import { ARS } from '../config.js';
import { DiceManager } from "../dice/dice.js";
import * as debug from "../debug.js"

/**
 * 
 * Action Management
 * 
 * Actions are objects on Item or Actors that are a
 * flexible system used to cast/melee/range/damage/heal/effects
 * 
 * 
 */
import { ActionSheet } from "../apps/action-sheet.js";

/**
 * 
 * This really isnt a prepareDerivedData but the idea works
 * 
 * @param {*} object 
 */
export function prepareDerivedData(object) {
    //TODO messing about with mapping objects
    // if (object.system?.actions) {
    //     object.system.actionMap = object.system.actionMap ? object.system.actionMap : new Map();
    //     object.system?.actions.forEach((action) => {
    //         object.system.actionMap.set(action.id, action);
    //     });
    // }
    //--end
    new Promise((resolve, reject) => {
        buildActionGroups(object, object.system.actionList = {})
        resolve()
    }).then(() => {
        // this counts how many inventory actions we have across all items for
        // the token-hud layout
        if (['character', 'npc'].includes(object.type)) {
            const inventoryActions = (items) => {
                let itemCount = 0;
                items.forEach((item) => {
                    // if (item.system.actionCount) {
                    //     console.log(`action.js prepareDerivedData ${object.name}: item ${item.name} has ${item.system.actionCount}`)
                    // }
                    itemCount += item.system.actionCount;
                });
                return (itemCount);
            };
            // object.system.itemActionCount = inventoryActions(object.items.filter(function (item) {
            //     return item.system?.location?.state === 'equipped' || item.system?.location?.state === 'carried'
            // }));
            // object.system.itemActionCount = inventoryActions(object.items);
            object.system.itemActionCount = inventoryActions(object.actionInventory);
        }

        object.system?.actions?.forEach((action) => {
            action.parentuuid = object.uuid;
            // add in a escaped tooltip to display
            if (action?.effect?.changes) {
                // action.effect.toolTip = encodeURIComponent(action.effect.changes.map(change => `[${change.key}/${change.value}]`).join(', '));
                let tooltip = action.effect.changes.map(change => `(${change.key}/${change.value})`).join(', ');
                if (tooltip) {
                    // these because foundry tries to parse our a dice roll so we stop it in tooltip
                    // tooltip = tooltip.replace(/(\[\[)/, '[');
                    // tooltip = tooltip.replace(/(\]\])/, ']');
                    tooltip = tooltip.replace(/[\[\[\]\]]/g, '');
                }
                action.effect.toolTip = tooltip;
            }
        });
    }
    )

    // console.log("action.js prepareDerivedData", { object })
    // console.log("action.js prepareDerivedData", object.system.actionList)
}

/**
 * 
 * 
 * This allows us to have have the actions in groups that are by name. 
 * So I can then reference them by the group when pulling them into dice/chatCards.
 * 
 * Right now this requires a lot of "index" reorganizing. test out using object/key instead at somepoint?
 * 
 * @param {*} object 
 * @param {*} data 
 */
export function buildActionGroups(object, data) {
    // console.log("action.js buildActionGroups", { object, game });
    if (!game.user.isGM && object.documentName === 'Item' && !object.isIdentified) {
        object.system.actionCount = 0;
        return data;
    }

    const groupList = new Array();
    if (object.system.actions?.length) {
        object.system.actions.forEach((action) => {
            if (!groupList[action.name]) {
                groupList[action.name] = {
                    name: action.name,
                    hasMelee: false,
                    hasCast: false,
                    hasDamage: false,
                }
            }

            if (groupList[action.name]) {
                if (action.type === 'cast' && !groupList[action.name].hasCast) groupList[action.name].hasCast = true;
                if (action.type === 'melee' && !groupList[action.name].hasMelee) groupList[action.name].hasMelee = true;
                if (['damage', 'heal'].includes(action.type) && !groupList[action.name].hasDamage) groupList[action.name].hasDamage = true;
            }
        });


        Object.values(groupList).forEach((entry) => {

            const actionList = object.system.actions.filter((action) => { return action.name === entry.name });
            const collapsedState = object.getFlag("ars", `actions.${entry.name}.display.collapsedState`) || 'none';
            data[entry.name] = {
                // id: randomID(16),
                // tag: entry.name.slugify({ strict: true }),
                img: actionList[0]?.img ?? 'icons/svg/d20-grey.svg',
                source: object,
                collapsedState: collapsedState ? collapsedState : 'none',
                actions: actionList,
                description: actionList.filter((action) => { return action.description ? action.description : false }).map(c => c.description).join("<p/>"),
                data: entry,
            }
        });
    }

    // console.log("action.js buildActionGroups", { object, groupList }, object?.name, Object.values(groupList).length)
    object.system.actionCount = Object.values(groupList).length;
    return data;
}


