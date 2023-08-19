import { ARS } from '../config.js';
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js";
import { CombatManager } from "./combat.js";
import { SocketManager } from "../sockets.js";

export class ARSCombatTracker extends CombatTracker {

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "combat",
            template: "systems/ars/templates/sidebar/combat-tracker.hbs",
            title: "COMBAT.SidebarTitle",
            scrollY: [".directory-list"],
            height: "auto",
        });
    }

    /** @override */
    createPopout() {
        const pop = super.createPopout();
        pop.options.resizable = true;
        pop.options.height = 650;
        return pop;
    }

    /** @override
     * we do this so we can inject "game" and a few other things into the combat.turns and turns
     * 
     * turns[x].index gets added so we can look up the correct index even if the turns list has hidden entries
     * turns[x].combatant is added so we can look at token.object.isVisible (so we can hide things their token can't see) and a few other things.
     * 
     */
    async getData(options) {
        const data = await super.getData(options);

        data.game = game;
        // data.turn.css = `${data.turn.css}`
        // console.log("combatTracker.js getData", { data }, this);

        if (data.combat?.turns)
            for (let [i, combatant] of data.combat.turns.entries()) {
                data.combat.turns[i].index = i;
                const turnsIndex = data.turns.findIndex(entry => { return entry.id === data.combat.turns[i].id });
                if (data.turns[turnsIndex]) {
                    data.turns[turnsIndex].index = i;
                    data.turns[turnsIndex].combatant = data.combat.turns[i];
                }
            }

        // data.turns.for(turn => { console.log("combatTracker.js getData", { turn }) })
        return data;
    }

    /**
     * Handle a Combatant control toggle
     * @private
     * @param {Event} event   The originating mousedown event
     */
    async _onCombatantControl(event) {
        // console.log("combatTracker.js _onCombatantControl", { event });
        event.preventDefault();
        event.stopPropagation();
        const btn = event.currentTarget;
        const li = btn.closest(".combatant");
        const combat = this.viewed;
        const c = combat.combatants.get(li.dataset.combatantId);

        console.log("combatTracker.js _onCombatantControl", { combat, c }, this, event.shiftKey);

        // Switch control action
        switch (btn.dataset.control) {

            // Toggle combatant visibility
            case "toggleHidden":
                return c.update({ hidden: !c.hidden });

            // Toggle combatant defeated flag
            case "toggleDefeated":
                return this._onToggleDefeatedStatus(c);

            // toggle casting state
            case "toggleCasting":
                await c.setFlag("ars", "initCasting", !c.getFlag("ars", "initCasting"));
                // await c.token.setFlag("ars", "initCasting", !c.token.getFlag("ars", "initCasting"));
                // this.render();
                break;

            // Actively ping the Combatant
            case "pingCombatant":
                return this._onPingCombatant(c);

            // Roll combatant initiative
            case "rollInitiative":
                return await utilitiesManager.rollCombatantInitiative(c, combat, event.ctrlKey);

            // delay turn to end of turn order +1
            case "delayTurn":
                const lastInit = combat._getLastInInitiative();
                console.log("_onCombatantControl", { c, combat, lastInit }, c.id, combat.combatant.id);
                if (c.id == combat.combatant.id) {
                    // if the combatant and this person are the same, flip to next turn
                    // and reset initiative to last +1
                    await combat.nextTurn(c);
                    return c.update({ initiative: lastInit + 1 })
                }
                break;

            // Target the Combatant
            case "targetCombatant": {

                const targetToken = c.token; //canvas.tokens.get(c.tokenId);
                targetToken.object.setTarget(true, { user: game.user, releaseOthers: !event.shiftKey, groupSelection: true });
                ui.combat.render();
                // if user is GM, try and set the target for the person with active initiative if they own
                // the actor and are connected
                if (game.user.isGM) {
                    const sourceToken = combat.combatant.token;
                    const defaultLevel = sourceToken.actor.ownership?.['default'] || 0;
                    for (const activeUser of game.users) {
                        // find active game.user that has perms for this token, if so change target for them
                        if (activeUser.active && !activeUser.isGM && game.user.id != activeUser.id &&
                            ((defaultLevel >= 3) ||
                                (sourceToken.actor.ownership?.[activeUser.id] >= 3))
                        ) {
                            // targetToken.object.setTarget(true, { user: activeUser, releaseOthers: !event.shiftKey, groupSelection: true });
                            // console.log("combatTracker.js _onCombatantControl", { activeUser, targetToken });
                            if (game.user.id != activeUser.id)
                                SocketManager.notify(game.user.id, activeUser.id, 'TargetToken',
                                    { shiftKey: event.shiftKey, tokenId: targetToken.id })
                        }
                    }
                }
                // }
                // const _timeout1 = setTimeout(async () => targetToken.object._refreshTarget(), 1000);
            }
                break;


        }
    }
}

