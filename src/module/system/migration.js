/**
 * 
 * Functions to manage version migration/updates
 * 
 */
import * as debug from "../debug.js";

export function migrationChecks() {
    const needsUpgrade = '2023.04.01';
    const systemMigrationVersion = game.settings.get("ars", "systemMigrationVersion");
    // console.log("migration.js migrationChecks", { needsUpgrade, systemMigrationVersion }, game.system.version);

    // if (!systemMigrationVersion) {
    //     return game.settings.set("ars", "systemMigrationVersion", game.system.version);
    // }

    const needsMigration = (systemMigrationVersion && isNewerVersion(needsUpgrade, systemMigrationVersion));
    // if (!needsMigration) {
    //     // if (game.system.version != systemMigrationVersion)
    //     //     return game.settings.set("ars", "systemMigrationVersion", game.system.version);
    //     return;
    // }

    console.log("migration.js migrationChecks", { needsUpgrade, systemMigrationVersion, needsMigration }, game.system.version);

    if (needsMigration) {
        console.log("migration.js migrationChecks UPDATING");
        migrateWorld();
    }
    return game.settings.set("ars", "systemMigrationVersion", game.system.version);
}

/**
 * 
 * Migrate all world data
 * 
 */
export async function migrateWorld() {
    ui.notifications.info(`Applying System Migration for version ${game.system.version}. Please be patient and do not close your game or shut down your server.`, { permanent: true });

    // const migrationData = await getMigrationData();
    let migrationData;

    // Migrate World Actors
    for (let a of game.actors) {
        try {
            const updateData = migrateActorData(a.toObject(), migrationData);
            if (!foundry.utils.isEmpty(updateData)) {
                console.log(`Migrating Actor document ${a.name}`);
                await a.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            err.message = `Failed system migration for Actor ${a.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Items
    for (let i of game.items) {
        try {
            const updateData = migrateItemData(i.toObject(), migrationData);
            if (!foundry.utils.isEmpty(updateData)) {
                console.log(`Migrating Item document ${i.name}`);
                await i.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            err.message = `Failed system migration for Item ${i.name}: ${err.message}`;
            console.error(err);
        }
    }

    // // Migrate World Macros
    // for (const m of game.macros) {
    //     try {
    //         const updateData = migrateMacroData(m.toObject(), migrationData);
    //         if (!foundry.utils.isEmpty(updateData)) {
    //             console.log(`Migrating Macro document ${m.name}`);
    //             await m.update(updateData, { enforceTypes: false });
    //         }
    //     } catch (err) {
    //         err.message = `Failed dnd5e system migration for Macro ${m.name}: ${err.message}`;
    //         console.error(err);
    //     }
    // }

    // Migrate Actor Override Tokens
    for (let s of game.scenes) {
        try {
            const updateData = migrateSceneData(s, migrationData);
            if (!foundry.utils.isEmpty(updateData)) {
                console.log(`Migrating Scene document ${s.name}`);
                await s.update(updateData, { enforceTypes: false });
                // If we do not do this, then synthetic token actors remain in cache
                // with the un-updated actorData.
                s.tokens.forEach(t => t._actor = null);
            }
        } catch (err) {
            err.message = `Failed system migration for Scene ${s.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Compendium Packs
    for (let p of game.packs) {
        if (p.metadata.package !== "world") continue;
        if (!["Actor", "Item", "Scene"].includes(p.documentName)) continue;
        await migrateCompendium(p);
    }

    // Set the migration as complete
    console.log("migration.js migrationChecks UPDATING COMPLETE");
    game.settings.set("ars", "systemMigrationVersion", game.system.version);
    ui.notifications.info(`System Migration to version ${game.system.version} completed!`, { permanent: true });
}

/**
 * 
 * Migrate compendium data
 * 
 * @param {*} pack 
 * @returns 
 */
export const migrateCompendium = async function (pack) {
    const documentName = pack.documentName;
    if (!["Actor", "Item", "Scene"].includes(documentName)) return;

    // const migrationData = await getMigrationData();
    let migrationData; // currently not used

    // Unlock the pack for editing
    const wasLocked = pack.locked;
    await pack.configure({ locked: false });

    // Begin by requesting server-side data model migration and get the migrated content
    await pack.migrate();
    const documents = await pack.getDocuments();

    // Iterate over compendium entries - applying fine-tuned migration functions
    for (let doc of documents) {
        let updateData = {};
        try {
            switch (documentName) {
                case "Actor":
                    updateData = migrateActorData(doc.toObject(), migrationData);
                    break;
                case "Item":
                    updateData = migrateItemData(doc.toObject(), migrationData);
                    break;
                case "Scene":
                    updateData = migrateSceneData(doc.data, migrationData);
                    break;
            }

            // Save the entry, if data was changed
            if (foundry.utils.isEmpty(updateData)) continue;
            await doc.update(updateData);
            console.log(`Migrated ${documentName} document ${doc.name} in Compendium ${pack.collection}`);
        }

        // Handle migration failures
        catch (err) {
            err.message = `Failed system migration for document ${doc.name} in pack ${pack.collection}: ${err.message}`;
            console.error(err);
        }
    }

    // Apply the original locked status for the pack
    await pack.configure({ locked: wasLocked });
    console.log(`Migrated all ${documentName} documents from Compendium ${pack.collection}`);
};

/**
 * 
 * Migrate actor data
 * 
 * @param {*} actor 
 * @param {*} migrationData 
 * @returns 
 */
export const migrateActorData = function (actor, migrationData) {
    const updateData = {};

    // Actor Data Updates
    if (actor.system) {
        // _migrateActorMovement(actor, updateData);
        _migrateActorActions(actor, updateData);
        _migrateActorEffects(actor, updateData)

    }

    // Migrate Owned Items
    if (!actor.items) return updateData;
    const items = actor.items.reduce((arr, i) => {
        // Migrate the Owned Item
        const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
        let itemUpdate = migrateItemData(itemData, migrationData);

        // Update the Owned Item
        if (!foundry.utils.isEmpty(itemUpdate)) {
            itemUpdate._id = itemData._id;
            arr.push(expandObject(itemUpdate));
        }
        return arr;
    }, []);
    if (items.length > 0) updateData.items = items;
    return updateData;
};

/**
 * 
 * migrate item data changes
 * 
 * @param {*} item 
 * @param {*} migrationData 
 * @returns 
 */
export const migrateItemData = function (item, migrationData) {
    const updateData = {};

    // _migrateCost(item, updateData);
    _migrateItemClass(item, updateData);
    _migrateItemActions(item, updateData)
    _migrateItemEffects(item, updateData)

    // console.log(`migration.js migrateItemData ${item.name}`, { updateData })
    return updateData;
};

/**
 * Migrate a single Scene document to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {object} scene            The Scene data to Update
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}                The updateData to apply
 */
export const migrateSceneData = function (scene, migrationData) {
    const tokens = scene.tokens.map(token => {
        const t = token instanceof foundry.abstract.DataModel ? token.toObject() : token;
        const update = {};

        // _migrateTokenImage(t, update);
        _migrateTokenObjects(t, update)

        if (Object.keys(update).length) foundry.utils.mergeObject(t, update);
        if (!t.actorId || t.actorLink) {
            t.actorData = {};
        }
        else if (!game.actors.has(t.actorId)) {
            t.actorId = null;
            t.actorData = {};
        }
        else if (!t.actorLink) {
            const actorData = duplicate(t.actorData);
            actorData.type = token.actor?.type;
            const update = migrateActorData(actorData, migrationData);
            ["items", "effects"].forEach(embeddedName => {
                if (!update[embeddedName]?.length) return;
                const updates = new Map(update[embeddedName].map(u => [u._id, u]));
                t.actorData[embeddedName].forEach(original => {
                    const update = updates.get(original._id);
                    if (update) foundry.utils.mergeObject(original, update);
                });
                delete update[embeddedName];
            });

            foundry.utils.mergeObject(t.actorData, update);
        }
        return t;
    });
    return { tokens };
};

/**
 * 
 * This checks tokens for action/effects not on their synthetic parent and updates
 * 
 * @param {*} token 
 * @param {*} updateData 
 * @returns 
 */
function _migrateTokenObjects(token, updateData) {
    console.log(`migration.js _migrateTokenObjects ${token.name}`, { token, updateData })

    // all of this is handled in the migrateActor...

    // if (token.actorData?.system?.actions?.length) {
    //     _migrateActorActions(token.actorData, updateData);
    // }
    // if (token.actorData?.effects?.length) {
    //     _migrateActorEffects(token.actorData, updateData);
    // }
    // if (token.actorData?.items?.length) {
    //     for (const item of token.actorData.items) {
    //         _migrateItemActions(item, updateData);
    //         _migrateItemEffects(item, updateData);
    //     }
    // }
    return updateData;
}
/* -------------------------------------------- */
// /**
//  * 
//  * Convert from original "100 gp" to new value/currency
//  * 
//  * @param {*} item 
//  * @param {*} updateData 
//  * @returns 
//  */
// function _migrateCost(item, updateData) {
//     console.log("migration.js _migrateCost", { item, updateData })
//     if (['item', 'weapon', 'armor', 'potion'].includes(item.type)) {
//         const originalCost = item.cost;
//         if (originalCost) {
//             if (originalCost.match(/\d+ \w+/)) {
//                 const [itemCost, itemCurrency] = originalCost.split(" ");
//                 const newCost = { value: parseInt(itemCost) || 0, currency: itemCurrency };
//                 updateData["cost"] = newCost;
//             } else {
//                 updateData["-=cost"] = null;
//             }
//         }
//     }
//     return updateData;
// }

/**
 * 
 * This checks for actions on an actor and updates them
 * 
 * @param {*} actor 
 * @param {*} updateData 
 */
function _migrateActorActions(actor, updateData) {
    // console.log("migration.js _migrateActorActions", { actor, updateData })
    if (actor.system.actions)
        for (const action of actor.system.actions) {
            if (action.effect.changes.length)
                _migrateAction(actor, action, updateData);
        }
}
/**
 * 
 * This checks for actions on items and updates them
 * 
 * @param {*} item 
 * @param {*} updateData 
 */
function _migrateItemActions(item, updateData) {
    // console.log("migration.js _migrateItemActions", { item, updateData })
    if (item.system.actions)
        for (const action of item.system.actions) {
            if (action.effect.changes.length)
                _migrateAction(item, action, updateData);
        }

}

/**
 * 
 * This fixes actions that apply effects 
 * 
 * @param {*} object 
 * @param {*} action 
 * @param {*} updateData 
 */
function _migrateAction(object, action, updateData) {
    // console.log(`migration.js _migrateAction ${object.name}`, { object, action, updateData })
    let actionBundle = foundry.utils.deepClone(getProperty(object, "system.actions") || []);
    actionBundle = Object.values(actionBundle);
    for (const [index, change] of action.effect.changes.entries()) {
        // console.log("migration.js _migrateAction", { index, change })
        _migrateEffectChange(object, action.effect, change, updateData)
        actionBundle[action.index].effect.changes[index].key = change.key;
        actionBundle[action.index].effect.changes[index].value = change.value;
    }
    // set this so it persists through looping over actions
    object.system.actions = actionBundle;
    //
    updateData['system.actions'] = actionBundle;
    // console.log(`migration.js _migrateAction updateData for ${object.name}`, { actionBundle, updateData })
}

/**
 * 
 * This checks for effects on actors and updates 
 * 
 * @param {*} actor 
 * @param {*} updateData 
 */
function _migrateActorEffects(actor, updateData) {
    if (actor.effects) {
        let effectsBundle = duplicate(actor.effects);
        if (effectsBundle.length) {
            for (const effect of effectsBundle) {
                for (const change of effect.changes) {
                    _migrateEffectChange(actor, effect, change, updateData)
                }
            }
            // actor.update({ 'effects': effectsBundle });
            updateData['effects'] = effectsBundle;
        }
    }
}
/**
 * 
 * This checks for effects on items and updates
 * 
 * @param {*} item 
 * @param {*} updateData 
 */
function _migrateItemEffects(item, updateData) {
    let effectsBundle = duplicate(item.effects);
    if (effectsBundle.length) {
        for (const effect of effectsBundle) {
            for (const change of effect.changes) {
                _migrateEffectChange(item, effect, change, updateData)
            }
        }
        // item.update({ 'effects': effectsBundle });
        updateData['effects'] = effectsBundle;
    }
}

/**
 * 
 * This will update the effect.changes change entries for the 23.04.1 effect mass changes
 * 
 * @param {*} object 
 * @param {*} effect 
 * @param {*} change 
 * @param {*} updateData 
 */
function _migrateEffectChange(object, effect, change, updateData) {
    let detailsCheck = undefined;
    try {
        detailsCheck = JSON.parse(change.value);
    } catch { }
    const migratedAlready = (detailsCheck && (hasProperty(detailsCheck, "formula") || hasProperty(detailsCheck, "properties")));

    if (change.key.toLowerCase() === 'light') {
        console.log(`migration.js _migrationEffects LIGHT ${object.name}`, { object, effect, change })
        const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
        const details = {
            color: opts[0],
            dim: opts[1],
            bright: opts[2] || opts[1],
            angle: opts[3] || 360,
            animation: opts[4] || undefined,
            alpha: opts[5] || undefined,
        };
        change.key = 'special.light';
        change.mode = 0;
        change.value = JSON.stringify(details)

    } else if (change.key.toLowerCase() === 'vision') {
        console.log(`migration.js _migrationEffects VISION ${object.name}`, { object, effect, change })
        // { name: "special.vision", mode: 0, value: '{"range": 10, "angle": 360, "mode": "basic"}' }
        const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
        const details = {
            range: parseInt(opts[0]) || 10,
            angle: opts[1] || 360,
            mode: opts[2] || 'basic',
        }
        change.key = 'special.vision';
        change.mode = 0;
        change.value = JSON.stringify(details)

    } else if (change.key.toLowerCase() === 'absorb') {
        console.log(`migration.js _migrationEffects ABSORB ${object.name}`, { object, effect, change })
        // { name: "special.absorb", mode: 0, value: '{"amount":10, "damageType":"fire"}' },
        const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
        const details = {
            amount: parseInt(opts[0]) || 10,
            damageType: opts[1] || 'fire',
        }
        change.key = 'special.absorb';
        change.mode = 0;
        change.value = JSON.stringify(details)

    } else if (change.key.toLowerCase() === 'aura') {
        console.log(`migration.js _migrationEffects AURA ${object.name}`, { object, effect, change })
        // { name: "special.aura", mode: 0, value: '{"distance": 10, "color": "red", "faction": "friendly", "opacity": "0.50", "shape": "round"}' },
        const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
        const details = {
            distance: parseInt(opts[0]) || 10,
            color: opts[1] || 'red',
            faction: opts[2] || 'friendly',
            opacity: parseFloat(opts[3]) || 0.50,
            shape: opts[4] || 'round',
        }
        change.key = 'special.aura';
        change.mode = 0;
        change.value = JSON.stringify(details);
    } else if (change.key.toLowerCase() === 'system.mods.heal.regen') {
        console.log(`migration.js _migrationEffects system.mods.heal.regen ${object.name}`, { object, effect, change })
        const details = {
            type: 'heal',
            rate: 1,
            cycle: 'round',
            dmgType: '',
            formula: parseInt(change.value) || 1,
        }
        change.key = 'special.ongoing';
        change.mode = 0;
        change.value = JSON.stringify(details)

    } else if (change.key.toLowerCase().startsWith('ongoing ')) {
        console.log(`migration.js _migrationEffects ONGOING ${object.name}`, { object, effect, change })
        // { name: "special.ongoing", mode: 0, value: '{"type":"heal", "rate":"1", "cycle": "round", "dmgType": "", "formula": "1d4"}' },
        const opts = change.key.toLowerCase().split(' ').map(text => text.trim());
        const valueOpts = change.value.toLowerCase().split(' ').map(text => text.trim());
        const details = {
            type: opts[1] || 'heal',
            rate: parseInt(opts[3]) || 1,
            cycle: opts[4] || 'round',
            dmgType: valueOpts[1] || '',
            formula: valueOpts[0] || 1,
        }
        change.key = 'special.ongoing';
        change.mode = 0;
        change.value = JSON.stringify(details)

    } else if (change.key.toLowerCase() === 'mirrorimage') {
        console.log(`migration.js _migrationEffects MIRRORIMAGE ${object.name}`, { object, effect, change })
        // { name: "special.mirrorimage", mode: 0, value: 5 },
        change.key = 'special.mirrorimage';
        change.mode = 0;
        change.value = change.value;

    } else if (change.key.toLowerCase() === 'stoneskin') {
        console.log(`migration.js _migrationEffects STONESKIN ${object.name}`, { object, effect, change })
        // { name: "special.stoneskin", mode: 0, value: 5 },
        change.key = 'special.stoneskin';
        change.mode = 0;
        change.value = change.value;

    } else if (change.key.toLowerCase() === 'status') {
        console.log(`migration.js _migrationEffects STATUS ${object.name}`, { object, effect, change })
        // { name: "special.status", mode: 0, value: 'blind' },
        change.key = 'special.status';
        change.mode = 0;
        change.value = change.value;
    } else if (!migratedAlready) {
        //check detailsCheck to make sure we only do these once.

        if (change.key.toLowerCase().startsWith('target.')) {
            console.log(`migration.js _migrationEffects TARGET. ${object.name}`, { object, effect, change })
            // { name: "target.alignment", mode: 0, value: '{"trigger": "ne,ce,le", "properties": "", "type": "attack", "formula": "1d6"}' },
            const opts1 = change.key.toLowerCase().split(':').map(text => text.trim());
            const opts2 = opts1[0].toLowerCase().split('.').map(text => text.trim());
            const triggerType = opts2[1];
            let saveType = '';
            if (opts1[1].startsWith('save')) {
                // get the saveTypes
                //save,spell,breath,poison
                //remove save
                const arr = opts1[1].split(",");
                // put everything else in saveType
                saveType = arr.slice(1).join(",");
            }
            const details = {
                trigger: opts2[2],
                type: saveType ? 'save' : (opts1[1] || 'attack'),
                saveType: saveType ? saveType : undefined,
                properties: '',
                formula: change.value,
            }
            change.key = `target.${triggerType}`;
            change.mode = 0;
            change.value = JSON.stringify(details);

        } else if (change.key.toLowerCase().startsWith('attacker.')) {
            console.log(`migration.js _migrationEffects ATTACKER. ${object.name}`, { object, effect, change })
            // { name: "attacker.alignment", mode: 0, value: '{"trigger": "ne,ce,le", "properties": "", "type": "attack", "formula": "1d6"}' },
            const opts1 = change.key.toLowerCase().split(':').map(text => text.trim());
            const opts2 = opts1[0].toLowerCase().split('.').map(text => text.trim());
            const triggerType = opts2[1];
            const details = {
                trigger: opts2[2],
                type: opts1[1] || 'attack',
                properties: '',
                formula: change.value,
            }
            change.key = `attacker.${triggerType}`;
            change.mode = 0;
            change.value = JSON.stringify(details);

        } else if (change.key.toLowerCase() === 'system.mods.saves.paralyzation') {
            console.log(`migration.js _migrationEffects PARA ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.paralyzation", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.paralyzation';
            change.mode = 0;
            change.value = JSON.stringify(details)

        } else if (change.key.toLowerCase() === 'system.mods.saves.poison') {
            console.log(`migration.js _migrationEffects POISON ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.poison", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.poison';
            change.mode = 0;
            change.value = JSON.stringify(details)

        } else if (change.key.toLowerCase() === 'system.mods.saves.death') {
            console.log(`migration.js _migrationEffects DEATH ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.death", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.death';
            change.mode = 0;
            change.value = JSON.stringify(details)

        }
        else if (change.key.toLowerCase() === 'system.mods.saves.rod') {
            console.log(`migration.js _migrationEffects ROD ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.rod", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.rod';
            change.mode = 0;
            change.value = JSON.stringify(details)

        } else if (change.key.toLowerCase() === 'system.mods.saves.staff') {
            console.log(`migration.js _migrationEffects STAFF ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.staff", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.staff';
            change.mode = 0;
            change.value = JSON.stringify(details)

        } else if (change.key.toLowerCase() === 'system.mods.saves.wand') {
            console.log(`migration.js _migrationEffects WAND ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.wand", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.wand';
            change.mode = 0;
            change.value = JSON.stringify(details)

        } else if (change.key.toLowerCase() === 'system.mods.saves.petrification') {
            console.log(`migration.js _migrationEffects PETRI ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.petrification", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.petrification';
            change.mode = 0;
            change.value = JSON.stringify(details)

        } else if (change.key.toLowerCase() === 'system.mods.saves.polymorph') {
            console.log(`migration.js _migrationEffects POLY ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.polymorph", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.polymorph';
            change.mode = 0;
            change.value = JSON.stringify(details)

        } else if (change.key.toLowerCase() === 'system.mods.saves.breath') {
            console.log(`migration.js _migrationEffects BREATH ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.breath", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.breath';
            change.mode = 0;
            change.value = JSON.stringify(details)

        } else if (change.key.toLowerCase() === 'system.mods.saves.spell') {
            console.log(`migration.js _migrationEffects SPELL ${object.name}`, { object, effect, change })
            // { name: "system.mods.saves.spell", mode: 0, value: '{"formula": "1", "properties": ""}' },
            const opts = change.value.toLowerCase().split(' ').map(text => text.trim());
            const details = {
                formula: opts[0] || 1,
                properties: opts[1] || '',
            }
            change.key = 'system.mods.saves.spell';
            change.mode = 0;
            change.value = JSON.stringify(details)
        }
    }
}
/**
 * 
 * Remove the old @abilities.con.hp
 * 
 * @param {*} item 
 * @param {*} updateData 
 */
function _migrateItemClass(item, updateData) {
    if (['class'].includes(item.type)) {
        if (item.system.features.hpConFormula === "@abilities.con.hp") {
            console.log(`Updating ${item.name} with ${item.system.features.hpConFormula}`);
            console.log("", { updateData })
            mergeObject(updateData, {
                system: {
                    features: {
                        hpConFormula: '',
                    }
                }
            });
        }
    }

}


/** ------------------- ChangeLog ----------------------- */
class ARSChangeLogView extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            resizable: true,
            minimizable: true,
            id: "changelog-view-sheet",
            classes: ["ars", "changelog-view"],
            title: "Change Log View",
            template: "systems/ars/templates/apps/changelog-view.hbs",
            width: 700,
            height: 600,
            // scrollY: [".filter-list", ".item-list"],
        });
    }

    async getData() {
        const data = await super.getData();

        data.gameSystem = game.system;

        return data;
    }

}

export function changeLogLoadView() {
    if (!game.ars.ui?.changelogView) {
        game.ars.ui = {
            changelogView: new ARSChangeLogView()
        }
        game.ars.ui.changelogView.render(true);
    }
}
/**
 * This checks for updates and then displays details. Not really a change log but gives details if changeed.
 */
export function changeLogChecks() {
    const logVersion = game.settings.get("ars", "systemChangeLogVersion");
    const needsReview = !logVersion || logVersion != game.system.version; //isNewerVersion('2023.01.01', logVersion);

    console.log("migration.js changeLogChecks", { logVersion, needsReview }, game.system.version);

    if (needsReview) {
        console.log("migration.js changeLogChecks REVIEW!");
        game.settings.set("ars", "systemChangeLogVersion", game.system.version);
        changeLogLoadView();
    }
}