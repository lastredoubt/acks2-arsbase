import * as debug from "./debug.js"
import * as actionManager from "./apps/action.js";
import { DiceManager } from "./dice/dice.js";
import { PlaceCastShape } from "./castshape/castshape.js";
import * as effectManager from "./effect/effects.js";
import * as utilitiesManager from "./utilities.js";
import { ARSDicer } from "./dice/dicer.js";

/**
 * 
 * Hide/show buttons based on user type (isGM/etc)
 * 
 * @param {*} message 
 * @param {*} html 
 * @param {*} data 
 */
export function renderChatMessages(message, html, data) {
    // console.log("chat.js", "-------------------renderChatMessages-----------------------", { message, html, data });

    // hide buttons for non-owners of the chatCard
    updateForOwnerButtons(message, html);

    // console.log("", { message }, message.isContentVisible, message.isAuthor, game.user.isGM)
    // check for identified npcs and hide/show names for such
    updateForNPCIdentification(message, html);

    updateForItemIdentification(message, html);

    // hide gm-view-only class chat fields from non-gm
    updateForGMOnlyViews(message, html);

    // hide owner-view-only class from non-owners
    updateForOwnerOnlyViews(message, html)

    // hide blind rolls from chat if not owner or GM
    updateForBlindRolls(message, html);

    // hide secure values
    updateForSecureValues(message, html);

    //TODO add data.sound to specials for this to trigger
    // if (message.data.sound)
    //     AudioHelper.play({ src: message.data.sound });
}

/**
 * 
 * Hide buttons on cards for non-owners
 * 
 * @param {*} message 
 * @param {*} html 
 */
function updateForOwnerButtons(message, html) {
    const chatCard = html.find(".card-buttons");

    // const chatMsgId = event.target.closest("[data-message-id]")?.dataset.messageId;

    // if (chatCard.length > 0) {
    // console.log("chat.js", "renderChatMessages", "data.message.speaker.actor", data.message.speaker.actor);
    let actor = game.actors.get(message.speaker.actor);

    const isOwner = (actor && actor.isOwner);
    // const isAuthor = (actor && (actor.id == data.author.id));
    const isGM = (game.user.isGM);// || (data.author.id === game.user.id));

    // Otherwise conceal action buttons except for saving throw
    const buttons = chatCard.find("button[data-action]");
    buttons.each((i, btn) => {
        const buttonAction = btn.dataset.action || "";
        switch (buttonAction) {
            case "undo-action-effect":
            case "undo-healthadjust":
                if (!isGM) btn.style.display = "none";
                break;

            default:
                if (!isGM && !isOwner) {
                    btn.style.display = "none";
                }
                // console.log("chat.js renderChatMessages", { isGM, isOwner })
                break;
        }
    });

    const divs = chatCard.find("div.card-buttons");

    divs.each((i, dv) => {
        if (!isGM && !isOwner) {
            dv.style.display = "none";
        }
    });

}


/**
 * Hides class "owner-only-view" from non-owners
 * Shows class "non-owner-only-view" to non-owners
 * 
 * @param {*} message 
 * @param {*} html 
 */
function updateForOwnerOnlyViews(message, html) {
    const actor = game.actors.get(message.speaker.actor);
    const isOwner = (actor && actor.isOwner);

    // console.log("chat.js updateForOwnerOnlyViews", { message, actor, isOwner })

    // owner-only-view
    html.find('.owner-only-view').each((i, onlyOwner) => {
        if (!game.user.isGM && !isOwner)
            onlyOwner.setAttribute("style", "display:none;");
    });
    // alternatively if non-owner-only-view and owner, hide that and let non-owners see it
    html.find('.non-owner-only-view').each((i, onlyOwner) => {
        if (game.user.isGM || isOwner)
            onlyOwner.setAttribute("style", "display:none;");
    });
}

/**
 * 
 * Only show secure values to GM
 * 
 * @param {*} message 
 * @param {*} html 
 */
