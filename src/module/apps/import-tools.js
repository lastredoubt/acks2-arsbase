import { ARS } from '../config.js';
import { DiceManager } from "../dice/dice.js";
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js"


export class ImportManager {

    static showImportFromStatblock() {
        const form = new ImportSheet("statblock");
        form.render(true);
    }

    static showImportFromNPCtext() {
        const form = new ImportSheet("npctext");
        form.render(true);
    }

    static addImportActorButton(app, html) {
        // console.log("import-tools.js addImportFromStatblockButton", { app, html })
        if (game.user.isGM && app.id == "actors") {
            const statblockImportButton = $(`<button class='import-manager' data-tooltip='Import NPC by statblock'> ` +
                `<i class='fas fa-user-plus'></i>` +
                `Import Statblock` +
                ` <i class='fas fa-file-alt'></i>` +
                `</button>`);

            statblockImportButton.click(function (env) {
                // console.log("import-tools.js addImportFromStatblockButton", { env })
                ImportManager.showImportFromStatblock();
            });

            html.find(".header-actions").append(statblockImportButton);

            const npctextbutton = $(`<button class='import-manager' data-tooltip='Import NPC by text'> ` +
                `<i class='fas fa-user-plus'></i>` +
                `Import NPCText` +
                ` <i class='fas fa-book-open'></i>` +
                `</button>`);

            npctextbutton.click(function (env) {
                // console.log("import-tools.js addImportFromNPCTextButton", { env })
                ImportManager.showImportFromNPCtext();
            });

            html.find(".header-actions").append(npctextbutton);

        }
    }

} // end ImportManager