/**
 * Extend Combat to tweak initiative order/etc
 */
export class ARSCombat extends Combat {

    /**
     * Sort initiative lowest to highest
     * 
     * @param {Token} a 
     * @param {Token} b 
     */
    _sortCombatants(a, b) {
        // return ((a.initiative > b.initiative) ? 1 : -1);
        const ia = Number.isNumeric(a.initiative) ? a.initiative : 9999;
        const ib = Number.isNumeric(b.initiative) ? b.initiative : 9999;
        const ascendingInitiative = game.settings.get("ars", "InitiativeAscending");
        let ci = ascendingInitiative ? ia - ib : ib - ia;
        if (ci !== 0) return ci;
        // dont sort this
        // let [an, bn] = [a.token?.nameRaw || "", b.token?.nameRaw || ""];
        // let cn = an.localeCompare(bn);
        // if (cn !== 0) return cn;

        // lastly...
        return a.tokenId - b.tokenId;
    }


    _getLastInInitiative() {
        let lastInit = 0;
        this.combatants.forEach(element => {
            if (element.initiative > lastInit) lastInit = element.initiative;
        });
        return lastInit;
    }
    _getFirstInInitiative() {
        let firstInit = 0;
        this.combatants.forEach(element => {
            if (element.initiative < firstInit) firstInit = element.initiative;
        });
        return firstInit;
    }
    /**
     * Returns the current turns initiative value
     * 
     * @returns Number 
     */
    _getCurrentTurnInitiative() {
        const thisTurn = this.current.turn;
        const result = this.turns[thisTurn]?.initiative || 0;
        return (result);
    }
    /**
     * @override to remove time passage (it's only advanced at end of round)
     * 
     * Advance the combat to the next turn
     * @return {Promise<Combat>}
     */
    async nextTurn(combatantDelayTurn = null) {
        console.log("combatTracker.js nextTurn START", this);

        // using this to try and block race condition where system
        // things initiative has started and adds last person in init to roll
        this.beginningOfRound = false;

        let turn = this.turn ?? -1;
        let skip = this.settings.skipDefeated;

        // Determine the next turn number
        let next = null;
        if (skip && !combatantDelayTurn) {
            for (let [i, t] of this.turns.entries()) {
                if (i <= turn) continue;
                if (t.isDefeated) continue;
                next = i;
                break;
            }
        } else if (combatantDelayTurn) {
            for (let [i, t] of this.turns.entries()) {
                if (i < turn) continue;
                if (combatantDelayTurn.id === t.id) continue;
                next = i;
                break;
            }

        } else next = turn + 1;

        // Maybe advance to the next round
        let round = this.round;
        if ((this.round === 0) || (next === null) || (next >= this.turns.length)) {
            return this.nextRound();
        }

        // Update the document, passing data through a hook first
        const updateData = { round, turn: next };
        // Classic systems update time on the round, not each turn
        // const updateOptions = { advanceTime: CONFIG.time.turnTime, direction: 1 };
        Hooks.callAll("combatTurn", this, updateData);
        return this.update(updateData);
        // return this.update({ round: round, turn: next });
    }

    /**
     * @override to make adjustments to time passage
     * 
     * Advance the combat to the next round
     * @return {Promise<Combat>}
     */
    async nextRound() {
        console.log("combatTracker.js nextRound START", this);
        let turn = this.turn === null ? null : 0; // Preserve the fact that it's no-one's turn currently.
        if (this.settings.skipDefeated && (turn !== null)) {
            turn = this.turns.findIndex(t => !t.isDefeated);
            if (turn === -1) {
                ui.notifications.warn("COMBAT.NoneRemaining", { localize: true });
                turn = 0;
            }
        }
        // let advanceTime = Math.max(this.turns.length - (this.turn || 0), 0) * CONFIG.time.turnTime;
        // advanceTime += CONFIG.time.roundTime;
        // OSR systems advance time by round counter, not turns, per round.
        const advanceTime = CONFIG.time.roundTime;
        return this.update({ round: this.round + 1, turn }, { advanceTime });
    }
    /**
     * @override time is roundTime, not turnTime for a round
     * 
     * Rewind the combat to the previous round
     * @return {Promise<Combat>}
     */
    async previousRound() {
        let turn = (this.round === 0) ? 0 : Math.max(this.turns.length - 1, 0);
        if (this.turn === null) turn = null;
        const round = Math.max(this.round - 1, 0);
        // let advanceTime = -1 * (this.turn || 0) * CONFIG.time.turnTime;
        // let advanceTime = -1 * (this.turn || 0) * CONFIG.time.roundTime;
        const advanceTime = round > 0 ? -CONFIG.time.roundTime : 0;
        return this.update({ round, turn }, { advanceTime });
    }

