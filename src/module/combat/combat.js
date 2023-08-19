import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js";


export class CombatManager {
    // This function applies damage adjustments to a target based on various factors.
    // It takes into account resistances, vulnerabilities, immunities, and damage absorption.
    // It returns an object containing the total damage, damage types, and absorbed damage.

    /**
     * This function applies damage adjustments to a target based on various factors.
     * It takes into account resistances, vulnerabilities, immunities, and damage absorption.
     * It returns an object containing the total damage, damage types, and absorbed damage.
     * 
     * @param {Object} sourceActor - Source of the damage
     * @param {Object} targetToken - Target of the damage
     * @param {Object} sourceItem - Source item used for the damage
     * @param {Object} sourceAction - Source action causing the damage
     * @param {boolean} bDamage - Indicates if the target takes damage
     * @param {Array} dmgDone - Array of damage entries
     * @param {Object} ammo - Ammo object, if applicable
     * @returns {Object} - { total: damageTotalDone, types: damageTypes, absorbed: absorbedTotal }
     * 
    */

    static async applyDamageAdjustments(
        sourceActor,
        targetToken,
        sourceItem,
        sourceAction,
        bDamage,
        dmgDone,
        ammo = null
    ) {
        // console.log("combat.js applyDamageAdjustments ", {
        //     sourceActor,
        //     targetToken,
        //     sourceItem,
        //     sourceAction,
        //     bDamage,
        //     dmgDone,
        // });

        // Variables
        let targetActor = targetToken ? targetToken.actor : undefined;
        let damageTotalDone = 0; // Accumulator for total damage done
        let absorbedTotal = 0; // Accumulator for total damage absorbed
        let damageTypes = []; // Array to store unique damage types
        let clearSaveCache = false; // Boolean to control save cache deletion

        // Check for the existence of a save cache and if it applies to the current situation
        const saveCache = targetToken
            ? await targetToken.document.getFlag("ars", "saveCache")
            : undefined;
        const halfDamageFromSave =
            saveCache
                ? saveCache.save === "halve" && saveCache.sourceId === String(sourceActor.id)
                : false;

        // Process damage entries
        for (let entry of dmgDone) {
            let rollTotal = entry.dmg; // Damage roll total for the current entry

            // Add unique damage types to the damageTypes array
            const damageType = entry.type;
            if (!damageTypes.includes(damageType)) damageTypes.push(damageType);

            // Apply damage adjustments if bDamage is true and targetActor exists
            if (bDamage && targetActor) {
                rollTotal = CombatManager.processHalfDamageFromSave(
                    rollTotal,
                    halfDamageFromSave
                );
                rollTotal = CombatManager.processWeaponMagicAndMetalResists(
                    sourceActor,
                    sourceItem,
                    ammo,
                    sourceAction,
                    targetActor,
                    rollTotal
                );
                rollTotal = CombatManager.processPerDiceResists(
                    entry,
                    targetActor,
                    rollTotal
                );
                rollTotal = CombatManager.processResistsByAmount(
                    targetActor,
                    damageType,
                    rollTotal
                );
                rollTotal = CombatManager.processImmVulnResists(
                    targetToken,
                    rollTotal,
                    damageType
                );

                const absorbResults = await CombatManager.processAbsorbDamage(
                    targetToken,
                    sourceActor,
                    damageType,
                    rollTotal
                );
                rollTotal = absorbResults.rollTotal;
                absorbedTotal += absorbResults.absorbedTotal;
            }

            // Delete save cache and reset clearSaveCache flag if necessary
            if (clearSaveCache) {
                utilitiesManager.deleteSaveCache(targetToken);
                clearSaveCache = false;
            }

            // Update the total damage done
            damageTotalDone += Math.round(rollTotal);

            // Update clearSaveCache flag based on halfDamageFromSave
            if (!clearSaveCache) clearSaveCache = halfDamageFromSave;
        }

        return { total: damageTotalDone, types: damageTypes, absorbed: absorbedTotal };
    }


    /**
    * Process half damage from saving throw.
    * @param {number} rollTotal - The total damage before processing half damage from saving throw.
    * @param {boolean} halfDamageFromSave - Indicates whether half damage should be applied based on a saving throw.
    * @return {number} The updated rollTotal after processing half damage from saving throw.
    */
    static processHalfDamageFromSave(rollTotal, halfDamageFromSave) {
        if (halfDamageFromSave) {
            return Math.round(rollTotal * 0.5);
        }
        return rollTotal;
    }