function updateForSecureValues(message, html) {
    const secureValues = html.find(".secure-value");
    // console.log("updateForSecureValues", { secureValues })
    if (secureValues) {
        secureValues.each(async (i, secureValue) => {
            // console.log("updateForSecureValues", { secureValue }, secureValue.dataset);
            const value = secureValue.dataset?.value;
            // console.log("updateForSecureValues", secureValue.innerHTML);
            if (!game.user.isGM && value) {
                // if not GM we show the value in data-value=''
                secureValue.innerHTML = `${value}`;
            }
        });
    }
}

/**
 * 
 * Replace secure-name class items with proper name if not identified
 * 
 * @param {*} message 
 * @param {*} html 
 */
function updateForItemIdentification(message, html) {
    const useItemIdentification = game.ars.config.settings.identificationItem;
    const secureNames = html.find(".secure-name");
    // console.log("updateForItemIdentification", { secureNames })
    if (secureNames) {
        secureNames.each(async (i, secureName) => {
            // console.log("updateForItemIdentification", { secureName }, secureName.parentNode.dataset);
            const itemId = secureName.parentNode.dataset?.id;
            const itemType = secureName.parentNode.dataset?.type;
            // console.log("updateForItemIdentification", secureName.innerHTML);
            if (useItemIdentification && itemType === 'item' && itemId) {
                const sceneId = message.speaker.scene;
                const tokenId = message.speaker.token;
                const scene = sceneId ? game.scenes.get(sceneId) : null;
                const token = scene ? scene.tokens.find((tk) => tk.id === tokenId) : null;
                const item = await token?.actor.getEmbeddedDocument("Item", itemId);
                // console.log("updateForItemIdentification", { sceneId, tokenId, scene, token, item }, secureName.innerHTML);
                // we do all this to ensure that we show the item name instead if the item is not identified.
                // otherwise we leave it as is (probably actionGroup)
                if (item) {
                    if (item.isIdentified) {
                        // leave it alone
                    } else {
                        secureName.innerHTML = `${item.name}`;
                    }
                }
            }
        });
    }
}

/**
 * 
 * Hide any chat entries block entries that are marked gm-only-view if not GM
 * 
 * @param {*} message 
 * @param {*} html 
 */
function updateForGMOnlyViews(message, html) {
    // gm-only-view
    html.find('.gm-only-view').each((i, onlyGM) => {
        if (!game.user.isGM)
            onlyGM.setAttribute("style", "display:none;");
    });
}
// hide blind roll chat (even tho they can't see the roll) from players to remove
// the ability to see that a npc rolled initiative
function updateForBlindRolls(message, html) {
    // console.log("chat.js updateForBlindRolls", { message, html })
    // if blind roll and not GM then hide the message
    if (!message.isContentVisible && !message.isAuthor && !game.user.isGM) {
        //chat-message message flexcol whisper blind
        html.css("display", "none");
    }
}
/**
 * 
 * show safe names to pcs or real names if identified
 * 
 * show real names to DMs
 * 
 * @param {*} message 
 * @param {*} html 
 */