    /**
     * @override no time for just previous persons play turn
     * 
     * Rewind the combat to the previous turn
     * @return {Promise<Combat>}
     */
    async previousTurn() {
        if ((this.turn === 0) && (this.round === 0)) return this;
        else if ((this.turn <= 0) && (this.turn !== null)) return this.previousRound();
        // const advanceTime = -1 * CONFIG.time.turnTime;
        // return this.update({ turn: (this.turn ?? this.turns.length) - 1 }, { advanceTime });
        return this.update({ turn: (this.turn ?? this.turns.length) - 1 });
    }

    /**
     * 
     * Run "new round" processes.
     * 
     * @param {*} combat 
     */
    processNewRound() {
        console.log("combatTracker.js newRound", { combat });
        this.combatants.forEach(entry => {
            // clear saveCache
            this.processOneRoundFlags(entry);
        });
    }

    /**
     * ReRoll initative at the start of a round.
     * @param {Boolean} forceRoll 
     */
    async reRollInitiative(forceRoll) {
        const rollInitEachRound = game.settings.get("ars", "rollInitEachRound");
        if (rollInitEachRound || forceRoll) {
            const systemVariant = game.settings.get("ars", "systemVariant");
            const initSideVSide = game.settings.get("ars", "initSideVSide");
            // using this to try and block race condition where system
            // things initiative has started and adds last person in init to roll
            this.beginningOfRound = true;
            await this.resetAll();
            // TODO: we do this to block sounds due to how foundry handles initiative
            // need to figure out how to detect when start of round rolls and mute during that
            // but foundry isnt aware of new round start rolls versus next person getting initiative, it sees it all the same?
            game.ars.config.muteInitiativeSound = true;

            // roll initiative side v side only
            if (initSideVSide) {
                const _roll = async (formula) => {
                    let roll;
                    try {
                        roll = await new Roll(String(formula)).roll({ async: true });
                        if (game.dice3d) await game.dice3d.showForRoll(roll, game.user, true);
                    } catch (err) {
                        console.error(err);
                        ui.notifications.error(`Initiative dice formula evaluation failed: ${err.message}`);
                        return null;
                    }
                    roll.diceToolTip = await roll.getTooltip();
                    return roll;
                };
                const initiativeFormula = game.settings.get("ars", "initiativeFormula");
                //roll dice
                const npcRoll = await _roll(initiativeFormula);
                const pcRoll = await _roll(initiativeFormula);
                for (const c of this.combatants) {
                    if (c.isOwner && c.initiative === null) {
                        // console.log("combatTracker.js reRollInitiative", { c }, c.token.disposition);
                        switch (c.token.disposition) {
                            case game.ars.const.TOKEN_DISPOSITIONS.FRIENDLY:
                            case game.ars.const.TOKEN_DISPOSITIONS.NEUTRAL:
                                await c.update({ 'initiative': pcRoll.total });
                                break;

                            case game.ars.const.TOKEN_DISPOSITIONS.HOSTILE:
                                await c.update({ 'initiative': npcRoll.total });
                                break;

                            default:
                                await c.update({ 'initiative': npcRoll.total });
                                break
                        }
                        // if (c.isNPC) {
                        //     await c.update({ 'initiative': npcRoll.total });
                        // } else {
                        //     await c.update({ 'initiative': pcRoll.total });
                        // }
                    }
                }
                await this.update({ turn: 0 });
                //show chat msg
                utilitiesManager.chatMessageForSideVSideInitiative(ChatMessage.getSpeaker(),
                    `Opponents Initiative ${npcRoll.total}`, npcRoll)
                utilitiesManager.chatMessageForSideVSideInitiative(ChatMessage.getSpeaker(),
                    `Party Initiative ${pcRoll.total}`, pcRoll)
            } else {
                // roll all npcs
                for (const c of this.combatants) {

                    if (c.isOwner && c.isNPC && (c.initiative === null)) {
                        const lastInitiativeFormula = c.getFlag("ars", "lastInitiativeFormula");
                        let formula = lastInitiativeFormula ? lastInitiativeFormula : c._getInitiativeFormula();
                        if (!lastInitiativeFormula && Number(systemVariant) === 2)
                            formula += ' + @initSizeMod';
                        await utilitiesManager.rollCombatantInitiative(c, this, true, { formula: formula, rollMode: 'blindroll' });
                    }
                    // roll all !npcs
                    // if (c.isOwner && !c.isNPC && (c.initiative === null)) {
                    //     await utilitiesManager.rollCombatantInitiative(c, this, true, { formula: c._getInitiativeFormula() });
                    // }
                }
            }
            game.ars.config.muteInitiativeSound = false;

            // await this.rollNPC({ messageOptions: { bulkRolls: true, rollMode: 'blindroll' } });
            // await this.update({ turn: 0 });
        }
    }