    /**
    * Process weapon magic and metal resistances to determine the adjusted roll total.
    *
    * @param {Object} sourceActor - The actor using the weapon.
    * @param {Object} sourceItem - The weapon item being used.
    * @param {Object} ammo - The ammunition being used, if any.
    * @param {Object} sourceAction - The action being performed with the weapon.
    * @param {Object} targetActor - The target actor being attacked.
    * @param {number} rollTotal - The initial roll total before adjustments.
    * @returns {number} - The adjusted roll total after applying resistances.
    */
    static processWeaponMagicAndMetalResists(sourceActor, sourceItem, ammo, sourceAction, targetActor, rollTotal) {
        if (sourceItem && sourceItem.type === 'weapon') {
            // Determine if a special metal property is found in the weapon or action.
            let specialMetal = false;

            // Calculate target's magic potency resistance.
            const magicPotencyMod = targetActor?.system?.resistances?.magicpotency ?
                parseInt(utilitiesManager.evaluateFormulaValue(targetActor.system.resistances.magicpotency, targetActor.getRollData())) : 0;
            let targetMagicPotency = targetActor?.system?.resistances ?
                targetActor.system.resistances.weapon.magicpotency : 0;
            if (targetMagicPotency < magicPotencyMod) targetMagicPotency = magicPotencyMod;

            // Calculate item's magic potency.
            let itemPotency = sourceItem.type === 'weapon' ? sourceItem.system.attack.magicPotency : 0;

            // Add ammunition's magic potency if it exists.
            if (ammo && ammo.system?.attack?.magicPotency) {
                itemPotency += ammo.system.attack.magicPotency;
            }

            // Calculate action's magic potency.
            const actionPotency = sourceAction ? sourceAction.magicpotency : 0;
            const actionProperties = sourceAction ? Object.values(sourceAction.properties) : [];
            const itemProperties = sourceItem ? Object.values(sourceItem.system.attributes.properties || []) : [];

            // Calculate the effective magic potency.
            let magicPotency = sourceActor.effectiveMagicPotency();
            if (actionPotency > magicPotency) magicPotency = actionPotency;
            if (itemPotency > magicPotency) magicPotency = itemPotency;

            const potencyFormulaValue = sourceActor.system.mods?.formula?.potency?.attack ? utilitiesManager.evaluateFormulaValue(sourceActor.system.mods?.formula?.potency?.attack, sourceActor.getRollData()) : 0;
            if (potencyFormulaValue && !isNaN(potencyFormulaValue) && potencyFormulaValue > magicPotency)
                magicPotency = potencyFormulaValue;

            // Create a list of properties from the item and action.
            const propertiesList = itemProperties.concat(actionProperties).map(entry => entry.trim().toLowerCase());

            // Check for metal resistances in the target.
            const metals = targetActor.type === 'npc' ? Object.values(targetActor.system.resistances?.weapon?.metals) : undefined;
            if (metals && metals.length && propertiesList && propertiesList.length) {
                for (const metal of metals) {
                    if (propertiesList.includes(metal.type.toLowerCase().trim())) {
                        // Apply metal protection effects.
                        switch (metal.protection) {
                            case 'halve':
                                rollTotal = Math.round(rollTotal * 0.5);
                                break;
                            case 'full':
                                break;
                        }
                        if (!specialMetal) specialMetal = true;
                        break;
                    }
                }
            }

            // If no special metal is found and magic potency is less than target magic potency, set roll total to 0.
            if (!specialMetal && (magicPotency < targetMagicPotency)) {
                rollTotal = 0;
            }
        }
        return rollTotal;
    }

    /**
   * Process Per-dice Resistance Modifications
   *
   * @param {Object} entry - The entry object containing roll and damage type information.
   * @param {Object} targetActor - The target actor object containing system modifier information.
   * @param {Number} rollTotal - The initial roll total to be modified.
   * @returns {Number} - The modified roll total after applying per-dice resistance.
   */
    static processPerDiceResists(entry, targetActor, rollTotal) {
        // Store the resistPerDiceValue, if any.
        let resistPerDiceValue;

        // Extract the damage type from the entry object.
        const damageType = entry.type;

        // Check for a specific resistPerDiceValue in the targetActor's system modifiers.
        if (targetActor.system.mods.resists?.perdice?.[damageType]) {
            resistPerDiceValue = targetActor.system.mods.resists.perdice[damageType];
        }
        // If not found, check for a global resistPerDiceValue in the targetActor's system modifiers.
        else if (targetActor.system.mods.resists?.perdice?.all) {
            resistPerDiceValue = targetActor.system.mods.resists.perdice.all;
        }

        // Convert resistPerDiceValue to an integer, defaulting to 0 if not set.
        const resistsPerDice = parseInt(resistPerDiceValue || 0);

        // If resistsPerDice is a valid numeric value, apply the per-dice resistance modifications.
        if (resistsPerDice && Number.isFinite(resistsPerDice)) {
            // Reset rollTotal and store the original roll total and dice roll results for later use.
            rollTotal = 0;
            const perRollTotal = entry.roll.total;
            const diceRollResults = entry.roll.dice[0].total ? entry.roll.dice[0].total : 0;
            const otherTerms = diceRollResults ? (perRollTotal - diceRollResults) : 0;

            // Iterate through all dice in the roll.
            for (const dieRoll of entry.roll.dice) {
                // Iterate through each individual result of the die roll.
                for (const perRolled of dieRoll.results) {
                    // Update rollTotal by adding the maximum of the modified roll result and 1.
                    rollTotal += Math.max((perRolled.result + (parseInt(resistsPerDice))), 1);
                }
            }
            // Add otherTerms back to the rollTotal.
            rollTotal += otherTerms;
        }

        return rollTotal;
    }


