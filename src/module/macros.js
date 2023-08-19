import * as utilitiesManager from "./utilities.js";

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * 
 * @param {Object} dropData     The dropped data
 * @param {number} slot     The hotbar slot to use
 * 
 */
export async function createARSMacro(dropData, slot) {
    console.log("macros.js createARSMacro", { dropData, slot })
    const macroData = { type: "script", scope: "actor" };
    switch (dropData.type) {

        case 'Memorization':
            const actor = fromUuidSync(dropData.actorUuid);
            const command =
                `// Macro to use Memorization slot created for "${actor.name}"\n` +
                `const actor = fromUuidSync('${dropData.actorUuid}');\n` +
                `const spell = fromUuidSync('${dropData.uuid}');\n` +
                `const macroData = {actor:actor,slotIndex:${dropData.macroData.index},slotLevel:${dropData.macroData.level},slotType:'${dropData.macroData.type}'};\n` +
                `spell.runMacro(macroData);\n`;

            foundry.utils.mergeObject(macroData, {
                name: dropData.macroData.name,
                img: dropData.macroData.img,
                // command: `game.ars.rollItemMacro("memorization;${data.data.level};${data.data.index};${data.data.type};${data.data.name}");`,
                command: command,
                flags: { "ars.itemMacro": true },
            });
            break;

        case 'Item':
            const item = await fromUuid(dropData.uuid);
            if (['weapon', 'skill', 'potion'].includes(item.type)) {

                const command =
                    `// Macro to use Item created for "${item.actor.name}"\n` +
                    `const item = fromUuidSync('${item.uuid}');\n` +
                    `item.runMacro();\n`

                foundry.utils.mergeObject(macroData, {
                    name: item.name,
                    img: item.img,
                    command: command,
                    flags: { "ars.itemMacro": true }
                });
            }
            break;

        case 'RollTable':
            const tableEntry = await fromUuid(dropData.uuid);
            if (tableEntry) {
                const command =
                    `// Macro to use RollTable\n` +
                    `const rollTable = fromUuidSync('${tableEntry.uuid}');\n` +
                    `rollTable.sheet.render(true);\n`

                foundry.utils.mergeObject(macroData, {
                    name: tableEntry.name,
                    img: tableEntry.img,
                    command: command,
                    // flags: { "ars.itemMacro": true }
                });
            } else {
                ui.notifications.error(`Cannot find table to create macro for "${dropData.uuid}".`);
                return true;
            }
            break;

        case 'Actor':
            const actorEntry = await fromUuid(dropData.uuid);
            if (actorEntry) {
                const command =
                    `// Macro to use Actor\n` +
                    `const actorEntry = fromUuidSync('${actorEntry.uuid}');\n` +
                    `actorEntry.sheet.render(true);\n`

                foundry.utils.mergeObject(macroData, {
                    name: actorEntry.name,
                    img: actorEntry.img,
                    command: command,
                });
            } else {
                ui.notifications.error(`Cannot find actor to create macro for "${dropData.uuid}".`);
                return true;
            }
            break;

        //allow copy macro to another slot
        case 'Macro':
            const copyMacro = await fromUuid(dropData.uuid);
            if (copyMacro) {
                foundry.utils.mergeObject(macroData, copyMacro.toObject());
            } else {
                ui.notifications.error(`Cannot find macro to copy for "${dropData.uuid}".`);
                return true;
            }
            break;

        default:
            ui.notifications.error(`Macros for for type "${dropData.type}" are not currently supported.`);
            return true;
            break;
    }

    // console.log("macros.js createARSMacro", { slot, macroData })

    const macro = game.macros.find(m => (m.name === macroData.name) && (m.command === macroData.command)
        && m.author.isSelf) || await Macro.create(macroData);
    // console.log("macros.js createARSMacro", duplicate(macro))
    game.user.assignHotbarMacro(macro, slot);
}
