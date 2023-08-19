// import { ARSActorSheet } from "./actor-sheet.js";
import { ARSNPCSheet } from "./actor-sheet-npc.js";
import { DiceManager } from "../dice/dice.js";
import { onManageActiveEffect, prepareActiveEffectCategories } from "../effect/effects.js";
import * as actionManager from "../apps/action.js";
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js"

/**
 * //TODO make lootable actor/item
 * 
 * This class will be used as chests, bags/etc
 * 
 */
export class ARSLootableSheet extends ARSNPCSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ars", "sheet", "actor", "lootable"],
            template: "systems/ars/templates/actor/lootable-sheet.hbs",
            actor: this.actor, // for actor access in character-sheet.hbs
            // width: 550,
            // height: 500,
            height: "auto",
            // tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }


    /** @override */
    get template() {
        if (!this.actor.isOwner || !game.user.isGM) {
            if (this.canLoot) {
                return "systems/ars/templates/actor/lootable-sheet.hbs";
            } else {
                return `systems/ars/templates/actor/lootable-limited-sheet.hbs`;
            }
        }
        return `systems/ars/templates/actor/lootable-sheet.hbs`;
    }

    /** @override */
    get title() {
        const actorName = this.token?.name ?? this.actor.name;
        if (this.canLoot) return `${actorName} [LOOT]`; // `;
        return super.title;
    }

    get canLoot() {
        return this.actor.isLootable && !this.actor.isOwner;
    }

    // give pcs limited view if lootable
    get permission() {
        console.log("actor-sheet-lootable.js 1")
        if (game.user.isGM || !this.actor.isLootable) {
            console.log("actor-sheet-lootable.js 2")
            return super.permission;
        }
        console.log("actor-sheet-lootable.js 3")
        return Math.max(super.permission, 1);
    }

    // /** @override */
    // async getData() {
    //     const data = await super.getData();
    //     console.log("actor-sheet-lootable.js getData", { data })
    //     data.cssClass = this.canLoot ? "editable" : "locked";
    //     data.owner = this.canLoot;
    //     data.editable = this.canLoot;
    //     return data;
    // }

    /** @override to apply/manage locking lootable npc */
    async render(force, options) {
        console.log("actor-sheet-lootable.js render", { force, options }, this, this.object.system.opened, game.user.id)
        // when pc openes the loot window, set opened flag

        utilitiesManager.cleanStaleSheetLocks(this);
        // console.log("actor-sheet-lootable.js cleanStaleSheetLocks 4", force, this.object.system.opened, game.user.id);
        if (force && !game.user.isGM && (!this.object.system.opened || this.object.system.opened === game.user.id)) {
            await utilitiesManager.runAsGM({
                sourceFunction: 'actor-sheet-lootable.js render',
                operation: 'actorUpdate',
                user: game.user.id,
                targetTokenId: this.object?.token?.id,
                update: { 'system.opened': game.user.id },
            });
            utilitiesManager.chatMessage(ChatMessage.getSpeaker(), 'Looting Item', `${game.user.character?.name ?? game.user.name} is looting ${this.object?.token?.name}`, this.object?.token?.img);
            super.render(force, options);
        } else if ((this.object.system.opened === game.user.id) || game.user.isGM) {
            super.render(force, options);
        } else {
            const lootingUser = game.users.get(this.object?.system?.opened)
            if (lootingUser)
                ui.notifications.error(`${lootingUser.name} is already looting ${this.object.name}`);
        }

    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
    }

}