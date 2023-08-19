import * as effectManager from "./effect/effects.js";
import * as actionManager from "./apps/action.js";
import * as utilitiesManager from "./utilities.js";
import * as debug from "./debug.js";



/**
 * prompt dialog for a quantity of something
 * @param {*} mincount 
 * @param {*} maxcount 
 * @param {*} default_amount 
 * @param {*} question 
 * @param {*} title 
 * @param {*} confirmLabel 
 * @param {*} cancelLabel 
 * @param {*} options 
 * @returns 
 */
export async function getQuantity(mincount = 0, maxcount = 1, default_amount = 1, question = 'Take how many?', title = 'Taking', confirmLabel = 'Aquire', cancelLabel = 'Leave', options = {}) {

    console.log("utilities.js getQuantity", { mincount, maxcount, default_amount });
    // if default set to 0 we set it to maxcount (for loot mode)
    if (!default_amount) default_amount = maxcount;

    const content = await renderTemplate("systems/ars/templates/dialogs/dialog-quantity.hbs", {
        question,
        mincount,
        maxcount,
        default_amount
    });

    const _onDialogSubmit = (html) => {
        const form = html[0].querySelector("form");
        let quantity = 0;
        quantity = form.quantity.value
        if (quantity < mincount) quantity = mincount;
        if (quantity > maxcount) quantity = maxcount;

        return parseInt(quantity);
    }

    return new Promise(resolve => {
        new Dialog({
            title,
            content,
            buttons: {
                submit: {
                    label: confirmLabel,
                    callback: html => resolve(_onDialogSubmit(html))
                },
                cancel: {
                    label: cancelLabel,
                    callback: html => resolve(0)
                }
            },
            close: () => resolve(0)
        }, options).render(true);
    });
}

/**
 * 
 * prompt a confirmation dialog
 * 
 * @param {*} question 
 * @param {*} title 
 * @param {*} options 
 * @returns 
 */
export async function confirm(question = `<p>Are you sure?</p>`, title = 'Confirmation', options = {}) {
    // console.log("utilities.js dialogConfirm", { title, question });
    return Dialog.confirm({
        title: title,
        content: question,
        yes: () => { return true },
        no: () => { return false },
    });
}


/**
 * 
 * Get a situational modifer value
 * 
 * @param {*} min 
 * @param {*} max 
 * @param {*} defmod Default modifier value
 * @param {*} question 
 * @param {*} title 
 * @param {*} flavor
 * @param {*} options 
 * @returns Number
 */
export async function getSituational(min = 0, max = 1, defmod = 0, question = 'Situational Modifier:', title = 'Modifier', flavor = '', options = {}) {
    // console.log("dialog.js dialogGetSituational", { min, max, defmod, question, title, flavor })

    const defaultRollMode = game.settings.get("core", "rollMode");

    // we set a flag on this user that stores this situational value and reuse it if it exists
    const situationalDice = await game.user.getFlag("ars", 'situationalDice') || [];
    // console.log("dialog.js dialogGetSituational", situationalDice)
    if (situationalDice[title.slugify({ strict: true })]) {
        const mod = parseInt(situationalDice[title.slugify({ strict: true })].value) || 0;
        if (mod) defmod = mod;
    }
    const content = await renderTemplate("systems/ars/templates/dialogs/dialog-situational-modifier.hbs", {
        flavor,
        question,
        min,
        max,
        defmod,
        CONFIG,
        defaultRollMode,
    });

    const _onDialogSubmit = (html) => {
        const form = html[0].querySelector("form");
        let modifier = 0;
        modifier = parseInt(form.modifier.value);
        if (isNaN(modifier)) modifier = 0;
        if (modifier < min) modifier = min;
        if (modifier > max) modifier = max;

        situationalDice[title.slugify({ strict: true })] = { value: modifier };
        game.user.setFlag("ars", 'situationalDice', situationalDice);
        // game.settings.get("core", "rollMode")
        return { mod: modifier, rollMode: form.rollMode.value };
    }

    return new Promise(resolve => {
        new Dialog({
            title,
            content,
            buttons: {
                submit: {
                    label: 'Apply',
                    callback: html => resolve(_onDialogSubmit(html))
                },
                cancel: {
                    label: 'None',
                    callback: html => resolve(_onDialogSubmit(html))
                }
            },
            close: () => resolve({ mod: undefined, rollMode: undefined })
        }, options).render(true);
    });
}

/**
 * 
 * Select a item in actor's inventory and return itemId of selected
 * 
 * @param {*} actor 
 * @param {*} question 
 * @param {*} title 
 * @param {*} options 
 * @returns 
 */
