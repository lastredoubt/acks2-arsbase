
import { ARS } from './config.js';
import * as effectManager from "./effect/effects.js";
import * as actionManager from "./apps/action.js";
import * as initLibrary from "./library.js"
import * as dialogManager from "./dialog.js";
import * as debug from "./debug.js";

/**
 * 
 * Capitalize string
 * 
 * @param {*} s 
 * @returns 
 */
export function capitalize(s) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * 
 * Request a action to be performed by the connected GM
 * 
 *           utilitiesManager.runAsGM({
 *               operation: 'applyActionEffect',
 *               user: game.user.id,
 *               sourceActorId: source.id,
 *               sourceTokenId: sourceToken.id
 *               targetActorId: target.id,
 *               targetTokenId: token.id,
 *               targetItemId: item.id,
 *               itemUpdate: {'some.path': value}
 *               sourceAction: sourceAction
 *           });
 * 
 * @param {Object} data Requested command data
 */
export async function runAsGM(data = {}) {
    // if GM we skip to the command
    if (game.user.isGM) {
        await runGMCommand(data);
    } else {
        // send data to socket and look for GM to run the command for user
        const dataPacket = {
            requestId: randomID(16),
            type: 'runAsGM',
            ...data
        }
        // Emit a socket event
        console.trace("runAsGM", { data, dataPacket });
        await game.socket.emit('system.ars', dataPacket);
    }
}

/**
 * 
 * Process the requested GM Command
 * 
 * @param {*} data Requested command data
 */
export async function processGMCommand(data = {}) {
    // const findGM = game.user === game.users.filter((user) => user.isGM && user.active).sort((a, b) => a.id - b.id)[0];
    const activeGMs = game.users.filter((user) => user.isGM && user.active);
    const findGM = activeGMs.length ? activeGMs[0] : null;
    console.trace("processGMCommand", { data, activeGMs, findGM });
    if (!findGM) {
        ui.notifications.error(`No GM connected to process requested command.`);
        console.trace("processGMCommand No GM connected to process requested command.");
    } else
        // check to see if the GM we found is the person we've emit'd to and if so run command.
        if (findGM.id === game.user.id) {
            if (!game.ars.runAsGMRequestIds[data.requestId]) {

                // console.log("utilities.js processGMCommand", { data });

                // We do this to make sure the command is only run once if more than 
                // one GM is on the server
                game.ars.runAsGMRequestIds[data.requestId] = data.requestId;

                /**
                 * "data" is serialized and deserialized so the type is lost.
                 * Because of that we just exchange IDs when we need protos/etc 
                 * and load them where needed
                 * 
                 */
                // let source = data.sourceId ? canvas.tokens.get(data.sourceId) : undefined;
                // let target = data.targetId ? canvas.tokens.get(data.targetId) : undefined;

                // const sourceActor = data.sourceActorId ? game.actors.get(data.sourceActorId) : undefined;
                // const targetActor = data.targetActorId ? game.actors.get(data.targetActorId) : undefined;
                // const targetToken = data.targetTokenId ? canvas.tokens.get(data.targetTokenId) : undefined;

                // console.log("utilities.js processGMCommand", { data });

                await runGMCommand(data);
            } else {
                // requestId already processed
                console.log("utilities.js", "processGMCommand", "Unknown asGM request DUPLICATE ", { data });
                ui.notifications.error(`Duplicate asGM request command.`, { permanent: true });
            }
        }
}

/**
 * 
 * Run command as GM, final leg (after sending it to socket or directly executed by GM)
 * 
 * @param {Object} data 
 */
async function runGMCommand(data) {

    console.log("utilitis.js runGMCommand", { data })

    const sourceActor = data.sourceActorId ? game.actors.get(data.sourceActorId) : undefined;
    const sourceToken = data.sourceTokenId ? canvas.tokens.get(data.sourceTokenId) : undefined;
    const targetActor = data.targetActorId ? game.actors.get(data.targetActorId) : undefined;
    const targetToken = data.targetTokenId ? canvas.tokens.get(data.targetTokenId) : undefined;
    const targetItemId = data.targetItemId ? data.targetItemId : undefined;

    // console.log("utilitis.js runGMCommand", { sourceActor, sourceToken, targetActor, targetToken, targetItemId })
    switch (data.operation) {

        case 'game.party.updateMember':
            if (data.sourceActorId) {
                game.party.updateMember(data.sourceActorId);
            }
            break;

        case 'deleteEmbeddedDocuments':
            if (targetActor && targetItemId) {
                targetActor.deleteEmbeddedDocuments("Item", [targetItemId], { hideChanges: true });
            } else if (targetToken && targetItemId) {
                targetToken.actor.deleteEmbeddedDocuments("Item", [targetItemId], { hideChanges: true });
            }
            break;

        case 'createEmbeddedDocuments':
            if (targetActor && data.itemData) {
                await targetActor.createEmbeddedDocuments("Item", [data.itemData], { hideChanges: true });
            }
            break;

        case "deleteActiveEffect":
            await targetToken.actor.deleteEmbeddedDocuments("ActiveEffect", data.effectIds);
            break;

        case "applyActionEffect":
            await effectManager.applyActionEffect(sourceToken ? sourceToken.actor : sourceActor, targetToken, data.sourceAction, data.user);
            break;

        case "adjustTargetHealth":
            await setActorHealth(targetToken.actor, data.targetHPresult);
            if (targetToken.hasActiveHUD) canvas.tokens.hud.render();
            break;

        case "unsetFlag":
            await targetToken.document.unsetFlag("ars", data.flag.tag);
            break;

        case "setFlag":
            await targetToken.document.setFlag("ars", data.flag.tag, data.flag.data);
            break;

        case 'itemUpdate':
            let itemToUpdate;
            if (targetActor && targetItemId && data.update) {
                itemToUpdate = await targetActor.getEmbeddedDocument("Item", targetItemId);
                if (itemToUpdate) itemToUpdate.update(data.update);
            } else if (targetToken && targetItemId && data.update) {
                itemToUpdate = await targetToken.actor.getEmbeddedDocument("Item", targetItemId);
                if (itemToUpdate) itemToUpdate.update(data.update);
            }
            break;

        case 'actorUpdate':
            if (targetActor && data.update) {
                await targetActor.update(data.update);
            } else if (targetToken && data.update) {
                await targetToken.actor.update(data.update);
            }
            break;

        case 'partyAddLogEntry':
            if (data.text && game.party?.addLogEntry) {
                await game.party.addLogEntry(data.text);
            }
            break;

        case 'partyShareLootedCoins':
            if (sourceToken && game.party?.shareLootedCoins) {
                game.party.shareLootedCoins(sourceToken);
            }
            break;

        default:
            console.log("utilities.js processGMCommand Unknown asGM/runGMCommand request ", data.operation, { data });
            break;
    };
}

/**
 * 
 * Adjust actor heath accounting for min/max
 * 
 * @param {*} actor 
 * @param {*} adjustment  12 or -12
 */