    /**
     * Process damage resistance for a target actor based on the given damage type.
     *
     * @param {Object} targetActor - The target actor object.
     * @param {string} damageType - The damage type for which resistance will be processed.
     * @param {number} rollTotal - The initial damage roll total.
     * @returns {number} - The adjusted roll total after processing resistance.
     */
    static processResistsByAmount(targetActor, damageType, rollTotal) {
        let resist;

        // Safely retrieve the resist value from the target actor's system mods.
        try {
            resist = targetActor.system.mods.resists[damageType];
        } catch (error) {
            // No action needed, resist remains undefined.
        }

        // Check if resist value is valid and not zero.
        if (resist && !isNaN(resist) && parseInt(resist) !== 0) {
            const amount = parseInt(resist);
            const resistPercentage = amount * 0.01; // Convert resist amount to percentage multiplier.
            const adjustedDamage = Math.round(rollTotal * resistPercentage); // Calculate adjusted damage.

            rollTotal -= adjustedDamage; // Reduce rollTotal by the adjusted damage.
        }

        return rollTotal; // Return the updated rollTotal.
    }


    /**
    * Process immunities, resistances, and vulnerabilities for a target token based on a given damage type.
    *
    * @param {Token} targetToken - The target token to process the immunities, resistances, and vulnerabilities for.
    * @param {number} rollTotal - The initial damage roll total.
    * @param {string} damageType - The type of damage being dealt (e.g. 'fire', 'cold', 'slashing', etc.).
    * @returns {number} - The modified damage roll total after processing immunities, resistances, and vulnerabilities.
    */
    static processImmVulnResists(targetToken, rollTotal, damageType) {
        // Helper function to apply resistance/immunity/vulnerability modifications to the damage roll total
        function _resistHelper(targetActor, rollTotal, resistanceType = 'resist', dmgType) {
            // console.log("combat.js processImmVulnResists _resistHelper", { targetActor, rollTotal, resistanceType, dmgType });

            let newTotal = rollTotal; // Initialize the new total as the original roll total

            // Search for a matching effect
            findOneMatch:
            for (const effect of targetActor.getActiveEffects()) {
                for (const change of effect.changes) {
                    if (change.key === `system.mods.${resistanceType}`) {
                        // Parse resistances and compare them to the current damage type
                        const resists = change.value.toLowerCase().split(",").map(text => text.trim());
                        if (resists.includes(dmgType.toLowerCase())) {
                            // Apply the appropriate resistance/immunity/vulnerability modification
                            switch (resistanceType) {
                                case 'immune':
                                    newTotal = 0;
                                    break;
                                case 'resist':
                                    newTotal = Math.round(rollTotal * 0.5);
                                    break;
                                case 'vuln':
                                    newTotal = Math.round(rollTotal * 2);
                                    break;
                            }
                            // We only match one effect, then exit the loop
                            break findOneMatch;
                        }
                    }
                }
            }
            return newTotal; // Return the updated total after applying the resistance/immunity/vulnerability modification
        }

        // Apply immunities, resistances, and vulnerabilities
        rollTotal = _resistHelper(targetToken.actor, rollTotal, 'immune', damageType);
        rollTotal = _resistHelper(targetToken.actor, rollTotal, 'resist', damageType);
        rollTotal = _resistHelper(targetToken.actor, rollTotal, 'vuln', damageType);

        return rollTotal; // Return the updated rollTotal after applying all modifications
    }