export async function getInventoryItem(actor, question = 'Select Item Resource', title = 'Resource Selection', options = {}) {

    const content = await renderTemplate("systems/ars/templates/dialogs/dialog-inventory-item.hbs", {
        actor,
        title,
        question,
        CONFIG,
        type: options?.type ?? '',
        inventoryList: options?.inventory ? options.inventory : actor.inventory,
    });

    const _onDialogSubmit = (html) => {
        const form = html[0].querySelector("form");
        const itemId = form.inventorySelect.value || undefined;
        return itemId;
    }

    return new Promise(resolve => {
        new Dialog({
            title,
            content,
            buttons: {
                submit: {
                    label: 'Select',
                    callback: html => resolve(_onDialogSubmit(html))
                },
                cancel: {
                    label: game.i18n.localize('ARS.cancel'),
                    callback: html => resolve('')
                }
            },
            close: () => resolve(undefined)
        }, options).render(true);
    });
}

/**
 * 
 * SHOW a list of items in a dialog
 * 
 * @param {*} itemList Array of item Ids 
 * @param {*} text 
 * @param {*} title 
 * @param {*} options 
 * @returns 
 */
export async function showItems(actor = null, itemList = [], text = 'These items have been added to this character', title = 'Items Received', options = {}) {

    let items = [];
    for (const itemId of itemList) {
        let item;
        if (actor) {
            item = actor.items.get(itemId);
        } else {
            item = await utilitiesManager.getItem(itemId);
        }
        console.log("dialog.js dialogShowItems item", { item })
        if (item) items.push(item);
    }
    console.log("dialog.js dialogShowItems", { text, itemList, items })
    const content = await renderTemplate("systems/ars/templates/dialogs/dialog-show-items.hbs", {
        text,
        items,
        CONFIG,
    });

    return new Promise(resolve => {
        new Dialog({
            title,
            content,
            buttons: {
                submit: {
                    label: game.i18n.localize('ARS.close'),
                    callback: html => resolve(undefined)
                },
            },
            close: () => resolve(undefined)
        }, options).render(true);
    });
}

/**
 * 
 * Simple notification popup
 * 
 * @param {*} content 
 * @param {*} buttontext 
 * @param {*} title 
 * @returns 
 */
export async function showNotification(content = 'Empty notice text', buttontext = 'OK', title = 'Notification') {

    const response = await Dialog.prompt({
        title: `${title}`,
        content: `${content}`,
        label: `${buttontext}`,
        callback: async (html) => { }
    })

    return response;
}

/**
 * 
 * Prompt for a string value 
 * 
 * @param {*} text 
 * @param {*} question 
 * @param {*} title 
 * @param {*} options 
 * @returns 
 */
export async function getString(text = '', question = 'Enter the string:', title = 'Get String', options = {}) {

    const content =
        `<form>
            <div class="flexrow">
                <h3>${question}</h3>
                <div>
                    <input name="enteredText" type="text" value=${text} placeholder="Enter text"/>
                </div>
            </div>
        </form>`;

    const _onDialogSubmit = (html) => {
        const form = html[0].querySelector("form");
        return form.enteredText.value;
    }

    return await new Promise(resolve => {
        new Dialog({
            title,
            content,
            buttons: {
                submit: {
                    label: game.i18n.localize('ARS.submit'),
                    callback: html => resolve(_onDialogSubmit(html))
                },
                cancel: {
                    label: game.i18n.localize('ARS.cancel'),
                    callback: html => resolve('')
                }
            },
            close: () => resolve('')
        }, options).render(true);
    });
}

export async function getAttack(attackLable = 'Attack', cancelLabel = game.i18n.localize('ARS.cancel'), title = 'Make Attack', flavor = '', options = {}) {
    const defaultRollMode = game.settings.get("core", "rollMode");
    // console.log("dialog.js getAttack", { attackLable,cancelLabel,title })
    let defmod = 0;
    // we set a flag on this user that stores this situational value and reuse it if it exists
    const attackDice = await game.user.getFlag("ars", 'getAttack') || [];
    if (attackDice[title.slugify({ strict: true })]) {
        const mod = parseInt(attackDice[title.slugify({ strict: true })].value) || 0;
        if (mod) defmod = mod;
    }

    const content = await renderTemplate("systems/ars/templates/dialogs/dialog-get-attack.hbs", {
        flavor,
        defmod,
        CONFIG,
        defaultRollMode,
    });

    const _onDialogSubmit = (html) => {
        const form = html[0].querySelector("form");
        let modifier = 0;
        modifier = parseInt(form.modifier.value);
        if (isNaN(modifier)) modifier = 0;
        const acLocation = form.acLocation.value;

        attackDice[title.slugify({ strict: true })] = { value: modifier };
        game.user.setFlag("ars", 'getAttack', attackDice);
        const result = { mod: modifier, rollMode: form.rollMode.value, acLocation: acLocation };
        // console.log("dialog.js getAttack", { result })
        return result;
    }

    return new Promise(resolve => {
        new Dialog({
            title,
            content,
            buttons: {
                submit: {
                    label: attackLable,
                    callback: html => resolve(_onDialogSubmit(html))
                },
                cancel: {
                    label: cancelLabel,
                    callback: html => resolve(undefined)
                }
            },
            close: () => resolve(undefined)
        }, options).render(true);
    });
}

