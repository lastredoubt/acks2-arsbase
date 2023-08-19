import { ARS } from '../config.js';
import * as utilitiesManager from "../utilities.js";
import * as effectManager from "../effect/effects.js";
import { CombatManager } from "../combat/combat.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js";

export class DiceManager {

    // export { default as DamageRoll } from "./damage.js";

    // play success/failure sound with delay so dice have finished rolling
    // non-public rolls wont play sounds for players but will for GM
    static playAudioCheck(success = true, rollMode = "publicroll") {
        const audioPlayTriggers = game.settings.get("ars", "audioPlayTriggers");
        const audioTriggersVolume = game.settings.get("ars", "audioTriggersVolume");
        console.log("dice.js playAudioCheck", { success, rollMode, audioPlayTriggers, audioTriggersVolume })

        if (audioPlayTriggers) {
            const audioTriggerCheckFail = game.settings.get("ars", "audioTriggerCheckFail");
            const audioTriggerCheckSuccess = game.settings.get("ars", "audioTriggerCheckSuccess");

            if (['publicroll', 'selfroll', 'gmroll'].includes(rollMode)) {
                const _waitforit = setTimeout(async () =>
                    AudioHelper.play({ src: success ? audioTriggerCheckSuccess : audioTriggerCheckFail, volume: audioTriggersVolume }, rollMode === 'publicroll'), game.dice3d ? 2500 : 0
                );
            }
        }
    }
    static playAudioCast(success = true, rollMode = "publicroll", crit = false) {
        const audioPlayTriggers = game.settings.get("ars", "audioPlayTriggers");
        const audioTriggersVolume = game.settings.get("ars", "audioTriggersVolume");
        if (audioPlayTriggers) {
            const audioTriggerCast = game.settings.get("ars", "audioTriggerCast");

            if (['publicroll', 'selfroll', 'gmroll'].includes(rollMode)) {
                AudioHelper.play({ src: audioTriggerCast, volume: audioTriggersVolume }, rollMode === 'publicroll');
            }
        }
    }

    static playAudioMelee(success = true, rollMode = "publicroll", crit = false) {
        const audioPlayTriggers = game.settings.get("ars", "audioPlayTriggers");
        const audioTriggersVolume = game.settings.get("ars", "audioTriggersVolume");
        // console.log("dice.js playAudioMelee", { success, rollMode, crit, audioPlayTriggers, audioTriggersVolume }, ARS.sounds.combat['melee-hit'], ARS.sounds.combat['melee-miss'])
        if (audioPlayTriggers) {
            const audioTriggerMeleeHit = game.settings.get("ars", "audioTriggerMeleeHit");
            const audioTriggerMeleeCrit = game.settings.get("ars", "audioTriggerMeleeCrit");
            const audioTriggerMeleeMiss = game.settings.get("ars", "audioTriggerMeleeMiss");

            if (['publicroll', 'selfroll', 'gmroll'].includes(rollMode)) {
                const _waitforit = setTimeout(async () =>
                    AudioHelper.play(
                        {
                            src: success ? (crit ? audioTriggerMeleeCrit : audioTriggerMeleeHit) : audioTriggerMeleeMiss, volume: audioTriggersVolume
                        }, rollMode === 'publicroll'), game.dice3d ? 2500 : 0
                );
            }
        }
    }
    static playAudioMissile(success = true, rollMode = "publicroll", crit = false) {
        const audioPlayTriggers = game.settings.get("ars", "audioPlayTriggers");
        const audioTriggersVolume = game.settings.get("ars", "audioTriggersVolume");
        console.log("dice.js playAudioMissile", { success, rollMode, crit, audioPlayTriggers, audioTriggersVolume });
        if (audioPlayTriggers) {
            const audioTriggerRangeHit = game.settings.get("ars", "audioTriggerRangeHit");
            const audioTriggerRangeMiss = game.settings.get("ars", "audioTriggerRangeMiss");
            const audioTriggerRangeCrit = game.settings.get("ars", "audioTriggerRangeCrit");

            if (['publicroll', 'selfroll', 'gmroll'].includes(rollMode)) {
                const _waitforit = setTimeout(async () =>
                    AudioHelper.play(
                        {
                            src: success ? (crit ? audioTriggerRangeCrit : audioTriggerRangeHit) : audioTriggerRangeMiss, volume: audioTriggersVolume
                        }, rollMode === 'publicroll'), game.dice3d ? 2500 : 0
                );
            }
        }
    }
    /**
     * 
     * Process the ability check
     * 
     * @param {*} dd 
     */
    static async processAbilityCheck(dd) {
        // const aTargets = game.user.targets;         // these are "targeted"
        const abilityType = dd.action.abilityCheck.type;
        const bAbilityCheck = dd.action.abilityCheck.type !== 'none';

        console.log("dice.js processAbilityCheck", { dd, abilityType, bAbilityCheck });

        async function _processAbilityCheck(token) {
            const targetActor = token.actor;
            const nTarget = targetActor.system.abilities[abilityType].value;

            if (targetActor.system?.mods?.check?.formula) {
                dd.options.formula += '- @mods.check.formula';
            }
            if (targetActor.system?.mods?.check?.value) {
                dd.options.formula += '- @mods.check.value';
            }
            const roll = await DiceManager.systemRoll(targetActor, targetActor.getRollData(),
                game.i18n.localize('ARS.chat.check') + ` against ` + game.i18n.localize(`ARS.abilityTypes.${abilityType}`) + `, target ${nTarget}`,
                dd.formula, nTarget, true, false, '', dd.item, dd.action);

            dd.data.roll = roll;
            DiceManager.playAudioCheck(roll.bSuccess, roll.rollMode);
            if (roll.bSuccess) {
                switch (dd.action.successAction) {

                    case "remove":
                        game.user.targets.delete(token);
                        game.user.updateTokenTargets([]);
                        break;
                }

            } else {
                // console.log("dice.js processAbilityCheck FAILED Ability CHECK!");
            }

            Hooks.call("postRollAbility", token, dd.data.roll.bSuccess, game.i18n.localize(`ARS.abilityTypes.${abilityType}`), dd.source);
        }

        if (dd.targets.size > 0 && bAbilityCheck) {
            dd.targets.forEach(token => _processAbilityCheck(token));
        } else {
            // we really need a target to cast on...
            ui.notifications.error(`A target is required to force a ability check.`);
        }
    }

    /**
     * 
     * Cast and get a ability check
     * 
     * @param {*} sdd 
     */
    static async rollCastAbility(dd) {
        // console.log("dice.js", "rollCastAbility", "dataset", { sourceActor, sourceItem, sourceAction });
        dd.options.formula = "d20" + (dd.action.abilityCheck.formula ? `+ ${dd.source.abilityCheck.formula}` : '');

        DiceManager.processAbilityCheck(dd);
    }