/**
 * Get the .actions objects on this object and return them
 * 
 * @param {Object} object 
 */
export function getActions(object) {
    // console.log("action.js getActions", { object });
    let actionBundle = foundry.utils.deepClone(getProperty(object, "system.actions") || []);
    return Object.values(actionBundle);
}

/**
 * 
 * Get a single action in object at index actionId
 * 
 * @param {Object} object  Actor/Item 
 * @param {Number} actionId Index of action to retreive 
 */
export function getAction(object, actionId) {
    // console.log("action.js getAction", { object, actionId });
    return (getActions(object)[actionId]);
}
/**
 * 
 * Set the .actions objects to new value using actionBundle as source on object
 * 
 * @param {Object} object 
 * @param {Object} actionBundle 
 */
export async function setActions(object, actionBundle) {
    // console.log("action.js setActions", { object, actionBundle });
    return await object.update({ "system.actions": actionBundle });
}

/**
 * 
 * This reindexes the actionBundle to take into account moves/removals/etc to maintain ordering
 * 
 * @param {*} actionBundle 
 */
export function reIndexActions(actionBundle) {
    let index = 0;
    actionBundle.forEach((action) => {
        action.index = index;
        index++;
    });
}
/**
 * 
 * Manage action entries for Item or Actor 
 * 
 * @param {Object} object Item or Actor
 * @param {Number} index  The index number of the action to manipulate 
 * @param {String} actionToPerform The action to be performed, create, moveup (action order), movedown, edit or delete.
 */
export async function onManage_action(object, actionToPerform = 'create', { index, actionId = '', actionGroup = "" }) {
    console.log("action.js onManage_action", { object, index, actionToPerform, actionId, actionGroup });

    let updatedActions = false;
    if (actionToPerform === 'edit') {
        new ActionSheet(object, { actionId: index }).render(true);
    } else {
        let actionBundle = getActions(object);
		   switch (actionToPerform) {
            case "view-source":
                if (object.sheet) object.sheet.render(true);
                break;

            case "create":
		        let action = createActionEntry(object, actionBundle.length, actionGroup);
		        actionBundle.push(action);
		        updatedActions = true;
		        break;

            case "moveup":
                if (index > 0) {
                    const sourceAction = actionBundle.find(action => action.id === actionId);
                    for (let i = index - 1; i >= 0; i--) {
                        if (actionBundle[i].name === sourceAction.name &&
                            actionBundle[i].id !== sourceAction.id) {
                            const moveThis = actionBundle[i];
                            actionBundle[i] = sourceAction;
                            actionBundle[index] = moveThis;
                            reIndexActions(actionBundle);
                            updatedActions = true;
                            break;
                        }
                    }
                }
                break;

            case "movedown":
                if (index < actionBundle.length - 1) {
                    //
                    const sourceAction = actionBundle.find(action => action.id === actionId);
                    for (let i = parseInt(index) + 1; i < actionBundle.length; i++) {
                        if (actionBundle[i].name === sourceAction.name &&
                            actionBundle[i].id !== sourceAction.id) {
                            const moveThis = actionBundle[i];
                            actionBundle[i] = sourceAction;
                            actionBundle[index] = moveThis;
                            reIndexActions(actionBundle);
                            updatedActions = true;
                            break;
                        }
                    }
                }
                break;

            case "edit":
                // should never get here.
                break;

            case "delete":
                actionBundle.splice(index, 1);
                reIndexActions(actionBundle);
                updatedActions = true;
                break;
        }
        if (updatedActions) {
            return await setActions(object, actionBundle);
        }
        return null;
    }
}

/**
 * 
 * Create action at index
 * 
 * @param {Object} object Actor/Token
 * @param {Number} index  Max size of the current actionBundle array for indexing
 * @param {String} actionGroup ActionGroup name for display grouping
 * @returns 
 */
