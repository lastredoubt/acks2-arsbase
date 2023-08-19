import { ARS } from '../config.js';
import { ARSActorSheet } from "./actor-sheet.js";
import { DiceManager } from "../dice/dice.js";
import { onManageActiveEffect, prepareActiveEffectCategories } from "../effect/effects.js";
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js"
export class ARSNPCSheet extends ARSActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ars", "sheet", "actor", "npc"],
            template: "systems/ars/templates/actor/npc-sheet.hbs",
            actor: this.actor, // for actor access in character-sheet.hbs
            width: 510,
            height: 900,
            // height: "auto",
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }

    /** @override */
    get template() {
        if (this.actor.isOwner) {
            return `systems/ars/templates/actor/npc-sheet.hbs`;
        } else if (!this.actor.isOwner) {
            if (this.canLoot) {
                console.log("actor-sheet.js template using npc-loot-sheet")
                this.position.width = 500;
                this.position.height = 500;
                return `systems/ars/templates/actor/npc-loot-sheet.hbs`;
            } else {
                console.log("actor-sheet.js template using npc-limited-sheet")
                return `systems/ars/templates/actor/npc-limited-sheet.hbs`;
            }
        }

        return `systems/ars/templates/actor/npc-sheet.hbs`;
    }

    /** @override */
    get title() {
        if (this.canLoot) {
            const actorName = this.token?.name ?? this.actor.name;
            if (this.actor.isDead) {
                return `${actorName} [DEAD]`; // `;
            } else {
                return actorName;
            }
        }
        return super.title;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (this.actor.isOwner) {
            html.find(".saves-recalculate").click((event) => this._recalculateSaves(event));
            html.find(".npc-thaco-calculate").click((event) => this._calculateTHACO(event));
        }


        // clicking share coins button, can't use actual button because of ownership
        html.find(".share-looted-coins").click(async (event) => {
            if (await dialogManager.confirm('Split coins with party?', 'Share Coins')) {
                utilitiesManager.runAsGM({
                    operation: 'partyShareLootedCoins',
                    user: game.user.id,
                    sourceTokenId: this.actor.token.id,
                });
            } else {
                console.log("actor-sheet-lootable.js activateListeners FALSE CONFIRM");
            }
            // game.party.shareLootedCoins(this.actor);
        });

    }

    /**
     * recalculate npc's saving throws based on current hitdice value
     * 
     * @param {*} event 
     */
    async _recalculateSaves(event) {
        // console.log("actor-sheet-npc.js __recalculateSaves")
        const hdValue = this.actor.effectiveHD;

        if (event.ctrlKey || await dialogManager.confirm(`Set saves for effective HD${hdValue}?`, 'Recalculate Saves')) {
            this.actor.recalculateSaves();
        } else {
            console.log("actor-sheet-npc.js _recalculateSaves FALSE CONFIRM");
        }

    }


    async _calculateTHACO(event) {
        // console.log("actor-sheet-npc.js _calculateTHACO")
        const hdValue = this.actor.effectiveHD;

        if (event.ctrlKey || await dialogManager.confirm(`Set To Hit AC 0 for effective HD${hdValue}?`, 'Calculate Attack')) {
            this.actor.update({ 'system.attributes.thaco.value': Number(ARS.thaco.monster[hdValue]) })
        } else {
            console.log("actor-sheet-npc.js _calculateTHACO FALSE CONFIRM");
        }

    }

    /** @override to apply/manage locking lootable npc */
    async render(force, options) {
        // console.log("actor-sheet-npc.js render", { force, options }, this)
        // when pc openes the loot window, set opened flag
        utilitiesManager.cleanStaleSheetLocks(this);
        if (game.user.isGM) {
            super.render(force, options);
        } else if (force && !game.user.isGM && !game.paused && !this.object.system.opened) {
            utilitiesManager.runAsGM({
                sourceFunction: 'actor-sheet-npc.js render',
                operation: 'actorUpdate',
                user: game.user.id,
                targetTokenId: this.object.token.id,
                update: { 'system.opened': game.user.id },
            });
            utilitiesManager.chatMessage(ChatMessage.getSpeaker(), 'Looting Body', `${game.user.character?.name ?? game.user.name} is looting ${this.object.token.name}`, this.object.token.img);
            super.render(force, options);
        } else if (!game.paused && game.user.id === this.object.system.opened) {
            super.render(force, options);
        } else if (!game.paused && this.object.system?.opened && game.user.id !== this.object.system.opened) {
            const userLooting = game.users.get(this.object.system.opened);
            ui.notifications.error(`${this.object.token.name} is already being looted by ${userLooting ? userLooting.name : '[Disconnected?]'}.`)
        } else if (game.paused) {
            // console.trace("actor-sheet-npc.js looting error", { force, options })
            ui.notifications.error(`${this.object.token.name} cannot be looted while game is paused.`)
        }
    }

} // end ARSNPCSheet