    /**
    * Processes the absorption of damage for a given target, source, and damage type.
    *
    * @param {*} targetToken - The target token to process damage absorption for.
    * @param {*} sourceActor - The source actor responsible for the damage.
    * @param {*} damageType - The type of damage being dealt.
    * @param {*} rollTotal - The total amount of damage being dealt.
    * @returns - An object containing the updated rollTotal and the total absorbed damage.
    */
    static async processAbsorbDamage(targetToken, sourceActor, damageType, rollTotal) {
        let absorbedTotal = 0; // Total absorbed damage.
        let depletedEffect = []; // Array of depleted effect IDs.
        let updatedEffects = false; // Flag to check if any effects have been updated.

        let effectsBundle = duplicate(targetToken.actor.effects);
        effectsBundle.forEach((effect, efindex) => {
            if (!effect.disabled && !effect.isSuppressed) {
                effect.changes.forEach((change, index) => {
                    if (rollTotal > 0 && change.key === 'special.absorb') {

                        const rollTotalOrig = rollTotal;
                        const details = JSON.parse(change.value.toLowerCase());
                        details.amount = parseInt(details.amount);
                        if (details.amount && details.damagetype) {
                            updatedEffects = true;
                            if (details.damagetype === damageType ||
                                details.damagetype === 'none' ||
                                details.damagetype === 'all') {
                                let amountleft = details.amount; // Remaining absorption amount for the current effect.
                                const absorbDiff = rollTotal - details.amount;
                                if (absorbDiff < 0) { // absorbed it all, save the rest
                                    amountleft = Math.abs(absorbDiff);
                                    absorbedTotal += rollTotal;
                                    rollTotal = 0;
                                } else {
                                    rollTotal = absorbDiff;
                                    amountleft = 0;
                                    depletedEffect.push(effect._id);
                                    absorbedTotal += details.amount;
                                }
                                details.amount = amountleft;
                                change.value = JSON.stringify(details);
                                if (details.damagetype === 'none') {
                                    // a none absorb effect only tracks absorption but doesn't absorb the damage.
                                    rollTotal = rollTotalOrig;
                                    absorbedTotal = 0;
                                }
                            }
                        }
                    }
                });
            }
        });

        if (updatedEffects) {
            await utilitiesManager.runAsGM({
                sourceFunction: 'applyDamageAdjustments',
                operation: 'actorUpdate',
                user: game.user.id,
                targetTokenId: targetToken.id,
                update: { 'effects': effectsBundle },
            });
        }

        if (depletedEffect.length) {
            await utilitiesManager.runAsGM({
                operation: 'deleteActiveEffect',
                user: game.user.id,
                targetActorId: targetToken.actor.id,
                targetTokenId: targetToken.id,
                sourceActorId: sourceActor.id,
                effectIds: depletedEffect,
            });
        }

        return {
            rollTotal, // Return the updated rollTotal
            absorbedTotal, // Return the absorbedTotal
        };
    }

    //---------------------------