    /**
     * 
     * This process save checks from spell/actions issued from chat cards.
     * 
     * @param {*} sourceActor 
     * @param {*} sourceItem 
     * @param {*} action 
     * @param {*} sFormula 
     */
    // async function processSave(sourceActor, sourceItem, action, sFormula) {
    static async processSave(dd) {
        console.log("dice.js processSave", { dd });
        // let aTargets = game.user.targets;         // these are "targeted"
        const saveType = dd.action.saveCheck.type;
        const bSaveCheck = saveType !== 'none';

        async function _processSave(token) {

            // console.log("dice.js processSave _processSave", { token });
            utilitiesManager.deleteSaveCache(token);

            const targetActor = token.actor;

            const statusEffects = {
                // self: dd.source.statusModifiers(),
                target: token?.actor.statusModifiers()
            };
            const saveMods = {
                effects: {
                    // self: dd.source.getTargetCombatMods(token?.actor, 'save', dd.item),
                    target: dd.source.getTargetCombatMods(token?.actor, 'save', dd.item),
                    attacker: token?.actor.getAttackerCombatMods(dd.source, 'save', dd.item),
                },
                status: {
                    // self: statusEffects.self.save,
                    target: statusEffects.target?.save,
                }
            }

            // console.log("dice.js processSave _processSave", { saveMods, statusEffects });

            let bonusFormula = [];
            let modsTargetEffects = saveMods.effects.target?.save?.all || 0;
            if (saveMods.effects.target?.save?.[`${saveType}`])
                modsTargetEffects += saveMods.effects.target.save[`${saveType}`]

            let modsAttackerEffects = saveMods.effects.attacker?.save?.all || 0;
            if (saveMods.effects.attacker?.save?.[`${saveType}`])
                modsAttackerEffects += saveMods.effects.attacker.save[`${saveType}`]

            let modsStatusEffects = saveMods.status.target?.all || 0;
            if (saveMods.status.target?.[`${saveType}`])
                modsStatusEffects += saveMods.status.target[`${saveType}`]

            const nTarget = targetActor.system.saves[saveType].value;
            let modsSelfEffects = targetActor.getSaveModifiersFromEffects(saveType, dd.action);
            if (modsSelfEffects) {
                // bonusFormula.push('@selfEffects');
                // bonusFormula.push(`${modsSelfEffects}`);
                let modsformula = ``;
                if (modsSelfEffects) {
                    if (typeof modsSelfEffects === 'string') {
                        modsformula = `+ ${modsSelfEffects} `;
                    }
                    if (Array.isArray(modsSelfEffects)) {
                        modsformula = modsSelfEffects.join('+')
                    }
                }

                bonusFormula.push(modsformula);
            }
            if (modsTargetEffects) {
                // bonusFormula.push('@targetedEffects');
                bonusFormula.push(`${modsTargetEffects} `);
            }
            if (modsAttackerEffects) {
                // bonusFormula.push('@modsAttackerEffects');
                bonusFormula.push(`${modsAttackerEffects} `);
            }
            if (modsStatusEffects) {
                bonusFormula.push('@statusEffects');
                // bonusFormula.push(`${ modsStatusEffects } `);
            }

            // console.log("dice.js processSave _processSave", { bonusFormula, modsSelfEffects, modsTargetEffects, modsStatusEffects });
            //TODO: create temp rollData with mods from effects against specific type (fire, lighting/etc)?
            const rawRollData = targetActor.getRollData();
            const rollData = mergeObject(rawRollData, {
                targetedEffects: modsTargetEffects,
                selfEffects: modsSelfEffects,
                // targetStatus: modsStatusEffects,
                statusEffects: modsStatusEffects ? modsStatusEffects : '',
            });
            const formula = dd.formula + (bonusFormula.length ? bonusFormula.join('+') : '');

            // console.log("dice.js processSave _processSave", { rollData, formula });

            const roll = await DiceManager.systemRoll(targetActor, rollData,
                `Save versus ` + game.i18n.localize(`ARS.saveTypes.${saveType} `),
                formula, nTarget, true, true, '', dd.item, dd.action);

            dd.data.roll = roll;
            DiceManager.playAudioCheck(roll.bSuccess, roll.rollMode);

            if (roll.bSuccess) {
                switch (dd.action.successAction) {

                    case "halve":
                        // console.log("dice.js processSave SAVED", token);
                        utilitiesManager.setSaveCache(dd.source, token);
                        break;

                    case "remove":
                        // console.log("dice.js processSave removing target:", { token });
                        game.user.targets.forEach((saved) => {
                            if (saved.id === token.id) {
                                saved.setTarget(false, { user: game.user, releaseOthers: false, groupSelection: true });
                            }
                        });
                        break;
                }

            } else {
                // console.log("dice.js processSave FAILED SAVE!", token);
                // if you fail a save you also get interrupted if casting
                if (token.document.combatant && token.document.combatant.getFlag("ars", "initCasting")) {
                    utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: token.actor }), 'Casting Interrupted', `${token.name} has casting interrupted`, token.img);
                }
            }

            Hooks.call("postRollSave", token, dd.data.roll.bSuccess, game.i18n.localize(`ARS.saveTypes.${saveType} `), dd.source);
        }

        console.log("dice.js processSave", { dd });

        if (dd.targets.size > 0 && bSaveCheck) {
            dd.targets.forEach(token => _processSave(token));
        } else {
            // we really need a target to cast on...
            ui.notifications.error(`A target is required to force a save check.`);
            return;
        }
    }


    /**
     * 
     * Roll a save for a cast from chatCard
     * 
     * @param {*} dd 
     */
    static async rollCastSave(dd) {
        // console.log("dice.js", "rollCastSave", { sourceActor, sourceItem, sourceAction });
        dd.options.formula = `d20` + (dd.action.saveCheck.formula ? ` + ${dd.action.saveCheck.formula} ` : ``);

        DiceManager.processSave(dd);
    }


    /**
     * 
     * This is run when the "cast" option in a chat card is pressed
     * 
     */
    // export async function rollCast(sourceActor, sourceItem, bCastSpell = false,
    // slotIndex = undefined, slotType = undefined, slotLevel = undefined, sourceAction = undefined) {
    static async rollCast(dd) {

        console.log("dice.js rollCast", { dd });
        const bSaveCheck = dd.action.saveCheck.type !== 'none';
        const bAbilityCheck = dd.action.abilityCheck.type !== 'none';

        dd.options.formula = "d20";
        if (dd.isCastSpell && utilitiesManager.isMemslotUsed(dd.source, dd.slotType, dd.slotLevel, dd.slotIndex)) {
            console.log("dice.js rollCast spell slot used already!");
            ui.notifications.error(`${dd.item.name} has no more uses left.`);
            if (!game.user.isGM) return;
        }
        else if (!dd.isCastSpell && dd.action && game.ars.config.chargedActions.includes(dd.action.type) && dd.action.resource.type != 'none') {
            if (!await utilitiessManager.useActionCharge(dd.source, dd.item, dd.action)) {
                const resourceUsed = game.i18n.localize(game.ars.config.consumed[dd.action.resource.type] ?? 'uses');
                console.log(`dice.js rollAttack ${dd.action.name} has no more ${resourceUsed} left.`);
                ui.notifications.error(`${dd.action.name} has no more ${resourceUsed} left.`);
                if (!game.user.isGM) return;
            }
        }

        if (bSaveCheck) {
            dd.options.formula = `${dd.formula} + ${dd.action.saveCheck.formula} `;
            DiceManager.processSave(dd);
        }
        if (bAbilityCheck) {
            dd.options.formula = `${dd.formula} + ${dd.action.abilityCheck.formula} `;
            DiceManager.processAbilityCheck(dd);
        }

        //TODO processCheck here?

        if (dd.isCastSpell) {
            utilitiesManager.memslotSetUse(dd.data.sourceActor, dd.slotType, dd.slotLevel, dd.slotIndex, true);
        }

        // no save or ability, at least throw up a "this was cast"
        if (!bSaveCheck && !bAbilityCheck || dd?.action?.misc) {
            const speaker = ChatMessage.getSpeaker({ actor: dd.source });
            const isFriendly = dd.source.getToken().disposition === game.ars.const.TOKEN_DISPOSITIONS.FRIENDLY;
            ChatMessage.create({
                speaker: speaker,
                content:
                    `<div class="flexcol" > ` +
                    `<div class="${isFriendly ? '' : 'gm-only-view'}" style = "text-align: center;" > <h3>Cast <b>${dd.action.name}</b></h3></div> ` +
                    (dd?.action?.misc ? `<div class="${isFriendly ? '' : 'gm-only-view'}" > <h4>${dd.action.misc}</h4></div> ` : '') +
                    `<div class="non-owner-only-view" > ${game.i18n.localize("ARS.unknownAction")}</div> ` +
                    `</div> `,
                flags: { actor: dd.source, item: dd.item, action: dd.action }
            });
        }
        //sound triggered using spell sound if configured
        if (dd?.item?.system?.audio?.file) {
            dd.item.playAudio();
        } else {
            DiceManager.playAudioCast(true, 'publicroll', false);
        }

    }

    /**
     * 
     * Build up formulas/etc to roll damage
     * 
     * @param {*} dd 
     * @param {*} targetToken This is only used if we're using auto roll damage from an attack 
     * @param {Boolean} skipSituational
     * @returns 
     */
    static async rollDamage(dd, targetToken = null, skipSituational = false) {
        console.log("dice.js rollDamage", { dd, targetToken, skipSituational });

        // we do this because weapons only hit one.
        dd.data.targets = targetToken ? new Set().add(targetToken) : dd.data.targets;         // these are "targeted"
        //const aTargets =canvas.tokens.controlled; // these are "selected"

        async function _processRollDamage(target) {
            // console.log("dice.js rollDamage _processRollDamage", { target });

            const bLargeDMG = (dd.options.forceLarge || !game.ars.config.notLargeCreature.includes(target.actor.system.attributes.size));

            // console.log("dice.js rollDamage", { bLargeDMG });

            const meleeDmg = await CombatManager.getDamageFormulas(target, dd);
            if (!meleeDmg) return null;

            dd.options.flavor = meleeDmg.damageFlavor;
            const damageFormulas = meleeDmg.damageFormulas;
            const largeDamageFormulas = meleeDmg.largeDamageFormulas;

            if (dd.item && dd.isDamage) dd.options.flavor += bLargeDMG ? "[LARGE]" : "";

            if (dd.isDamage && dd.item && bLargeDMG) {
                dd.data.dmgFormulas = largeDamageFormulas;
                await DiceManager.adjustHPRoll(dd, target);
            } else {
                dd.data.dmgFormulas = damageFormulas;
                await DiceManager.adjustHPRoll(dd, target);
            }
        }

        if (!skipSituational && !dd.data.event.ctrlKey) {
            let situationalFlavor = dd.item ? await dd.item.getStatBlock() : (dd.action ? `${dd.action.name} ` : 'Damaging ...');
            const situational = await dialogManager.getDamage(dd.isDamage ? 'Damage' : 'Heal', 'Cancel', 'Apply Health Adjustment', situationalFlavor);
            if (!situational || isNaN(situational.mod)) return;
            dd.options.dmgAdjustment = situational?.dmgAdjustment || 'normal';
            dd.options.situational = situational;
        } else {
            dd.options.situational = { mod: 0, dmgAdjustment: 'normal' };
        }

        if (dd.targets.size > 0 && (dd.item && dd.options.isWeapon)) {
            dd.targets.forEach(target => _processRollDamage(target));
        } else {
            console.log("dice.js rollDamage NO TARGET", dd.targets);

            // Cast spell or no targets.
            const meleeDmg = await CombatManager.getDamageFormulas(null, dd);
            dd.options.flavor = meleeDmg.damageFlavor;
            // console.log("dice.js rollDamage", dd.options.forceLarge);
            dd.data.dmgFormulas = dd.options.forceLarge ? meleeDmg.largeDamageFormulas : meleeDmg.damageFormulas;

            // return adjustHPRoll(dd.source, dd.item, dd.action, dd.options.flavor, null, dd.data.damageFormulas, dd.isDamage, dd.dmgAdj);
            return await DiceManager.adjustHPRoll(dd);
        }

    }

    /**
     * Attack roll
     * 
     * @param {*} sourceActor 
     * @param {*} sourceItem 
     */
    static async rollAttack(dd) {
        // const aTargets = game.user.targets || undefined; // these are "targeted"

        console.log("dice.js rollAttack", { dd });

        // we add the situational prompt here so it's also used for actions
        let situationalFlavor = dd.item ? await dd.item.getStatBlock() : 'Attacking ...';
        const attackDetails = dd.data?.event?.ctrlKey ? null : await dialogManager.getAttack('Attack', 'Cancel', 'Attack Details', situationalFlavor);
        dd.options.acLocation = attackDetails?.acLocation || 'normal';
        dd.options.situational = {
            mod: attackDetails?.mod || 0,
            rollMode: attackDetails?.rollMode || undefined,
        };

        // only show weapon in flavor if it's truely identified (even if DM)
        (dd.options.label = dd.item ?
            (dd.item.isIdentifiedRaw ? `${dd.item.name} ` : `${game.i18n.localize("ARS.unknown")} ${dd.item.type} `) + ` attack` :
            `(Action) ${dd.action?.name} `);
        dd.options.isDamage = true;


        async function _processRollAttack(target) {
            dd.data.targetToken = target;

            let roll = await DiceManager.systemAttackRoll(dd, target);
            dd.data.roll = roll;

            const autoDamage = game.settings.get("ars", "autoDamage");
            const autoCheck = game.settings.get("ars", "autoCheck");

            // melee/thrown/ranged
            const attackType = (dd.options.isWeapon ? dd.item.system.attack.type : dd.action.type);

            if (dd?.item?.system?.audio?.success && dd?.item?.system?.audio?.failure) {
                dd.item.playCheck(roll.rollMode, roll.bSuccess, roll.criticaled);
            } else {
                switch (attackType) {
                    case 'melee':
                        DiceManager.playAudioMelee(roll.bSuccess, roll.rollMode, roll.criticaled);
                        break;

                    default:
                        DiceManager.playAudioMissile(roll.bSuccess, roll.rollMode, roll.criticaled);
                        break;
                }
            }

            if (roll.bSuccess && dd.item && autoDamage) {
                DiceManager.rollDamage(dd, target, true)
            } else if (roll.bSuccess && autoDamage && (dd.action.type === 'damage' || dd.action.type === 'heal')) {
                DiceManager.rollDamage(dd, target, true)
            }
            else if (roll.bSuccess && dd.action && autoCheck && dd.action.saveCheck.type !== 'none') {
                dd.options.formula = `d20` + (dd.action.saveCheck.formula ? ` + ${dd.action.saveCheck.formula} ` : ``);
                DiceManager.processSave(dd);
            } else if (roll.bSuccess && dd.action && autoCheck && dd.action.abilityCheck.type !== 'none') {
                dd.options.formula = `d20 + ${dd.action.abilityCheck.formula} `;
                DiceManager.processAbilityCheck(dd);
            }
            //TODO add processCheck entry here

            Hooks.call("postRollAttack", target, dd.data.roll.bSuccess, dd.source, dd.item, dd.action);
        }

        // if this is a weapon with ammo, use it
        if (dd.item && dd.options.isWeapon && game.ars.config.ammoAttacks.includes(dd.item.system.attack.type)) {
            if (!await utilitiesManager.useWeaponAmmo(dd.source, dd.item)) {
                const resourceUsed = game.i18n.localize(game.ars.config.consumed['item']);
                console.log(`dice.js rollAttack ${dd.item.name} has no more ${resourceUsed} left.`);
                ui.notifications.error(`${dd.item.name} has no more ${resourceUsed} left.`);
                if (!game.user.isGM) return;
            }
        }
        // if this is an action with a "charged" use track it
        else if (dd.action && dd.options.isAction && game.ars.config.chargedActions.includes(dd.action.type) && dd.action.resource.type != 'none') {
            if (!await utilitiesManager.useActionCharge(dd.source, dd.item, dd.action)) {
                const resourceUsed = game.i18n.localize(game.ars.config.consumed[dd.action.resource.type] ?? 'uses');
                console.log(`dice.js rollAttack ${dd.action.name} has no more ${resourceUsed} left.`);
                ui.notifications.error(`${dd.action.name} has no more ${resourceUsed} left.`);
                if (!game.user.isGM) return;
            }
        }

        if (dd.targets.size > 0) {
            dd.targets.forEach(target => _processRollAttack(target));
        } else {
            DiceManager.systemAttackRoll(dd, null);
        }

        // if this was a weapon item we popup the damage chatCard after attack
        // if (dd.item) {
        //     if (dd.item.type === 'weapon') {
        //         dd.item._chatRoll({
        //             item: dd.item,
        //             sourceActor: dd.source,
        //             sourceToken: dd.source.token,
        //         });
        //     }
        // }

    }

    /**
     * 
     * Roll an attack
     * 
     * @param {*} dd DicerData
     * @param {*} targetToken Token of this target
     * @returns 
     */
    static async systemAttackRoll(dd, targetToken) {
        const nTHACO = dd.source.system.attributes.thaco.value;
        // console.log("dice.js systemAttackRoll", { dd, targetToken })
        let bonusFormula = [];
        let proficientWithWeapon = false;
        let profHit = 0;
        let rangeModifier = 0;

        const statusEffects = {
            self: dd.source.statusModifiers(),
            target: targetToken ? targetToken?.actor.statusModifiers() : undefined,
        };
        const attackMods = {
            effects: {
                self: dd.source.getTargetCombatMods(targetToken?.actor, 'attack', dd.item),
                target: targetToken ? targetToken?.actor.getAttackerCombatMods(dd.source, 'attack', dd.item) : undefined,
            },
            status: {
                self: statusEffects.self.attack,
                target: targetToken ? statusEffects.target.attacked : undefined,
            }
        }

        const attackType = (dd.item && dd.options.isWeapon ? dd.item.system.attack.type : dd.action.type);

        let nTargetAC = 10;
        let sNameTarget = "Unknown";
        // let acType = ['ranged', 'thrown'].includes(attackType) ? `ranged${ dd.ac } ` : attackType;
        if (targetToken) {
            // nTargetAC = targetToken.actor.system.armorClass[dd.ac] + parseInt(statusEffects.target.ac.mod);
            // default AC is front/melee
            nTargetAC = targetToken.actor.system.armorClass[dd.ac];
            // we only use tags if attack is normal, we can't stack positional attacks and status tags (nodex/etc)
            if (dd.ac === 'normal' && statusEffects.target.ac.tags.length) {
                nTargetAC = targetToken.actor.system.armorClass[statusEffects.target.ac.tags[0]];
            }
            if (attackType) {
                switch (dd.ac) {
                    // case 'shieldless':
                    //     nTargetAC = targetToken.actor.system.armorClass[dd.ac] + parseInt(statusEffects.target.ac.mod);
                    //     break;
                    case 'rear':
                        if (['ranged', 'thrown'].includes(attackType)) {
                            nTargetAC = targetToken.actor.system.armorClass[`ranged${dd.ac} `] + parseInt(statusEffects.target.acRanged.mod);
                        } else {
                            // melee is default rear ac
                            // nTargetAC = targetToken.actor.system.armorClass[`${ attackType }${ dd.ac } `];
                        }
                        break;

                    default: // normal
                        if (['ranged', 'thrown'].includes(attackType)) {
                            nTargetAC = targetToken.actor.system.armorClass['ranged'] + parseInt(statusEffects.target.acRanged.mod);
                        }
                        break;

                }
            }
            //apply modifiers to AC if status mods exist for it
            nTargetAC += parseInt(statusEffects.target.ac.mod);
            sNameTarget = targetToken.name || targetToken.actor.name;

            // console.log("dice.js systemAttackRoll", { nTargetAC })
        }

        // if this is a weapon, apply tohit mods to both actions and weapon use
        if (dd.item && dd.item.type === 'weapon') {
            // get the modifiers for hit from proficiencies
            for (const profItem of dd.source.proficiencies) {
                for (const weapon of Object.values(profItem.system.appliedto)) {
                    if (weapon.id === dd.item.id) {
                        const weaponHitMod = utilitiesManager.evaluateFormulaValue(profItem.system.hit, dd.source.getRollData());
                        profHit += weaponHitMod;
                        proficientWithWeapon = true;
                    }
                }
            } // end profs check
            if (!proficientWithWeapon) profHit += parseInt(dd.source.system?.attributes?.proficiencies?.weapon?.penalty) || 0;
        }

        let weaponFormulas = [];

        if (dd.item && dd.options.isWeapon) {
            // add in modifier to hit from identified magic items
            const ammo = await dd.item.getAmmo(true);
            if (ammo && ammo.system?.attack?.modifier) {
                if (ammo.system.attack.modifier !== '0')
                    weaponFormulas.push(`${ammo.system.attack.modifier} `);
            } else if (!ammo && dd.item.system?.attack?.modifier) {
                if (dd.item.system.attack.modifier !== '0')
                    weaponFormulas.push(`${dd.item.system.attack.modifier} `);
            }

            if (ammo && ammo.system?.attack?.magicBonus)
                weaponFormulas.push(`${ammo.system.attack.magicBonus} `);

            if (((!ammo) || (ammo && dd.item.system.attack.type === 'ranged')) && dd.item.system.attack.magicBonus) {
                weaponFormulas.push(`${dd.item.system.attack.magicBonus} `);
            }

            switch (attackType) {
                case "melee":
                    if (dd.source.system.abilities.str.hit)
                        bonusFormula.push("@abilities.str.hit");
                    break
                case "thrown":
                case "ranged":
                    if (attackType === 'thrown' && dd.source.system.abilities.str.hit)
                        bonusFormula.push("@abilities.str.hit");
                    if (dd.source.system.abilities.dex.missile)
                        bonusFormula.push("@abilities.dex.missile");

                    //check range and apply @range 
                    if (targetToken?.document) {
                        const distance = dd.source.getToken().getDistance(targetToken.document);
                        const combatAutomateRangeMods = game.settings.get("ars", "combatAutomateRangeMods");
                        if (combatAutomateRangeMods && distance) {
                            const range = await dd.item.getRange();
                            // ARS.rangeModifiers.short/medium/long
                            if (distance >= 0 && distance <= range.short) {
                                rangeModifier = ARS.rangeModifiers.short;
                            } else if (distance >= range.short && distance <= range.medium) {
                                rangeModifier = ARS.rangeModifiers.medium;
                            } else if (distance >= range.medium && distance <= range.long) {
                                rangeModifier = ARS.rangeModifiers.long;
                            } else if (distance > range.long) {
                                rangeModifier = ARS.rangeModifiers.long;
                            }
                            if (rangeModifier)
                                bonusFormula.push("@range");
                        }
                    }

                    break
                default:
                    break
            }
        } else if (dd.action && dd.options.isAction) {
            if (dd.action.formula) bonusFormula.push(dd.action.formula);
            switch (dd.action.type) {
                case "melee":
                    if (dd.action.ability === 'str') {
                        bonusFormula.push("@abilities.str.hit");
                    }
                    break;
                case "thrown":
                    if (dd.action.ability === 'str') {
                        bonusFormula.push("@abilities.str.hit");
                    }
                    if (dd.action.ability === 'dex') {
                        bonusFormula.push("@abilities.dex.missile");
                    }
                    break;
                case "ranged":
                    if (dd.action.ability === 'dex') {
                        bonusFormula.push("@abilities.dex.missile");
                    }
                    break;

                default:
                    break;
            }

        }

        let formula = 'd20';
        // console.log("dice.js systemAttackRoll", { dd }, dd.options.situational, dd.data.event.ctrlKey)
        let situationalFlavor = dd.ammo ? await dd.ammo.getStatBlock() : (dd.item ? await dd.item.getStatBlock() : (dd.action ? dd.action.name : 'Attacking...'));
        // should only see this situation dialog if it's an action, not item
        if (!dd.options.situational)
            dd.options.situational = dd.data.event.ctrlKey ? { mod: 0 } : await dialogManager.getSituational(-10000, 100000, 0, `Modifier`, `Attack`, situationalFlavor)
        if (isNaN(dd.situational.mod)) return null;


        const _roll = async () => {
            let weaponMod = 0;

            if (profHit) bonusFormula.push("@proficiency");
            if (weaponFormulas.length) {
                bonusFormula.push("@weaponMod");
                // doing this hear keeps the view matching the @mod order, otherwise if the weapon mod formula has
                // additional like "4 + 1d3" they will be offset and might confuse. The con of doing this is
                // that this method doesn't show the rolls for these
                weaponMod = utilitiesManager.evaluateFormulaValue(weaponFormulas.join("+"), dd.source.getRollData());
            }

            if (dd.situational.mod != 0) bonusFormula.push("@situational");

            // melee/thrown/ranged
            const attackType = (dd.item && dd.item.type === 'weapon' ? dd.item.system.attack.type : dd.action.type);

            // insert @mods
            if (dd.source.system?.mods?.attack?.value)
                bonusFormula.push("@mods.attack.value");
            if (dd.source.system?.mods?.attack?.[attackType])
                bonusFormula.push(`@mods.attack.${attackType} `);

            let wVaFormula = '';
            if (targetToken && targetToken.actor)
                switch (game.ars.config.settings.systemVariant) {

                    case '0':
                    case '1': {
                        wVaFormula = DiceManager.getWVAMod(dd.source, targetToken.actor, dd.options.isWeapon ? dd.item : undefined)
                    }
                        break;

                    case '2': {
                        let wvAdmgType = 'slashing';
                        if (dd.options.isWeapon && dd.item) {
                            wvAdmgType = dd.item.system?.damage?.type ?? "slashing";
                        } else if (dd.action) {
                            // Normalize the action name by converting it to lower case and trimming whitespace
                            const aName = dd.action.name.toLowerCase().trim();
                            // Create a regular expression to match piercing attack types ('bite', 'horn', 'talon')
                            const pierceRegex = /(?:arrow|bolt|spear|bite|horn|pierc|stab|poke|talon)/;
                            // Create a regular expression to match bludgeoning attack types ('tail', 'fist', 'rock', 'stone', 'smash')
                            const bludgeonRegex = /(?:buffet|bludgeon|club|hammer|mace|staff|crush|tail|fist|punch|rock|stone|smash|slam)/;
                            // dont need a huge list here, default is slash. adding "slash" to be able to enforce slashing
                            const slashRegex = /(?:slash)/;

                            if (slashRegex.test(aName)) {
                                wvAdmgType = 'slashing';
                            } else if (pierceRegex.test(aName)) {
                                wvAdmgType = 'piercing';
                            } else if (bludgeonRegex.test(aName)) {
                                wvAdmgType = 'bludgeoning';
                            }
                            // default is slashing
                        }
                        wVaFormula = DiceManager.getWVAMod(dd.source, targetToken.actor, undefined, wvAdmgType);
                    }
                        break;

                    default:
                        break;
                }
            if (wVaFormula)
                bonusFormula.push('@WvsA');

            // insert attack mods for effects
            const selfEffects = attackMods.effects.self.value + attackMods.effects.self[attackType];
            const targetEffects = targetToken ? attackMods.effects.target.value + attackMods.effects.target[attackType] : undefined;
            // I think we can use the formula @ instead, we'll try.
            if (selfEffects) bonusFormula.push("@selfEffects");
            if (targetEffects) bonusFormula.push("@targetEffects");
            // if (selfEffects) bonusFormula.push(`${ selfEffects } `);
            // if (targetEffects) bonusFormula.push(`${ targetEffects } `);

            // insert attack mods for status effects
            const selfStatus = attackMods.status.self.value + attackMods.status.self[attackType];
            const targetStatus = targetToken ? attackMods.status.target.value + attackMods.status.target[attackType] : undefined;
            if (selfStatus) bonusFormula.push("@selfStatus");
            if (targetStatus) bonusFormula.push("@targetStatus");
            // if (selfStatus) bonusFormula.push(`${ selfStatus } `);
            // if (targetStatus) bonusFormula.push(`${ targetStatus } `);

            let additionalRollData = {
                weaponMod: weaponMod,
                WvsA: wVaFormula ? wVaFormula : undefined,
                proficiency: profHit,
                situational: dd?.situational?.mod,
                range: rangeModifier,
                // targeted: targeted,
                selfEffects: selfEffects,
                targetEffects: targetEffects,
                selfStatus: selfStatus ? selfStatus : '',
                targetStatus: targetStatus ? targetStatus : '',
            };
            Hooks.callAll("addAttackRollBonuses", dd, targetToken, bonusFormula, additionalRollData);

            const lastFormula = `${formula} ${bonusFormula.length ? "+" + bonusFormula.join("+") : ''} `;
            let roll;

            // console.log("dice.js systemAttackRoll _roll", { statusEffects, selfEffects, targetEffects, selfStatus, targetStatus })

            // build rollData for @formulas with temp data we need to reference
            const rawRollData = duplicate(dd.source.getRollData());
            const rollData = mergeObject(rawRollData, additionalRollData);

            // console.log("dice.js systemAttackRoll rollData", { rollData })
            try {
                roll = await new Roll(lastFormula, rollData, { rollMode: dd.situational.rollMode }).roll({ async: true });
            } catch (err) {
                console.error(err);
                ui.notifications.error(`Dice roll evaluation failed: ${err.message} `);
                return null;
            }
            roll.rawformula = formula +
                (bonusFormula.length ? ('+' + bonusFormula.join("+")) : '');

            return roll;
        };

        let roll = await _roll();

        // Create a Chat Message
        if (roll) {
            // const nACHit = dd.source.acHitByTHACO(roll.total);
            const nACHit = dd.source.acHit(roll.total);
            const naturalRoll = roll.dice[0].total;
            // console.log("dice.js attack roll natural roll = ", naturalRoll);
            const fumbled = naturalRoll == 1;
            const criticaled = naturalRoll == 20;
            let bSuccess = nACHit <= nTargetAC;

            const itemName = dd.options.label;
            if (targetToken) {
                dd.options.label +=
                    ` against` +
                    `<div data-id="${targetToken.id}" class="secure-name" > ${targetToken.name}</div> `;
                if (bSuccess) {

                    //TODO add in checks for displacement here.

                    // Mirror image/Stoneskin tests
                    let effectsBundle = duplicate(targetToken.actor.effects);
                    // console.log("dice.js attack mirror image effectsBundle", effectsBundle);
                    let depletedEffect = [];
                    let updatedEffects = false;
                    effectsBundle.forEach((effect, efindex) => {
                        if (!effect.disabled && !effect.isSuppressed && bSuccess) { // we check success incase we mirrored this already in the loop
                            effect.changes.forEach(change => {
                                if (change.key === 'special.mirrorimage' && bSuccess) {
                                    const mirrorCount = parseInt(change.value);
                                    if (mirrorCount > 0) {
                                        // check to see if hit mirror or target
                                        const checkRoll = Math.floor(Math.random() * (mirrorCount + 1)) + 1;
                                        // console.log("dice.js attack mirror image checkRoll!", checkRoll);
                                        if (checkRoll == 1) {
                                            //PC HIT
                                        } else {
                                            //MIRROR HIT
                                            // console.log("dice.js attack mirror image hit", mirrorCount);
                                            // remove a mirror
                                            change.value -= 1;
                                            bSuccess = false;
                                            updatedEffects = true;
                                            dd.options.label += ' STRUCK MIRROR ';
                                            if (change.value <= 0) depletedEffect.push(effect._id);
                                        }
                                    }
                                } else if (change.key === 'special.stoneskin' && bSuccess) {
                                    const stoneCount = parseInt(change.value);
                                    if (stoneCount > 0) {
                                        //STONESKIN HIT
                                        // console.log("dice.js attack STONESKIN hit", stoneCount);
                                        // remove a mirror
                                        change.value -= 1;
                                        bSuccess = false;
                                        updatedEffects = true;
                                        dd.options.label += ' STRUCK STONESKIN ';
                                        if (change.value <= 0) depletedEffect.push(effect._id);
                                    }
                                }
                            });
                        }
                    }); // end mirror/stone check
                    if (updatedEffects) {
                        await utilitiesManager.runAsGM({
                            sourceFunction: 'systemAttackRoll',
                            operation: 'actorUpdate',
                            user: game.user.id,
                            targetTokenId: targetToken.id,
                            update: { 'effects': effectsBundle },
                        });
                    }
                    if (depletedEffect.length)
                        await utilitiesManager.runAsGM({
                            operation: 'deleteActiveEffect',
                            user: game.user.id,
                            targetActorId: targetToken.actor.id,
                            targetTokenId: targetToken.id,
                            sourceActorId: dd.source.id,
                            effectIds: depletedEffect,
                        });
                    // }
                }
            } else {
                //sLabel += ", hit AC:" + nACHit;
            }

            // console.log("config", game.ars.config)
            // check auto-hit/miss for dice
            if (game.ars.config.settings.autohitfail && fumbled) {
                bSuccess = false;
            } else if (game.ars.config.settings.autohitfail && criticaled) {
                bSuccess = true;
            }

            roll.rollMode = dd.options.situational.rollMode;
            roll.bSuccess = bSuccess;
            roll.criticaled = criticaled;
            roll.fumbled = fumbled;

            roll.diceToolTip = await roll.getTooltip();

            // Create a Chat Message
            const sourceSpeaker = ChatMessage.getSpeaker({ actor: dd.source });
            let cardData = {
                isGM: game.user.isGM,
                config: game.ars.config,
                speaker: sourceSpeaker,
                flavor: dd.options.label,
                succeded: bSuccess,
                targetnumber: nTargetAC,
                hitnumber: nACHit,
                rolledcheck: roll.total,
                difference: Math.abs((nTargetAC - nACHit)),
                fumble: fumbled,
                critical: criticaled,
                tooltip: await roll.getTooltip(),
                "roll": roll,
                "source": dd.source,
                "target": targetToken,
                "targetname": sNameTarget,
                "weapon": dd.item ? dd.item : dd.action,
                "weaponname": itemName,
                "action": dd.action
            };

            const content = await renderTemplate("systems/ars/templates/chat/parts/chatCard-attack.hbs", cardData);
            let chatData = {
                content: content,
                user: game.user.id,
                speaker: sourceSpeaker,
                roll: roll,
                rollMode: dd.situational.rollMode,
                type: game.ars.const.CHAT_MESSAGE_TYPES.ROLL,
                flags: {
                    actor: dd.source, item: dd.item, criticaled, fumbled,
                    action: dd.data.sourceAction, targetLoc: targetToken ? targetToken.id : undefined
                }
            };
            ChatMessage.create(chatData);

            // roll.toMessage({ speaker: speaker, flavor: sLabel }, {});
        }
        return roll;
    }

    /**
     * 
     * Return a modifier formula when using a weapon type versus a armor type
     * 
     * @param {Object} sourceActor attacker
     * @param {Object} targetActor target
     * @param {Object} weaponUsed weapon item used to attack
     * @returns 
     */
    static getWVAMod(sourceActor, targetActor, weaponUsed, actionDmgType = undefined) {
        console.log("getWVAMod", { sourceActor, targetActor, weaponUsed });

        // Validate the input to check if all required variables are present
        function isValidInput(sourceActor, targetActor) {
            return (
                sourceActor &&
                targetActor
            );
        }

        // Find worn armor for the target actor
        function findArmor(targetActor) {
            return targetActor.armors.find((armor) => armor.isWornArmor);
        }

        // Find worn shield for the target actor
        function findShield(targetActor) {
            return targetActor.armors.find((shield) => shield.isWornShield);
        }

        // Calculate damage modifier formula for variant 1
        function getFormulaForVariant1(weaponUsed, armorWorn, shieldWorn) {
            // Get weapon style or default to empty string
            if ((!weaponUsed ||
                weaponUsed.type !== "weapon")) return "";

            const weaponStyle = weaponUsed.system?.weaponstyle ?? "";

            // Return empty formula if no armor is worn or weapon style is missing
            if (!armorWorn || !weaponStyle) {
                return "";
            }

            // Calculate armor class type considering the worn shield
            let acType = shieldWorn
                ? armorWorn.system.protection.ac - 1
                : armorWorn.system.protection.ac;
            acType = Math.max(0, Math.min(10, acType));

            // Fetch damage modifier based on variant, weapon style, and armor class type
            const variant = 1;
            const dmgMod = game.ars.config.weaponVarmor[variant]?.[weaponStyle]?.[acType] ?? 0;

            // Return damage modifier or empty string if no modifier is found
            return dmgMod ? `${dmgMod} ` : "";
        }

        // Calculate damage modifier formula for variant 2
        function getFormulaForVariant2(weaponUsed, armorWorn, damageType) {
            // Return empty formula if no armor is worn
            if (!armorWorn || !damageType) {
                return "";
            }

            // Get armor style or default to empty string
            const armorStyle = armorWorn.system?.armorstyle ?? "";
            if (!armorStyle) {
                return "";
            }

            // Fetch damage modifier based on variant, armor style, and damage type
            const variant = 2;
            const dmgMod = game.ars.config.weaponVarmor[variant]?.[armorStyle]?.[damageType] ?? 0;

            // Return damage modifier or empty string if no modifier is found
            return dmgMod ? `${dmgMod} ` : "";
        }

        // Check input validity before proceeding
        if (!isValidInput(sourceActor, targetActor)) {
            return "";
        }

        // Fetch the game variant and worn armor and shield
        const variant = parseInt(game.ars.config.settings.systemVariant);
        const wVaEnabled = game.settings.get("ars", "weaponVarmor");
        const armorWorn = findArmor(targetActor);
        const shieldWorn = findShield(targetActor);

        // Calculate attack modifier based on the game variant
        if (wVaEnabled) {
            if (variant <= 1) {
                return getFormulaForVariant1(weaponUsed, armorWorn, shieldWorn);
            } else if (variant === 2) {
                return getFormulaForVariant2(weaponUsed, armorWorn, actionDmgType);
            }
        }

        return "";
    }



    /**
     * 
     * Roll formulas and adjust health
     * 
     */
    static async adjustHPRoll(dd, targetToken = null) {
        const sourceName = dd.action ? dd.action.name : dd.item.name;
        // console.log("dice.js adjustHPRoll", { sourceActor, sourceItem, sourceAction, damageFlavor, sourceName, targetToken, damageFormulas, bDamage });

        // this does all the rolls.
        await CombatManager.getRolledDamage(dd);
        // let aTargets = game.user.targets;
        // if someone is using a weapon, flush and set to only that one target
        // since they roll damage for each target individually
        if (targetToken) dd.data.targets = new Set().add(targetToken);
        const ammo = await dd.item?.getAmmo(true);
        if (!dd.targets.size > 0) {
            const rdmg = await CombatManager.applyDamageAdjustments(dd.source, null, dd.item, dd.action, dd.isDamage, dd.data.dmgDone, ammo);
            await CombatManager.sendHealthAdjustChatCard(dd.source, null, dd.isDamage, dd.data.rolled, rdmg.total, rdmg.types, dd.flavor, sourceName, dd.rollMode);
        } else {
            for (let target of dd.targets) {
                const rdmg = await CombatManager.applyDamageAdjustments(dd.source, target, dd.item, dd.action, dd.isDamage, dd.data.dmgDone, ammo);
                await CombatManager.sendHealthAdjustChatCard(dd.source, target, dd.isDamage, dd.data.rolled, rdmg.total, rdmg.types, dd.flavor, sourceName, dd.rollMode);

                // system variant 2 uses armor damage system, 1 armor damage per die of damage
                CombatManager.armorDamage(target, dd);

            } // end for targetToken
        }
    }


    /**
     * 
     * @param {*} event 
     */
    static async rollAbility(event) {

        // console.log("dice.js rollAbility");

        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        //console.log("dice.js","rollSave","data",JSON.stringify(data));

        if (dataset.roll) {
            let source = this.actor;
            let sFormula = dataset.roll;
            const nTarget = dataset.target;

            let label = `Checking ${dataset.label} `;

            if (source.system?.mods?.check?.formula) {
                sFormula += '- @mods.check.formula';
            }
            if (source.system?.mods?.check?.value) {
                sFormula += '- @mods.check.value';
            }

            const roll = await DiceManager.systemRoll(source, source.getRollData(), label, sFormula, nTarget, event.ctrlKey, false);
            DiceManager.playAudioCheck(roll.bSuccess, roll.rollMode);

        }
        return null;
    }

    /**
     * 
     * @param {*} event 
     */
    static async rollSave(event) {

        console.log("dice.js rollSave", event);

        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        console.log("dice.js rollSave", { element, dataset });

        if (dataset.saveType) {
            const saveType = dataset.saveType;
            let sourceActor = this.actor;
            const nTarget = dataset.target;

            const modsFromEffects = sourceActor.getSaveModifiersFromEffects(saveType);
            let modsformula = ``;
            if (modsFromEffects) {
                if (typeof modsFromEffects === 'string') {
                    modsformula = `+ ${modsFromEffects} `;
                }
                if (Array.isArray(modsFromEffects)) {
                    modsformula = modsFromEffects.join('+')
                }
            }
            const sFormula = `d20${modsformula} `;

            let label = `Saving versus ${dataset.label} `;
            console.log("dice.js rollSave", { sFormula });

            const roll = await DiceManager.systemRoll(sourceActor, sourceActor.getRollData(), label, sFormula, nTarget, event.ctrlKey, true);
            DiceManager.playAudioCheck(roll.bSuccess, roll.rollMode);
            if (!roll.bSuccess) {
                // if you fail a save you also get interrupted if casting
                // console.log("dice.js rollSave", { sourceActor }, this);
                if (this.token?.combatant && this.token.combatant.getFlag("ars", "initCasting")) {
                    utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: sourceActor }), 'Casting Interrupted', `${sourceActor.name} has casting interrupted`, sourceActor.img);
                }
            }

        }

        return null;
    }

    /**
     * General use roll for skills or saves. 
     * Give it a target and direction to check. 
     * Ascending means roll >= to target, not ascending means roll <= target.
     * 
     * @param {Object} source   Actor
     * @param {Object} data     Data path of modifiers
     * @param {String} sLabel   Flavor label for roll
     * @param {String} sFormula  Dice formula
     * @param {Number} nTarget   Target of roll
     * @param {Boolean} skipSituational  skip situational modifier dialog
     * @param {Boolean} bAscendingCheck  Target value is ascending/greater|equal?
     * @param {String} targetFlavor  modifier tooltip text like "@effects" or whatever modified the roll
     * @param {Object} item  item used during roll (weapon/item/etc)
     * @param {Object} action action used during roll
     */
    static async systemRoll(source = null, data = null, sLabel = "Rolling ", sFormula = "d20", nTarget = 20, skipSituational = false, bAscendingCheck = true, targetFlavor = '', item = undefined, action = undefined) {


        console.log("dice.js systemRoll", { source, data, sLabel, sFormula, nTarget, bAscendingCheck });

        // as for situational modifier
        const situational = (skipSituational) ? { mod: 0 } : await dialogManager.getSituational(-10000, 10000, 0, `Modifier`, sLabel);
        const mod = situational.mod;
        // if "undefined" they clicked close
        if (isNaN(mod)) return null;
        if (mod != 0) {
            if (bAscendingCheck) {
                if (mod)
                    sFormula += ` + ${mod} `
            } else {
                // otherwise add to roll
                nTarget = parseInt(nTarget) + mod;
            }
        }

        const _roll = async () => {
            // Execute the roll
            let roll;
            try {
                roll = await new Roll(sFormula, data, { rollMode: situational.rollMode }).roll({ async: true });
                console.log("dice.js systemRoll", { roll, data });
                // if (game.dice3d) await game.dice3d.showForRoll(roll, game.user);
            } catch (err) {
                console.error(err);
                ui.notifications.error(`Dice roll evaluation failed: ${err.message} `);
                return null;
            }
            return roll;
        };

        // Create the Roll instance
        const roll = await _roll();
        //await _d20RollDialog({template, title, parts, data, rollMode: messageOptions.rollMode, dialogOptions, roll: _roll});


        if (roll) {
            // roll.rawformula = sFormula;
            roll.rawformula = `FORMULA:${sFormula} `;
            if (!bAscendingCheck || targetFlavor) {
                roll.rawformula += `< p /> TARGET:${targetFlavor} `;
                if (mod)
                    roll.rawformula += '+ @situational';
            }
            let bSuccess = false;
            const naturalRoll = roll.dice[0].total;
            // if (game.ars.config.settings.useAutoHitFailDice)
            const fumbled = naturalRoll == 1;
            const criticaled = naturalRoll == 20;
            if (bAscendingCheck) {
                bSuccess = roll.total >= nTarget;
            } else {
                bSuccess = roll.total <= nTarget;
            }

            roll.rollMode = situational.rollMode;
            roll.diceToolTip = await roll.getTooltip();

            // Create a Chat Message
            const sourceSpeaker = ChatMessage.getSpeaker({ actor: source });
            let cardData = {
                isGM: game.user.isGM,
                speaker: sourceSpeaker,
                flavor: sLabel,
                passedcheck: bSuccess,
                targetnumber: nTarget,
                rolledcheck: roll.total,
                difference: bAscendingCheck ? Math.abs((roll.total - nTarget)) : Math.abs((nTarget - roll.total)),
                fumble: fumbled,
                critical: criticaled,
                tooltip: await roll.getTooltip(),
                "roll": roll,
                "source": source,
                "data": data,
            };

            const content = await renderTemplate("systems/ars/templates/chat/parts/chatCard-check.hbs", cardData);
            let chatData = {
                content: content,
                user: game.user.id,
                speaker: sourceSpeaker,
                roll: roll,
                rollMode: situational.rollMode,
                type: game.ars.const.CHAT_MESSAGE_TYPES.ROLL,
                // sound: (bSuccess ? ARS.sounds.save.success : ARS.sounds.save.failure),
                flags: {
                    actor: source,
                    item: item,
                    action: action
                },
            };
            ChatMessage.create(chatData);
            roll.bSuccess = bSuccess;
            // await roll.toMessage({ speaker: speaker, flavor: sLabel }, {});
        }


        return roll;
    }

    /**
     * 
     * Roll a skill check for actor using skillItem (item)
     * 
     * @param {*} actor  The actor to perform the check
     * @param {*} skillItem  The skill item object
     * @returns 
     */
    static async rollSkillCheck(dd) {
        console.log("dice.js rollSkillCheck ", { dd });
        const abilityCheck = dd.item.system.features.ability !== 'none';

        dd.options.rollAscending = (dd.item.system.features.type === 'ascending');
        const targetType = dd.options.rollAscending ? "above" : "below";
        dd.options.formula = dd.item.system.features.formula;

        let nTarget, checkName, slugifyCheckName;

        // this is an ability check type.
        if (abilityCheck) {
            nTarget = dd.source.system.abilities[dd.item.system.features.ability].value;
            checkName = game.i18n.localize(`ARS.abilityTypes.${dd.item.system.features.ability} `);
        } else {
            // this is a skill check, general type
            checkName = dd.item.name;
            slugifyCheckName = checkName.slugify({ strict: true });
            nTarget = dd.item.system.features.target;
        }
        // save this for flavor text output
        const baseTarget = nTarget;
        const targetFormula =
            (slugifyCheckName && dd.source.system.mods.skill?.[slugifyCheckName]) ?
                `${nTarget} +@mods.skill.${slugifyCheckName} ` : nTarget;
        nTarget = utilitiesManager.evaluateFormulaValue(targetFormula, dd.source.getRollData());
        nTarget = parseInt(nTarget);

        /// apply modifiers, set label, run roll
        const mods = [];
        let mod = 0;
        // array of all the "direct" modifiers to this skill. These are manually set on the skill for customization
        ['class', 'background', 'ability', 'armor', 'item', 'race', 'other'].forEach(modType => {

            // console.log("dice.js rollSkillCheck", { modType });
            // console.log("dice.js rollSkillCheck skillItem.system.features.modifiers[modType]", skillItem.system.features.modifiers[modType]);


            if (dd.item.system.features.modifiers[modType]) {
                mods.push(`@${modType} `);
                mod += parseInt(dd.item.system.features.modifiers[modType] || 0);
            }
        });
        // apply mods from items like armor/race/etc for this skill
        const equipmentModifiers = dd.source.getEquipmentSkillMods(dd.item.name);
        if (equipmentModifiers.total) {
            mod += equipmentModifiers.total;
            mods.push(equipmentModifiers.modItemList.join(' + '));
        }

        // not sure what use the formula will be in future but here it is.

        const modFormula = dd.item.system.features.modifiers.formula ?
            dd.item.system.features.modifiers.formula : 0;
        let modRoll = modFormula ?
            utilitiesManager.evaluateFormulaValue(modFormula, dd.source.getRollData()) : '';
        if ((typeof Number(modFormula) === "number" && parseInt(modFormula)) ||
            (typeof Number(modFormula) !== "number" && modFormula)) {
            mods.push('@skillMod');
        }
        // if (!abilityCheck) modFormula = (-modFormula);
        // total up all the mods into target. On decending checks we add the "direct" mods to the "target" (the higher the easier to success)
        if (dd.options.rollAscending) {
            nTarget -= mod;
        } else {
            nTarget += mod;
        }

        if (abilityCheck) {
            dd.options.formula += (dd.options.formula && modRoll ? ' + ' : '') + (modRoll ? `${(-modRoll)} ` : '');
        } else {
            dd.options.formula += (dd.options.formula && modRoll ? ' + ' : '') + (modRoll ? `${modRoll} ` : '');
        }

        const targetFlavor = `${baseTarget} ` +
            (dd.source.system.mods.skill?.[slugifyCheckName] ?
                ` + @mods.skill.${slugifyCheckName} ` : '') +
            (!abilityCheck ? ` + ` + mods.join(' + ') : '');

        // console.log("dice.js rollSkillCheck", { modFormula, slugifyCheckName, modRoll, modSlug }, dd.options.formula);
        dd.options.targetNumber = nTarget;
        dd.options.label = `${dd.item.name}: Checking ${checkName}, target at or ${targetType} ${dd.options.targetNumber} `;


        if (dd.source.system?.mods?.check?.formula) {
            dd.options.formula += `${abilityCheck || !dd.options.rollAscending ? '-' : '+'} @mods.check.formula`;
        }
        if (dd.source.system?.mods?.check?.value) {
            dd.options.formula += `${abilityCheck || !dd.options.rollAscending ? '-' : '+'} @mods.check.value`;
        }


        const roll = await DiceManager.systemRoll(dd.source, dd.source.getRollData(), dd.label, dd.formula, dd.options.targetNumber, dd.data.event?.ctrlKey, dd.options.rollAscending, targetFlavor, dd.item, dd.action);

        // play sound for using skill
        dd.item.playAudio();

        DiceManager.playAudioCheck(roll.bSuccess, roll.rollMode);
        Hooks.call("postRollSkill", dd.source, roll.bSuccess, checkName);
        return roll;
    }

    /**
     * 
     * This takes a dice string like 2-5 and figures out a way 
     * to make it a dice roll (2d3-1, 1d4+1/etc)
     * 
     * Old NPC entries have this ;(
     * 
     * @param {String} diceString 
     * @returns 
     */
    static diceFixer(diceString) {
        let fixedRoll = "";
        const rollValues = diceString.match(/^(\d+)[\-](\d+)$/);
        let nCount = rollValues[1];
        let nSize = rollValues[2];
        if (nCount === 1) {
            fixedRoll = `${nCount}d${nSize} `
        } else {
            const nSizeAdjusted = Math.floor(nSize / nCount);
            const nRemainder = nSize % nCount; // nSize - (nSizeAdjusted * nCount);

            if (nCount > nSizeAdjusted) {
                fixedRoll = `${nSizeAdjusted}d${nCount} `;
            } else {
                fixedRoll = `${nCount}d${nSizeAdjusted} `;
            }

            if (nRemainder > 0) {
                fixedRoll += `+ ${nRemainder} `
            } else if (nRemainder < 0) {
                fixedRoll += `${nRemainder} `
            }
        }

        return fixedRoll;
    }
}