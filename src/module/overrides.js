import { ARSActor } from "./actor/actor.js";
import { ARS } from './config.js';
import * as debug from "./debug.js"
import * as utilitiesManager from "./utilities.js";
/**
 * 
 * Various overrides
 * 
 */

/**
 * 
 * Extend this to do some things with getters in ActiveEffect
 * 
 * 
 */
export class ARSActiveEffect extends ActiveEffect {

    get originItem() {
        if (!this.parent instanceof ARSActor) {
            return null;
        }
        if (this?.origin) {
            const itemId = this.origin.match(/Item\.([a-zA-Z0-9]+$)/i)?.[1];
            if (itemId) {
                const item = this.parent.items?.get(itemId) || null;
                return item;
            }
        }

        return null;
    }

    /**
     * getter override to determine if the item is equipped/identified, if not, supress.
     */
    get isSuppressed() {
        const originItem = this.originItem;
        const parent = this.parent;
        // check to see if parent npc and if so we dont suppress for un-identified items
        if (parent && ['npc'].includes(parent?.type)) {
            return super.isSuppressed;
            // if the effect comes from a item then we check item identification and supress if not id'd
        } else if (originItem) {
            // these types of items dont need to be equipped to work
            if (['ability', 'background', 'class', 'race', 'proficiency', 'skill'].includes(originItem.type)) {
                return super.isSuppressed;
            } else {
                const activeEffect = this.originItem.isEquipped && this.originItem.isIdentifiedRaw;
                return !activeEffect;
            }
        }
        return super.isSuppressed;
    }

    /** should effect be visible in UI */
    get isVisible() {
        if (game.user.isGM) return true;
        return !this.isSuppressed;
    }


    /**
     * Apply an ActiveEffect that uses an UPGRADE, or DOWNGRADE application mode.
     * Changes which UPGRADE or DOWNGRADE must be numeric to allow for comparison.
     * @param {Actor} actor                   The Actor to whom this effect should be applied
     * @param {EffectChangeData} change       The change data being applied
     * @param {*} current                     The current value being modified
     * @param {*} delta                       The parsed value of the change object
     * @param {object} changes                An object which accumulates changes to be applied
     * @private
     */
    _applyUpgrade(actor, change, current, delta, changes) {
        // console.log("overrides.js _applyUpgrade isSuppressed", { actor, change, current, delta, changes })
        let update;
        const ct = foundry.utils.getType(current);
        switch (ct) {
            case "boolean":
            case "number":
                if ((change.mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE) && (delta > current)) update = delta;
                else if ((change.mode === CONST.ACTIVE_EFFECT_MODES.DOWNGRADE) && (delta < current)) update = delta;
                break;
            // fix to set a value if there is nothing there
            default:
                update = delta;
                break
        }
        changes[change.key] = update;
    }



}

/**
 * Combatant extend to override isNPC to work
 * more how we expect it
 */
export class ARSCombatant extends Combatant {

    /**@override */
    get isNPC() {
        // return !this.actor || !this.players.length;
        return !this.actor || this.actor.type === 'npc';
    }

}

/**
 * 
 * We override this so that the permissions are set recursively.
 * 
 * this will check for children in folder and if exist also set permissions in those
 * 
 */