export class ImportSheet extends FormApplication {
    constructor(type) {
        super(type);
        this.type = type;
    }

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            actionId: undefined,
            classes: ["ars"],
            closeOnSubmit: false,
            height: 400,
            id: "import-sheet",
            resizable: true,
            submitOnClose: true,
            template: "systems/ars/templates/apps/import-sheet.hbs",
            title: "Import Text",
            width: 500
        });
    }

    async getData() {
        const page = {
            type: this.type,
            expected: this.type === "statblock" ? "ARS.importtools.expected.statblock" : "ARS.importtools.expected.npctext",
            importText: '',
            addMarkup: true,
            ARS,
        };
        return page;
    }


    /** @override */
    async _updateObject(event, formData) {
        // console.log('import-tools.js _updateObject', { event, formData });
        // this.render();
    }


    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find("#importform").submit(this._importTextSubmit.bind(this));
    }

    _importTextSubmit(event) {
        // console.log("import-tools.js _importTextSubmit", { event });

        event.preventDefault();
        // const inputText = $(event.target).find('#inputText');
        // const text = inputText.val();
        // const inputAddMarkup = $(event.target).find('#inputAddMarkup');
        // const addMarkup = inputAddMarkup.val();


        const formData = new FormData(event.target);
        const addMarkup = formData.get("inputAddMarkup") === "true";
        const text = formData.get("importext");


        console.log("import-tools.js _importTextSubmit", { text, addMarkup });
        switch (this.type) {
            case "statblock":
                try {
                    this.importStatBlockText(text, addMarkup);
                } catch (err) {
                    ui.notifications.error(`Error: ${err}: Import failed, check format of stat block text.`)
                }
                break;
            case "npctext":
                try {
                    this.importNPCText(text, addMarkup);
                } catch (err) {
                    ui.notifications.error(`Error: ${err}: Import failed, check format of NPC text.`)
                }
                break;

        }
        this.close()
    }

    /**
     * Import npctext block to actor
     * 
     * @param {*} text 
     */
    importNPCText(text, addMarkup = false) {

        const fieldMappings = {
            activity_cycle: ['ACTIVITY CYCLE', 'ACTIVE TIME'],
            alignment: ['ALIGNMENT'],
            armor_class: ['ARMOR CLASS', 'ARMOUR CLASS'],
            climate_terrain: ['CLIMATE/TERRAIN', 'CLIMATE', 'TERRAIN'],
            damage: ['DAMAGE/ATTACK', 'DAMAGE'],
            diet: ['DIET'],
            frequency: ['FREQUENCY'],
            hit_dice: ['HIT DICE'],
            intelligence: ['INTELLIGENCE'],
            inlair: ['LAIR PROBABILITY', '% IN LAIR'],
            magic_resist: ['MAGIC RESISTANCE'],
            morale: ['MORALE'],
            movement: ['MOVEMENT', 'MOVE'],
            no_appearing: ['NO. APPEARING', 'NO. ENCOUNTERED'],
            no_attacks: ['NO. OF ATTACKS', 'ATTACKS'],
            organization: ['ORGANIZATION'],
            size: ['SIZE'],
            special_attacks: ['SPECIAL ATTACKS'],
            special_defenses: ['SPECIAL DEFENSES', 'SPECIAL DEFENCES'],
            thaco: ['THAC0', 'THACO'],
            treasure: ['TREASURE', 'TREASURE TYPE'],
            xp_value: ['XP VALUE'],
            xp_osriccalc: ['LEVEL/XP', 'LEVEL/X.P.'],
        };


        const block = this.parseNPCText(text, fieldMappings);
        console.log("import-tools.js importNPCText", { text, block });

        // convert damage entries like 2-8 to 2d4.
        const diceRollDamage = block.damage ? block.damage.replace(/(\d+)-(\d+)/g, (match, min, max) => {
            const diceRoll = utilitiesManager.convertToDiceRoll(`${min}-${max}`);
            return diceRoll;
        }) : '';
        block.damage = diceRollDamage;

        // conver 1-4 to 1d4 in this field
        block.no_appearing = block?.no_appearing?.replace(/(\d+)-(\d+)/g, (match, min, max) => {
            const diceRoll = utilitiesManager.convertToDiceRoll(`${min}-${max}`);
            return diceRoll;
        }) || '';

        let newDescription = utilitiesManager.textCleanPaste(block.description ?? text);
        if (addMarkup)
            newDescription = utilitiesManager.textAddSimpleMarkup(newDescription);

        // do funky xp calcs for osric
        if (block.xp_osriccalc) {
            //strip commas
            let xpcalc = block.xp_osriccalc.replace(/,/g, '').replace(/\s/g, '');
            //"8/3520 + 16/hp";
            const regex = /\d+\/(\d+)\s*\+\s*(\d+)\/hp/;
            const [_, exp, perhpxp] = xpcalc.match(regex);
            // 195+(@system.attributes.hp.max*4)
            if (exp && perhpxp)
                block.xp_value = `${exp}+(@system.attributes.hp.max*${perhpxp})`;
            else if (exp)
                block.xp_value = `${exp}`;
            else block.xp_value = 0;
        } else {
            // convert text to number
            block.xp_value = parseInt(block.xp_value?.replace(/,/g, '')?.match(/\d+/)?.[0]) || 1;
        }

        // figure out what the .size value should be from text size value found
        if (block.size) {
            function getSizeType(text) {
                const sizeAbbreviations = {
                    "T": "tiny",
                    "S": "small",
                    "M": "medium",
                    "L": "large",
                    "H": "huge",
                    "G": "gargantuan",
                };

                for (const [abbreviation, sizeType] of Object.entries(sizeAbbreviations)) {
                    if (text.includes(abbreviation)) {
                        return sizeType;
                    }
                }

                return null;
            }
            block.size_specific = getSizeType(block.size);
        }
        // convert thaco to number found
        if (block.thaco) {
            block.thaco = parseInt(block.thaco?.match(/\d+/)?.[0]) || 20;
        } else {
            // otherwise calculate thaco from HD
            // Retrieve the effective HD (Hit Dice) value for the actor, defaulting to 1 if not defined
            const hdValue = utilitiesManager.effectiveLevel(block.hit_dice)
            // Update the THAC0 (To Hit Armor Class 0) value based on the hdValue
            block.thaco = Number(ARS.thaco.monster[hdValue]) || 20;
        }
        if (block.armor_class) {
            const ac = parseInt(block.armor_class?.match(/[\-]?\d+/)?.[0]);
            if (isNaN(ac)) {
                block.armor_class = 10;
            } else {
                block.armor_class = ac;
            }
        } else {
            block.armor_class = 10;
        }
        const newData = {
            activity: block.activity_cycle ?? "",
            acNote: block.armor_class ?? "",
            climate: block.climate_terrain ?? "",
            diet: block.diet ?? "",
            frequency: block.frequency ?? "",
            inlair: block.inlair ?? "",
            movement: block.movement ?? "",
            numberAppearing: block.no_appearing ?? "",
            organization: block.organization ?? "",
            sizenote: block.size ?? "",
            damage: block.damage ?? "",
            hitdice: block.hit_dice ?? 1,
            magicresist: block.magic_resist ?? "",
            morale: block.morale ?? "",
            intelligence: block.intelligence ?? "",
            numberAttacks: block.no_attacks ?? "1",
            specialAttacks: block.special_attacks ?? "",
            specialDefenses: block.special_defenses ?? "",
            treasureType: block.treasure ?? "",
            attributes: {
                "ac": {
                    "value": block.armor_class,
                },
                "thaco": {
                    "value": block.thaco,
                },
                "size": block.size_specific ?? "medium",
            },
            details: {
                "biography": {
                    "value": newDescription,
                },
                "source": "NPC Text Import",
                "alignment": this.helperGetAlignmentShortCode(block.alignment) ?? (block.alignment?.toLowerCase() ?? "n"),
            },
            xp: {
                value: block.xp_value || 0,
            }
        };

        this.createNPC(block.name, "icons/svg/mystery-man.svg", newData)
    }

    /**
     * Import statblock as actor
     * 
     * @param {*} text 
     */
    importStatBlockText(text, addMarkup = false) {

        const fieldMappings = {
            ac: { matchStrings: ['AC'], type: 'string' },
            acNote: { matchStrings: ['AC'], type: 'string' },
            hd: { matchStrings: ['HD', 'HitDice'], type: 'string' },
            hp: { matchStrings: ['hp', 'HP'], type: 'number' },
            specialDefense: { matchStrings: ['SD'], type: 'string' },
            specialAttacks: { matchStrings: ['SA'], type: 'string' },
            magicresist: { matchStrings: ['MR'], type: 'string' },
            move: { matchStrings: ['MV', 'MOVE'], type: 'string' },
            thaco: { matchStrings: ['THACO'], type: 'number' },
            numAttacks: { matchStrings: ['#AT'], type: 'number' },
            damage: { matchStrings: ['Dmg'], type: 'string' },
            size: { matchStrings: ['SZ', 'SIZE'], type: 'string' },
            morale: { matchStrings: ['ML'], type: 'string' },
            intelligence: { matchStrings: ['Int', 'INTEL'], type: 'string' },
            alignment: { matchStrings: ['AL'], type: 'string' },
            xp: { matchStrings: ['XP', 'EXPERIENCE', 'EXP'], type: 'string' },
        };

        const block = this.parseStatblockText(text, fieldMappings);
        console.log("import-tools.js importStatBlockText", { text, block })

        let newDescription = utilitiesManager.textCleanPaste(text);
        if (addMarkup) newDescription = utilitiesManager.textAddSimpleMarkup(newDescription);

        if (block.ac) {
            const ac = parseInt(block.ac?.match(/[\-]?\d+/)?.[0]);
            if (isNaN(ac)) {
                block.ac = 10;
            } else {
                block.ac = ac;
            }
        } else {
            block.ac = 10;
        }
        block.xp = parseInt(block.xp?.replace(/,/g, '')?.match(/\d+/)?.[0]) || 1;

        const diceRollDamage = block.damage ? block.damage.replace(/(\d+)-(\d+)/g, (match, min, max) => {
            const diceRoll = utilitiesManager.convertToDiceRoll(`${min}-${max}`);
            return diceRoll;
        }) : '';
        block.damage = diceRollDamage;

        const npcName = block.name;
        const npcImage = "icons/svg/mystery-man.svg";
        const newData = {
            acNote: block.acNote ?? "",
            sizenote: block.size ?? "",
            damage: block.damage ?? "",
            hitdice: block.hd ?? 1,
            magicresist: block.magicresist ?? "",
            morale: block.morale ?? "",
            intelligence: block.intelligence ?? "",
            movement: block.move ?? "",
            numberAttacks: block.numAttacks ?? "1",
            specialAttacks: block.specialAttacks ?? "",
            specialDefenses: block.specialDefense ?? "",
            treasureType: block.treasureType ?? "",
            attributes: {
                "ac": {
                    "value": block.ac || 10,
                },
                "thaco": {
                    "value": block.thaco || 20,
                },
                "hp": {
                    "base": 0,
                    "value": block.hp,
                    "min": 0,
                    "max": block.hp,
                },
                // "movement": {
                //     "value": block.move ?? 12,
                //     "unit": "ft"
                // },
                "size": "medium",
            },
            details: {
                "biography": {
                    "value": text,
                },
                "source": "Statblock Import",
                "alignment": this.helperGetAlignmentShortCode(block.alignment) ?? (block.alignment?.toLowerCase() ?? "n"),
            },
            xp: {
                value: block.xp ?? 1,
            }
        }

        this.createNPC(npcName, npcImage, newData)
    }

    /**
     * Parses input text using provided field mappings and returns an object with the collected values.
     *
     * @param {string} text - The input text to be parsed.
     * @param {object} fieldMappings - An object containing match strings and data types for the fields to be parsed.
     * @return {object} - An object containing the parsed field values.
     */
    parseStatblockText(text, fieldMappings) {
        // Initialize the result object to store parsed field values
        let result = {};

        // Extract the name from the input text and store it in the result object
        const nameMatch = text.match(/^(.*?):/i);
        result.name = nameMatch ? nameMatch[1] : 'No-Name-Found';

        // Iterate through the keys in the fieldMappings object
        for (const key in fieldMappings) {
            // Destructure the matchStrings and type properties from the current fieldMapping
            const { matchStrings, type } = fieldMappings[key];

            // Find the first match string present in the input text
            const matchString = matchStrings.find(ms => text.includes(ms));

            // If a match string is found
            if (matchString) {
                // Create a regular expression based on the field type (number or string)
                const regex = type === 'number'
                    ? new RegExp(`${matchString}\\s+\\d+`)
                    : new RegExp(`${matchString}\\s+([a-zA-Z0-9_,\\"\\-\\+\\(\\)\\/'\\s]+)`);
                // Find the matching value in the input text using the regular expression
                const match = text.match(regex);

                // If a matching value is found
                if (match) {
                    // Extract the value based on the field type (number or string) and store it in the result object
                    const value = type === 'number'
                        ? parseFloat(match[0].replace(matchString, '').trim())
                        : match[1].trim();
                    result[key] = value;
                }
            }
        }

        // Return the result object containing the parsed field values
        return result;
    }

    parseNPCText(text, fieldMappings) {
        const lines = text.split('\n');
        const creatureInfo = {};
        const keyValuePattern = /(\w[\w\s\.\\\/]*):(.+)/i;

        creatureInfo['name'] = lines[0].trim();
        const descriptionLines = [];

        for (const line of lines.slice(1)) {
            if (keyValuePattern.test(line)) {
                const [, key, value] = line.match(keyValuePattern);
                const matchingField = Object.entries(fieldMappings).find(([, matches]) =>
                    matches.some(match => line.trim().match(new RegExp('^' + match + '\\s*[:]', 'i')))
                );

                if (matchingField) {
                    const [mappedKey] = matchingField;
                    creatureInfo[mappedKey] = value.trim();
                } else {
                    descriptionLines.push(line.trim());
                }
            } else {
                descriptionLines.push(line.trim());
            }
        }

        creatureInfo['description'] = descriptionLines.join('\r\n').trim();

        return creatureInfo;
    }

    helperGetAlignmentShortCode(alignmentName) {
        // Generate a reverse mapping object
        const reverseAlignmentMap = {};
        for (const key in ARS.alignmentLongNameMap) {
            reverseAlignmentMap[ARS.alignmentLongNameMap[key]] = key;
        }

        // Normalize the input alignment name (remove spaces and convert to lowercase)
        const normalizedAlignmentName = alignmentName.replace(/\s+/g, '').toLowerCase();

        // Return the short code for the given alignment name, or undefined if not found
        return reverseAlignmentMap[normalizedAlignmentName];
    }

    // This asynchronous function creates a new NPC with the given name, image, and data
    // npcName: the name of the new NPC
    // npcImage: the image URL for the new NPC
    // newData: an object containing additional data for the new NPC
    async createNPC(npcName, npcImage, newData) {
        // Create the new actor with the provided data and options
        let actor = await Actor.create({
            name: npcName,
            type: "npc",
            img: npcImage,
            data: {
                ...newData,
            },
        }, {
            temporary: false,
            renderSheet: true,
        });

        // Recalculate the saves for the new actor
        await actor.recalculateSaves();
    }


} // end ImportSheet