export function createActionEntry(object, index, actionGroup = "") {
    let action = duplicate(game.system.template.Item['action']);
    if (action.templates instanceof Array) {
        action.templates.forEach((t) => {
            action = mergeObject(action, game.system.template.Item.templates[t]);
        });
    }

    // add save and ability check templates into action as well, will be action[x].save/action[x].abilityCheck
    action = mergeObject(action, game.system.template.Item['saveCheck']);
	action = mergeObject(action, game.system.template.Item['castShapeProperties']);
    action = mergeObject(action, game.system.template.Item['abilityCheck']);
    if (!action.id) {
        action.id = randomID(16);
    }
    delete action.templates;
    let actionName = "unknown";
    if (actionGroup) {
        actionName = actionGroup;
    } else if (object && object.name) {
        actionName = object.name;
    }
    action.index = index;
    action.name = actionName;
    // set the default image on action if object unset, to "cast" as it's the default new action type.
    let actionImg = ARS.icons.general.combat.cast;
    if (object && object.img) {
        actionImg = object.img;
    }
    action.img = actionImg;

    return action;
}


/**
 * 
 * Create actions for token from damageList
 * 
 * @param {Object} token  token object
 * @param {Array} damageList Array of damage strings ['1d6','1d4+2']
 *
 */
export async function createActionForNPCToken(token, damageList, actionName = "Attack") {
    // console.log("createActionForNPCToken", { token, damageList, actionName });
    if (damageList && damageList.length) {
        // console.log("createActionForNPCToken:START");
        let actionBundle = Object.values(foundry.utils.deepClone(getProperty(token.actor, "system.actions") || []));

        createActionFromDamage(token.actor, damageList, actionBundle, actionName);

        // token.update({ "actorData.system.actions": actionBundle });
        token.actor.update({ "system.actions": actionBundle });
    }
}
/**
 * 
 * Create actions for actor from damageList
 * 
 * @param {Object} actor 
 * @param {Array/object} damageList 
 * @param {String} actionName 
 */
export async function createActionForActor(actor, damageList, actionName = "Attack") {
    // console.log("createActionForActor", { actor, damageList, actionName });
    if (damageList && damageList.length) {
        let actionBundle = Object.values(foundry.utils.deepClone(getProperty(actor, "system.actions") || []));

        createActionFromDamage(actor, damageList, actionBundle, actionName);

        await actor.update({ "system.actions": actionBundle });
    }
}

/**
 * 
 * Create a actions array for a imports npc only using a bundle.
 * 
 * @param {Array} actionBundle 
 * @param {Array/Object} damageList 
 * @param {String} actionName 
 * @returns 
 */
export async function createActionForActionBundle(actionBundle, damageList, actionName = "Attack", actionSpeed = 0) {
    // console.log("createActionForActionBundle", { actionBundle, damageList, actionName });
    if (damageList && damageList.length) {
        createActionFromDamage(null, damageList, actionBundle, actionName, actionSpeed);
        return actionBundle;
    }
}
/**
 * 
 * Helper to create actions for simple damagelist/name and dmgType
 * 
 * @param {Actor|Token} object 
 * @param {Array} damageList 
 * @param {DataBundle} actionBundle 
 * @param {String} actionName 
 * @returns 
 */
function createActionFromDamage(object, damageList, actionBundle, actionName = "Attack", actionSpeed = 0) {
    // console.log("createActionFromDamage", { object, damageList, actionBundle, actionName });
    // create "attack" action first, default to melee/str based
    let action = createActionEntry(object, actionBundle.length);
    action.name = actionName;
    action.speed = actionSpeed;
    action.type = 'melee';
    action.ability = 'none';
    action.abilityCheck.type = 'none';
    action.saveCheck.type = 'none'
    action.img = ARS.icons.general.combat[action.type];
    actionBundle.push(action);

    const _actionDamage = (dmg, dmgType = 'slashing') => {
        let actionDamage;
        // console.log("createActionFromDamage", { object, dmg, actionBundle });
        // console.log("createActionFromDamage:dmg", dmg);
        if (dmg) {
            actionDamage = createActionEntry(object, actionBundle.length);
            let diceString = '';
            try {
                const match = dmg.match(/^(\d+[\-]\d+$)/) || null;
                if (match && match[1]) diceString = match[1];
            } catch (err) { }

            if (diceString) {
                diceString = DiceManager.diceFixer(diceString[0]);
            } else {
                diceString = dmg;
            }

            actionDamage.name = actionName;
            actionDamage.damagetype = dmgType;
            actionDamage.type = 'damage';
            actionDamage.ability = 'none';
            actionDamage.formula = diceString;
            actionDamage.abilityCheck.type = 'none';
            actionDamage.saveCheck.type = 'none'
            actionDamage.img = ARS.icons.general.combat[action.type];
        } else {
            // console.log("createActionFromDamage", { object, dmg, actionBundle });
        }
        return actionDamage;
    };

    // create damage entries for each valid damage dice we find in string
    damageList.forEach(entry => {
        if (entry.dmg) {
            actionBundle.push(_actionDamage(entry.dmg, entry.dmgType));
        } else {
            actionBundle.push(_actionDamage(entry));
        }

    })

    return actionBundle;
}