export function adjustActorHealth(actor, adjustment) {
    // console.log("utilitis.js adjustActorHealth ", { actor, adjustment });

    const nCurrent = parseInt(actor.system.attributes.hp.value);
    const nMax = parseInt(actor.system.attributes.hp.max);
    const nMin = parseInt(actor.system.attributes.hp.min);

    // console.log("utilitis.js adjustActorHealth ", { actor, adjustment, nCurrent, nMax, nMin });

    let nNew = nCurrent + parseInt(adjustment);
    if (nNew > nMax) nNew = nMax;
    if (nNew < nMin) nNew = nMin;
    setActorHealth(actor, nNew);
}
/**
 * 
 * Set new health value on token.
 * 
 * @param {*} targetActor  targetActor's health to adjust
 * @param {*} value  The new value of target tokens health
 */
export async function setActorHealth(targetActor, value) {
    console.log("utilities.js setActorHealth", { targetActor, value });
    await targetActor.update({ "system.attributes.hp.value": value });
    // set status markers for health values
    setHealthStatusMarkers(targetActor);
}

/**
 * 
 * If the actor hp is at min or lower, mark them defeated
 * 
 * @param {*} actorData 
 */
async function setHealthStatusMarkers(targetActor) {
    // console.log("utilities.js setDefeatedStatus", { targetActor });
    // need token object, not token document
    const token = targetActor.getToken().object;
    if (token) {
        // console.log("utilities.js setDefeatedStatus", { token });
        const defeated = targetActor.system.attributes.hp.value <= targetActor.system.attributes.hp.min;
        // const alreadyDown = (token.actor?.effects.find(e => e.getFlag("core", "statusId") === 'dead'));
        // const alreadyDown = token.actor?.effects.some(e => Object.keys(e.statuses).includes('dead'));
        const alreadyDown = token.actor.hasStatusEffect('dead');
        // find defeated status
        const status = CONFIG.statusEffects.find(e => e.id === 'dead');
        // const defeatedIcon = ARS.icons.general.combat.effects.defeated;
        const effect = token.actor && status ? status : CONFIG.controlIcons.defeated;
        // check to see if they need defeated mark or remove defeated mark
        // if ((!defeated && alreadyDown) || (defeated && !alreadyDown)) {
        await token.toggleEffect(effect, { overlay: defeated, active: defeated });
        // }
    }
}


/**
 * 
 * @param {Number} slotIndex 
 * @param {String} slotType arcaneSlots or divineSlots
 * @param {Boolean} bValue  Set true or false
 */
export async function memslotSetUse(actor, slotType, slotLevel, slotIndex, bValue) {
    let memSlots = foundry.utils.deepClone(actor.system.spellInfo.memorization);
    memSlots[slotType][slotLevel][slotIndex].cast = bValue;
    await actor.update({ "system.spellInfo.memorization": memSlots })
}

/**
 * 
 * @param {String} slotType  arcaneSlots or divineSlots
 * @param {Number} slotIndex 
 * 
 */
export function isMemslotUsed(actor, slotType, slotLevel, slotIndex) {
    // console.log("utilitis.js  isMemslotUsed", { actor, slotType, slotLevel, slotIndex });
    const spellUsed = actor.system.spellInfo.memorization[slotType][slotLevel][slotIndex]?.cast || false;
    return spellUsed;
}


/**
 * 
 * Use ammo for weapon (range/thrown)
 * 
 * @param {*} actor 
 * @param {*} weapon 
 * @returns 
 */
export async function useWeaponAmmo(actor, weapon) {
    // console.log("utilities.js useWeaponAmmo", { actor, weapon })
    let itemId = weapon.system.resource.itemId;
    if (!itemId) {
        itemId = await dialogManager.getInventoryItem(actor, `Ammo for ${weapon.name}`, `Select Ammo`,
            { inventory: actor.weapons });
        if (!itemId) return false;
        await weapon.update({ 'system.resource.itemId': itemId });
    }
    if (itemId) {
        let item = actor.items.get(itemId);
        if (item) {
            let itemCount = item.system.quantity;
            if (itemCount - 1 >= 0) {
                await item.update({ 'system.quantity': (itemCount - 1) });
                return true;
            } else {
                await weapon.update({ 'system.resource.itemId': '' });
                return await useWeaponAmmo(actor, weapon);
            }
        }
    }
    return false;
}

/**
 * 
 * Use a charge for an action
 * 
 * @param {*} actor 
 * @param {*} action 
 * @returns 
 */
export async function useActionCharge(actor, itemSource, action) {
    console.log("utilities.js useActionCharge", { actor, action })
    let actionBundle = itemSource ? foundry.utils.deepClone(itemSource.system.actions) : foundry.utils.deepClone(actor.system.actions);

    const type = action.resource.type;
    const cost = action.resource.count.cost;
    const max = Number.isInteger(action.resource.count.max) ? action.resource.count.max : evaluateFormulaValue(action.resource.count.max, actor.getRollData());
    let used = action.resource.count.value;
    let itemId = action.resource.itemId;

    console.log("utilities.js useActionCharge", { type, cost, max, used, itemId })

    switch (type) {
        case 'charged':
            if ((used + cost) <= max) {
                actionBundle[action.index].resource.count.value = (used + cost);
                itemSource ? await itemSource.update({ "system.actions": actionBundle }) :
                    await actor.update({ "system.actions": actionBundle })
                // console.log("utilities.js useActionCharge TRUE")
                return true;
            } else {
                // no charges left
                return false;
            }
            break;

        case 'item':
        case 'powered':
            if (!itemId && type !== 'powered') {
                itemId = await dialogManager.getInventoryItem(actor, `Resource for ${action.name}`, `Select Resource`);
                if (!itemId) return false;
                actionBundle[action.index].resource.itemId = itemId;
                if (itemSource) {
                    await itemSource.update({ "system.actions": actionBundle })
                } else {
                    await actor.update({ "system.actions": actionBundle });
                }
            } else if (!itemId && type === 'powered' && itemSource) {
                actionBundle[action.index].resource.itemId = itemSource.id;
                await itemSource.update({ "system.actions": actionBundle })
            }
            let item = await actor.getEmbeddedDocument("Item", itemId);
            if (!item && itemSource && type === 'powered') item = itemSource;

            if (item) {
                if (type === 'item') {
                    let itemCount = item.system.quantity;
                    // console.log("utilities.js useActionCharge itemCount", itemCount)
                    if ((itemCount - cost) >= 0) {
                        // console.log("utilities.js useActionCharge itemCount - cost", (itemCount - cost))
                        await item.update({ 'system.quantity': (itemCount - cost) });
                        return true;
                    } else {
                        // no more left, remove this item so next time it prompts to select
                        if (itemCount <= 0) {
                            actionBundle[action.index].resource.itemId = '';
                            itemSource ? await itemSource.update({ "system.actions": actionBundle }) : await actor.update({ "system.actions": actionBundle });
                        }
                        return false;
                    }
                } else if (type === 'powered') {
                    // we use charges from another item to power this action
                    let poweredUsed = item.system.charges.value;
                    let maxCount = item.system.charges.max;
                    if (poweredUsed + cost <= maxCount) {
                        const newUsed = poweredUsed + cost;
                        await item.update({ 'system.charges.value': newUsed });
                        return true;
                    } else {
                        return false;
                    }

                }
            } else {
                ui.notifications.error(`Unable to find the object associated with this power. Check the action->resource section and verify the item is set correctly. `)
            }
            break;

    }
    // console.log("utilities.js useActionCharge FALSE")
    return false;
}

/**
 * Evaluate a formula to it's total number value, async
 * @param {String} formula 
 * @param {*} data 
 * @returns 
 */
