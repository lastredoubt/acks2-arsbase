import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import { CombatManager } from "../combat/combat.js";
import * as debug from "../debug.js"
import { ARS } from '../config.js';


/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
export async function onManageActiveEffect(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest("li");
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;

    console.log("effects.js onManageActiveEffect", { event, owner, a, li, effect });

    switch (a.dataset.action) {
        case "create":
            return await owner.createEmbeddedDocuments("ActiveEffect", [{
                name: "New Effect",
                icon: "icons/svg/aura.svg",
                origin: owner.uuid,
                "duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
                disabled: li.dataset.effectType === "inactive"
            }]);
            break;
        case "edit":
            return effect.sheet.render(true);
            break;
        case "delete":
            if (await dialogManager.confirm(`Delete <b>${effect.name}</b> effect?`, 'Delete Effect')) {
                return effect.delete();
            }
            break;
        case "toggle":
            return effect.update({ disabled: !effect.disabled });
            break;
    }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {

    // console.log("effects.js prepareActiveEffectCategories effects:", effects);

    // Define effect header categories
    const categories = {
        temporary: {
            type: "temporary",
            label: "Temporary Effects",
            info: ["Temporary Effects"],
            effects: []
        },
        passive: {
            type: "passive",
            label: "Passive Effects",
            info: ["Passive Effects"],
            effects: []
        },
        inactive: {
            type: "inactive",
            label: "Inactive Effects",
            info: ["Inactive Effects"],
            effects: []
        },
        suppressed: {
            type: "suppressed",
            label: `Suppressed`,
            effects: [],
            info: [`Suppressed`]
        }
    };

    // Iterate over active effects, classifying them into categories
    for (let e of effects) {
        // e._getSourceName(); // Trigger a lookup for the source name
        if (e.isSuppressed) categories.suppressed.effects.push(e);
        else if (e.disabled) categories.inactive.effects.push(e);
        else if (e.isTemporary) categories.temporary.effects.push(e);
        else categories.passive.effects.push(e);
    }

    return categories;
}

/**
   * get the changes.key that matches 'keymatch' string
   * 
   * getEffectsByChangesKey("ATTACK", effects);
   * 
   * @param {String} keymatch 
   * @param {List of Effects} effects 
   */
export function getEffectsByChangesKey(keymatch, effects) {
    // console.log("effects.js", "getEffectsByChangesKey", { keymatch, effects });
    return effects.filter((e) => e.changes?.find((ee) => ee.key === keymatch));
}

/**
 * 
 * Create ActiveEffect from sourceActor on targetActor using action properties
 * 
 * @param {*} sourceActor  The actor source of the action triggering the effect application
 * @param {*} targetActor The token target of the action effect.
 * @param {*} action The action that contains the effect to apply to targetActor
 * @param {*} chatUser The user that executed the application (used for when GM has to apply the effect)
 * 
 */
export async function applyActionEffect(sourceActor, targetToken, action, chatUser = game.user.id) {
    console.log("effects.js applyActionEffect ", { sourceActor, targetToken, action, chatUser });
    /**
     * 
     * we use this since you can't async in a string.replace() and we need it to get formula results
     * 
     * @param {*} str 
     * @param {*} regex 
     * @param {*} asyncFn 
     * @returns 
     */
    async function replaceAsync(str, formulaActor, regex, regexCleanup, asyncFn) {
        const promises = [];
        str.replace(regex, (match, ...args) => {
            const promise = asyncFn(match, formulaActor, regexCleanup, ...args);
            promises.push(promise);
        });
        const data = await Promise.all(promises);
        return str.replace(regex, () => data.shift());
    }
    const _evaluateFormulaValue = (match, formulaActor, regexCleanup, p1, offset, string) => {
        console.log("effects.js applyActionEffect ", { match, formulaActor, regexCleanup, p1, offset, string });
        /// evaluate [[1d6]] or [[@valid.formula +3]] in key/value before applying
        // let formula = p1.replace(/[\{}]/g, '');
        // let formula = p1.replace(/[\[\[\]\]]/g, '');
        let formula = p1.replace(regexCleanup, '');
        console.log("effects.js applyActionEffect ", { formula });
        // const rollData = { system: targetToken.actor.getRollData() };
        //be able to formulate source or target actor using {{}} for source and [[]] for target
        // const rollData = useSource? sourceActor.getRollData(): targetToken.actor.getRollData();
        const rollData = formulaActor ? formulaActor.getRollData() : null;
        const formulaResult = utilitiesManager.evaluateFormulaValue(formula, rollData);
        // console.log("effects.js applyActionEffect ", { formulaResult });
        return formulaResult;
    }
    const _evalKeys = async (changes) => {
        for (let index = 0; index < changes.length; index++) {
            // manage "dice rolls" within the key/value
            // const regEx = new RegExp("(\\[.*\\])", "ig");
            //be able to formulate source or target actor using {{}} for source and [[]] for target
            const regExSource = new RegExp("({{.*}})", "ig");
            const regExSourceCleanup = /[\{\}]/g;

            const regExTarget = new RegExp("(\\[\\[.*\\]\\])", "ig");
            const regExTargetCleanup = /[\[\]]/g;

            // check for source formula
            if (changes[index].key.match(regExSource)) {
                changes[index].key = await replaceAsync(changes[index].key, sourceActor, regExSource, regExSourceCleanup, _evaluateFormulaValue);
            }
            if (changes[index].value.match(regExSource)) {
                changes[index].value = await replaceAsync(changes[index].value, sourceActor, regExSource, regExSourceCleanup, _evaluateFormulaValue);
            }

            // check for target formula 
            if (changes[index].key.match(regExTarget)) {
                changes[index].key = await replaceAsync(changes[index].key, targetToken.actor, regExTarget, regExTargetCleanup, _evaluateFormulaValue);
            }
            if (changes[index].value.match(regExTarget)) {
                changes[index].value = await replaceAsync(changes[index].value, targetToken.actor, regExTarget, regExTargetCleanup, _evaluateFormulaValue);
            }
        }
        return changes;
    };

    // console.log("effects.js applyActionEffect", { sourceActor, targetToken, action });

    //look for a status "effect" entry (will only use last one, not multiple)
    let statusIds = undefined;
    action.effect.changes.forEach(async (change, index) => {
        console.log("effects.js applyActionEffect", { change, index })
        if (change.key.toLowerCase() === 'special.status' && change.value) {
            statusIds = change.value.toLowerCase().split(',').map(text => text.trim()) || [];
        }
    });

    // console.log("effects.js", "applyActionEffect", { ef });
    // let durationRollResult;
    const formula = action.effect.duration.formula || '';
    // console.log("effects.js applyActionEffect", { formula });
    // if (formula) durationRollResult = await new Roll(String(formula), sourceActor.data).roll({ async: true });
    const durationRollResult = formula ? utilitiesManager.evaluateFormulaValue(formula, sourceActor.getRollData()) : 0;
    // console.log("effects.js applyActionEffect", { durationRollResult });
    let effectDuration = utilitiesManager.convertTimeToSeconds((formula ? durationRollResult : 0), action.effect.duration.type);

    //TODO: support apply time variables in KEY/VALUE parameters in changes using targetToken.actor.data
    // let newChanges = action.effect.changes; // loop through changes, update key/value looking for evaluation of things like "[1d8]" or [@system.abilities.str.value/2] sorta things.
    const effect = await targetToken.actor.createEmbeddedDocuments("ActiveEffect", [{
        // flags: statusId ? { core: { statusId } } : {},
        statuses: statusIds, // status is a Set now
        label: action.name,
        icon: action.img,
        // id: randomID(16),
        origin: `${targetToken.actor.uuid}`,
        "duration.seconds": effectDuration,
        // "duration.rounds": effectDuration,
        // "duration.turns": effectDuration,
        "duration.startTime": game.time.worldTime,
        "duration.startRound": game.combat?.round,
        "duration.startTurn": game.combat?.turn,
        transfer: false,
        "changes": await _evalKeys(foundry.utils.deepClone(action.effect.changes)),
    }], { parent: targetToken.actor });
    // console.log("effects.js effect", { effect });
    const appliedEffect = Object?.values(effect)?.[0];
    console.log("effects.js applyActionEffect", { appliedEffect });

    // TODO what does .priority do?
    // effect.changes.priority = 

    let cardData = {
        "action": action,
        "targetActor": targetToken.actor,
        "targetToken": targetToken,
        "sourceActor": sourceActor,
        "owner": sourceActor.id,
        "effect": appliedEffect,
        "game": game,
    };

    let chatData = {
        user: chatUser,
        speaker: ChatMessage.getSpeaker()
    };

    chatData.content = await renderTemplate("systems/ars/templates/chat/parts/chatCard-action-effectApplied.hbs", cardData);

    ChatMessage.create(chatData);
    // });
}


/**
 * Apply effect to sourceActor's targets using sourceAction properties
 * 
 * @param {*} sourceActor 
 * @param {*} sourceAction 
 */
export async function applyEffect(sourceActor, sourceAction) {
    // console.log("effects.js applyEffect", { sourceActor, sourceAction });
    const targets = game.user.targets || undefined; // these are "targeted"
    //const aTargets =canvas.tokens.controlled;      // these are "selected"
    // game.actors.tokens[]
    if (targets.size) {
        targets.forEach(target => {
            // console.log("effects.js applyEffect", { target });
            // if (game.user.isGM) {
            //     applyActionEffect(sourceActor, target, sourceAction);
            // } else {
            utilitiesManager.runAsGM({
                operation: 'applyActionEffect',
                sourceFunction: 'applyEffect',
                user: game.user.id,
                targetActorId: target.actor.id,
                targetTokenId: target.id,
                sourceActorId: sourceActor.id,
                sourceTokenId: sourceActor.token ? sourceActor.token.id : null,
                sourceAction: sourceAction
            });
            // }
        });
    } else {
        ui.notifications.error(`Need target to apply effect.`);
    }
}

/**
 * Remove effect on actor by ID
 * 
 * @param {*} actor 
 * @param {*} effectId 
 */
// export async function undoEffect(token, effectId) {
export async function undoEffect(targetToken, effectId) {
    // console.log("effects.js undoEffect", { targetToken, effectId });

    if (!game.user.isGM) return;

    let deleted = false;
    try {
        deleted = await targetToken.deleteEmbeddedDocuments("ActiveEffect", [effectId]);
    } catch { }
    // console.log("effects.js undoEffect", { deleted });
    if (!deleted) {
        ui.notifications.error(`Unable to find effect ${effectId} on ${targetToken.name}.`);
    } else {
        ui.notifications.info(`Removed effect ${deleted[0].name} on ${targetToken.name}.`);
    }
}

/**
 * 
 * Manage expirations for effects on NPCs in combat tracker
 * and PCs in the Party Tracker (ignored otherwise)
 * 
 * Currently duration.seconds is all we watch for duration
 * 
 * @param {*} worldTime 
 */
export async function manageEffectExpirations(worldTime) {

    console.log("effects.js manageEffectExpirations CONFIG.time.roundTime", CONFIG.time.roundTime);

    /**
     * 
     * Checks actor for expired effects, flags them and bulk removes
     * 
     * @param {*} actor 
     */
    async function _expireEffects(actor) {
        if (actor) {
            let reRender = false;
            console.log("effects.js manageEffectExpirations _expireEffects", { actor });
            const expiredEffects = [];
            const disableEffects = []; //TODO add option to disable only expired effect?
            for (const effect of actor.getActiveEffects()) {
                // console.log("effects.js manageEffectExpirations _expireEffects !effect.disabled && !effect.isSuppressed");
                if (effect.duration?.seconds) {
                    // console.log("effects.js manageEffectExpirations _expireEffects effect.duration?.seconds");
                    if (!effect.duration?.startTime) {
                        // console.log("effects.js manageEffectExpirations _expireEffects !effect.duration?.startTime");
                        // set a startTime to game.time.worldTime?
                        effect.update({
                            'duration.startTime': worldTime,
                        });
                    } else {
                        const startTime = effect.duration.startTime;
                        const duration = effect.duration.seconds;
                        const timePassed = (worldTime - startTime);
                        // const roundRemainder = timePassed % CONFIG.time.roundTime;
                        // const timePassedInRounds = ((timePassed - roundRemainder) / CONFIG.time.roundTime);
                        // console.log("effects.js manageEffectExpirations _expireEffects", { timePassed, roundRemainder, timePassedInRounds });
                        // expired?
                        // console.log("effects.js manageEffectExpirations _expireEffects", (worldTime - startTime));
                        if (timePassed >= duration) {
                            // if this is a from a item that the pc owns then we dont delete the effect
                            if (effect.origin.startsWith(`Actor.${actor.id}.Item.`)) {
                                console.log("effects.js manageEffectExpirations _expireEffects disabled", { effect });
                                disableEffects.push(effect.id);
                            } else {
                                console.log("effects.js manageEffectExpirations _expireEffects expired", { effect });
                                expiredEffects.push(effect.id);
                            }
                        }
                    }
                }

            } // end list of active effects

            if (disableEffects.length) {
                for (const effectId of disableEffects) {
                    const effect = await actor.getEmbeddedDocument("ActiveEffect", effectId);
                    console.log("effects.js manageEffectExpirations _expireEffects disableEffects", { effect }, effect._source.duration.seconds);
                    effect.update({
                        'duration.startTime': 0,
                        'disabled': true
                    });
                }
                reRender = true;
            }
            if (expiredEffects.length) {
                actor.deleteEmbeddedDocuments("ActiveEffect", expiredEffects, { "expiry-reason": 'expired duration' });
                console.log("effects.js manageEffectExpirations _expireEffects expired ------->", { actor })
                reRender = true;
            }
            if (reRender) actor.sheet.render();
        }
    }

    /**
     * 
     * Apply Ongoing heal/damage
     * 
     * @param {Object} actor 
     * @param {String} formula 
     * @param {Boolean} isDamage if not damage, it's healing
     * @param {String} dmgType fire/frost/slashing
     * @param {Boolean} hideDice Dont show dice
     */
    async function applyOngoing(actor, formula, isDamage, dmgType = '', hideDice = false) {
        const roll = await new Roll(formula, actor.getRollData()).roll({ async: true });
        // if (game.dice3d) await game.dice3d.showForRoll(roll, game.user);
        if (game.dice3d && !hideDice) game.dice3d.showForRoll(roll, game.user);
        // calculate damage and result damage resists 
        const rolled = {
            rawformulas: [roll.formula],
            formulas: [roll.formula],
            results: [roll.result],
            totals: [roll.total],
            totalValues: roll.total,
            rolls: [roll],
        };
        let dmgDone = [];
        dmgDone.push({
            dmg: roll.total,
            type: dmgType,
            roll: roll,
        });
        const targetToken = actor.getToken().object ?? null;

        const rdmg = await CombatManager.applyDamageAdjustments(targetToken.actor, targetToken, undefined, undefined, true, dmgDone);
        // console.log("effects.js applyOngoing", { targetToken, rolled, roll, dmgDone, rdmg });
        return ({ token: targetToken, total: rdmg.total, dmgTypes: rdmg.types })
        // const card = await CombatManager.sendHealthAdjustChatCard(targetToken.actor, targetToken, isDamage, rolled, rdmg.total, rdmg.types, '', 'Ongoing Damage');
        // utilitiesManager.adjustActorHealth(targetToken.actor, -rdmg.total);
    }

    /**
     * 
     * Check active effects for onGoing effects and apply them
     * 
     * @param {*} actor 
     */
    async function _ongoingEffects(actor) {
        // console.log("effects.js _ongoingEffects", { actor });
        const modes = game.ars.const.ACTIVE_EFFECT_MODES;
        // const effectsBundle = duplicate(actor.effects);
        // const activeEffects = effectsBundle.filter(effect => !effect.disabled && !effect.isSuppressed);
        // let activatedOngoing = false;
        const ongoingEffects = actor.getActiveEffects().filter(effect => { return effect.changes.some(changes => { return changes.key.toLowerCase() === 'special.ongoing' }) });
        for (const effect of ongoingEffects) {
            console.log("effects.js _ongoingEffects", { effect, worldTime });
            const startTime = effect.duration.startTime;
            const change = effect.changes.find(c => c.key.toLowerCase() === 'special.ongoing');
            // for (const change of effect.changes) {
            if (change) {
                if (change.mode == modes.CUSTOM) {
                    // const flagPath = `lastTime.${change.key.slugify({ strict: true })}`;
                    const flagPath = `lastOngoingTime`;
                    const lastTime = await effect.getFlag("ars", flagPath) ?? 0;
                    // const lastTime = change.lastTime ?? 0;
                    const timePassed = lastTime ? (worldTime - lastTime) : (worldTime - startTime);

                    /**
                     * 
                     * Change.Key: 
                     * * ongoing heal every 1 round
                     * * ongoing heal every 1 turn
                     * * ongoing damage every 1 round
                     * 
                     * Change.Value:
                     * * 1d6+1 heal
                     * * 1d3+1 fire
                     */
                    //get "ongoing heal every 1 round"

                    // {type:"heal", rate:"1", cycle: "round", formula: "1d4"}
                    const details = JSON.parse(change.value.toLowerCase());
                    const isDamage = details.type === 'damage';
                    const isHeal = details.type === 'heal';
                    const byRound = details.cycle === 'round';
                    const byTurn = details.cycle === 'turn';
                    const rate = parseInt(details.rate) || 1;

                    const formula = details.formula;
                    const dmgType = details.dmgtype;

                    // const keys = change.key.toLowerCase().split(/[\s]+/);
                    // const isDamage = keys.some(item => new RegExp('damage', 'i').test(item))
                    // const isHeal = keys.some(item => new RegExp('heal', 'i').test(item))
                    // const byRound = keys.some(item => new RegExp('round', 'i').test(item))
                    // const byTurn = keys.some(item => new RegExp('turn', 'i').test(item))

                    // get the the rate
                    // let match = undefined;
                    // const rate = (match = change.key.match(/\s+(\d+)\s+(round|turn)/i)) ? parseInt(match[1], 10) : undefined;

                    // get "formula dmgType"
                    // const values = change.value.toLowerCase().split(/[\s]+/);
                    // const formula = values[0];
                    // const dmgType = values[1] ?? '';

                    // console.log("effects.js _ongoingEffects", { change, details, rate, byRound, byTurn, isHeal, isDamage, formula, dmgType, timePassed, lastTime, flagPath });

                    if (rate > 0) {
                        const roundsPassed = Math.floor(timePassed / CONFIG.time.roundTime);
                        const turnsPassed = Math.floor(timePassed / CONFIG.time.turnTime);

                        // console.log("effects.js _ongoingEffects", { roundsPassed, turnsPassed });

                        if ((byTurn && turnsPassed >= rate) || (byRound && roundsPassed >= rate)) {
                            let count = 0;
                            let remaining = 0;

                            if (byRound) {
                                count = Math.floor(roundsPassed / rate);
                                remaining = (roundsPassed % rate) * CONFIG.time.roundTime;
                                // console.log("effects.js _ongoingEffects", { byRound, roundsPassed, count, remaining });

                            } else if (byTurn) {
                                count = Math.floor(turnsPassed / rate);
                                remaining = (turnsPassed % rate) * CONFIG.time.turnTime;
                                // console.log("effects.js _ongoingEffects", { byTurn, turnsPassed, count, remaining });
                            }
                            // apply count many of the ongoing effects
                            const _MAX_COUNT_TRIGGERS = actor.type === 'character' ? 500 : 1; // incase someone advances things by large amount.
                            const _LOTS_OF_TIME_PASSED = 20; // we dont show dice rolls after this many
                            const resultOngoing = { token: undefined, total: 0, dmgTypes: '' };
                            for (let i = 0; i < Math.min(count, _MAX_COUNT_TRIGGERS); i++) {
                                const rO = await applyOngoing(actor, formula, isDamage, dmgType, (i >= _LOTS_OF_TIME_PASSED));
                                resultOngoing.token = rO.token;
                                resultOngoing.total += rO.total;
                                resultOngoing.dmgTypes = rO.dmgTypes;
                            }
                            if (count > _MAX_COUNT_TRIGGERS) {
                                ui.notifications.warn(`Limited number of ongoing effect applications of ${count} to ${_MAX_COUNT_TRIGGERS}`);
                            }
                            const card = CombatManager.sendHealthAdjustChatCard(
                                resultOngoing.token.actor,
                                resultOngoing.token,
                                isDamage,
                                { totalValues: resultOngoing.total, totals: [resultOngoing.total], formulas: [`${count}x ${formula}`], rawformulas: [`${count}x ${formula}`], results: [resultOngoing.total] },
                                resultOngoing.total,
                                resultOngoing.dmgTypes,
                                `Effect: ${effect.name}`,
                                'Ongoing Effect',
                                (resultOngoing.token.isNeutral || resultOngoing.token.isHostile) ? 'gmroll' : undefined,
                            );

                            //modify last based on remaining so we dont lose 
                            // store any remaining time that wasn't exact
                            const lastChecked = remaining > 0 ? worldTime - remaining : worldTime;
                            await effect.setFlag("ars", flagPath, lastChecked);
                            // change.lastTime = lastChecked;
                            // activatedOngoing = true;
                        } else {
                            // do nothing
                        }
                    } //rate > 0
                }
            } // for (const change of effect.changes) 
            // if (activatedOngoing)
            // await actor.update({ 'effects': effectsBundle });

        }
    } // end _ongoingEffects


    if (game.combat?.active) {
        // flip through all NPCs in combat tracker
        for (const actor of game.combat.combatants.map(co => co.actor)) {
            // check everything in CT but PCs
            if (actor.type !== 'character') {
                await _expireEffects(actor);
                await _ongoingEffects(actor);
            }
        }
    }
    // flip through all PCs in party tracker
    // const partyMembers = game.party.getMembers();
    // for (const member of partyMembers) {
    for (const [key, actor] of game.party.members) {
        // const actor = game.actors.get(member.id);
        await _expireEffects(actor);
        await _ongoingEffects(actor);
    }


    console.log("effects.js manageEffectExpirations _expireEffects DONE");
}

/**
   * 
   * Returns enabled/active effects
   * 
   * @param {*} sourceItem Item this is from? (or not)
   * @returns {Array}
   */
export function getActiveEffects(sourceItem = undefined) {
    // let activeEffects = [];
    console.log("effects.js getActiveEffects", this, { sourceItem })
    let activeEffects = this.effects.filter(effect => !effect.disabled && !effect.isSuppressed);

    // check for effects that are on the item only used in combat
    if (sourceItem) {
        const inCombatOnly = sourceItem.getItemUseOnlyEffects();
        if (inCombatOnly.length)
            activeEffects = activeEffects.concat(inCombatOnly);
    }

    // console.log("actor.js getActiveEffects", { activeEffects })
    return activeEffects;
}

/**
 * 
 * Get Aura information from an effect
 * 
 * @param {*} effect 
 * @returns 
 */
export function getAuraInfo(effect) {
    let auraInfo = undefined;
    // console.log("effects.js getAuraInfo", { effect })
    //only a single aura allowed per "effect"
    const change = effect.changes.find(c => c.key.toLowerCase() === 'special.aura');
    if (change) {
        // let [distance, color, faction, opacity, shape] = change.value.toLowerCase().trim().split(" ");
        // console.log("effects.js getAuraInfo", change.value.toLowerCase())
        const details = JSON.parse(change.value.toLowerCase());
        // console.log("effects.js getAuraInfo", { details })
        details.distance = parseInt(details.distance);
        if (ARS.htmlBasicColors[details.color])
            details.color = ARS.htmlBasicColors[details.color];
        let isSquare = false;
        if (details.shape == 'square')
            isSquare = true;
        if (details.opacity)
            details.opacity = parseFloat(details.opacity);

        // game.ars.const.TOKEN_DISPOSITIONS.FRIENDLY:
        // game.ars.const.TOKEN_DISPOSITIONS.NEUTRAL:
        // game.ars.const.TOKEN_DISPOSITIONS.HOSTILE:
        let disposition = game.ars.const.TOKEN_DISPOSITIONS.HOSTILE;

        switch (details.faction) {
            case 'self':
            case 'ally':
            case 'friend':
            case 'friendly':
            case 'neutral':
            case 'all':
                disposition = game.ars.const.TOKEN_DISPOSITIONS.FRIENDLY;
                break;

            // case 'foe':
            // case 'enemy':
            //     break;

            default:
                break
        }

        auraInfo = {
            distance: details.distance,
            color: details.color,
            isSquare: isSquare,
            opacity: details.opacity,
            permission: details.permission ?? "all",
            disposition: disposition,
            faction: details.faction,
        }
    }

    return auraInfo;
}