export function updateForNPCIdentification(message, html) {
    const useActorIdentification = game.ars.config.settings.identificationActor;
    const sceneId = message.speaker.scene;
    const tokenId = message.speaker.token;
    const scene = sceneId ? game.scenes.get(sceneId) : null;
    const msgSourceToken = scene ? scene.tokens.find((tk) => tk.id === tokenId) : null;

    const secureNames = html.find(".secure-name");
    // console.log("chat.js _showSecureName", { secureNames })
    if (secureNames)
        secureNames.each((i, secureName) => {
            const msgTokenId = secureName.dataset.id;
            // itemType only exists for items, so if there is entry skip this one
            const itemType = secureName.parentNode.dataset?.type;
            if (itemType !== 'item') {
                // console.log("chat.js _showSecureName", { msgTokenId })
                if (useActorIdentification && !msgTokenId && !game.user.isGM && !msgSourceToken?.actor.isIdentified && msgSourceToken?.disposition !== 1) {
                    // console.log("chat.js _showSecureName 1", { secureName })
                    // secureName.innerHTML = msgSourceToken.actor.alias ? msgSourceToken.actor.alias : `${game.i18n.localize("ARS.unknownActor")}`;
                    secureName.innerHTML = msgSourceToken?.actor?.alias ? msgSourceToken.actor.alias : `${game.i18n.localize("ARS.unknownActor")}`;
                } else if (useActorIdentification && msgTokenId) {
                    const token = scene ? scene.tokens.find((tk) => tk.id === msgTokenId) : null;
                    if (token) {
                        secureName.innerHTML = `${token.name}`; // we do this here so the name is based on this game.user 
                    } else if (!game.user.isGM && !msgSourceToken?.actor.isIdentified && msgSourceToken?.disposition !== 1) {
                        secureName.innerHTML = `${game.i18n.localize("ARS.unknownActor")}`;
                    }

                } else {
                    // do nothing, leave it as whatever had been set
                }
            }
        });
}


// we dont use this but I was testing it out to see how it worked out
//
// /**
//  * This function is used to hook into the Chat Log context menu to add additional options to each message
//  * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
//  *
//  * @param {HTMLElement} html    The Chat Message being rendered
//  * @param {object[]} options    The Array of Context Menu options
//  *
//  * @returns {object[]}          The extended options Array including new context choices
//  */
// export const addChatMessageContextOptions = function (html, options) {
//     let canApply = li => {
//         const message = game.messages.get(li.data("messageId"));
//         // console.log("chat.js addChatMessageContextOptions", { message })
//         return message?.isRoll && message?.isContentVisible && game.user.targets.size;
//     };
//     options.push(
//         {
//             name: game.i18n.localize("ARS.chatCard.ChatContextDamage"),
//             icon: '<i class="fas fa-user-minus"></i>',
//             condition: canApply,
//             callback: li => applyChatCardDamage(li, 1)
//         },
//         {
//             name: game.i18n.localize("ARS.chatCard.ChatContextHealing"),
//             icon: '<i class="fas fa-user-plus"></i>',
//             condition: canApply,
//             callback: li => applyChatCardDamage(li, -1)
//         },
//         {
//             name: game.i18n.localize("ARS.chatCard.ChatContextDoubleDamage"),
//             icon: '<i class="fas fa-user-injured"></i>',
//             condition: canApply,
//             callback: li => applyChatCardDamage(li, 2)
//         },
//         {
//             name: game.i18n.localize("ARS.chatCard.ChatContextHalfDamage"),
//             icon: '<i class="fas fa-user-shield"></i>',
//             condition: canApply,
//             callback: li => applyChatCardDamage(li, 0.5)
//         }
//     );
//     return options;
// };

// function applyChatCardDamage(li, multiplier) {
//     const message = game.messages.get(li.data("messageId"));
//     const roll = message.roll;
//     return Promise.all(canvas.tokens.controlled.map(t => {
//         const a = t.actor;

//         const rdmg = await combatManager.applyDamageAdjustments(sourceActor, targetToken, sourceItem, sourceAction, bDamage, dmgDone);
//         await combatManager.sendHealthAdjustChatCard(sourceActor, targetToken, bDamage, rolled, rdmg.total, rdmg.types, damageFlavor, sourceName);

//         return a.applyDamage(roll.total, multiplier);
//     }));
// }


export function chatListeners(html) {
    // html.on('click', '.card-buttons button', this.chatAction.bind(this));
    html.on('click', ".chatCard-expand-view", _onToggleCardDescription);
    // html.find('.spellCard-description').click(event => _onToggleSpellDescription(event, html));
    html.on('click', '.card-buttons button', chatAction);
}


