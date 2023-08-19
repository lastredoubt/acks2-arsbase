import { ARS } from '../config.js';
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js"

export class ARSSettingsAudio extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'ars-settings-audio-form',
            title: 'Configure Game Settings - Audio',
            template: "systems/ars/templates/apps/settings-audio.hbs",
            width: 600,
            height: 800,
            resizable: true,
            // height: 'auto',
            closeOnSubmit: true,
        });
    }

    async getData() {
        let data = super.getData();
        mergeObject(data, {
            isGM: game.user.isGM,

            initVolumeSound: await game.settings.get("ars", "initVolumeSound"),
            playRoundSound: await game.settings.get("ars", "playRoundSound"),
            initRoundSound: await game.settings.get("ars", "initRoundSound"),
            initTurnSound: await game.settings.get("ars", "initTurnSound"),
            playTurnSound: await game.settings.get("ars", "playTurnSound"),

            audioPlayTriggers: await game.settings.get("ars", "audioPlayTriggers"),
            audioTriggersVolume: await game.settings.get("ars", "audioTriggersVolume"),
            audioTriggerCheckSuccess: await game.settings.get("ars", "audioTriggerCheckSuccess"),
            audioTriggerCheckFail: await game.settings.get("ars", "audioTriggerCheckFail"),
            audioTriggerMeleeHit: await game.settings.get("ars", "audioTriggerMeleeHit"),
            audioTriggerMeleeMiss: await game.settings.get("ars", "audioTriggerMeleeMiss"),
            audioTriggerMeleeCrit: await game.settings.get("ars", "audioTriggerMeleeCrit"),
            audioTriggerRangeHit: await game.settings.get("ars", "audioTriggerRangeHit"),
            audioTriggerRangeMiss: await game.settings.get("ars", "audioTriggerRangeMiss"),
            audioTriggerRangeCrit: await game.settings.get("ars", "audioTriggerRangeCrit"),
            audioTriggerCast: await game.settings.get("ars", "audioTriggerCast"),
            audioTriggerDeath: await game.settings.get("ars", "audioTriggerDeath"),

        });

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // initRoundSound
        html.find(".file-picker").click(function (event) {
            console.log("", { event })
            const fp = new FilePicker({
                type: "audio",
                wildcard: true,
                current: $(event.currentTarget).prev().val(),
                callback: path => {
                    $(event.currentTarget).prev().val(path);
                }
            });
            return fp.browse();
        });

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