export async function evaluateFormulaValueAsync(formula, data = {}, options = {}) {

    console.log("utilities.js evaluateFormulaValue", { formula, data });
    if (formula) {
        let fRoll;
        try {
            // fRoll = new Roll(String(formula), data).roll({ async: false });
            fRoll = await new Roll(String(formula), data).roll({ async: true });
            // console.log("utilities.js evaluateFormulaValue 2", { formula, data, fRoll });
        } catch (err) {
            ui.notifications.error(`utilities.js evaluateFormulaValue() formula process error: ${err}`)
            console.log("utilities.js evaluateFormulaValue formula process error", { err, formula, data });
            return 0
        }

        // console.log("utilities.js evaluateFormulaValue 1", { fRoll });
        if (options && options.showRoll) {
            if (game.dice3d) await game.dice3d.showForRoll(fRoll, game.user, true);
        }
        return fRoll.total; // round it off
    } else {
        // console.log("utilities.js evaluateFormulaValue NOT FORMULA PASSED");
        return 0;
    }
}

/**
 * 
 * Eval a formula w/o async
 * 
 * @param {*} formula 
 * @param {*} RollData 
 * @returns 
 */
export function evaluateFormulaValue(formula, data = {}, options = {}) {

    // console.log("utilities.js evaluateFormulaValue 1", { formula, data });
    if (formula) {
        let fRoll;
        try {
            fRoll = new Roll(String(formula), data).roll({ async: false });
            // console.log("utilities.js evaluateFormulaValue 2", { formula, data, fRoll });
        } catch (err) {
            ui.notifications.error(`utilities.js evaluateFormulaValue() formula process error: ${err}`)
            console.log("utilities.js evaluateFormulaValue formula process error", { err });
            return 0
        }
        if (options && options.showRoll) {
            // game.dice3d.showForRoll(roll, user, synchronize, whisper, blind)
            if (game.dice3d) game.dice3d.showForRoll(fRoll, game.user, false);
        }
        return fRoll.total;
    } else {
        // console.log("utilities.js evaluateFormulaValue NO FORMULA PASSED");
        return 0;
    }
}


/**
 * Do somethings when NPC token first placed.
 *  
 * Roll hp using static hp, hp calculation or hitdice
 * 
 * @param {Object} token NPC Token instance
 */
