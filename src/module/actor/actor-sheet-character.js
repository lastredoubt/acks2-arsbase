import { ARSActorSheet } from "./actor-sheet.js";
import { DiceManager } from "../dice/dice.js";
import { PlaceCastShape } from "../castshape/castshape.js";
import { onManageActiveEffect, prepareActiveEffectCategories } from "../effect/effects.js";
import * as actionManager from "../apps/action.js";
import * as utilitiesManager from "../utilities.js";
import * as debug from "../debug.js"

export class ARSCharacterSheet extends ARSActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ars", "sheet", "actor", "character"],
            template: "systems/ars/templates/actor/character-sheet.hbs",
            // template: "systems/ars/templates/actor/character-sheet.hbs",
            actor: this.actor, // for actor access in character-sheet.hbs
            width: 600,
            height: 700,
            // height: "auto",
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }

}