export class ARSPermissionControl extends DocumentOwnershipConfig {
    async _updateObject(event, formData) {
        // console.log("overrides.js ARSPermissionControl _updateObject", { event, formData });
        // console.log("overrides.js ARSPermissionControl _updateObject this.document", this.document);
        event.preventDefault();
        if (!game.user.isGM) throw new Error("You do not have the ability to configure permissions.");
        // Collect user permissions
        const metaLevels = CONST.DOCUMENT_META_OWNERSHIP_LEVELS;
        const isFolder = this.document instanceof Folder;
        const omit = isFolder ? metaLevels.NOCHANGE : metaLevels.DEFAULT;

        const ownershipLevels = {};
        for (let [user, level] of Object.entries(formData)) {
            if (level === omit) {
                delete ownershipLevels[user];
                continue;
            }
            ownershipLevels[user] = level;
        }

        const allFolders = (folderDoc) => {
            console.log("overrides.js ARSPermissionControl", folderDoc.name, { folderDoc });
            const updates = folderDoc.contents.map(e => {
                const ownership = foundry.utils.deepClone(e.ownership);
                for (let [k, v] of Object.entries(ownershipLevels)) {
                    if (v === metaLevels.DEFAULT) delete ownership[k];
                    else ownership[k] = v;
                    // if (v === -2) delete p[k];
                    // else p[k] = v;
                }
                // return { _id: e.id, permission: p }
                return { _id: e.id, ownership };
            });
            const cls = getDocumentClass(folderDoc.type);
            cls.updateDocuments(updates, { diff: false, recursive: false, noHook: true });
            const children = folderDoc?.children;
            if (children) children.forEach(e => {
                if (e?.folder instanceof Folder)
                    allFolders(e.folder);
            });
        };


        // Update all documents in a Folder
        if (this.document instanceof Folder) {
            return allFolders(this.document);
        }

        // Update a single Document
        // return this.document.update({ permission: perms }, { diff: false, recursive: false, noHook: true });
        return this.document.update({ ownership: ownershipLevels }, { diff: false, recursive: false, noHook: true });
    }
}

export class ARSJournalDirectory extends JournalDirectory {
    // /** @inheritdoc */
    // static get defaultOptions() {
    //     const opts = super.defaultOptions;
    //     opts.resizable = true;
    //     return opts;
    // }

    /** @override */
    createPopout() {
        const pop = super.createPopout();
        pop.options.resizable = true;
        pop.options.height = 650;
        return pop;
    }
}

export class ARSRollTableDirectory extends RollTableDirectory {
    // /** @inheritdoc */
    // static get defaultOptions() {
    //     const opts = super.defaultOptions;
    //     opts.resizable = true;
    //     return opts;
    // }
    /** @override */
    createPopout() {
        const pop = super.createPopout();
        pop.options.resizable = true;
        pop.options.height = 650;
        return pop;
    }

}

export class ARSChatLog extends ChatLog {

    /** @override */
    createPopout() {
        const pop = super.createPopout();
        pop.options.resizable = true;
        pop.options.height = 650;
        return pop;
    }


    /**@override so we can insert some additional context menus */
    _getEntryContextOptions() {
        let contextOptions = super._getEntryContextOptions();

        function applyDamageHelper(li, adjustment) {
            const message = game.messages.get(li.data("messageId"));
            const damage = message.getFlag("ars", "damage");
            const adjustedDamage = Math.round(damage * adjustment);
            console.log(`overrides.js _getEntryContextOptions applyDamageHelper ${damage, adjustedDamage}`)
            for (const target of game.user.targets) {
                utilitiesManager.adjustActorHealth(target.actor, adjustedDamage);
            }
        }

        const optionsApplyDamage = {
            name: "CHAT.ApplyDamage", //"Apply damage to Current Target",
            icon: '<i class="fa-solid fa-swords"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                return (game.user.isGM && message.getFlag("ars", "damage")) ? true : false;
            },
            callback: (li) => {
                applyDamageHelper(li, 1);
            }
        };