// toggle between long/short spell description
function _onToggleCardDescription(event) {
    const element = event.currentTarget;
    // toggle FA icon
    $(element).find(".fas").toggleClass("fa-compress-alt fa-expand-alt");

    const desc = $(element).parents(".chatCard-description");
    // desc.find(".chatCard-expand-view").toggleClass('fa-compress-alt fa-expand-alt');
    const shortDesc = desc.find(".chatCard-description-short");
    const fullDesc = desc.find(".chatCard-description-full");
    shortDesc.toggle();
    fullDesc.toggle();

}


/**
  * 
  * This is the general function used when buttons are clicked in chat. Lots of various
  * options have to be accounted for.
  * 
  * @param {*} event 
  */
async function chatAction(event) {
    // console.log("chat.js chatAction - START", { event }, this);
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    // console.log("chat.js chatAction", { element, dataset });
    // const acLocation = element.closest('.card-buttons').querySelector('select[name="ac-location"]')?.value;
    const dmgAdjustment = element.closest('.card-buttons').querySelector('select[name="damage-adjustment"]')?.value;

    // get this chatCard ID incase we want to delete (used for undo buttons)
    const cmId = event.target.closest("[data-message-id]")?.dataset.messageId;
    const message = game.messages.get(cmId);

    // what command are we doing?
    const performAction = dataset.action;
    const parentDataset = element.parentNode.dataset;

    // console.log("chat.js chatAction", { parentDataset });

    // options specific to buttons
    const closest = event.currentTarget.closest(".card-buttons");
    const bCastSpell = !closest.classList.contains("chatCard-action");

    // console.log("item.js chatAction bCast", { event, element, dataset, performAction, parentDataset, bCastSpell });
    // an "action" record
    const actionId = parentDataset.actionId;
    // source Actor and Token Id if avaliable
    const sourceActorId = parentDataset.sourceActorId;
    const sourceTokenId = parentDataset.sourceTokenId;
    // Target token id if avaliable
    const targetTokenId = parentDataset.targetTokenId;
    // effect id (used to find and undo an effect application)
    const effectId = parentDataset.effectId;
    // item (weapon or spell) record id
    const itemId = parentDataset.itemId;
    // this is for modders that want to force large damage roll
    const forceLarge = dataset.forcelarge === 'true';

    let sourceActor, sourceToken, targetToken, targetActor;

    if (sourceTokenId) {
        sourceToken = canvas.tokens.get(sourceTokenId) || null;
        if (sourceToken) {
            sourceActor = sourceToken.actor;
        }
    }
    if (!sourceActor && sourceActorId) {
        sourceActor = game.actors.get(sourceActorId) || null;
    }
    if (!sourceToken)
        sourceToken = canvas.tokens.get(message?.speaker?.token);
    if (!sourceActor)
        sourceActor = game.actors.get(message?.speaker?.actor) || null;
    // console.log("item.js chatAction actors", { sourceActor, sourceToken });

    if (targetTokenId) {
        targetToken = canvas.tokens.get(targetTokenId) || null;
        targetActor = targetToken.actor;
    }

    // console.log("item.js chatAction datas", { sourceActor, sourceToken, targetToken, targetActor });


    if (!sourceActor) {
        // author had some issues with this with his module.
        if (!game.modules.get("roll-new-character-stats")?.active)
            ui.notifications.error(`Unable to find originating chat cards token/actor. [${sourceTokenId}/${sourceActorId}]`)
        return;
    }

    // these are values used for spells that are memorized
    const slotIndex = bCastSpell ? closest.dataset.index : undefined;
    const slotType = bCastSpell ? closest.dataset.type : undefined;
    const slotLevel = bCastSpell ? closest.dataset.level : undefined;

    let item = itemId ? sourceActor.items.get(itemId) : undefined;
    if (bCastSpell) {
        // if spell not in inventory check global list
        if (!item && slotType) {
            // item = await sourceActor._getSpellById(game.ars.library.spells[slotType].all, itemId);
            item = await utilitiesManager.getItem(itemId);
        }
    }

    // action item or from actor
    const sourceAction = (item ? actionManager.getAction(item, actionId) : actionManager.getAction(sourceActor, actionId));

    const dd = ARSDicer.create(
        {
            event: event,
            sourceActor: sourceActor,
            sourceToken: sourceToken,
            targetToken: targetToken,
            sourceItem: item,
            sourceAction: sourceAction,
        },
        {
            isCastSpell: bCastSpell,
            dmgAdjustment: dmgAdjustment,
            forceLarge: forceLarge,

            slotIndex: slotIndex,
            slotType: slotType,
            slotLevel: slotLevel
        });

    console.log("item.js ARSDicer", { dd, performAction })
    switch (performAction) {

        case "action-attack-roll":
            dd.options.isWeapon = false;
            dd.options.isAction = true;
            DiceManager.rollAttack(dd);
            break;

        case "action-damage-roll":
            dd.options.isWeapon = false;
            dd.options.isAction = true;
            DiceManager.rollDamage(dd);
            break;

        case "action-heal-roll":
            dd.options.isDamage = false;
            dd.options.isWeapon = false;
            dd.options.isAction = true;
            DiceManager.rollDamage(dd);
            break;

        case "action-effect-roll":
            dd.options.isWeapon = false;
            dd.options.isAction = true;
            if (sourceActor) {
                effectManager.applyEffect(sourceToken ? sourceToken.actor : sourceActor, sourceAction);
            } else {
                ui.notifications.error(`Action effects require sourceActor.`);
            }
            break;

        case "undo-action-effect":
            dd.options.isWeapon = false;
            dd.options.isAction = true;
            if (targetActor) {
                effectManager.undoEffect(targetActor, effectId);
                game.messages.get(cmId).delete();
            } else {
                ui.notifications.error(`Action requires a target.`);
            }
            break;

        case "undo-healthadjust":
            if (game.user.isGM) {
                const bDamage = (parentDataset.isDamage === 'true');
                const adjustment = parseInt(parentDataset.hpAdjustment);
                let hpPath = targetActor.system.attributes.hp;

                console.log("item.js undo-healthadjust", { targetActor, bDamage, adjustment, hpPath });

                // if it was damage, then we heal, if it was heal, we damage
                const newValue = bDamage ? hpPath.value + adjustment : hpPath.value - adjustment;
                const nTargetHPResult = Math.clamped(newValue, hpPath.min, hpPath.max);

                console.log("item.js undo-healthadjust", { newValue, nTargetHPResult });

                await utilitiesManager.setActorHealth(targetActor, nTargetHPResult);
                if (targetToken.hasActiveHUD) canvas.tokens.hud.render();
                ui.notifications.notify((bDamage ? "Restored" : "Removed") + ` ${adjustment} health on ${targetActor.name}.`, 'info');
                // delete the chatCard since we used undo button
                game.messages.get(cmId).delete();
            }
            break;

        case "attack-roll":
            dd.options.isWeapon = true;
            dd.options.isAction = false;
            DiceManager.rollAttack(dd);
            break;

        case "healthchange-roll":
            dd.options.isWeapon = true;
            dd.options.isAction = false;
            DiceManager.rollDamage(dd);
            break;

        case "cast-roll":
            DiceManager.rollCast(dd);
            break;
			
		case "cast-shape-template":
            PlaceCastShape.placeCastShape(dd);
            break;

        case "save-roll":
            DiceManager.rollCastSave(dd);
            break;

        case "ability-roll":
            DiceManager.rollCastAbility(dd);
            break;

        case "skill-roll":
            DiceManager.rollSkillCheck(dd);
            break;

        case "use-roll":
            const itemUsed = await utilitiesManager.useActionCharge(dd.source, dd.item, dd.action);
            if (itemUsed) {
                utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: dd.source }), `${dd.item.name}`, `${dd.source.name} used ${dd.item.name}`, dd.item.img)
            } else {
                utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: dd.source }), `${dd.item.name}`, `${dd.source.name} tried to use <b>${dd.item.name}</b> but no more uses remain.`, dd.item.img)
            }
            break;

        default:
            console.log("item.js chatAction unknown performAction", { performAction })
            break;
    }
}