    /**
     * 
     * Make a chat card for incoming damage and send it.
     * 
     * //TODO: Add absorb output to this, consolidate damage into object rDMG.bDamage, rDMG.rolled/etc
     * 
     * @param {*} sourceActor 
     * @param {*} targetToken 
     * @param {*} bDamage 
     * @param {*} rolled 
     * @param {*} damageTotalDone 
     * @param {*} damageTypes 
     * @param {*} damageFlavor 
     * @param {*} sourceName 
     * @param {*} rollMode 
     */
    static async sendHealthAdjustChatCard(sourceActor, targetToken, bDamage, rolled, damageTotalDone, damageTypes, damageFlavor = '', sourceName = '', rollMode = game.settings.get("core", "rollMode")) {
        // console.log("combat.js sendHealthAdjustChatCard", { sourceActor, targetToken, bDamage, rolled, damageTotalDone, damageTypes, damageFlavor, sourceName, rollMode })
        let damageTypesLocalized = []
        damageTypes.forEach((dmgType) => {
            damageTypesLocalized.push(bDamage ? game.i18n.localize("ARS.damageTypes." + dmgType) : '');
        });

        const damageTypeString = damageTypesLocalized.join();
        const formulasString = rolled?.formulas.join(" + ");
        const rawFormulasString = rolled?.rawformulas.join(" + ");
        const resultsString = rolled?.results.join(" + ");
        const totalsString = rolled?.totals.join(" + ");
        const diceHTMLToolTips = rolled.rolls ? await Promise.all(rolled.rolls.map(async (roll) => {
            return await roll.getTooltip()
        })) : null;
        // console.log("healthAdjust diceHTMLToolTips ", { diceHTMLToolTips })

        let sFlavor = undefined;
        let nHPAdjustment = Math.max(damageTotalDone, 0);
        let nHPDiff = nHPAdjustment;
        if (targetToken) {
            const sNameTarget = targetToken.name;
            let hpPath = targetToken.actor.system.attributes.hp;
            const nTargetHPOriginalValue = hpPath.value;
            let nTargetHPResult = nTargetHPOriginalValue;

            // console.log("combat.js applyDamageAndChat", { targetToken, sNameTarget, hpPath, nHPAdjustment, nTargetHPOriginalValue, nTargetHPResult });

            if (bDamage) {
                nTargetHPResult = Math.clamped((hpPath.value - nHPAdjustment), hpPath.min, hpPath.max);
            } else {
                nTargetHPResult = Math.clamped((hpPath.value + nHPAdjustment), hpPath.min, hpPath.max);
            }

            nHPDiff = Math.abs(nTargetHPOriginalValue - nTargetHPResult);

            // console.log("combat.js applyDamageAndChat nTargetHPOriginalValue ", { nTargetHPOriginalValue, nTargetHPResult, nHPDiff });
            utilitiesManager.runAsGM({
                sourceFunction: 'sendHealthAdjustChatCard',
                operation: 'adjustTargetHealth',
                user: game.user.id,
                targetTokenId: targetToken.id,
                targetActorId: targetToken.actor.id,
                targetHPresult: nTargetHPResult
            });

            //TODO this needs to be made more understandable !!
            sFlavor =
                `<div data-id="${targetToken?.id}" class="secure-name">${sNameTarget}</div>` +
                `<a data-value="${rolled?.totalValues}" class="secure-value">${damageTotalDone}</a> ` +
                `${damageTypeString}${(bDamage ? " damage" : " healing")}` +
                `${(damageFlavor ? `<div>${damageFlavor}</div>` : "")}`;
        } else {
            // no target
            // dont think I need secure-value here cause it should always show flat value w/o target
            sFlavor =
                `<div data-id="${targetToken?.id}" class="secure-name">${sourceName}</div>` +
                `<a data-value="${rolled?.totalValues}" class="secure-value">${damageTotalDone}</a> ${damageTypeString}${(bDamage ? " damage" : " healing")}${(damageFlavor ? ` ${damageFlavor}` : "")}`;
        }

        let speaker = ChatMessage.getSpeaker({ actor: sourceActor });
        const roll = {
            formula: formulasString,
            rawformula: rawFormulasString,
            result: resultsString,
            diceToolTip: diceHTMLToolTips?.join(''),
            total: rolled?.totalValues,
        }
        let cardData = {
            speaker: speaker,
            flavor: sFlavor,
            tooltip: resultsString,
            isDamage: bDamage,
            adjustment: nHPDiff,
            "roll": roll,
            "sourceActorId": sourceActor.id,
            "targetActorId": targetToken?.actor.id,
            "targetToken": targetToken,
            "owner": sourceActor.id,
            "game": game,
        };

        const content = await renderTemplate("systems/ars/templates/chat/parts/chatCard-healthAdjust.hbs", cardData);

        let chatData = {
            content: content,
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            rollMode: rollMode,
            flags: {
                "ars": {
                    "damage": bDamage ? -(damageTotalDone) : damageTotalDone,
                    "damageType": damageTypes,
                }
            }
            // roll: roll,
        };
        ChatMessage.applyRollMode(chatData, rollMode);
        // const chatCard = await ChatMessage.create(chatData);
        ChatMessage.create(chatData);

        //Check is the target his was casting and warn if interrupted
        if (bDamage && targetToken?.combatant && targetToken.combatant.getFlag("ars", "initCasting")) {
            const combat = targetToken.combatant.combat;
            const currentInitiative = combat._getCurrentTurnInitiative();
            // only show message if target initiative hasnt passed yet
            if (targetToken.combatant.initiative && currentInitiative < targetToken.combatant.initiative) {
                utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: targetToken.actor }), 'Casting Interrupted', `${targetToken.name} has casting interrupted`, targetToken.img, { rollMode: rollMode });
            }
        }
    } // end makeHealthAdjustChatCard

    /**
     * 
     * Gets the damaged rolled
     * 
     * @param {*} dd 
     */
    static async getRolledDamage(dd) {
        const _roll = async (localFormula, additionalRollData = undefined) => {
            let roll;
            let rollOptions = { maximize: dd.dmgAdj === 'max', async: true };
            const rawRollData = duplicate(dd.source.getRollData())
            const rollData = additionalRollData ? mergeObject(rawRollData, additionalRollData) : rawRollData;
            // console.log("combat.js getRolledDamage _roll", { localFormula, rollData });
            try {
                roll = new Roll(localFormula, rollData, { rollMode: dd.rollMode });
                // console.log("getRolledDamage==>1", duplicate(roll))
                // console.log("getRolledDamage 1", { roll })
                if (dd.dmgAdj === 'double') roll.alter(2, 0);
                // if (dd.dmgAdj.match(/^x(\d+)/i)) { // look for x2, x3, x4/etc
                //     let match = dd.dmgAdj.match(/^x(\d+)/i);
                //     if (match && match[1]) {
                //         const multiplier = parseInt(match[1]);
                //         rolledTotal *= multiplier;
                //     }
                // }            
                await roll.roll(rollOptions);
                if (game.dice3d) await game.dice3d.showForRoll(roll, game.user, true);
            } catch (err) {
                console.error(err);
                ui.notifications.error(`Dice roll evaluation failed: ${err.message}`);
                return null;
            }

            // console.log("getRolledDamage==>1", duplicate(roll))
            return roll;
        };

        // calculate damage and result damage resists
        const rolled = {
            armorDamage: [],
            rawformulas: [],
            formulas: [],
            results: [],
            totals: [],
            rolls: [],
            totalValues: 0,
        };

        let dmgDone = [];
        for (let dmg of dd.dmgFormulas) {
            const diceRoll = dmg.formula;
            const damageType = dmg.type;
            const roll = await _roll(diceRoll, dmg.rollData);
            // console.log("combat.js getRolledDamage", { roll })
            //TODO variant 2, 1 armor damage per die rolled
            const armorDamage = dd.isDamage ? roll.dice[0]?.results?.length || 0 : 0;
            // console.log("combat.js getRolledDamage totals", roll.dice[0].total, roll.total, armorDamage)

            let rolledTotal = roll.total;
            if (dd.dmgAdj === 'half') {
                rolledTotal = Math.max(Math.round(rolledTotal / 2), 1);
            } else if (dd.dmgAdj.match(/^x(\d+)/i)) { // look for x2, x3, x4/etc
                let match = dd.dmgAdj.match(/^x(\d+)/i);
                if (match && match[1]) {
                    const multiplier = parseFloat(match[1]);
                    rolledTotal = rolledTotal * multiplier;
                    if (rolledTotal < 0) rolledTotal = 1;
                }
            }
            // damage multipliers from mods.*'
            //TODO add flavor for this
            // multiplier general/all
            if (dd.source.system.mods?.damage?.multiplier?.value) {
                // console.log("combat.js getRolledDamage totals dd.source.system.mods?.damage?.multiplier?.value", dd.source.system.mods?.damage?.multiplier?.value)
                const multiplier = parseFloat(dd.source.system.mods.damage.multiplier.value);
                rolledTotal = rolledTotal * multiplier;
                if (rolledTotal < 0) rolledTotal = 1;
            }

            // multiplier by ranged/melee/thrown
            const attackType = (dd.options.isWeapon ? dd.item.system.attack.type : dd.action.type);
            if (dd.source.system.mods?.damage?.multiplier?.[attackType]) {
                // console.log("combat.js getRolledDamage totals dd.source.system.mods?.damage?.multiplier?.[attackType]", dd.source.system.mods?.damage?.multiplier?.[attackType])
                const multiplier = parseFloat(dd.source.system.mods.damage.multiplier[attackType]);
                // console.log("combat.js getRolledDamage totals rolledTotal 1", { rolledTotal, multiplier }, rolledTotal * multiplier)
                // if (multiplier < 0) {
                //     const reducedTotal = rolledTotal * Math.abs(multiplier);
                //     rolledTotal = rolledTotal - reducedTotal;
                //     console.log("combat.js getRolledDamage totals rolledTotal 2", { reducedTotal, rolledTotal })
                // } else {
                //     rolledTotal = rolledTotal * multiplier;
                //     console.log("combat.js getRolledDamage totals rolledTotal 3", { rolledTotal })
                // }
                rolledTotal = rolledTotal * multiplier;
                if (rolledTotal < 0) rolledTotal = 1;
                // console.log("combat.js getRolledDamage totals rolledTotal 4", rolledTotal)
            }

            // moved down here so that the totalValues is applied after situation mods are made so players can see them.

            rolled.armorDamage.push(armorDamage);
            rolled.formulas.push(roll.formula);
            rolled.rawformulas.push(dmg.rawformula);
            rolled.results.push(roll.result);
            rolled.totals.push(roll.total);
            // rolled.totalValues += parseInt(roll.total);
            rolled.totalValues += parseInt(rolledTotal);
            rolled.rolls.push(roll);

            dmgDone.push({
                dmg: rolledTotal,
                type: damageType,
                // roll: roll, sendHealthAdjustChatCard
                roll: roll
            });
        } // end for damageFormulas

        dd.data.dmgDone = dmgDone;
        dd.data.rolled = rolled;
    }

    /**
     * Populate damage formulas
     * 
     * @param {*} targetToken 
     * @param {*} dd 
     * @returns 
     */
    static async getDamageFormulas(targetToken, dd) {
        const sourceActor = dd.source;
        const sourceItem = dd.item;
        const sourceAction = dd.action;
        const damageStyle = dd.dmgAdj;
        let bonusFormula = [];

        // console.log("combat.js getDamageFormulas", { targetToken, dd });

        //TODO: effects/status dont work on actions for damage, because they do aoe/etc we dont have a target, revisit this someday
        function _bonusFormulaHelper(profDamage = 0) {
            // melee/thrown/ranged
            const attackType = (dd.options.isWeapon ? dd.item.system.attack.type : dd.action.type);

            // insert @mods
            if (dd.source.system?.mods?.damage?.value)
                bonusFormula.push("@mods.damage.value");
            // actions dont have a type of damage, just "damage"
            // if (dd.item && dd.options.isWeapon && dd.source.system?.mods?.damage?.[attackType])
            if (dd.source.system?.mods?.damage?.[attackType])
                bonusFormula.push(`@mods.damage.${attackType}`);

            // insert attack mods for effects
            const selfEffects = attackMods.effects.self.value + (dd.item ? attackMods.effects.self?.[attackType] : 0);
            // when using action (not weapon) to damage we dont check target.*.damage style effects because they do aoe damage
            const targetEffects = dd.item ? (targetToken ? attackMods.effects.target.value + attackMods.effects.target?.[attackType] : 0) : 0;

            if (selfEffects) bonusFormula.push("@selfEffects");
            if (targetEffects) bonusFormula.push("@targetEffects");

            // insert attack mods for status effects
            const selfStatus = attackMods.status.self.value + (dd.item ? attackMods.status.self?.[attackType] : 0);
            // when using action (not weapon) to damage we dont check target.*.damage style effects because they do aoe damage
            const targetStatus = dd.item ? (targetToken ? attackMods.status.target.value + attackMods.status.target?.[attackType] : 0) : 0;
            if (selfStatus) bonusFormula.push("@selfStatus");
            if (targetStatus) bonusFormula.push("@targetStatus");

            const rollData = {
                profs: profDamage,
                situational: dd?.situational?.mod,
                selfEffects: selfEffects,
                targetEffects: targetEffects,
                selfStatus: selfStatus,
                targetStatus: targetStatus,
            }

            return rollData;
        }

        let damageFormulas, largeDamageFormulas;
        let damageFlavor = "";
        if (damageStyle !== 'normal') {
            // damageFlavor = damageFlavor ? `${damageFlavor} <b>${damageStyle}</b>` : `<b>${damageStyle}</b>`;
            damageFlavor = `<b>${damageStyle}</b>`;
        }

        const statusEffects = {
            self: dd.source.statusModifiers(),
            target: targetToken?.actor.statusModifiers()
        };
        const attackMods = {
            effects: {
                self: dd.source.getTargetCombatMods(targetToken?.actor, 'damage', dd.item),
                target: targetToken?.actor.getAttackerCombatMods(dd.source, 'damage', dd.item),
            },
            status: {
                self: statusEffects.self.damage,
                target: statusEffects.target?.damage,
            }
        }

        let profDamage = 0;
        if (sourceItem?.type === 'weapon') {
            // get the modifiers for damage from proficiencies
            for (const profItem of sourceActor.proficiencies) {
                for (const weapon of Object.values(profItem.system.appliedto)) {
                    if (weapon.id === sourceItem.id) {
                        const weaponDamageMod = utilitiesManager.evaluateFormulaValue(profItem.system.damage, sourceActor.getRollData(), { showRoll: true });
                        profDamage += weaponDamageMod;
                    }
                }
            } // end profs check
        }


        if (dd.options.isWeapon && sourceItem && sourceItem.type === 'weapon') {
            // add in magic bonus damage
            const weaponFormulaDamage = sourceItem.system.damage.normal;
            const weaponFormulaBonusDamage = sourceItem.system.damage.magicBonus;

            const largeWeaponFormulaDamage = sourceItem.system.damage.large || weaponFormulaDamage;

            // addin bonus magic damage if the weapon is identified
            const formulaDamage = weaponFormulaDamage +
                ((weaponFormulaBonusDamage) ? ` + ${weaponFormulaBonusDamage}` : "");

            const largeFormulaDamage = largeWeaponFormulaDamage +
                ((weaponFormulaBonusDamage) ? ` + ${weaponFormulaBonusDamage}` : "");

            // include ammo
            const ammo = await dd.item.getAmmo(true);
            let ammoFormulaDmg = ammo ? ammo.system.damage.normal +
                ((ammo.system.damage.magicBonus) ? `+ ${ammo.system.damage.magicBonus}` : "") : '';

            // if item is ranged weapon also apply it's bonus
            if (weaponFormulaBonusDamage && ammoFormulaDmg && dd.item.system.attack.type === 'ranged') ammoFormulaDmg = `${ammoFormulaDmg} + ${weaponFormulaBonusDamage}`;
            let ammoLargeFormulaDmg = ammo ? ammo.system.damage.large +
                ((ammo.system.damage.magicBonus) ? `+ ${ammo.system.damage.magicBonus}` : "") : '';
            // if item is ranged weapon also apply it's bonus
            if (weaponFormulaBonusDamage && ammoLargeFormulaDmg && dd.item.system.attack.type === 'ranged') ammoLargeFormulaDmg = `${ammoLargeFormulaDmg} + ${weaponFormulaBonusDamage}`;

            // console.log("combat.js rollDamage", { sourceActor, targetToken, targetActor, sourceItem, bDamage, weaponFormulaDamage, weaponFormulaBonusDamage, formulaDamage, largeFormulaDamage })

            if (profDamage) bonusFormula.push("@profs");
            if (dd.situational.mod) bonusFormula.push("@situational");

            switch (sourceItem.system.attack.type) {
                case "melee":
                    if (dd.source.system.abilities.str.dmg)
                        bonusFormula.push("@abilities.str.dmg");
                    break
                case "thrown":
                    if (dd.source.system.abilities.str.dmg)
                        bonusFormula.push("@abilities.str.dmg");
                    break
                case "ranged":
                    break
                default:
                    break
            }

            const rollData = _bonusFormulaHelper(profDamage);
            // console.log("combat.js getDamageFormulas", { bonusFormula, rollData, attackMods });

            const formulaTail = (bonusFormula.length ? ` + ` + bonusFormula.join('+') : '');

            let formulaCalcs = (ammoFormulaDmg ? ammoFormulaDmg : formulaDamage) + formulaTail;
            let largeFormulaCalcs = (ammoLargeFormulaDmg ? ammoLargeFormulaDmg : largeFormulaDamage) + formulaTail;

            // console.log("combat.js getDamageFormulas", { formulaCalcs, largeFormulaCalcs, ammoFormulaDmg, ammoLargeFormulaDmg })

            damageFormulas = [{
                formula: formulaCalcs,
                // rawformula: `${formulaDamage}${rawFormulaTail}`,
                rawformula: `${formulaCalcs}`,
                type: ammo ? ammo.system.damage.type : sourceItem.system.damage.type,
                rollData: rollData,
            }];
            largeDamageFormulas = [{
                formula: largeFormulaCalcs,
                // rawformula: `${largeFormulaDamage}${rawFormulaTail}`,
                rawformula: `${largeFormulaCalcs}`,
                type: ammo ? ammo.system.damage.type : sourceItem.system.damage.type,
                rollData: rollData,
            }];

            const otherdmg = Object.values(ammo ? ammo.system.damage.otherdmg : sourceItem.system.damage.otherdmg);
            if (otherdmg.length) {
                otherdmg.forEach(partFormula => {
                    damageFormulas.push({
                        formula: partFormula.formula,
                        rawformula: partFormula.formula,
                        type: partFormula.type,
                    });
                    largeDamageFormulas.push({
                        formula: partFormula.formula,
                        rawformula: partFormula.formula,
                        type: partFormula.type,
                    });
                });
            }

        }
        else if (sourceAction && (sourceAction.type === 'damage' || sourceAction.type === 'heal')) {
            // console.log("getDamageFormulas", { sourceAction })
            let formulaDamage = sourceAction.formula;

            if (dd.situational.mod) bonusFormula.push("@situational");
            if (profDamage) bonusFormula.push("@profs");

            if (sourceAction.type !== 'damage') {
                if (dd.source.system?.mods?.heal?.value)
                    bonusFormula.push("@mods.heal.value");
            } else {
                switch (sourceAction.ability) {
                    case "str":
                        bonusFormula.push("@abilities.str.dmg");
                        break;
                    case "dex":
                        break;

                    case "none":
                        break;

                    default:
                        break
                }
            }
            const otherdmg = Object.values(sourceAction.otherdmg);
            // Need to see if the bonusFormula exists and append if so

            const rollData = _bonusFormulaHelper(profDamage);
            // console.log("combat.js getDamageFormulas 2", { bonusFormula, rollData, attackMods });

            let formulaCalcs;
            if (bonusFormula.length) {
                formulaCalcs = formulaDamage + " + " + bonusFormula.join(" + ")
            } else {
                formulaCalcs = formulaDamage;
            }

            const rawformula = `${formulaCalcs}`;
            // const rawformula = `${formulaCalcs}` + (dd.situational.mod != 0 ? ` + @situational` : '');
            // formulaCalcs = `${formulaCalcs}` + (dd.situational.mod != 0 ? ` + ${dd.situational.mod}` : '');
            damageFormulas = [{
                formula: formulaCalcs,
                rawformula: rawformula,
                type: sourceAction.damagetype,
                rollData: rollData,
            }];

            if (otherdmg.length) {
                otherdmg.forEach(partFormula => {
                    damageFormulas.push({
                        formula: partFormula.formula,
                        rawformula: partFormula.formula,
                        type: partFormula.type,
                    });
                });
            }
        }


        const returnData = { damageFlavor: damageFlavor, damageFormulas: damageFormulas, largeDamageFormulas: largeDamageFormulas };
        // console.log("getDamageFormulas", { damageFlavor: damageFlavor, damageFormulas: damageFormulas, largeDamageFormulas: largeDamageFormulas })
        return returnData;
    }

    /**
     * 
     * system variant 2 uses armor damage system, 1 armor damage per die of damage
     * 
     * @param {*} target 
     * @param {*} dd 
     */
    static armorDamage(target, dd) {
        // system variant 2 uses armor damage system, 1 armor damage per die of damage
        if (game.ars.config.settings.systemVariant == '2' && game.ars.config.settings.useArmorDamage) {
            let armorDamageTotal = 0;
            dd.data.rolled.armorDamage.forEach(i => armorDamageTotal += i);
            console.log("combat.js armor damage", { target, armorDamageTotal });
            if (target?.actor?.armors && armorDamageTotal) {
                target.actor.armors.forEach(armor => {
                    // .system.protection.points
                    if (armor.system.protection.points.value > 0) {
                        const newAP = (armor.system.protection.points.value - armorDamageTotal);
                        armor.update({ 'system.protection.points.value': Math.max(0, newAP) })
                        if (newAP < 1) {
                            dialogManager.showNotification(`Your <b>${armor.name}</b> is no longer functional.`, 'OK', 'Protection Broken')
                            // utilitiesManager.chatMessage(ChatMessage.getSpeaker(), 'Protection Broken', `Your ${armor.name} is no longer functional.`)
                        }
                    }
                })
            }
        }
    }
}