        const optionsApplyHalfDamage = {
            name: "CHAT.ApplyHalfDamage",
            icon: '<i class="fa-solid fa-swords"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                return (game.user.isGM && message.getFlag("ars", "damage")) ? true : false;
            },
            callback: (li) => {
                applyDamageHelper(li, 0.5);
            }
        };

        const optionsApplyQuarterDamage = {
            name: "CHAT.ApplyQuarterDamage",
            icon: '<i class="fa-solid fa-swords"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                return (game.user.isGM && message.getFlag("ars", "damage")) ? true : false;
            },
            callback: (li) => {
                applyDamageHelper(li, 0.25);
            }
        };


        contextOptions.push(optionsApplyDamage);
        contextOptions.push(optionsApplyHalfDamage);
        contextOptions.push(optionsApplyQuarterDamage);

        return contextOptions;
    }


}
export class ARSItemDirectory extends ItemDirectory {
    // /** @inheritdoc */
    // static get defaultOptions() {
    //     const opts = super.defaultOptions;
    //     opts.resizable = true;
    //     return opts;
    // }
    /** @override */
    createPopout() {
        const pop = super.createPopout();
        pop.options.resizable = true;
        pop.options.height = 650;
        return pop;
    }
}

export class ARSPlaylistDirectory extends PlaylistDirectory {
    // /** @inheritdoc */
    // static get defaultOptions() {
    //     const opts = super.defaultOptions;
    //     opts.resizable = true;
    //     return opts;
    // }
    /** @override */
    createPopout() {
        const pop = super.createPopout();
        pop.options.resizable = true;
        pop.options.height = 650;
        return pop;
    }

}
export class ARSCompendiumDirectory extends CompendiumDirectory {
    // /** @inheritdoc */
    // static get defaultOptions() {
    //     const opts = super.defaultOptions;
    //     opts.resizable = true;
    //     return opts;
    // }
    /** @override */
    createPopout() {
        const pop = super.createPopout();
        pop.options.resizable = true;
        pop.options.height = 650;
        return pop;
    }

}
export class ARSRollTable extends RollTable {

    /**
      * @override because we want more than 5 nested tables.
      * 
      * Evaluate a RollTable by rolling its formula and retrieving a drawn result.
      *
      * Note that this function only performs the roll and identifies the result, the RollTable#draw function should be
      * called to formalize the draw from the table.
      *
      * @param {object} [options={}]       Options which modify rolling behavior
      * @param {Roll} [options.roll]                   An alternative dice Roll to use instead of the default table formula
      * @param {boolean} [options.recursive=true]   If a RollTable document is drawn as a result, recursively roll it
      * @param {number} [options._depth]            An internal flag used to track recursion depth
      * @returns {Promise<RollTableDraw>}  The Roll and results drawn by that Roll
      *
      * @example Draw results using the default table formula
      * ```js
      * const defaultResults = await table.roll();
      * ```
      *
      * @example Draw results using a custom roll formula
      * ```js
      * const roll = new Roll("1d20 + @abilities.wis.mod", actor.getRollData());
      * const customResults = await table.roll({roll});
      * ```
      */
    async roll({ roll, recursive = true, _depth = 0 } = {}) {
        const max_depth = 100;

        console.log("overrids.js ARSRollTable roll()", { roll, recursive, _depth })
        // Prevent excessive recursion
        if (_depth > max_depth) {
            throw new Error(`Maximum recursion depth exceeded ${max_depth} when attempting to draw from RollTable ${this.id}`);
        }

        // Reference the provided roll formula
        roll = roll instanceof Roll ? roll : Roll.create(this.formula);
        let results = [];

        // Ensure that at least one non-drawn result remains
        const available = this.results.filter(r => !r.drawn);
        if (!this.formula || !available.length) {
            ui.notifications.warn("There are no available results which can be drawn from this table.");
            return { roll, results };
        }

        // Ensure that results are available within the minimum/maximum range
        const minRoll = (await roll.reroll({ minimize: true, async: true })).total;
        const maxRoll = (await roll.reroll({ maximize: true, async: true })).total;
        const availableRange = available.reduce((range, result) => {
            const r = result.range;
            if (!range[0] || (r[0] < range[0])) range[0] = r[0];
            if (!range[1] || (r[1] > range[1])) range[1] = r[1];
            return range;
        }, [null, null]);
        if ((availableRange[0] > maxRoll) || (availableRange[1] < minRoll)) {
            ui.notifications.warn("No results can possibly be drawn from this table and formula.");
            return { roll, results };
        }

        // Continue rolling until one or more results are recovered
        let iter = 0;
        while (!results.length) {
            if (iter >= 10000) {
                ui.notifications.error(`Failed to draw an available entry from Table ${this.name}, maximum iteration reached`);
                break;
            }
            roll = await roll.reroll({ async: true });
            results = this.getResultsForRoll(roll.total);
            iter++;
        }

        // Draw results recursively from any inner Roll Tables
        if (recursive) {
            let inner = [];
            for (let result of results) {
                let pack;
                let documentName;
                if (result.type === CONST.TABLE_RESULT_TYPES.DOCUMENT) documentName = result.documentCollection;
                else if (result.type === CONST.TABLE_RESULT_TYPES.COMPENDIUM) {
                    pack = game.packs.get(result.documentCollection);
                    documentName = pack?.documentName;
                }
                if (documentName === "RollTable") {
                    const id = result.documentId;
                    const innerTable = pack ? await pack.getDocument(id) : game.tables.get(id);
                    if (innerTable) {
                        const innerRoll = await innerTable.roll({ _depth: _depth + 1 });
                        inner = inner.concat(innerRoll.results);
                    }
                }
                else inner.push(result);
            }
            results = inner;
        }

        // Return the Roll and the results
        return { roll, results };
    }

} // ARSRollTable