    /**
     * 
     * Process various changes/updates for start of new round
     * 
     * @param {*} tokenDocument 
     */
    processOneRoundFlags(tokenDocument) {
        // console.log("processOneRoundFlags tokenDocument", { tokenDocument });
        // flush saveCache
        // tokenDocument.unsetFlag("ars", "saveCache");
        tokenDocument.token.unsetFlag("ars", "saveCache");
        //flush is Casting flag
        tokenDocument.token?.combatant.unsetFlag("ars", "initCasting");
    }

} // end Class ARSCombat


/**
 * 
 * function run from hook for preUpdateCombat
 * 
 * @param {*} combat 
 * @param {*} updateData 
 * @param {*} options 
 * @param {*} userId 
 */
export async function _preUpdateCombat(combat, updateData, options, userId) {
    if (!game.user.isGM) return;
    const roundUpdate = hasProperty(updateData, "round");
    const turnUpdate = hasProperty(updateData, "turn");
    // console.log("combatTracker.js _preUpdateCombat", { combat, updateData, options, userId, roundUpdate, turnUpdate });
}

/**
 * 
 * function run from hook for updateCombat
 * 
 * @param {*} combat 
 * @param {*} updateData 
 * @param {*} options 
 * @param {*} userId 
 */
// export async function _updateCombat(combat, updateData, options, userId) {
export async function combatTurn(combat, updateData) {
    console.log("combatTracker.js combatTurn 1", { combat, updateData });
    const initVolumeSound = game.settings.get("ars", "initVolumeSound");
    const roundUpdate = hasProperty(updateData, "round");
    const turnUpdate = hasProperty(updateData, "turn");
    // console.log("combatTracker.js combatTurn 2", { roundUpdate, turnUpdate }, "COMBAT:", duplicate(combat));
    // console.log("combatTracker.js combatTurn", { combat, updateData, options, userId, roundUpdate, turnUpdate });
    if (roundUpdate && !game.ars.config.muteInitiativeSound) {
        const initRoundSound = game.settings.get("ars", "initRoundSound");
        const playRoundSound = game.settings.get("ars", "playRoundSound");
        if (playRoundSound) {
            // console.log("combatTracker.js combatTurn playRoundSound", playRoundSound);
            AudioHelper.play({ src: initRoundSound, volume: initVolumeSound });
        }
        // start of the new round
        if (game.user.isGM) {
            // we always roll initiative if it's the very first round, so send force boolean
            await combat.reRollInitiative((combat.round === 1 && combat.turn === 0));
            combat.processNewRound();
        }
    } else if (turnUpdate && !game.ars.config.muteInitiativeSound) {
        // console.log("combatTracker.js combatTurn TURNUPDATE =======>", combat.turn);
        const token = combat.combatant.token;
        // console.log("combatTracker.js combatTurn", { token, turnUpdate }, getProperty(updateData, 'turn'));
        const playTurnSound = game.settings.get("ars", "playTurnSound");
        if (token.isOwner && playTurnSound && combat.turn !== 0) {
            // console.log("combatTracker.js combatTurn playTurnSound", playTurnSound);
            const initTurnSound = game.settings.get("ars", "initTurnSound");
            AudioHelper.play({ src: initTurnSound, volume: initVolumeSound });
        }

        const panOnInitiative = game.settings.get("ars", "panOnInitiative");
        if (panOnInitiative && token.isOwner) {
            canvas.animatePan({ x: token.x, y: token.y, scale: 2, duration: 1000 });
            // canvas.animatePan({ x: token.data.x, y: token.data.y, scale: Math.max(1, canvas.stage.scale.x), duration: 1000 });

            // this will select the token so vision/etc is updated
            // if you use the pan option it will instant pan, not the slow method as above
            // token?.object?.control({ releaseOthers: true, pan: panOnInitiative });
            token?.object?.control({ releaseOthers: true });
        }

        // const turnCount = getProperty(updateData, "turn");
        // next Combatants Turn
    } else {
        // console.log("combatTracker.js combatTurn");
    }

    // console.log("combatTracker.js combatTurn");
}
