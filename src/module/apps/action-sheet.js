// import { onManageAction_ActiveEffect } from "../effects.js";
import * as actionManager from "../apps/action.js";

/**
 * A specialized form used to select from a checklist of attributes, traits, or properties
 * @implements {FormApplication}
 */
export class ActionSheet extends FormApplication {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            actionId: undefined,
            classes: ["ars"],
            closeOnSubmit: false,
            height: 400,
            id: "action-sheet",
            resizable: true,
            submitOnChange: true,
            submitOnClose: true,
            template: "systems/ars/templates/apps/action-sheet.hbs",
            title: "Item Action",
            width: 500
        });
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        //manage the "other" damage on actions (add/remove)
        html.find(".action-control").click(this._onActionDamageOtherControl.bind(this));

        //manage "effects" on actions (add/remove)
        html.find(".action-effect-control").click(ev => { this.onManage_ActionEffects(ev) });

        html.find(".action-image").click(ev => { this.onEditImage(ev) });

        html.find(".effect-control").click(this._onEffectControl.bind(this));

        html.find('.general-properties-controls').click(this._manageProperties.bind(this));

        html.find('.changes-list .effect-change .effect-change-key').change((event) => this._updateKeyValue(event));
    }

    /** @override */
    async getData() {
        // console.log('action-sheet.js getData', this);
        // console.log('action-sheet.js', "getData", "this.object", this.object);
        const item = this.object;
        const data = item;
        data.config = CONFIG.ARS;
        data.const = CONST;
        const actionId = this.options.actionId;
        const action = foundry.utils.deepClone(item.system.actions[actionId]);

        // Prepare Active Effects
        // for (let action of item.data.actions) {
        //     action.effects = prepareActiveEffectCategories(action.effects);
        // }

        const actionData = {
            data: data,
            owner: item.isOwner,
            actor: item.actor,
            editable: this.isEditable,
            isEditable: this.isEditable,
            enrichedDesc: await TextEditor.enrichHTML(action.description, { async: true }), //secrets: this?.actor?.isOwner,rollData: this.object.getRollData(),
            enrichedMisc: await TextEditor.enrichHTML(action.misc, { async: true }),
            item: this.object,
            config: data.config,
            action: action,
            actionId: actionId,
            selectEffectKeys: game.ars.config.selectEffectKeys,
        };

        // console.log('action-sheet.js getData ', { actionData });
        return actionData;
    }

    /* -------------------------------------------- */

    /** @override */
    async _updateObject(event, formData) {
        // console.log('action-sheet.js _updateObject START->', { event, formData });
        const actionId = this.options.actionId;
        const source = this.object;

        let dataUpdate = foundry.utils.deepClone(source.system.actions);

        for (const [key, value] of Object.entries(formData)) {
            setProperty(dataUpdate[actionId], key, value);
        }

        // console.log('action-sheet.js _updateObject UPDATE->', duplicate(dataUpdate));
        // now set all the changes just made on the item.
        // const applied = await source.update({ "system.actions": dataUpdate });
        await source.update({ "system.actions": dataUpdate });
        // render after the changes for possible dynamic options using handlebars 
        this.render();
    }

    /**
     * 
     * updates sheet when a key is selected that we know about to defaults
     * 
     * @param {*} event 
     */
    async _updateKeyValue(event) {
        // console.log("action-sheet.js _updateKeyValue-------------->", { event }, this);
        const element = event.currentTarget;
        const value = element.value;
        const li = element.closest("li");
        const index = li.dataset.index;
        if (value) {
            // block submitOnChange for this
            event.stopPropagation();
            const details = game.ars.config.selectEffectKeys.find(a => a.name === value);
            const actionId = this.options.actionId;
            if (details) {
                // console.log("action-sheet.js _updateKeyValue-------------->", { details });
                // const change = duplicate(this.object.actions[actionId].effect.changes);
                // change[index].key = details.name;
                // change[index].mode = details.mode;
                // change[index].value = details.value;
                let actionBundle = foundry.utils.deepClone(getProperty(this.object, "system.actions") || []);
                actionBundle = Object.values(actionBundle);
                actionBundle[actionId].effect.changes[index].key = details.name;
                actionBundle[actionId].effect.changes[index].mode = details.mode;
                actionBundle[actionId].effect.changes[index].value = details.value;
                await this.object.update({ "system.actions": actionBundle });
                this.render(true);
                // // // const keyInput = li.querySelector(`.key input`);
                // const modeInput = li.querySelector(`.mode select`);
                // const valueInput = li.querySelector(`.value textarea`);

                // // keyInput.value = details.name;
                // modeInput.value = details.mode;
                // valueInput.value = details.value;

            }

        }
    }


    /**
     * Manage other damage objects on action
     * 
     * @param {*} event 
     */
    async _onActionDamageOtherControl(event) {
        // console.log("action-sheet.js _onActionDamageOtherControl event", event);
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const item = this.object;
        const actionId = this.options.actionId;
        const index = Number(dataset.index);


        let actionBundle = foundry.utils.deepClone(getProperty(item, "system.actions") || []);
        actionBundle = Object.values(actionBundle);


        if (element.classList.contains("add-damage")) {
            // console.log("_onActionDamageOtherControl", "add-damage otherdmg", otherdmg);
            let newDMG = {};
            newDMG.type = "slashing";
            newDMG.formula = "1d4";
            newDMG.id = randomID(16);
            actionBundle[actionId].otherdmg.push(newDMG);
        }

        if (element.classList.contains("delete-damage")) {
            actionBundle[actionId].otherdmg.splice(index, 1);
        }

        await item.update({ "system.actions": actionBundle });
        this.render();

    }

    /**
     * Manage effects on action objects
     * 
     * 
     * @param {*} event 
     */
    async onManage_ActionEffects(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const actionId = this.options.actionId;
        const item = this.object;
        const dataset = element.dataset;
        const li = element.closest("li");
        const actionToPerform = dataset.action;
        const effectId = li.dataset.effectId;

        // console.log("action-sheet.js", "onManage_ActionEffects", "element", element);
        // console.log("action-sheet.js", "onManage_ActionEffects", "dataset", dataset);
        // console.log("action-sheet.js", "onManage_ActionEffects", "li", li);
        // console.log("action-sheet.js", "onManage_ActionEffects", "actionToPerform", actionToPerform);
        // console.log("action-sheet.js", "onManage_ActionEffects", "effectId", effectId);

        switch (actionToPerform) {
            case 'create':
                let newActionEffect = duplicate(game.system.template.Item['actionEffect']);

                if (newActionEffect.templates instanceof Array) {
                    newActionEffect.templates.forEach((t) => {
                        newActionEffect = mergeObject(newActionEffect, game.system.template.Item.templates[t]);
                    });
                }

                if (!newActionEffect.id) {
                    newActionEffect.id = randomID(16);
                }
                delete newActionEffect.templates;

                // console.log("action-sheet.js", "onManage_ActionEffects", "newActionEffect", newActionEffect);

                // let actionBundle = duplicate(getProperty(item, "system.actionEffects") || []);
                let actionBundle = foundry.utils.deepClone(getProperty(item, "system.actions") || []);
                actionBundle = Object.values(actionBundle);
                actionBundle[actionId].effectList.push(newActionEffect);

                // console.log("action-sheet.js", "onManage_ActionEffects", "actionBundle[newActionEffect.id]", actionBundle[newActionEffect.id]);


                await item.update({ "system.actions": actionBundle });

                // console.log("action-sheet.js", "onManage_ActionEffects", "item", item);
                this.render();
                break

            case 'delete':
                let deleteBundle = foundry.utils.deepClone(getProperty(item, "system.actions") || []);
                deleteBundle[actionId].effectList.splice(effectId, 1);
                await item.update({ "system.actions": deleteBundle });
                this.render();
                break

            default:
                console.log("action-sheet.js", "onManage_ActionEffects", "Unknown actionToPerform type=", actionToPerform);
                break
        }


    }

    /**
     * edit image/icon for action
     * 
     * @param {*} event 
     */
    onEditImage(event) {
        // console.log("action-sheet.js", "onEditImage", { event });
        if (event.currentTarget.dataset.edit === 'img') {
            const fp = new FilePicker({
                type: "image",
                current: this.img,
                callback: path => {
                    event.currentTarget.src = path;
                    this._onSubmit(event);
                },
                top: this.position.top + 40,
                left: this.position.left + 10
            });
            // console.log("action-sheet.js", "onEditImage", { fp });
            return fp.browse();
        }
    }

    /**
     * Provide centralized handling of mouse clicks on control buttons.
     * Delegate responsibility out to action-specific handlers depending on the button action.
     * 
     * @param {MouseEvent} event      The originating click event
     * @private
     */
    async _onEffectControl(event) {
        event.preventDefault();
        // console.log("action-sheet.js _addEffectChange event", event);
        const element = event.currentTarget;
        const actionId = this.options.actionId;
        switch (element.dataset.action) {
            case "add":
                const actions = foundry.utils.deepClone(this.object.system.actions);
                actions[actionId].effect.changes.push({ mode: 0, key: "", value: "", })
                await this.object.update({ "system.actions": actions });
                // console.log("action-sheet.js", "_addEffectChange this.object", this.object);
                break;
            case "delete":
                const index = element.closest("li").dataset.index;
                let actionBundle = actionManager.getActions(this.object);
                actionBundle[actionId].effect.changes.splice(index, 1);
                await this.object.update({ "system.actions": actionBundle });
                break;
        }
        this.render();
    }


    /**
     * 
     * Add/remove properties
     * 
     * @param {*} event 
     */
    async _manageProperties(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const li = element.closest("li");
        const index = li?.dataset?.index || undefined;
        const actionCommand = dataset.action;
        const actionId = this.options.actionId;

        // console.log("action-sheet.js _manageProperties", this.object);

        const actions = foundry.utils.deepClone(this.object.system.actions);
        actions[actionId].properties = Object.values(actions[actionId].properties);
        switch (actionCommand) {
            case 'create':
                await this._onSubmit(event); // do this first as we don't save items onchange (it's onclose)
                actions[actionId].properties.push('');
                await this.object.update({ "system.actions": actions });
                break;

            case 'remove':
                if (index) {
                    await this._onSubmit(event);
                    actions[actionId].properties.splice(index, 1);
                    await this.object.update({ "system.actions": actions });
                }
                break;
        }
        this.render();
    }
    /* ----------------------------------------- */
}