/**
 * @override to resize RollTable sheet window
 */
export class ARSRollTableConfig extends RollTableConfig {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            resizable: true,
            height: "650",
        });
    }
} //ARSRollTableConfig

export class ARSTokenConfig extends TokenConfig {

    /**@override */
    static get defaultOptions() {
        const defaultOpts = super.defaultOptions;
        defaultOpts.template = "systems/ars/templates/scene/token-config.hbs";
        return defaultOpts;
    }

    /**@override */
    async getData() {
        console.log("overrides.js ARSTokenConfig getData", {})
        const sheetData = await super.getData();
        sheetData.config = ARS;
        console.log("overrides.js ARSTokenConfig getData", { sheetData })
        return sheetData;
    }

} // ARSTokenConfig

/**
 * A form designed for creating and editing an Active Effect on an Actor or Item entity.
 * @implements {FormApplication}
 *
 * @param {ActiveEffect} object     The target active effect being configured
 * @param {object} [options]        Additional options which modify this application instance
 */
export class ARSActiveEffectConfig extends ActiveEffectConfig {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "active-effect-sheet"],
            title: "EFFECT.ConfigTitle",
            template: "systems/ars/templates/effects/active-effect-config.hbs",
            width: 560,
            height: "auto",
            // height: "340",
            resizable: true,
            tabs: [{ navSelector: ".tabs", contentSelector: "form", initial: "details" }]
        });
    }

    async getData() {
        const context = await super.getData();
        context.selectEffectKeys = game.ars.config.selectEffectKeys;

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.changes-list .effect-change .effect-change-key').change((event) => this._updateKeyValue(event));
    }

    async _updateKeyValue(event) {
        // event.stopPropagation();
        console.log("overrides.js _updateKeyValue", { event }, this);
        // const effect = this.document;

        const element = event.currentTarget;
        const value = element.value;
        const li = element.closest("li");
        // const dataset = li.dataset;
        // const index = dataset.index;

        // console.log("overrides.js _updateKeyValue", { element, effect, value, li, dataset, index });
        if (value) {
            const details = game.ars.config.selectEffectKeys.find(a => a.name === value);
            if (details) {
                event.preventDefault();
                // Find the input elements with class names "mode" and "value"
                const modeInput = li.querySelector(`.mode select`);
                const valueInput = li.querySelector(`.value textarea`);

                modeInput.value = details.mode;
                valueInput.value = details.value;
            }
        }
    }

} // end ARSActiveEffectConfig