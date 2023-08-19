import { ARS } from '../config.js';
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js"

export class ARSSettingsCombat extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'ars-settings-combat-form',
            title: 'Configure Game Settings - Combat',
            template: "systems/ars/templates/apps/settings-combat.hbs",
            width: 600,
            // height: 860,
            resizable: true,
            height: 'auto',
            closeOnSubmit: true,
        });
    }

    async getData() {
        let data = super.getData();
        const variant = parseInt(game.ars.config.settings.systemVariant);
        mergeObject(data, {
            isGM: game.user.isGM,
            isVariant0: (variant === 0),
            isVariant1: (variant === 1),
            isVariant2: (variant === 2),
            combatAutomateRangeMods: await game.settings.get("ars", "combatAutomateRangeMods"),

            initiativeFormula: await game.settings.get("ars", "initiativeFormula"),
            initiativeUseSpeed: await game.settings.get("ars", "initiativeUseSpeed"),
            InitiativeAscending: await game.settings.get("ars", "InitiativeAscending"),
            initSideVSide: await game.settings.get("ars", "initSideVSide"),
            rollInitEachRound: await game.settings.get("ars", "rollInitEachRound"),

            useArmorDamage: await game.settings.get("ars", "useArmorDamage"),
            useAutoHitFailDice: await game.settings.get("ars", "useAutoHitFailDice"),
            autoDamage: await game.settings.get("ars", "autoDamage"),
            autoCheck: await game.settings.get("ars", "autoCheck"),
            weaponVarmor: await game.settings.get("ars", "weaponVarmor"),

            ctShowOnlyVisible: await game.settings.get("ars", "ctShowOnlyVisible"),
        });

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // // initRoundSound
        // html.find(".file-picker").click(function (event) {
        //     console.log("", { event })
        //     const fp = new FilePicker({
        //         type: "audio",
        //         wildcard: true,
        //         current: $(event.currentTarget).prev().val(),
        //         callback: path => {
        //             $(event.currentTarget).prev().val(path);
        //         }
        //     });
        //     return fp.browse();
        // });

    }

    async _updateObject(event, formData) {
        // Handle form submission and process the formData
        // console.log("settings-audio.js", { formData })
        for (let setting in formData) {
            // console.log("settings-audio.js", { setting }, ":", formData[setting])
            game.settings.set("ars", setting, formData[setting]);
        }
    }
}