export function postNPCTokenCreate(token) {
    // wont run this if the npc token already has a .max value
    // if (!token.actor.system.attributes.hp.max) {
    const hitdice = String(token.actor.system.hitdice);
    const hpCalc = String(token.actor.system.hpCalculation);
    const hpStatic = parseInt(token.actor.system.attributes.hp.value);
    let formula = "";

    let hp = 0;
    if (hpStatic > 0) {
        hp = hpStatic;
    } else if (hpCalc.length > 0) {
        formula = hpCalc;
    } else if (hitdice.length > 0) {
        const aHitDice = hitdice.match(/^(\d+)(.*)/);
        const sHitDice = aHitDice[1]
        const sRemaining = aHitDice[2];
        formula = sHitDice + "d8" + sRemaining;
    }

    if (!hpStatic) {
        const roll = new Roll(formula).roll({ async: false });
        hp = roll.total;
    }
    // at least 1 hp
    hp = Math.max(hp, 1);

    console.log("_postNPCTokenCreate:createToken:hp", { hp });

    const npcNumberedNames = game.settings.get("ars", "npcNumberedNames");
    let newName = ""
    if (npcNumberedNames) {
        // set NPC name # with random value so they can be called out
        const MaxRandom = 25;
        const npcTokens = token.collection ? token.collection.filter(function (mapObject) { return mapObject?.actor?.type === 'npc' }) : [];
        let randomRange = MaxRandom + npcTokens.length;
        let loops = 0;

        do {
            loops += 1;
            const nNumber = Math.floor(Math.random() * (randomRange + loops)) + 1;
            // if the name contains #XX remove it, happens when you copy/paste a existing npc token
            let sName = token.name.replace(/#\d+/, '');
            sName = `${sName} #${nNumber}`;
            const matchedNPCs = npcTokens.filter(function (npcToken) { return npcToken.name.toLowerCase() === sName.toLowerCase() });
            if (matchedNPCs.length < 1) {
                newName = sName;
            }
            if (loops > 100) {
                newName = `${token.name} #xXxXxX`;
            }
        } while (newName == "");
    } else {
        newName = token.name;
    }

    // if we have a list of damage entries and nothing in actions or no weapons, create some
    const damageList = token.actor.system.damage.match(/(\d+[\-dD]\d+([\-\+]\d+)?)/g);
    // token.actor.weapons
    // if (damageList?.length && token.actor.system?.weapons?.length < 1) {
    if (damageList?.length && token.actor?.weapons?.length < 1) {
        if (!token.actor.system.actions || token.actor.system.actions?.length < 1) {
            actionManager.createActionForNPCToken(token, damageList);
        }
    }

    // calculate size when dropped.
    const protoSizeWidth = token.actor.prototypeToken.width;
    const protoSizeHeight = token.actor.prototypeToken.height;
    const customSettingSize = (protoSizeHeight != 1 || protoSizeWidth != 1);
    console.log("_postNPCTokenCreate:createToken:hp", { token, protoSizeHeight, protoSizeWidth, hp }, protoSizeHeight != 1);
    let sizeSetting = 1;
    switch (token.actor.system.attributes.size) {
        case 'tiny':
            sizeSetting = 0.25;
            break;
        case 'small':
            sizeSetting = 0.5;
            break;
        case 'medium':
            sizeSetting = 1;
            break;
        case 'large':
            sizeSetting = 1;
            break;
        case 'huge':
            sizeSetting = 2;
            break;
        case 'gargantuan':
            sizeSetting = 3;
            break;
    }

    /**
     * do this so we can calculate xp at drop time with current hp for older systems 
     * 
     * 15+(@system.attributes.hp.max*100) would be 15+maxHP*100 and when killed granted to party xp
     * 
     */
    const rollData = mergeObject(token.actor.getRollData(),
        {
            // system: {
            attributes: {
                hp: { max: hp }
            }
            // }
        }) || 0;

    const xpTotal = evaluateFormulaValue(token.actor.system.xp.value, rollData);

    console.log("utilities.js postNPCTokenCreate", { rollData, xpTotal })

    // set values for updates
    const actorUpdates = {
        "system.attributes.hp.value": hp,
        "system.attributes.hp.max": hp,
        "system.attributes.hp.min": 0,
        "system.xp.value": xpTotal,
        "name": newName,
    };
    const tokenUpdates = {
        'name': newName,
        "width": customSettingSize ? protoSizeWidth : sizeSetting,
        "height": customSettingSize ? protoSizeHeight : sizeSetting,
        "xp.value": xpTotal,
    };

    // generate coin formulas when spawning npc
    for (const coin in token.actor.system.currency) {
        const formula = token.actor.system.currency[coin];
        if (formula) {
            const coinValue = parseInt(evaluateFormulaValue(formula, null)) || 0;
            actorUpdates[`system.currency.${coin}`] = coinValue;
        }

    }
    // console.log("utilities.js postNPCTokenCreate", { actorUpdates, tokenUpdates })
    // use this for token update instead?
    Hooks.call("arsUpdateToken", this, token, tokenUpdates, 300);
    Hooks.call("arsUpdateActor", token.actor, actorUpdates);
}

/**
 * 
 * Sort callback function to sort by record.name
 * 
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function sortByRecordName(a, b) {
    if (a?.name && b?.name) {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
    }
    return 0;
}

/**
 * 
 * Sort by the item.data.sort value
 * 
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function sortBySort(a, b) {
    const nameA = a.sort;
    const nameB = b.sort;
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

/**
 * 
 * Sort callback function to sort by record.level
 * 
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function sortByLevel(a, b) {
    if (a.level < b.level) {
        return -1;
    }
    if (a.level > b.level) {
        return 1;
    }
    return 0;
}

/**
 * 
 * Wrapper function to get item from world or from packs
 * 
 * @param {*} itemId 
 * @returns 
 */
export async function getItem(itemId) {
    // look for item in world first
    let item = getWorldItem(itemId);
    // if not in world, find in packs
    if (!item) item = await getPackItem(itemId);
    return item;
}

/**
 * 
 * Get item by name in world or pack file, first match
 * 
 * @param {*} name 
 * @returns 
 */
export async function getItemByName(name) {
    let item = await getWorldItemByName(name);
    // if (!item) item = await getPackItemByName(name);
    return item;
}


/**
 * 
 * Get an item from any pack file
 * 
 * @param {*} itemId 
 * @returns 
 */
export async function getPackItem(itemId) {
    let item;
    const allItemPacks = game.packs.filter(i => i.metadata.type === 'Item');
    // console.log("utilities.js getPackItem", { allItemPacks });
    for (const pack of allItemPacks) {
        const foundItem = await game.packs.get(pack.collection).getDocument(itemId);
        if (foundItem) {
            if (game.user.isGM || pack.visible) {
                item = foundItem;
            }
            break;
        }
    };
    return item;
}

/**
 * 
 * Get an item in the Campaign local
 * 
 * @param {*} itemId 
 * @returns 
 */
export function getWorldItem(itemId) {
    const item = game.items.get(itemId);
    // console.log("utilitiesManager.js getWorldItem 1", { itemId, item });
    return item;
}

// /**
//  * 
//  * Get a item by name from pack files
//  * 
//  * @param {*} name 
//  * @returns 
//  */
// export async function getPackItemByName(name) {
//     const _getPackItemEntry = async (name) => {
//         let matchedItem;
//         for (const foundItem of game.ars.library.allItems) {
//             if (foundItem.name === name) {
//                 matchedItem = await foundItem.pack.getDocument(foundItem.id);
//                 break;
//             }
//         }
//         return matchedItem;
//     }
//     const item = await _getPackItemEntry(name);
//     return item;
// }

/**
 * 
 * Get a item from world files by name
 * 
 * @param {*} name 
 * @returns 
 */
export async function getWorldItemByName(name) {
    const items = await game.items.filter(a => { return a.name === name });
    const item = items[0] ? item[0] : undefined
    return item;
}

/**
 * Function to allow refresh of library data, used by modules
 */
export async function initializeLibrary() {
    await initLibrary.default();
}

/**
 * 
 * Get folder record or create one to match name/type.
 * 
 * @param {String} folderName "Dropped NPCs"
 * @param {String} type "Actor" or "Item" .etc
 * @param {String} sort "a" for auto, "m" for manual
 * @param {Number} sortNumber "0"
 * @returns Folder
 */
export async function getFolder(folderName, type, sort = 'a', sortNumber = 0) {
    let folder;
    // const folderList = game.folders.filter(a => { a.name === folderName && a.type == type });
    const foundFolder = game.folders.getName(folderName);
    // console.log("utilitiesManager.js getFolder 1", { foundFolder })
    if (foundFolder) {
        // console.log("utilitiesManager.js getFolder 2", { foundFolder })
        folder = foundFolder;
    } else {
        let folderData = {
            name: folderName,
            type: type,
            sorting: "a",
            sort: 0,
        };
        const rootFolder = await Folder.implementation.create(folderData);
        // console.log("utilitiesManager.js getFolder 3", { rootFolder })
        folder = rootFolder;
    }

    // console.log("utilitiesManager.js getFolder", { folder })
    return folder;
}
/**
 * 
 *  Clear save Cache
 * 
 * @param {Actor} sourceActor 
 * @param {Token} targetToken 
 */
export async function deleteSaveCache(targetToken) {
    await runAsGM({
        operation: "unsetFlag",
        user: game.user.id,
        targetTokenId: targetToken.id,
        targetActorId: targetToken.actor.id,
        // sourceActorId: sourceActor.id,
        flag: {
            tag: 'saveCache',
        }
    });
}

/**
 * 
 * Set the saveCache for follow up spell damage reductions
 * 
 * @param {Actor} sourceActor 
 * @param {Token} targetToken 
 */
export async function setSaveCache(sourceActor, targetToken) {
    await runAsGM({
        operation: "setFlag",
        user: game.user.id,
        targetTokenId: targetToken.id,
        targetActorId: targetToken.actor.id,
        sourceActorId: sourceActor.id,
        flag: {
            tag: 'saveCache',
            data: { save: 'halve', sourceId: sourceActor.id }
        }
    });
}


/**
 * Send generic chat message with minimal requirements
 * 
 * @param {*} speaker ChatMessage.getSpeaker({ actor: this.actor })
 * @param {*} title 
 * @param {*} message 
 * @param {*} img 
 * @param {*} chatCustomData 
 */
export function chatMessage(speaker = ChatMessage.getSpeaker(), title = `Message`, message = `Forgot something...`, img = '',
    chatCustomData = { rollMode: game.settings.get("core", "rollMode") }) {
    let imageHTML = '';
    if (img) {
        imageHTML = `<div class="a25-image"><img src="${img}" height="64"/></div>`;
    }
    let chatData = {
        title: title,
        content: `<div><h2>${title}</h2></div>` +
            `${imageHTML ? imageHTML : ''}` +
            `<div>${message}</div>`,
        user: game.user.id,
        speaker: speaker,
        type: game.ars.const.CHAT_MESSAGE_TYPES.OTHER,
    };
    mergeObject(chatData, { ...chatCustomData });

    //use user current setting? game.settings.get("core", "rollMode") 
    if (chatCustomData.rollMode) ChatMessage.applyRollMode(chatData, chatCustomData.rollMode);
    ChatMessage.create(chatData);
}

/**
 * 
 * Simple message for SideVSide initiative rolls
 * 
 * @param {*} speaker 
 * @param {*} title 
 * @param {*} message 
 * @param {*} roll 
 */
export async function chatMessageForSideVSideInitiative(speaker, title, roll) {

    const content = await renderTemplate("systems/ars/templates/chat/parts/chatCard-sidevside-roll.hbs", {
        title,
        roll,
    });

    let chatData = {
        title: title,
        content: content,
        user: game.user.id,
        roll: roll,
        rollMode: game.settings.get("core", "rollMode"),
        speaker: speaker,
        type: game.ars.const.CHAT_MESSAGE_TYPES.OTHER,
    };
    //use user current setting? game.settings.get("core", "rollMode") 
    // ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
    ChatMessage.create(chatData);
}

/**
 * 
 * Return a itemList record from a item
 * 
 * @param {*} itm Item Record
 * @returns { id: itm.id, uuid: itm.uuid, img: itm.img, name: itm.name, type: itm.type, quantity: itm.system.quantity }
 */
export function makeItemListRecord(itm) {
    if (itm) {
        return { id: itm.id, uuid: itm.uuid, img: itm.img, name: itm.name, type: itm.type, quantity: itm.system.quantity };
    }
}

/**
 * 
 * Take a time type (round|turn|hour|day) and convert the
 * count to seconds for duration management.
 * 
 * @param {*} type 
 * @param {*} count 
 * @returns Integer (seconds)
 */
export function convertTimeToSeconds(count = 1, type = 'round') {
    // console.log("utilities.js convertTimeToSeconds", { count, type })
    let timeMultiplier = 60;
    switch (type) {
        // turn is 10 rounds
        case 'turn':
            timeMultiplier = 600;
            break;
        // hour is 6 turns
        case 'hour':
            timeMultiplier = 3600;
            break;
        // day is 24 hours
        case 'day':
            timeMultiplier = 86400;
            break;

        // default is round, 60 seconds
        default:
            timeMultiplier = 60;
            break;
    }

    // console.log("utilities.js convertTimeToSeconds count * timeMultiplier", count * timeMultiplier)
    return count * timeMultiplier;
}

/**
 * 
 * return array of all items in all compendiums
 * 
 * @param {String} objectType Default 'Item'
 * @param {Boolean} gmOnly  Default false
 * @returns 
 */
export async function getPackItems(objectType = 'Item', isGM = false) {
    // console.log("utilities.js getPackItems", { objectType, isGM })
    const allItemPacks = game.packs.filter(i => i.metadata.type === objectType);
    // console.log("utilities.js getPackItems", { allItemPacks }, typeof allItemPacks, allItemPacks.length)
    const maxPacks = allItemPacks.length;
    let packItems = [];
    let count = 1;

    SceneNavigation.displayProgressBar({
        label: `${game.i18n.localize("ARS.loadingItemBrowser")}`,
        pct: ((count / allItemPacks.length) * 100).toFixed(0)
    });

    for (const pack of allItemPacks) {
        // console.log("utilities.js getPackItems", { pack }, pack.collection, pack.index.size)
        if (pack.visible) {
            SceneNavigation.displayProgressBar({
                label: `${game.i18n.localize("ARS.loadingItemBrowser")}: ${pack.title}`,
                pct: ((count / allItemPacks.length) * 100).toFixed(0)
            });

            const items = await pack.getDocuments();
            console.log(`Loaded ${pack.title} items:`, { items })
            packItems = packItems.concat(items);
        }
        count++;
    };

    return packItems;
}

/**getPack
 * 
 * Check for sale npc/lootable npc actor locks
 * If the player is no longer active, remove it.
 * 
 * @param {*} sheet 
 */
export async function cleanStaleSheetLocks(sheet) {
    const lockId = sheet.object.system.opened;
    if (lockId) {
        // console.log("utilities.js cleanStaleSheetLocks", { lockId });
        const lockedBy = game.users.get(lockId);
        // console.log("utilities.js cleanStaleSheetLocks", { lockedBy });
        if (!lockedBy || !lockedBy?.active) {
            await runAsGM({
                sourceFunction: 'cleanSheetLocks',
                operation: 'actorUpdate',
                user: game.user.id,
                targetTokenId: sheet.object.token.id,
                update: { 'system.opened': null },
            });
        }
    }
    console.log("utilities.js cleanStaleSheetLocks end");

}

/**
 * 
 * Check to see if using speed to initiative, if they've already roll, then roll initiative
 * 
 * @param {*} actor 
 * @param {*} item 
 * @returns 
 */
export async function rollInitiativeWithSpeed(actor, item, manualRoll = false) {
    console.log("utilities.js rollInitiativeWithSpeed", { actor, item, manualRoll })
    const initiativeUseSpeed = game.settings.get("ars", "initiativeUseSpeed");
    if (initiativeUseSpeed && item &&
        actor.getCombatant() &&
        (!actor.initiative || (actor.initiative && manualRoll))) {
        const combatant = actor.getCombatant();
        let initSpeed = 0;
        switch (item.type) {
            case 'weapon':
                //TODO: Apply prof mods to speeds?
                initSpeed = parseInt(item.system.attack.speed) || 0;
                break;
            case 'spell':
                const spellCastInit = parseInt(item.system.castingTime)
                if (Number(item.system.castingTime) || spellCastInit === 0)
                    initSpeed = spellCastInit;
                else // assume its 1 round, turn/hour/etc so it doesn't really need a speed cept last.
                    initSpeed = 99;
                break;

            default:
                return false;
                break;
        }
        await rollCombatantInitiative(combatant, combatant.combat, event.ctrlKey,
            {
                initSpeedMod: initSpeed,
                useSpeed: true,
                useWeapon: item.type === 'weapon',
                useSpell: item.type === 'spell',
                casting: (item.type === 'spell'),
                question: 'Modifier',
                title: 'Initiative',
                flavor: `Rolling Initiative for ${item.name} adding ${initSpeed}`,
            });
        if (actor.sheet)
            actor.sheet.render();

        return true;
    }
    return false;
}

/**
 * Roll initiative. Check turn, check values, check for situation dialog() then roll
 * @param {*} combatant 
 * @param {*} combat 
 * @param {*} ctrlKey Boolean
 * @param {*} initSpeedMod Integer
 * @returns 
 */
export async function rollCombatantInitiative(combatant, combat, ctrlKey = false,
    initOptions = {
        initSpeedMod: 0, useSpeed: false, useWeapon: false, useSpell: false,
        casting: false, question: 'Modifier', title: 'Initiative', flavor: 'Rolling Initiative', formula: undefined
    }) {
    console.log("utilities.js rollCombatantInitiative", { combatant, combat, ctrlKey, initOptions });
    const initSideVSide = game.settings.get("ars", "initSideVSide");

    // if (!game.user.isGM && (combatant.initiative !== null || combat.current.turn !== 0)) {
    if (!game.user.isGM && combatant.initiative !== null) {
        ui.notifications.warn(`You cannot roll initiative more than once.`);
        return;
    }
    const init = ctrlKey ? { mod: 0, rollMode: (initOptions?.rollMode ? initOptions.rollMode : '') } :
        await dialogManager.getInitiative(initOptions.question, initOptions.title, initOptions.flavor, initOptions.casting)

    const currentInitiative = combat._getCurrentTurnInitiative();
    const startingTurnIndex = combat.current.turn;

    if (isNaN(init.mod)) return null;
    if (init.casting) {
        combatant.setFlag("ars", "initCasting", true);
    }
    const initFormula = combatant._getInitiativeFormula();
    let formula = initOptions.formula ? initOptions.formula : `${initFormula}`;
    if (initOptions.useSpeed) {
        formula += ` + ${initOptions.initSpeedMod}`
        if (initOptions.useWeapon)
            combatant.setFlag("ars", "lastInitiativeFormula", formula);
    }

    if (combatant.actor?.system?.mods?.initiative)
        formula += ' + @mods.initiative';
    if (combatant.actor.initiativeModifier)
        formula += ' + @initStatusMod';
    if (init.mod) formula += ` + ${init.mod}`
    if (!combat.beginningOfRound && combat.current.turn && currentInitiative) {
        formula += ` +${currentInitiative + 1}`;
    } else if (!combat.beginningOfRound && combat.current.turn && !currentInitiative) {
        formula += ` +${combat._getLastInInitiative() + 1}`;
    }
    // console.log("utilities.js rollCombatantInitiative", { formula, combat, combatant }, "COMBAT:", duplicate(combat));
    await combat.rollInitiative([combatant.id], { formula: formula, updateTurn: !startingTurnIndex, messageOptions: { flavor: initOptions.flavor, rollMode: init.rollMode } });
    //dont update turn if combat is already progressed past first person
    // console.log("utilities.js rollCombatantInitiative", { formula, combat, combatant }, "TURN:", startingTurnIndex, "ROLLEDTURN:", combatant.index, "INIT:", combatant.initiative);
    if (startingTurnIndex) {
        if (combatant.index < startingTurnIndex) {
            console.log("utilities.js rollCombatantInitiative", "SET TO :", combatant.index);
            await combat.update({ turn: combatant.index });
        }
    } else {
        console.log("utilities.js rollCombatantInitiative", "SET TO DEFAULT:", 0);
        await combat.update({ turn: 0 })
    }
    // return combat.current.turn ? combat : await combat.update({ turn: 0 });
    if (combatant.actor.sheet)
        combatant.actor.sheet.render();
    return combat;
}

// /**
//  * 
//  * //TODO: Not using right now, might come back to this as results are more easily understood by players
//  * 
//  * Return currency updates of for purchase of amount/type
//  * 
//  * @param {*} currency actor.system.currency
//  * @param {*} amount  Integer
//  * @param {*} type  coin type, cp or sp or gp etc... 
//  * @returns the actor.update('coinType': remaining) value you'll need if amount avaliable or undefined
//  */
// export function exactChangePlease(currency, amount, type = "gp") {
//     console.log("utilities.js exactChangePlease", { currency, amount, type });

//     const variant = game.ars.config.settings.systemVariant;

//     // get the cp value of this coinage type
//     const cpConversion = ARS.currencyValue[variant][type];
//     // convert the amount to cp value
//     const targetCPValue = cpConversion * amount;
//     // let copperBaseNeeded = targetCPValue;

//     //return currency copper base value * amount
//     function cpConversionHelper(cAmount, cType) {
//         return (ARS.currencyValue[variant][cType] * parseInt(cAmount));
//     }

//     //return cost in ctype and remaining copper
//     function coinAmountHelper(ctype) {
//         // total cost in this coin type 
//         const costInCoin = targetCPValue / ARS.currencyValue[variant][ctype];
//         // round up the coin cost for floats
//         const costInCoinRound = Math.ceil(costInCoin);
//         // remainder converted to copper 
//         // console.log("utilities.js exactChangePlease coinAmountHelper", targetCPValue % ARS.currencyValue[variant][ctype]);
//         const remainingCopper = targetCPValue % ARS.currencyValue[variant][ctype] ? (ARS.currencyValue[variant][ctype] - targetCPValue % ARS.currencyValue[variant][ctype]) : 0;

//         // console.log("utilities.js exactChangePlease coinAmountHelper", { targetCPValue, costInCoin, costInCoinRound, remainingCopper }, "currencyValue:", ARS.currencyValue[variant][ctype]);

//         return ([costInCoinRound, remainingCopper]);
//     }

//     /**
//      * convert remaining copper to other (larger value) coins where possible
//      * 
//      * @param {*} remainingCopperCoins 
//      * @returns 
//      */
//     function consolidateCoinHelper(remainingCopperCoins) {
//         // console.log("utilities.js exactChangePlease consolidateCoinHelper", { remainingCopperCoins });
//         const leftOverChange = [];
//         if (remainingCopper) {
//             let copperChange = parseInt(remainingCopper);
//             // if I dont nail the order of coin types it will sometimes go backwards?!?! not sure why
//             // and we want to start with largest currency first.
//             for (const ctype of ['pp', 'ep', 'gp', 'sp', 'cp']) {
//                 const conversionValue = parseInt(ARS.currencyValue[variant][ctype]);
//                 const copperToCTypeCount = (copperChange / conversionValue);
//                 const convertedRemaining = (copperChange % conversionValue);
//                 // console.log("utilities.js exactChangePlease consolidateCoinHelper", { copperChange, amount, ctype, conversionValue, copperToCTypeCount, convertedRemaining });
//                 if (copperToCTypeCount >= 1 || convertedRemaining == 0) {
//                     const amount =
//                         ((copperChange - (convertedRemaining)) / conversionValue)
//                     const leftOver = convertedRemaining;
//                     copperChange = leftOver;
//                     leftOverChange.push({ amount: amount, type: ctype })

//                     // console.log("utilities.js exactChangePlease consolidateCoinHelper", { leftOver, copperChange, leftOverChange });
//                 }
//                 if (!copperChange)
//                     break;
//             }
//         }
//         console.log("utilities.js exactChangePlease consolidateCoinHelper DONE", { leftOverChange });
//         return leftOverChange;
//     }

//     let validCoinType = '';
//     for (const ctype of ARS.currencyType) {
//         const coinCPValue = cpConversionHelper(currency[ctype], ctype);
//         if (coinCPValue >= targetCPValue) {
//             validCoinType = ctype;
//             break;
//         }
//     }


//     // console.log("utilities.js exactChangePlease", { validCoinType });
//     const [validCoinAmount, remainingCopper] = coinAmountHelper(validCoinType);
//     let diffString = `spent ${validCoinAmount} ${validCoinType}`;

//     let update = {
//         [`system.currency.${validCoinType}`]: (parseInt(currency[validCoinType]) - validCoinAmount),
//     };
//     const change = consolidateCoinHelper(remainingCopper);
//     if (change.length) {
//         // update['system.currency.cp'] = (parseInt(currency['cp']) + remainingCopper);
//         diffString += ` and received`;
//         for (let i = 0; i < change.length; i++) {
//             update[`system.currency.${change[i].type}`] = (parseInt(currency[change[i].type]) + change[i].amount);
//             diffString += ((i > 0 ? ', ' : ' ') + `${change[i].amount} ${change[i].type}`);
//         }
//         diffString += ` in change`;
//     }

//     if (!validCoinType) {
//         update = undefined;
//         diffString = game.i18n.localize("ARS.currency.insufficient");
//     }

//     console.log("utilities.js exactChangePlease", { update, diffString });
//     return [update, diffString];
// }


/**
 * 
 * Debug code to see what total CP value before/after resulted in to check math on calculateCoins()
 * 
 * @param {*} availableCurrency 
 * @returns 
 */
function getCurrentCPTotal(availableCurrency) {
    const variant = game.ars.config.settings.systemVariant;
    const currencyBaseExchange = ARS.currencyValue[variant];
    let totalAvailable = 0;
    for (let currency in availableCurrency) {
        totalAvailable += availableCurrency[currency] * currencyBaseExchange[currency];
    }

    return totalAvailable;
}
/**
 * Calculate coins used when buying an amount of a currency type.
 * It prioritizes using smaller coins first or converting the largest currency
 * to reach the target amount.
 *
 * @param {*} availableCurrency actor.system.currency
 * @param {*} costAmount Integer
 * @param {*} costCurrency cp/sp/ep/gp/pp
 * @returns { available: newAvailableCurrency, spent: spent, change: change }
 */
export function calculateCoins(availableCurrency, costAmount, costCurrency) {
    const variant = game.ars.config.settings.systemVariant;
    const currencyBaseExchange = ARS.currencyValue[variant];

    // Convert the cost amount and currency type to base value
    let costInBaseValue = costAmount * currencyBaseExchange[costCurrency];

    // Calculate the total available currency in base value
    let totalAvailable = 0;
    for (let currency in availableCurrency) {
        totalAvailable += availableCurrency[currency] * currencyBaseExchange[currency];
    }

    // Return undefined if not enough currency is available
    if (totalAvailable < costInBaseValue) {
        return undefined;
    }

    console.log("utilities.js calculateCoins availableCurrency totalAvailable:", getCurrentCPTotal(availableCurrency), "Cost in CP", { costInBaseValue });

    // Exchange the lowest value currencies for the complete total amount needed
    let newAvailableCurrency = { ...availableCurrency };
    let spent = {};
    let currencies = Object.keys(currencyBaseExchange);

    // Loop through each currency from lowest to highest
    for (let i = 0; i < currencies.length; i++) {
        let currency = currencies[i];
        spent[currency] = 0;

        // Keep exchanging currency until we reach the target cost in base value
        while (costInBaseValue >= currencyBaseExchange[currency] && newAvailableCurrency[currency] > 0) {
            costInBaseValue -= currencyBaseExchange[currency];
            newAvailableCurrency[currency]--;
            spent[currency]++;
        }
    }

    // If costInBaseValue is not 0, exchange larger currency to compensate
    for (let i = 0; i < currencies.length && costInBaseValue > 0; i++) {
        let currency = currencies[i];

        if (newAvailableCurrency[currency] > 0) {
            let needed = Math.ceil(costInBaseValue / currencyBaseExchange[currency]);
            if (needed <= newAvailableCurrency[currency]) {
                spent[currency] += needed;
                newAvailableCurrency[currency] -= needed;
                costInBaseValue -= currencyBaseExchange[currency];
                break;
            }
        }
    }

    // If we have a negative costInBaseValue, convert it to the highest currency we can then default to CP
    let change = {};
    if (costInBaseValue < 0) {
        costInBaseValue = Math.abs(costInBaseValue);
        for (let i = currencies.length - 1; i >= 0 && costInBaseValue > 0; i--) {
            let currency = currencies[i];
            change[currency] = 0;

            // Keep converting until we reach the desired change in base value
            while (costInBaseValue >= currencyBaseExchange[currency]) {
                newAvailableCurrency[currency]++;
                change[currency]++;
                costInBaseValue -= currencyBaseExchange[currency];
            }
        }
    }

    console.log("utilities.js calculateCoins newAvailableCurrency totalAvailable:", getCurrentCPTotal(newAvailableCurrency));

    // Return the new availableCurrency totals and the amount of each currency spent and the change
    return { available: newAvailableCurrency, spent: spent, change: change };
}


/**
 * 
 * Escape any regular expression characters in string
 * 
 * @param {*} string 
 * @returns 
 */
export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * 
 * Find a item name/type match in current inventory of actor if it exists
 * 
 * finds itemToMatch.name split up by space or comma to see if its in the item.name 
 * of the actors inventory of items
 * 
 * @param {*} targetActor actor these items exist on
 * @param {*} itemToMatch item object to find similar
 * @param {*} itemTypes  Filter itemToMatch types out (optional)
 * @param {*} matchToType Only compare itemToMatch against items of this type (optional) i.e. look for a name of weapon itemToMatch in proficiency item names
 * @returns 
 */
export function findSimilarItem(targetActor, itemToMatch, itemTypes = ['item', 'weapon'], matchToType = null) {
    const MIN_WORD_LENGTH = 3;
    const ignoreAttributeTypes = [
        // "alchemical",
        "ammunition",
        // "animal",
        // "art",
        // "clothing",
        "daily food and lodging",
        // "equipment packs",
        // "gear",
        // "gem",
        // "jewelry",
        "provisions",
        // "scroll",
        // "service",
        "herb or spice",
        // "tack and Harness",
        "tool",
        // "transport",
        "other"
    ];

    // console.log("utilities.js findSimilarItem", { targetActor, itemToMatch, itemTypes, matchToType });

    //if this isnt a item type valid to look for, return not found
    if (
        itemTypes.length && !itemTypes.includes(itemToMatch.type) ||
        itemToMatch?.system?.attributes?.magic && !itemToMatch?.system?.attributes?.identified
    ) {
        return undefined;
    }

    // if only matching a item, only look at specific attribute types, not everything
    if (!matchToType &&
        !['type', 'subtype'].some(attr => ignoreAttributeTypes.includes(itemToMatch?.system?.attributes?.[attr]?.toLowerCase() ?? ''))
    ) {
        return undefined;
    }

    function matchWords(nameWord, queryWord) {
        const sanitizedName = escapeRegExp(nameWord);
        const sanitizedQuery = escapeRegExp(queryWord);
        const nameRegex = new RegExp(`\\b${sanitizedName}\\b`, 'i');
        const queryRegex = new RegExp(`\\b${sanitizedQuery}\\b`, 'i');
        return nameRegex.test(sanitizedQuery) || queryRegex.test(sanitizedName);
    }

    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**search for every piece of item.name in every part of the object name in the list of objects     */
    function searchObjectsByName(queryItem, objectList) {
        const ignoreWords = ['and', 'art', 'day', 'etc', 'from', 'for', 'gem', 'level', 'night', 'per', 'the', 'tun', 'was'];
        const escapedQuery = escapeRegExp(queryItem.name);
        const filteredList = objectList.filter(obj => {
            const { id, type, name } = obj;
            if (queryItem.id === id) return false;

            const nameWords = name.toLowerCase().split(/[\s,]+/).filter(w => w.length >= MIN_WORD_LENGTH && !ignoreWords.includes(w));
            const queryWords = escapedQuery.toLowerCase().split(/[\s,]+/).filter(w => w.length >= MIN_WORD_LENGTH && !ignoreWords.includes(w));
            const matchType = matchToType ? type === matchToType : queryItem.type === type;

            return matchType && queryWords.some(qWord => nameWords.some(nWord => matchWords(nWord, qWord)));
        });

        return filteredList;
    }

    const foundItems = searchObjectsByName(itemToMatch, targetActor.items);

    // console.log("utilities.js findSimilarItem", { foundItems });
    return foundItems;
}

/**
 * 
 * Fix double spacing.
 * Remove end of line when ending in -CR
 * Remove CR on lines not ending with .
 * Replace EOL with <p/>
 * 
 * @param {*} text 
 * @returns 
 */
export function textCleanPaste(text) {
    let newText = text;
    // remove double space
    newText = newText.replace(/ {2,}/g, ' ');
    // remove double space
    newText = newText.replace(/[\s]+[\r\n]/g, '\r\n');
    // unwrap lines ending in -
    newText = newText.replace(/-(?:\s*[\n\r])/g, '')
    // remove CRs for lines w/o .
    newText = newText.replace(/(?<!\.|\.\s)[\n\r]/g, ' ')
    // replace EOL with <p/>
    newText = newText.replace(/[\n\r]+/g, '<p/>');
    // clean up highbit chars and replace with ascii
    newText = this.replaceHighBitChars(newText);

    return newText;
}


/**
 * 
 * Swap out odd characters for matching ascii
 * 
 * @param {*} inputString 
 * @returns 
 */
export function replaceHighBitChars(inputString) {
    // Define a lookup table for high-bit characters and their ASCII equivalents
    const highBitToAsciiMap = {
        'Á': 'A', 'á': 'a', 'Â': 'A', 'â': 'a', 'Ã': 'A', 'ã': 'a', 'Ä': 'A', 'ä': 'a', 'Å': 'A', 'å': 'a',
        'Æ': 'AE', 'æ': 'ae', 'Ç': 'C', 'ç': 'c', 'È': 'E', 'è': 'e', 'É': 'E', 'é': 'e', 'Ê': 'E', 'ê': 'e',
        'Ë': 'E', 'ë': 'e', 'Ì': 'I', 'ì': 'i', 'Í': 'I', 'í': 'i', 'Î': 'I', 'î': 'i', 'Ï': 'I', 'ï': 'i',
        'Ð': 'D', 'ð': 'd', 'Ñ': 'N', 'ñ': 'n', 'Ò': 'O', 'ò': 'o', 'Ó': 'O', 'ó': 'o', 'Ô': 'O', 'ô': 'o',
        'Õ': 'O', 'õ': 'o', 'Ö': 'O', 'ö': 'o', 'Ø': 'O', 'ø': 'o', 'Ù': 'U', 'ù': 'u', 'Ú': 'U', 'ú': 'u',
        'Û': 'U', 'û': 'u', 'Ü': 'U', 'ü': 'u', 'Ý': 'Y', 'ý': 'y', 'Þ': 'P', 'þ': 'p', 'ß': 's', 'Œ': 'OE',
        'œ': 'oe', 'Š': 'S', 'š': 's', 'Ÿ': 'Y', 'ž': 'z', 'Ž': 'Z', 'ƒ': 'f',
        '—': '--' // Add em dash to its ASCII equivalent
    };

    // Replace high-bit characters with their ASCII equivalents
    const asciiString = inputString.replace(/[^\x00-\x7F]/g, (char) => highBitToAsciiMap[char] || char);

    return asciiString;
}



/**
 * 
 * If line starts with Word: add <h3>Word</h3>
 * Find any dice roll and add [[//roll diceRoll]]
 * 
 * @param {*} text 
 * @returns 
 */
export function textAddSimpleMarkup(text) {
    let newText = text;

    // remove period from vs. and vrs.
    function replaceVsAndVrs(text) {
        const regex = /(vs|vrs)[.]/gi;
        return text.replace(regex, (match) => match.slice(0, -1));
    }

    newText = replaceVsAndVrs(newText)

    // replace Word: with <h3>word</h3>
    newText = newText.replace(/<p\/>([\w\/]+):/gmi, (match, word) => `<h2>${word}</h2>`);
    // replace dice roll strings with inline roll
    newText = newText.replace(/(\d+)?d(\d+)([+-]\d+)?/gm, (match) => `[[/roll ${match}]]`)

    newText = textAddBoldTags(newText, ARS.markupPhrases);

    return newText;
}

export function textAddBoldTags(text, phrases) {
    const regexPhrases = phrases.join('|');
    const regex = new RegExp(`[^.!?]*(?:${regexPhrases})[^.!?]*[.!?]`, 'gi');

    return text.replace(regex, (match) => `<b>${match}</b>`);
}

// This function converts a range into a dice roll string (e.g., '2d6+1')
// range: a string representing a range of possible values (e.g., '1-6')

/**
 * This function converts a range into a dice roll string (e.g., '2d6+1')
 * 
 * @param {String} range: a string representing a range of possible values (e.g., '1-6')
 * @returns String
 */
export function convertToDiceRoll(range) {
    // Split the range into min and max, then convert them to numbers
    const [min, max] = range.split('-').map(Number);

    // Array of valid dice types (number of sides)
    const validDiceTypes = [2, 4, 6, 8, 10, 12, 20, 100];

    // Check if the range is valid (max should be greater or equal to min)
    if (max < min) {
        throw new Error('Invalid range: Max value should be greater than or equal to Min value');
    }

    // Calculate the difference between max and min values
    const difference = max - min + 1;

    // Initialize variables for optimal dice roll configuration
    let numberOfSides = difference;
    let numberOfDice = 1;
    let bestDifference = Number.MAX_SAFE_INTEGER;
    let bestModifier = 0;

    // Iterate through each dice type to find the optimal configuration
    for (let dice of validDiceTypes) {
        // Iterate through possible dice counts
        for (let count = 1; count <= difference; count++) {
            // Iterate through possible modifiers
            for (let modifier = 0; modifier < dice; modifier++) {
                // Calculate min and max values for the current configuration
                const minValue = count + modifier;
                const maxValue = count * dice + modifier;
                const currentDifference = Math.abs(maxValue - minValue + 1 - difference);

                // Check if the current configuration satisfies the input range
                // and has a smaller difference than the best configuration found so far
                if (min >= minValue && max <= maxValue && currentDifference < bestDifference) {
                    bestDifference = currentDifference;
                    numberOfSides = dice;
                    numberOfDice = count;
                    bestModifier = modifier;
                }
            }
        }
    }

    // Generate the modifier string based on the bestModifier value
    const modifierString = bestModifier > 0 ? `+${bestModifier}` : '';

    // Return the dice roll string with the optimal configuration
    return `${numberOfDice}d${numberOfSides}${modifierString}`;
}

// This function calculates the effective level of a character based on hit dice (HD)
// hitDice: the hit dice string (e.g., '1d6+2')
export function effectiveLevel(hitDice) {

    // Helper function to extract hit dice value and modifier from the hit dice string
    function helperGetHitDice(hitDice) {
        const hitDiceString = String(hitDice);
        const [, hitDiceValue, , modifierType, modifierValue] = hitDiceString.match(/^(\d+)(([+\-])(\d+))?/);

        if (hitDiceValue) {
            const parsedHitDiceValue = parseInt(hitDiceValue);
            const parsedModifierType = modifierType || '';
            const parsedModifierValue = modifierValue || 0;
            const calculatedModifierValue = parseInt(`${parsedModifierType}${parsedModifierValue}`) || 0;

            return [parsedHitDiceValue, calculatedModifierValue];
        }

        return [1, 0];
    }

    // Get the hit dice and modifier value
    const [hdValue, modValue] = helperGetHitDice(hitDice);
    const variant = ARS.settings.systemVariant;
    let effectiveHD = -1;

    // Handle different system variants (0 for OSRIC, others for different versions)
    if (Number(variant) === 0) {
        if (hdValue > 0 && modValue > 0) {
            effectiveHD = hdValue + 2;
        } else if (hdValue === 1 && modValue === -1) {
            effectiveHD = hdValue;
        } else if (hdValue === 1 && modValue < -1) {
            effectiveHD = 0;
        } else if (hdValue > 0) {
            effectiveHD = hdValue + 1;
        } else {
            effectiveHD = hdValue;
        }
    } else {
        const bonusHD = Math.floor(modValue / 4);
        effectiveHD = hdValue + bonusHD + (modValue > 0 ? 1 : modValue < 0 ? -1 : 0);
    }

    // Ensure the effective HD is within the valid range of 0 to 21
    effectiveHD = Math.min(Math.max(effectiveHD, 0), 21);

    // Return the effective HD
    return effectiveHD;
}