/**
 * 
 * pre-calculate formulas for tooltips/visual information
 * 
 * @param {*} object 
 * @param {*} actions 
 */
export async function populateFormulaEvals(object, actions) {
    // console.log("action.js populateFormulaEvals", { object, actions }, object.documentName);
    if (actions) {
        let rollData = object.getRollData();
        if (object.documentName === 'Item' && object.isOwned) {
            rollData = object.actor.getRollData();
        }
        for (const action of actions) {
            if (action.formula) {
                try {
                    let roll = new Roll(action.formula, rollData);
                    await roll.evaluate({ async: true });
                    action.formulaEvaluated = roll.formula;
                } catch (err) {
                    console.log(`action.js populateFormulaEvals error ${err}`, { object, actions, rollData });
                    action.formulaEvaluated = action.formula;
                }
            }
        }
    }
}

/**
 * Copies actions from a source object to a target object.
 * @param {Object} object - The target object to copy actions to.
 * @param {Object} sourceObject - The source object to copy actions from.
 */
export async function copyActionsToObject(object, sourceObject) {
    // console.log("action.js copyActionsToObject", { object, sourceObject });

    // Check if the source object has actions
    if (sourceObject.system.actions) {
        const actionBundle = getActions(object);

        // Iterate through each action in the source object
        sourceObject.system.actions.forEach((action, index) => {
            const copiedAction = foundry.utils.deepClone(action);

            // If this is the first action or a charged action, add extra information from the source object
            if (index == 0 || ARS.chargedActions.includes(action.type)) {

                // Add extra spell notes for objects of type 'spell'
                let preDescriptionText = '';
                if (sourceObject.type === 'spell') {

                    function createLine(property, label) {
                        return property ? `${label}: ${property}<p />` : '';
                    }

                    const lines = [
                        createLine(sourceObject.system.type, 'Type'),
                        createLine(sourceObject.system.school, 'School'),
                        createLine(sourceObject.system.sphere, 'Sphere'),
                        createLine(sourceObject.system.level, 'Level'),
                        createLine(sourceObject.system.castingTime, 'Cast Time'),
                        createLine(sourceObject.system.range, 'Range'),
                        createLine(sourceObject.system.durationText, 'Duration'),
                        createLine(sourceObject.system.save, 'Save'),
                        createLine(sourceObject.system.areaOfEffect, 'AOE'),
                    ];

                    // Add components information if any of the components exist
                    if (sourceObject.system.components.verbal || sourceObject.system.components.somatic || sourceObject.system.components.material) {
                        lines.push(`Components: ${sourceObject.system.components.verbal ? 'V' : ''
                            }${sourceObject.system.components.somatic ? 'S' : ''
                            }${sourceObject.system.components.material ? 'M' : ''
                            }<p />`);
                    }

                    preDescriptionText = lines.join('');
                } // end spell type

                // Combine preDescriptionText, source object description, and action description
                copiedAction.description = (preDescriptionText ? preDescriptionText : '') +
                    sourceObject.system.description + (action.description ? action.description : '');
                copiedAction.img = sourceObject.img || '';
            }
            actionBundle.push(copiedAction);
        });

        // Re-index actions and set the actions for the target object
        reIndexActions(actionBundle);
        await setActions(object, actionBundle);
    }
}


/**
 * 
 * Toggle action group view state collapsed or full
 * 
 * The is a set/getFlag setting stored on the object with actions and as map it to the name of the action group
 * 
 * @param {*} event 
 */
export async function toggleActionView(event) {
    // console.log("action.js toggleActionView", { event })

    const element = event.currentTarget;
    const dataset = element.dataset;
    const li = element.closest("li");
    const actionGroup = li.dataset.actionGroup;
    const sourceUuid = li.dataset.sourceUuid;
    const sourceObject = await fromUuid(sourceUuid);

    const source = (sourceObject.documentName === 'Token' ? sourceObject.actor : sourceObject);

    const collapsedState = source.getFlag("ars", `actions.${actionGroup}.display.collapsedState`) || 'none';
    const newState = collapsedState === 'none' ? 'block' : 'none';
    source.setFlag("ars", `actions.${actionGroup}.display.collapsedState`, newState);

    // console.log("action.js toggleActionView", { element, dataset, li, sourceUuid, sourceObject, source, collapsedState, newState })

}