/**
 * 
 * 
 * 
 * @param {*} damageLabel 
 * @param {*} cancelLabel 
 * @param {*} title 
 * @param {*} options 
 * @returns 
 */
export async function getDamage(damageLabel = 'Damage', cancelLabel = game.i18n.localize('ARS.cancel'), title = 'Apply Damage', flavor = '', options = {}) {
    const defaultRollMode = game.settings.get("core", "rollMode");
    // console.log("dialog.js getDamage", { damageLabel,cancelLabel,title })
    let defmod = 0;

    // we set a flag on this user that stores this situational value and reuse it if it exists
    const damageDice = await game.user.getFlag("ars", 'getDamage') || [];
    if (damageDice[title.slugify({ strict: true })]) {
        const mod = parseInt(damageDice[title.slugify({ strict: true })].value) || 0;
        if (mod) defmod = mod;
    }

    const content = await renderTemplate("systems/ars/templates/dialogs/dialog-get-damage.hbs", {
        flavor,
        defmod,
        CONFIG,
        defaultRollMode,
    });

    const _onDialogSubmit = (html) => {
        const form = html[0].querySelector("form");
        let modifier = 0;
        modifier = parseInt(form.modifier.value);
        if (isNaN(modifier)) modifier = 0;
        const dmgAdjustment = form.dmgAdjustment.value;

        damageDice[title.slugify({ strict: true })] = { value: modifier };
        game.user.setFlag("ars", 'getDamage', damageDice);
        const result = { mod: modifier, rollMode: form.rollMode.value, dmgAdjustment: dmgAdjustment };
        return result;
    }

    return new Promise(resolve => {
        new Dialog({
            title,
            content,
            buttons: {
                submit: {
                    label: damageLabel,
                    callback: html => resolve(_onDialogSubmit(html))
                },
                cancel: {
                    label: cancelLabel,
                    callback: html => resolve(undefined)
                }
            },
            close: () => resolve(undefined)
        }, options).render(true);
    });
}

/**
 * 
 * @param {*} question 
 * @param {*} title 
 * @param {*} flavor 
 * @param {*} casting 
 * @param {*} options 
 * @returns 
 */
export async function getInitiative(question = 'Modifier', title = 'Initiative', flavor = 'Rolling Initiative', casting = false, options = {}) {
    // console.log("dialog.js getInitiative", { question, title, flavor, casting })
    let defmod = 0;
    // let casting = false;

    const defaultRollMode = game.settings.get("core", "rollMode");
    // we set a flag on this user that stores this situational value and reuse it if it exists
    const situationalDice = await game.user.getFlag("ars", 'situationalInitiative') || [];
    // console.log("dialog.js dialogGetSituational", situationalDice)
    if (situationalDice[title.slugify({ strict: true })]) {
        const mod = parseInt(situationalDice[title.slugify({ strict: true })].value) || 0;
        if (mod) defmod = mod;
        // casting = situationalDice[title.slugify({ strict: true })].casting;
    }
    const content = await renderTemplate("systems/ars/templates/dialogs/dialog-initiative-modifier.hbs", {
        flavor,
        question,
        defmod,
        casting,
        CONFIG,
        defaultRollMode,
    });

    const _onDialogSubmit = (html) => {
        const form = html[0].querySelector("form");
        let modifier = 0;
        let casting = false;
        modifier = parseInt(form.modifier.value);
        casting = form.casting.checked;
        // console.log("dialog.js getInitiative casting", { casting }, form.casting)
        if (isNaN(modifier)) modifier = 0;

        situationalDice[title.slugify({ strict: true })] = { value: modifier, casting: casting };
        game.user.setFlag("ars", 'situationalInitiative', situationalDice);
        return { mod: modifier, casting: casting, rollMode: form.rollMode.value };
    }

    return new Promise(resolve => {
        new Dialog({
            title,
            content,
            buttons: {
                submit: {
                    label: 'Apply',
                    callback: html => resolve(_onDialogSubmit(html))
                },
                cancel: {
                    label: 'None',
                    callback: html => resolve(_onDialogSubmit(html))
                }
            },
            close: () => resolve({ mod: undefined, rollMode: undefined })
        }, options).render(true);
    });
}
