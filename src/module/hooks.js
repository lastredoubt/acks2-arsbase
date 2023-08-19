/**
 * 
 * Hooks
 * 
 */

import { ARSItem } from "./item/item.js";
import { ARS } from './config.js';
import * as chatManager from "./chat.js";
import * as utilitiesManager from "./utilities.js";
import * as macrosManager from "./macros.js";
import * as effectManager from "./effect/effects.js";
import { CombatManager } from "./combat/combat.js";
import * as dialogManager from "./dialog.js";
import * as combatTracker from "./combat/combatTracker.js";
import * as initLibrary from "./library.js"
import * as encounterManager from "./item/encounter.js";
import { actionsHUD } from "./token/token-hud.js";
import * as debug from "./debug.js";
import { addPartyTab } from "./sidebar/party.js";
import { addBrowserButton } from "./apps/item-browser.js";
import { addTradeButton } from "./apps/item-trade.js";
import { ARSItemBrowser } from "./apps/item-browser.js";
import { migrationChecks, changeLogChecks } from "./system/migration.js";
import { ImportManager } from "./apps/import-tools.js";
import { SocketManager } from "./sockets.js";
export default function () {
    /**
     * Hook to set default values for new actors
     */

    console.log("hooks.js DEFAULT()");

    /**
     * 
     * Hook run on items created. 
     * 
     * We do some work here so we can see if the item is owned
     * 
     */
    Hooks.on("createItem", async (item, options, userId) => {
        if (!game.user.isGM) return;
        // console.log("hooks.js createItem", { item, options, userId });
        // if (item.type === 'spell') initLibrary.refreshWorldSpellsList();
        item.postCreateItem();
    });
    /**
     * Hook to set defaults for new items
     * 
     */
    Hooks.on("preCreateItem", async (createData, options, userId) => {
        // console.log("hooks.js preCreateItem", { createData, options, userId });
    });

    /**
     * This is for ActiveEffects
     */
    Hooks.on("preCreateActiveEffect", (effect, effectData, options, userId) => {
        // console.log("hooks.js preCreateActiveEffect", { effect, effectData, options, userId });
    });
    Hooks.on("applyActiveEffect", (actor, effectData, change, value, changes) => {
        if (!game.user.isGM) return;
        // console.log("hooks.js applyActiveEffect", { actor, effectData, change, value, changes });

        if (['character', 'npc'].includes(actor.type)) {
            // if the duration.seconds has a value and startTIme is 0, set it.
            if (!effectData.effect.disabled && !effectData.effect.isSuppressed &&
                effectData.effect.duration.seconds &&
                !effectData.effect.duration.startTime) {
                effectData.effect.update({ 'duration.startTime': game.time.worldTime });
            }
        }
    });
    /**
     * when a update is triggered for an effect we check vision/light on token settings
     */
    Hooks.on("updateItemLocationState", (actor, item) => {
        console.log("hooks.js updateItemLocationState", { actor, item });
        // if (game.user.isGM) {
        //     actor.getToken()?.object.updateAuras();
        // }
    });

    Hooks.on("updateItem", (item, context, diff, id) => {
        console.log("hooks.js updateItem", { item, context, diff, id });
        if (game.user.isGM) {
            if (item.actor &&
                (context?.system?.attributes?.hasOwnProperty('identified') || context?.system?.hasOwnProperty('location'))) {
                console.warn("changes include identified state");
                const token = item.actor.getToken();
                if (token) {
                    token.object.updateAuras();
                    token.checkForAuras();
                }
            }
        }
    });

    Hooks.on("updateActiveEffect", async (effect, options, id) => {
        console.log("hooks.js updateActiveEffect----------------------->", { effect, options, id });
        const auraFound = effect.changes.find(c => c.key.toLowerCase() === 'special.aura');
        if (auraFound) {
            if (game.user.isGM) {
                if (effect.parent && effect.parent.documentName === 'Actor') {
                    try {
                        await effect?.parent?.getToken()?.checkForAuras();
                    } catch (err) {
                        console.warn(`${err}`);
                    }
                } else if (effect.parent) {
                    if (effect.parent.documentName === 'Item' &&
                        effect?.parent?.parent?.documentName === 'Actor') {
                        // console.log(`${effect.name} changed when owned.`);
                        effect.parent.refreshEffects();
                    }
                }
            }
            // console.log("hooks.js updateActiveEffect", { auraFound });
            // canvas.tokens.placeables.forEach(t => {
            for (const t of canvas.tokens.placeables) {
                if (t.hasAura) {
                    t.updateAuras()
                }
            };
        }
        if (!game.user.isGM) return;
        console.log("hooks.js updateActiveEffect", { effect, options, id });
        if (['character', 'npc'].includes(effect.parent.type)) {
            // effect.parent.updateTokenLight();
            // effect.parent.updateTokenVision();
            if (effect?.parent?.documentName === 'Actor') {
                effect.parent.getToken()?.updateLight();
                effect.parent.getToken()?.updateSight();
            }
        }
    });

    Hooks.on("createActiveEffect", async (effect, options, id) => {
        if (!game.user.isGM) return;
        console.log("hooks.js createActiveEffect", { effect, options, id });
        if (['character', 'npc'].includes(effect?.parent?.type)) {
            effect.parent.getToken()?.updateLight();
            effect.parent.getToken()?.updateSight();
        }
        //if creating a hp.base effect
        if (effect.changes.find(change => change.key.toLowerCase() == 'system.attributes.hp.base')) {
            effect.parent.update(await effect.parent._getClassHPData());
        }
        if (game.user.isGM && effect.changes.find(change => change.key.toLowerCase() == 'special.aura')) {
            // console.log("hooks.js createActiveEffect special.aura=", { effect }, effect.changes.find(change => change.key.toLowerCase() == 'special.aura'));
            await effect.parent?.getToken()?.checkForAuras();
            for (const t of canvas.tokens.placeables) {
                if (t.hasAura) {
                    t.updateAuras()
                }
            };
        }
    });
    Hooks.on("deleteActiveEffect", async (effect, options, id) => {
        if (!game.user.isGM) return;
        console.log("hooks.js deleteActiveEffect", { effect, options, id });
        if (['character', 'npc'].includes(effect.parent.type)) {
            effect.parent.getToken()?.updateLight();
            effect.parent.getToken()?.updateSight();
        }
        // if deleting a hp.base effect
        if (effect.changes.find(change => change.key.toLowerCase() == 'system.attributes.hp.base')) {
            effect.parent.update(await effect.parent._getClassHPData());
        }
        // if deleting a aura effect
        if (game.user.isGM && effect.changes.find(change => change.key.toLowerCase() == 'special.aura')) {
            await effect.parent.getToken().checkForAuras();
            for (const t of canvas.tokens.placeables) {
                if (t.hasAura) {
                    t.updateAuras()
                }
            };
        }
    });
    Hooks.on("preCreateToken", async function (token, tokenData, options) {
        console.log("Hooks:preCreateToken", { token, tokenData, options });

        if (game.user.isGM && game.ars.config.settings.automateLighting) {
            // set initial light/sight settings checking effects also
            // we have to do this here on creation, otherwise 
            // updateSight()/updateLight() will cause errors.
            const light = token?.getLightSettings();
            const sight = token?.getSightSettings();
            token.updateSource({
                'sight': sight,
                'light': light
            });
        }

    });

    Hooks.on("deleteToken", async function (token, options, id) {
        console.log("Hooks:deleteToken", { token, options, id });
        if (!game.user.isGM) return;
        // check for effects attached to this token's auras
        // const _timeout2 = setTimeout(async () => {
        // for (const t of canvas.tokens?.placeables) {
        //     t.document.checkForDanglingAuraEffects();
        // }
        // }, 1500);
        token.checkForAuras();
    });
    /**
     * Hook to run when a token is created
     */
    Hooks.on("createToken", async function (token, options, id) {
        console.log("Hooks:createToken", { token, options, id });
        if (!game.user.isGM) return;

        if (token.actor.type === 'npc' && !token.actorLink) {
            utilitiesManager.postNPCTokenCreate(token);
        }
        await token.checkForAuras();
    });

    function playAudioDeath(rollMode = "publicroll") {
        const audioPlayTriggers = game.settings.get("ars", "audioPlayTriggers");
        const audioTriggersVolume = game.settings.get("ars", "audioTriggersVolume");
        console.log("hooks.js playAudioDeath", { rollMode, audioPlayTriggers, audioTriggersVolume })
        if (audioPlayTriggers) {
            const audioTriggerDeath = game.settings.get("ars", "audioTriggerDeath");
            AudioHelper.play(
                {
                    src: audioTriggerDeath, volume: audioTriggersVolume
                }, false);
        }
    }

    // Hooks.on("updateTokenDocument", async (token, hookData, options, tokenId) => {
    //     console.log("hooks.js updateTokenDocument----------------------->", { token, hookData, options, tokenId });
    //     if (hookData.hasOwnProperty('x') || hookData.hasOwnProperty('y') || hookData.hasOwnProperty('hidden')) {
    //         if (game.user.isGM) {
    //             await token.checkForAuras();
    //         }
    //     }
    // });

    Hooks.on("updateToken", async (token, hookData, options, tokenId) => {
        // console.log("hooks.js updateToken----------------------->", { token, hookData, options, tokenId });
        if (hookData.hasOwnProperty('x') || hookData.hasOwnProperty('y') || hookData.hasOwnProperty('hidden')) {
            if (!game.user.isGM) {
                // refresh ct for vision changes since x/y changed?
                // this is for when other tokens move
                // console.log("hooks.js updateToken data", { data });
                if (game.ars.config.settings.ctShowOnlyVisible) {
                    ui.combat.render();
                }
            }
            if (game.user.isGM) {
                // without the timer the token is mid-move sometimes and aura will just get reapplied
                // if they are stepping out of it. So we wait 1 second.
                const _timeout1 = setTimeout(async () => await token.checkForAuras(), 1000);
            }
        }
    });

    // /** refreshToken */
    // Hooks.on('refreshToken', (token, options) => {
    //     console.log("hooks.js refreshToken", { token, options });
    // });

    /** drawToken */
    // Hooks.on('drawToken', (token, options) => {
    //     console.log("hooks.js drawToken", { token, options });
    // });

    // /** target changed */
    // Hooks.on('targetToken', (user, targetToken, targeted) => {
    //     console.log("hooks.js targetToken", { user, targetToken, targeted });
    // });

    /**
     * hooks to add listeners for chat
     */
    Hooks.on("renderChatLog", (app, html, data) => {
        chatManager.chatListeners(html);
    });
    Hooks.on("renderChatPopout", (app, html, data) => {
        chatManager.chatListeners(html);
    });

    // intercept messages and show/hide buttons based on owner/isGM
    Hooks.on("renderChatMessage", (app, html, data) => {
        // console.log("hooks.js renderChatMessage", { app, html, data });
        chatManager.renderChatMessages(app, html, data);

    });

    Hooks.on("deleteActor", (actor, data, id) => {
        // console.log("hooks.js deleteActor", { actor, data, id });

        // this makes sure if a player actor is deleted and its in the party
        // that the display will update
        if (game.user.isGM) {
            if (game.party) {
                game.party.render();
            }
        }
    });

    Hooks.on("updateActor", async (actor, hookData, diff, id) => {
        console.log("hooks.js updateActor", { actor, hookData, diff, id });

        if (actor.type === 'npc' && hookData?.system?.attributes?.hasOwnProperty("identified")) {
            // refresh the combat-tracker with new display modes
            ui.combat.render();
            // flip through messages and update the relevant ones
            game.messages.forEach((msg) => {
                const tokenId = msg.speaker.token;
                if (actor.token?.id === tokenId) {
                    //triggers renderChatMessage which updates for display modes
                    ui.chat.updateMessage(msg);
                }
            });

            if (!game.user.isGM) {
                actor.token.object.draw();
            }
        }

        //hookData?.system?.attributes?.hp
        if (hookData?.system?.attributes?.hasOwnProperty("hp") &&
            actor.system.attributes.hp.max) {

            // const alreadyDown = actor.hasStatusEffect('dead');
            const defeated = (hookData.system.attributes.hp.value <= 0);
            if (!actor.hasStatusEffect('dead') && defeated) {
                playAudioDeath();
                if (game.party?.getMembers().length) {
                    game.party.addDefeatedAward(actor.getToken());
                }
            }
        }

        // GM manages the encumbrance statuses
        if (game.user.isGM && actor.type === 'character') {
            const token = actor.getToken();
            // deal with automated encumbrance status effects
            if (token)
                token.updateEncumbranceStatus();
        }
    });

    /**
     * Do anything after initialization but before "ready"
     */
    Hooks.once('setup', function () {
    });

    /**
     * 
     * Hook to capture socket requests to run action as GM
     * 
     */
    Hooks.on("ready", async () => {
        console.log("hooks.js Hook:ready!!!!!");
        await initLibrary.default();
        // pre-create the browser so it doesn't take long time to load
        // when they click it later.
        // if (!game.ars.ui?.itembrowser) {
        game.ars.ui = {
            itembrowser: new ARSItemBrowser()
        }
        // }

        game.socket.on('system.ars', async (context) => {
            console.log("hooks.js game.socket.on", { context });
            if (context.type === 'runAsGM') {
                if (game.user.isGM)
                    utilitiesManager.processGMCommand(context);
            } else {
                SocketManager.socketedCommunication(context);
            }
        });

        migrationChecks();

        // last thing we do is initiallize the party-tracker bits
        game.party.initializePartyTracker();

        changeLogChecks();
        // addTradeButton();


    });

    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => {
        // console.log("hooks.js hotbarDrop", { bar, data, slot });
        macrosManager.createARSMacro(data, slot);
        return false;
    });

    /**
      * 
      * A hook event that fires whenever the contents of a Compendium pack were modified.
      * This hook fires for all connected clients after the update has been processed.
      * 
      */
    Hooks.on("updateCompendium", (object, documents, options, userId) => {
        // console.log("hooks.js Hook:updateCompendium", { object, documents, options, userId });

        // we've disabled the compendium cache method
        // initLibrary.default();

        //
        // for (const actor of game.actors) {
        //     if (actor.hasSpellSlots && actor.sheet && actor.sheet.rendered) {
        //         actor.sheet.render(true); //refresh sheet since compendiums were updated and a spell might be gone/added
        //     }
        // }
    });

    /**
     *  Hover over token hook
     */
    // Hooks.on("hoverToken", async function(tokenData,onControl) {
    //   // console.log("Hooks:hoverToken",{tokenData, onControl});
    //   // token.actor.system.attributes.hp.value = 15;
    //   // token.actor.system.attributes.hp.max = 15;

    //   console.log("hoverToken:token",{tokenData});
    // })

    // /**
    //  * Hook for macros on items
    //  */
    // Hooks.once("ready", async function () {
    //   // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    //   Hooks.on("hotbarDrop", (bar, data, slot) => macrosManager.createARSMacro(data, slot));
    // });

    /**
     * Hook to manage start of new combat turn
     * 
     */
    Hooks.on("preUpdateCombat", (combat, updateData, options, userId) => {
        // console.log("hooks.js Hook: preUpdateCombat", { combat, updateData, options, userId });
        combatTracker._preUpdateCombat(combat, updateData, options, userId);
    });
    Hooks.on("createCombat", async (combat, updateData, options, userId) => {
        // console.log("hooks.js Hook: createCombat START ", { combat, updateData, options, userId });
    });
    Hooks.on("updateCombat", async (combat, updateData, options, userId) => {
        console.log("hooks.js Hook: updateCombat START ", { combat, updateData, options, userId });
        await combatTracker.combatTurn(combat, updateData);

        for (const actor of game.combat.combatants.map(co => co.actor)) {
            if (actor.isOwner && actor.sheet && actor.sheet.rendered) {
                actor.sheet.render();
            }
        }// end for
    });

    Hooks.on("combatTurn", async (combat, updateData, options, userId) => {
        console.log("hooks.js Hook: combatTurn START ", { combat, updateData, options, userId });
    });

    Hooks.on("preDeleteCombat", async (combat, updateData, options, userId) => {
        // console.log("hooks.js Hook: preDeleteCombat START ", { combat, updateData, options, userId });
    });
    Hooks.on("deleteCombat", async (combat, updateData, options, userId) => {
        // console.log("hooks.js Hook: deleteCombat START ", { combat, updateData, options, userId });
    });

    //triggers when adding combatant to combat tracker. also preCreateCombatant 
    Hooks.on("createCombatant", async (combat, options, id) => {
        // console.log("hooks.js Hook: createCombatant", { combat, options, id });
    });
    Hooks.on("updateCombatant", async (combat, options, id) => {
        // console.log("hooks.js Hook: updateCombatant", { combat, options, id });
    });
    Hooks.on("deleteCombatant", async (combat, options, id) => {
        // console.log("hooks.js Hook: deleteCombatant", { combat, options, id });
    });

    Hooks.on("updateWorldTime", async (worldTime, advanceTime) => {
        console.log("hooks.js Hook: updateWorldTime", { worldTime, advanceTime });
        if (game.user.isGM) {
            await effectManager.manageEffectExpirations(worldTime);
        }
    });

    /**
     * arsUpdateToken hook from actor.js
     */
    Hooks.on("arsUpdateToken", (actor, token, data, delay = 300) => {
        console.log("hooks.js Hook: arsUpdateToken", { actor, token, data });
        const _timeout1 = setTimeout(async () => await token.update(data), delay);
    });
    /**
     * hook to apply actor updates via hook
     */
    Hooks.on("arsUpdateActor", (actor, data) => {
        console.log("hooks.js Hook: arsUpdateActor", { actor, data });
        const _timeout1 = setTimeout(async () => await actor.update(data), 300);
    });
    /**
     * 
     * If needed you can manipulate data in updatedData before it's
     * sent to .update() and not trigger an additional derivedData() event
     * 
     */
    // Hooks.on("preUpdateActor", (actor, data, options, userId) => {
    // console.log("hooks.js Hook: preUpdateActor", { actor, data, options, userId });

    // if (updatedData.data.spellInfo) {
    //   console.log("hooks.js", "Hook: preUpdateActor spellInfo", updatedData.data.spellInfo);
    //   const slotBundle = actor.buildSpellInfoBundle(updatedData);
    //   updatedData.data.spellInfo = slotBundle;
    // }

    // console.log("hooks.js", "Hook: preUpdateActor __END");
    // });

    /**
     * Hook to capture the drop item on actor sheet
     * 
     
     */
    // Hooks.on("dropActorSheetData", async function (targetActor, targetSheet, itemData) {
    // console.log("Hooks:dropActorSheetData", { targetActor, targetSheet, itemData });
    // return true; // let super continue
    // });

    /**
     * When something dropped on canvas
     */
    Hooks.on("dropCanvasData", async function (canvas, object) {
        console.log("Hooks:dropCanvasData", { canvas, object });

        /**
         * 
         * Handle item/coin drag/drops on tokens
         * Handle encounter drops on map
         * 
         */

        function _processActorDrop(obj) {
            const dropTarget = canvas.tokens.placeables.find((token) => {
                const maximumX = token.x + (token.hitArea?.right ?? 0);
                const maximumY = token.y + (token.hitArea?.bottom ?? 0);
                return obj.x >= token.x && obj.y >= token.y && obj.x <= maximumX && obj.y <= maximumY;
            });

            const actor = dropTarget?.actor;
            if (actor && actor.isOwner) {
                if (["character", "npc", "lootable"].includes(actor.type) && actor.sheet) {
                    actor.sheet._handleOnDrop({}, obj);
                }
            }
        }

        switch (object.type) {
            case 'Item':
                // items from lootables have data
                if (object.hasOwnProperty('data')) {
                    _processActorDrop(object);
                    return false;
                } else {
                    // items from the world/compendium do not have .data, just itemid
                    // const item = await utilitiesManager.getItem(object.id);
                    const item = await fromUuid(object.uuid);
                    if ((item?.type === 'encounter')) {
                        encounterManager.encounterDrop(item, object);
                        return false;
                    } else {
                        // no a encounter item, we allow rest to fall through as normal drops to actor sheet
                        _processActorDrop(object);
                        return false;
                    }
                }
                break;

            case 'Coin':
                _processActorDrop(object);
                return false;
                break;
        }

        return true;
    });

    // dont use this but I tested it out.
    // Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);

    /**
     * Hook for when a token hud is rendered
     */
    // Hooks.on('renderTokenHUD', async (hud, html, token) => {
    // });


    /** hook triggers when user clicks on token. */
    Hooks.on('controlToken', async (token, selected) => {
        // console.log("hooks.js controlToken", { token, selected })

        // only GM can see the quick buttons
        if (game.user.isGM) {
            if (token?.actor?.type !== "lootable")
                actionsHUD(token, selected);
        }

    });

    Hooks.on("renderSidebar", async (app, html) => {
        // console.log("hooks.js renderSidebar", { app, html })
        // add the partyTab
        addPartyTab(app, html);
    });

    Hooks.on("renderSidebarTab", async (app, html) => {
        // console.log("hooks.js renderSidebarTab", { app, html })
        addBrowserButton(app, html);
        ImportManager.addImportActorButton(app, html);
    });

    Hooks.on("renderPlayerList", async (app, html) => {
        // console.log("hooks.js renderPlayerList", { app, html })
        if (!document.getElementById('trade-request-button'))
            addTradeButton();
    });


    //TODO add custom command lines
    // Hooks.on('chatMessage', async (log, data, chatData) => {
    //     if (data[0] !== '/') return;

    //     // check for valid command line
    //     // if (!cfn) return;

    //     // try {
    //     //     //run valid command like
    //     //     cfn(args, chatData);
    //     //     return false;
    //     // }
    //     // catch (error) {
    //     //     console.error({ command, args }, error);
    //     // }

    // });

    // hook tags for token vision updates to use for updating CT views.
    // lightingRefreshm, sightRefresh 
    Hooks.on('sightRefresh', async (sightLayer) => {
        // console.log("hooks.js sightRefresh", { sightLayer })

        // dont need this, siteRefresh only triggers for the user, not everyone
        // sightLayer.sources.forEach((tokenObject) => {
        //     console.log("hooks.js sightRefresh", { tokenObject }, tokenObject.object.actor.id, game.user.data.character)
        //     if (game.user.data.character === tokenObject.object.actor.id) {
        //         ui.combat.render();
        //     }
        // });
        if (!game.user.isGM) {
            if (game.ars.config.settings.ctShowOnlyVisible) {
                ui.combat.render();
            }
        }
    });

    // updateSetting compendium setting
    Hooks.on('updateSetting', async (setting, value, diff, id) => {
        // console.log("hooks.js updateSetting", { setting, value, diff, id })
        // initLibrary.buildPackItemList();
    });

    // Hooks.on('renderARSLootableSheet ', async (lootable, html, data) => {
    //     console.log("hooks.js openARSLootableSheet", { lootable, html })
    // });


    //hooks for when lootable sheets close for lock flags
    Hooks.on('closeARSLootableSheet', async (lootable, html) => {
        // console.log("hooks.js closeARSLootableSheet", { lootable, html }, lootable.alreadyBeeingLooted)
        // when pc closes the loot window, remove opened flag
        if (!game.user.isGM) {
            _unlockSheet(lootable);
        }
    });
    Hooks.on('closeARSNPCSheet', async (lootable, html) => {
        // console.log("hooks.js closeARSNPCSheet", { lootable, html }, lootable.alreadyBeeingLooted)
        // when pc closes the loot window, remove opened flag
        if (!game.user.isGM) {
            _unlockSheet(lootable);
        }
    });
    // toggle the lock flag on a lootable npc
    function _unlockSheet(sheet) {
        if (!game.user.isGM) {
            utilitiesManager.runAsGM({
                sourceFunction: 'hooks.js: _unlockSheet',
                operation: 'actorUpdate',
                user: game.user.id,
                targetTokenId: sheet.object.token.id,
                update: { 'system.opened': null },
            });
        }
    }

    //TODO add sounds for each of these
    Hooks.on("postRollAbility", (target, success, type, sourceActor) => {
        // console.log("hooks.js postAbilityRoll", { target, success, type, sourceActor });
    });

    Hooks.on("postRollSave", (target, success, type, sourceActor) => {
        // console.log("hooks.js postSaveRoll", { target, success, type, sourceActor });
    });

    Hooks.on("postRollAttack", (target, success, sourceActor, sourceItem, sourceAction) => {
        // console.log("hooks.js postAttackRoll", { target, success, sourceActor, sourceItem, sourceAction });
    });

    Hooks.on("postRollSkill", (target, success, type) => {
        // console.log("hooks.js postSkillRoll", { target, success, type });
    });
} // end hooks initializations

