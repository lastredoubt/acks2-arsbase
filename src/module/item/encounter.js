import * as effectManager from "../effect/effects.js";
import * as chatManager from "../chat.js";
import * as utilitiesManager from "../utilities.js";
import * as debug from "../debug.js";
import * as macrosManager from "../macros.js";
import * as actionManager from "../apps/action.js";


/**
 * 
 * When encounter dropped on scene add contents
 * 
 * @param {*} item item object (encounter item)
 * @param {*} dropData drop data that includes x/y
 */
export async function encounterDrop(item, dropData) {
    console.log("encounter.js encounterDrop", { item, dropData });
    if (item) {
        let newPos = 1;
        let lastX = dropData.x;
        let lastY = dropData.y;
        for await (const npcr of item.system.npcList) {
            // console.log("encounter.js encounterDrop", { npcr });
            // let actor = await Actor.implementation.fromDropData({ id: npcr.id, type: 'Actor', pack: npcr.pack });
            let actor = npcr.uuid ? await fromUuid(npcr.uuid) : await game.actors.get(npcr.id);
            if (!actor && npcr.pack) {
                actor = await game.packs.get(npcr.pack).getDocument(npcr.id);
            }
            if (actor) {
                // console.log("encounter.js encounterDrop actor", { actor });
                if (actor.compendium) {
                    const actorData = game.actors.fromCompendium(actor);
                    // console.log("encounter.js encounterDrop actorData", { actorData });
                    // create local actor, use same id so we can use it instead if we drop this again
                    actor = await Actor.implementation.create({ ...actorData, id: npcr.id, _id: npcr.id }, { keepId: true });

                    // place this actor into a dump folder
                    const dumpfolder = await utilitiesManager.getFolder("Encounter Drops", "Actor");
                    actor.update({ 'folder': dumpfolder.id })
                }

                // console.log("encounter.js encounterDrop resolve", { actor, npcr });
                const countFor = utilitiesManager.evaluateFormulaValue(npcr.count) || 1;
                console.log(`EncounterDrop spawning ${countFor} ${actor.name}`);
                await new Promise(async (resolve, reject) => {
                    // console.log("encounter.js encounterDrop td x/y", dropData.x, dropData.y);
                    for (let i = 0; i < countFor; i++) {
                        // Prepare the Token data
                        // const td = await actor.getTokenData({ x: dropData.x, y: dropData.y });
                        // console.log("encounter.js encounterDrop resolve", { actor });
                        const td = await actor.getTokenDocument({ x: dropData.x, y: dropData.y });
                        // const td = await actor.getTokenDocument({ x: dropData.x, y: dropData.y });

                        // console.log("encounter.js encounterDrop resolve", { td });

                        //TODO fix these so they are placed smartly, not like this
                        const widthPos = (td.width * canvas.grid.w / 2);
                        const heightPos = (td.height * canvas.grid.h / 2);

                        //
                        td.updateSource({
                            x: lastX - (widthPos),
                            y: lastY - (heightPos)
                        });

                        // snap to near grid slot
                        //
                        const hw = canvas.grid.w / 2;
                        const hh = canvas.grid.h / 2;
                        td.updateSource(canvas.grid.getSnappedPosition(td.x - (td.width * hw), td.y - (td.height * hh)));

                        // Validate the final position
                        if (canvas.dimensions.rect.contains(td.x, td.y)) {
                            // Submit the Token creation request and activate the Tokens layer (if not already active)
                            // canvas.scene.activate();
                            //
                            // const cls = getDocumentClass("Token");
                            // await cls.create(td, { parent: canvas.scene });
                            td.constructor.create(td, { parent: canvas.scene });
                            // console.log("encounter.js encounterDrop", { td });
                            lastX = td.x;
                            lastY = td.y;
                        } else {
                            console.log("encounter.js encounterDrop invalid placement ", { newX, newY });
                            ui.notifications.error('Could not drop token due to invalid placement.');
                        }
                        newPos++;
                    }
                    resolve();
                }).then(() => {
                    // console.log("encounter.js encounterDrop DONE");
                });
            }
        }
    }
}
