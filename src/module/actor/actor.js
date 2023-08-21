import { ARS } from '../config.js';
import { ARSDicer } from "../dice/dicer.js";
import { DiceManager } from "../dice/dice.js";
import * as action from "../apps/action.js";
import * as utilitiesManager from "../utilities.js";
import * as effectManager from "../effect/effects.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js"

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ARSActor extends Actor {

  chatTemplate = {
    "action": "systems/ars/templates/chat/parts/chatCard-action.hbs",
  }

  //getter to return actor alias
  get alias() {
    return this.system.alias;
  }

  /**
   * 
   * Returns name, wrapper for old "getter name" for v10
   * 
   * @returns 
   */
  getName() {
    if (!game.ars.config.settings.identificationActor)
      return this.name;

    if (['npc', 'lootable'].includes(this.type)) {
      if (!game.user.isGM && !this.isIdentified) {
        return this.alias ? this.alias : game.i18n.localize("ARS.unknownActor");
      }
    }

    return this.name;
  }

  get nameRaw() {
    return this.name;
  }
  /** getting for identified */
  get isIdentified() {
    return this.system.attributes.identified;
  }

  get needsInitiative() {
    const combatant = this.getCombatant();
    if (combatant) {
      return (combatant.initiative === null);
    }
    return false;
  }

  /**
   * get any status initiative modifers
   */
  get initiativeModifier() {
    let mod = 0;
    if (this.hasStatusEffect('restrain')) {
      mod += 3;
    }
    if (this.hasStatusEffect('blind')) {
      mod += 2;
    }

    return mod;
  }

  /** getter to return movement adjusted for encumbrance status effects */
  get movement() {
    const currentMove = this.type === 'npc' ? this.system.movement : this.system.attributes.movement.value;
    let move = parseInt(currentMove);
    const variant = parseInt(game.ars.config.settings.systemVariant);

    switch (variant) {
      case 0:
      case 1:
        {
          //v0/v1 move adjustments?
          if (this.hasStatusEffect('encumbrance-severe')) {
            if (currentMove > 30) move = 30;
          } else if (this.hasStatusEffect('encumbrance-heavy')) {
            if (currentMove > 30) move = 30;
          } else if (this.hasStatusEffect('encumbrance-moderate')) {
            if (currentMove > 60) move = 60;
          } else if (this.hasStatusEffect('encumbrance-light')) {
            if (currentMove > 90) move = 90;
          }
        }
        break;

      case 2: {
        if (this.hasStatusEffect('encumbrance-severe')) {
          move = 1;
        } else if (this.hasStatusEffect('encumbrance-heavy')) {
          move = move - Math.floor(move * (2 / 3));
        } else if (this.hasStatusEffect('encumbrance-moderate')) {
          move = move - Math.floor(move * (1 / 2));
        } else if (this.hasStatusEffect('encumbrance-light') ||
          this.hasStatusEffect('blind')) {
          move = move - Math.floor(move * (1 / 3));
        }
      } break;

      default: {

      } break;
    }

    return move;
  }

  /**
   * 
   * returns valid index for 
   * ARS.strengthTable[systemVariant][XXXXX] 
   * that adjust for percentile str
   * 
   * @returns index
   */

  /*  ------- ACKS
We can eliminate this as we don't have 18/% strength

  */
  computedStrengthValue() {
    const str = this.system.abilities.str;
    // If the value isn't 18 or there's no percent, simply return the value
    //added this in as I remarked out the remaining code
    return str.value;
    
    /* 
    if (str.value !== 18 || str.percent <= 0) return str.value;

    // Map ability percent to equivalent strength value
    if (str.percent >= 100) return 100;
    if (str.percent >= 91) return 99;
    if (str.percent >= 76) return 90;
    if (str.percent >= 51) return 75;
    // Default strength value for ability.percent < 51
    return 50; */
  }

  // Property to get the encumbrance value
  get encumbrance() {
    // Parse system variant configuration setting to an integer
    const systemVariant = parseInt(game.ars.config.settings.systemVariant);

    // Compute strength value based on ability
    const strengthValue = this.computedStrengthValue();

    switch (systemVariant) {

      /**
       * Encumbrance calculation for variant 2
       */
      case 2: {

        // In v2, magic armor doesn't count towards encumbrance
        // Calculate total weight of magic armors
        const magicArmorWeight = this.armors
          .filter((armor) => armor.isMagic)
          .reduce((totalWeight, armor) => totalWeight + (parseInt(armor.system.weight) * parseInt(armor.system.quantity)) || 0, 0);

        // Compute actual carried weight after discounting magic armor weight
        const actualCarriedWeight = parseInt(Number(this.carriedweight).toFixed(0)) - magicArmorWeight;

        // Get strength data from the strength table
        const strengthData = ARS.strengthTable[systemVariant][strengthValue];

        // Define mapping between encumbrance levels and their indices
        const encumbranceLevelIndices = {
          'unencumbered': 6,
          'light': 7,
          'moderate': 8,
          'heavy': 9,
          'severe': 10,
          'max': 11,
        };

        // Find and return the first encumbrance level where the actual carried weight is less than or equal to the corresponding strength value
        for (let index = 6; index < strengthData.length; index++) {
          let encumbranceLevel = Object.keys(encumbranceLevelIndices).find(key => encumbranceLevelIndices[key] === index);
          if (actualCarriedWeight <= strengthData[index]) {
            return encumbranceLevel;
          }
        }

        // If no encumbrance level found, return 'max'
        return 'max';
      } // end of variant 2
        break;

      /**
       * Encumbrance for standard/variant 1
       */
      default: {
        // variant 0 and 1
        const weight = parseInt(Number(this.carriedweight).toFixed(0)) || 0;
        const strMod = parseInt(ARS.strengthTable[systemVariant][strengthValue][2]) || 0;
        let encumbranceLevel = '';
        if (weight <= strMod + 35) {
          // move 12
          encumbranceLevel = 'unencumbered';
        } else if (weight <= strMod + 70) {
          // move 9
          encumbranceLevel = 'light';
        } else if (weight <= strMod + 105) {
          // move 6
          encumbranceLevel = 'moderate';
        } else if (weight <= strMod + 150) {
          // move 3
          encumbranceLevel = 'heavy';
        } else {
          // can't move?
          encumbranceLevel = 'severe';
        }
        return encumbranceLevel;
      } break;

    }

    // return an empty string otherwise
    return '';
  }


  /**
   * get the variant 2 style optional natural weapon initiative modifiers for size
   */
  get initiativeModifierForSize() {
    let mod = 0;
    switch (this.system.attributes.size) {
      // case "tiny": 

      case "small":
      case "medium":
        mod += 3;
        break;

      case "large":
        mod += 6;
        break;

      case "huge":
        mod += 9;
        break;

      case "gargantuan":
        mod += 12;
        break;

      default:
        break;
    }
    return mod;
  }

  // Helper function to find the highest key in an object
  findMatrixHighestLevel(obj) {
    // Get the highest key by converting keys to numbers and finding the maximum value
    return Math.max(...Object.keys(obj).map(Number));
  }

  //helper to get the single slice of the array specific to this combatlevel
  getMatrixSliceByLevel(matrixAs, combatLevel) {
    // Get the matrix variant from the game configuration
    const variant = Number(game.ars.config.settings.systemVariant);
    // Access the desired matrix using the variant and matrixAs
    const matrix = game.ars.config.matrix[variant][matrixAs];
    // Get the maximum combat level for the current matrix
    const matrixMaxLevel = this.findMatrixHighestLevel(matrix);
    // Clamp the input combatLevel to be within the valid range for the matrix
    const clampedCombatLevel = Math.max(0, Math.min(combatLevel, matrixMaxLevel));
    // Return the matrix slice for the clamped combat level
    return matrix[clampedCombatLevel];
  }

  /** getter to return current "best" attack matrix for highest current level */
  get matrixSlice() {
    const bestIndexCheck = 10;
    // best matrix slice for class(es)
    let bestmSlice = undefined;
    // Set the default matrix table as 'fighter' if not defined in the system
    const matrixAs = this.system.matrixTable ?? 'fighter';

    // Determine combat level based on the type of the character (npc or player)
    let combatLevel = this.type === 'npc' ? this.effectiveLevel : this.getMaxLevel();
    // Get the initial matrix slice using the default matrix table and combat level
    let mSlice = this.getMatrixSliceByLevel(matrixAs, combatLevel);

    // Get the active classes for the character
    const activeClasses = this.getActiveClasses();
    // Check if there are any active classes
    if (activeClasses.length) {
      // Iterate over each active class
      activeClasses.forEach((cl) => {
        // Check if the class has a matrix table defined in the system
        if (cl.system.matrixTable) {
          // Determine the safe combat level for the class, defaulting to 1 if not defined
          const safeCombatLevel = Math.max(0, cl.classDetails.level ?? 1);
          // Get the matrix slice for the current class and safe combat level
          const cSlice = this.getMatrixSliceByLevel(cl.system.matrixTable, safeCombatLevel);
          // Update the matrix slice if it is not set or if the current slice is better
          if (!bestmSlice || cSlice[bestIndexCheck] < bestmSlice[bestIndexCheck]) {
            bestmSlice = cSlice;
          }
        }
      });
    }
    if (!bestmSlice && activeClasses.length) {
      ui.notifications.warn(`No attack matrix found in class list for ${this.name}, defaulting to fighter. Required for Standard and Variant 1 settings.`)
    } else if (activeClasses.length) {
      mSlice = bestmSlice;
    }
    // Return the final matrix slice
    return mSlice;
  }


  /**
   * 
   * called before actor created
   * 
   * @param {*} data 
   * @param {*} options 
   * @param {*} user 
   */
  async _preCreate(data, options, user) {
    // do stuff to data, options, etc
    // console.log("actor.js _preCreate", { data, options, user })
    await super._preCreate(data, options, user);
    if (!data.hasOwnProperty('prototypeToken'))
      await this._createTokenPrototype(data);
  }

  async _onCreate(data, options, userId) {
    // console.log("actor.js _onCreate", { data, options, userId })
    await super._onCreate(data, options, userId);
    await this._postCreate(data, options, userId);
  }

  // /**@override */
  // async _onUpdate(data, options, userId) {
  //   console.log("actor.js _onUpdate", { data, options, userId })
  //   await super._onUpdate(data, options, userId);
  //   // await this.actor.update(newData????)
  // }

  async _postCreate(data, options, userId) {
    // console.log("actor.js _postCreate", { data, options, userId })
    if (!CONFIG.ARS.icons?.general?.actors) return;

    const normalDefaultIcon = 'icons/svg/mystery-man.svg';

    const defaultActorIcon = CONFIG.ARS.icons.general.actors[data.type];
    if (defaultActorIcon && this.img === normalDefaultIcon) {
      // We have to check if the current image is the normal "mystery man" icon because otherwise this replaces
      // icons during duplication. It's a hack but I don't see a way to detect duplication.
      await this.update({ img: defaultActorIcon });
    }
  }

  /**@override */
  async _preUpdate(changed, options, user) {
    // console.log("actor.js _preUpdate()", { changed, options, user })
    const actorSystem = foundry.utils.deepClone(this.system);
    const updateData = this._getClassHPData(foundry.utils.mergeObject({ system: actorSystem }, changed));

    if (updateData)
      this.updateSource(updateData);
    return super._preUpdate(changed, options, user);
  }



  /**@override */
  // _preUpdateEmbeddedDocuments(embeddedName, result, options, userId) {
  //   console.log("actor.js _preUpdateEmbeddedDocuments", { embeddedName, result, options, userId })
  //   super._preUpdateEmbeddedDocuments(embeddedName, result, options, userId);
  // }


  /**@override so that we can make sure that items updated such as class/abilities hp calcs will be managed */
  _onUpdateDescendantDocuments(embeddedName, documents, result, options, userId) {
    // console.log("actor.js _onUpdateEmbeddedDocuments", { embeddedName, documents, result, options, userId })
    super._onUpdateDescendantDocuments(embeddedName, documents, result, options, userId);

    const promise = new Promise((resolve) => {
      resolve(this._getClassHPData());
    });
    promise.then(async (classHPData) => {
      if (classHPData)
        await this.update(classHPData);
      await this.getToken()?.updateLight();
      await this.getToken()?.updateSight();
    });
  }
  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    // console.log("actor.js prepareData", this)

    this.system.mods = {}; // do this or the mods values from ActiveEffects increment during super.prepareData();
    super.prepareData();

    const data = this.system;
    // data.config = ARS;

    // the order of the following functions matter, keep that in mind

    const isPC = (this.type === "character");

    // @system.abilities.*, ability fields like opendoors, spell failure
    this._buildAbilityFields(data);

    action.prepareDerivedData(this);

    // this._prepareCharacterItems(data);

    //TODO: this._prepare try this?
    this._prepareCharacterItems(this);

    // Prepare PC specific 
    if (isPC) {
      this._prepareClassProficiencySlots(data);
    } else {
      // NPC specific
    }

    // _prepareCasterLevels needs to run after _prepareCharacterItems() so we have a list of actor.classes
    // @rank.levels.{arcane|divine} TOTAL (base+mods)
    this._prepareCasterLevels(data);

    //** wait for this to finish before the rest is processed */
    this._prepareCharacterData(data);

    //-- build selection lists for 

    // setup Armor values based on worn/etc
    this._prepareArmorClass(data);

    // this._prepareSpellsByLevel(data);
    this._prepareMemorizationSlotData(data);
    this._prepareMemorization(data);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(data) {
    if (this.isOwner)
      this._prepareClassData();
  }

  /** @override */
  prepareDerivedData() {
    // console.log("actor.js prepareDerivedData", this, this.overrides)
    super.prepareDerivedData();

    // for v10
    this.name = this.getName();

    // const data = this.system;
    const isPC = (this.type === "character");

    // add some data that can be referenced in formulas.
    this.system.initStatusMod = this.initiativeModifier;
    this.system.initSizeMod = this.initiativeModifierForSize;

    if (game.user.isGM) {
      // this is a backhanded way to make sure the party-tracker entry
      // is current.
      if (isPC && game.party?.getMembers().length) {
        game.party.updateMember();
      }
    }
    // console.log("actor.js prepareDerivedData", this);
  }


  /**
     * 
     * We use this to add values that can easily be accessed from
     * handlebars to generate specific output in the spell/memorization
     * section
     * 
     * @param {*} data 
     */
  _prepareMemorizationSlotData(data) {
    const systemVariant = ARS.settings.systemVariant;

    // console.log("actor.js _prepareMemorizationSlotData 1", duplicate(data), this)

    // data.spellInfo.slots.arcane.1 ADD #
    data.memorizations = {};
    let hasSpellSlots = false;
    let slotsCount = {};
    for (const spellType in data.spellInfo.slots) {
      slotsCount[spellType] = 0;
      let bTypeHasSlots = false;
      // console.log("actor.js _prepareMemorizationSlotData type", { spellType });
      Object.values(data.spellInfo.slots[spellType].value).forEach((slotCount, index) => {
        if (slotCount > 0) {
          hasSpellSlots = true;
          bTypeHasSlots = true;

          if (spellType === 'divine') {
            const wis = data.abilities.wis.value;
            if (wis > 25) wis = 25;
            if (wis < 1) wis = 1;
            const wisBonusSlots = game.ars.config.wisdomBonusSlots[systemVariant][wis][index];
            const disableWisBonus = this.classes.find(entry => entry.system.features.wisSpellBonusDisabled);
            // is disableWisBonus then we dont include high wis spell slot bonuses
            slotCount += disableWisBonus ? 0 : wisBonusSlots;
          }
          //TODO add optional bonus for high int here?
          // add in bonuses from mod.spells.slots[spellType][index] = value here?
          slotsCount[spellType] += parseInt(slotCount);
        }

        // memSlots[spellType][level][index] = { name: item.name, level: level, img: item.img, cast: false, id: item.id, uuid: item.uuid, };
        // populate prepSlots that don't exist so we have blanks to fill in character sheet

        if (slotCount < 1 || !data.spellInfo.memorization[spellType][index]) {
          data.spellInfo.memorization[spellType][index] = {};
        }

        let prepSlots = Object.values(data.spellInfo.memorization[spellType][index]).length || 0;
        if (prepSlots < slotCount) { // add blank slots that were added
          for (let i = prepSlots; i < slotCount; i++) {
            data.spellInfo.memorization[spellType][index][i] = {
              name: null,
              level: index,
            }
          }
        } else if (prepSlots > slotCount) { // remove slots that no longer exist
          for (let i = prepSlots; i > slotCount; i--) {
            delete data.spellInfo.memorization[spellType][index][Object.keys(data.spellInfo.memorization[spellType][index])[Object.keys(data.spellInfo.memorization[spellType][index]).length - 1]]
          }
        }

      });

      if (bTypeHasSlots) {
        data.memorizations[spellType] = {
          'memslots': foundry.utils.deepClone(data.spellInfo.memorization[spellType]),
          'totalSlots': slotsCount[spellType],
          'spellslots': foundry.utils.deepClone(data.spellInfo.slots[spellType]),
          // 'spellsByLevel': data.spellsByLevel[spellType],
        }
      }

    }

    // console.log("actor.js _prepareMemorizationSlotData 2", duplicate(data), this)

    this.hasSpellSlots = hasSpellSlots;
  }


  /**
   * 
   * data for memslots we only need if we have a sheet populated
   * 
   * @param {*} data 
   */
  _prepareMemorization(data) {
    // console.trace("actor.js _prepareMemorization", { data }, this);
    const promiseArray = [];

    for (const spellType of ['arcane', 'divine']) {
      if (data?.memorizations?.[spellType]) {
        for (let level = 0; level < data.memorizations[spellType].memslots.length; level++) {
          for (let slot = 0; slot < Object.values(data.memorizations[spellType].memslots[level]).length; slot++) {
            const spellId = data.memorizations[spellType].memslots[level][slot].id;
            if (spellId) {
              let spellItem = this.getEmbeddedDocument("Item", spellId);
              if (spellItem) {
                data.memorizations[spellType].memslots[level][slot].spellItem = spellItem;
              } else {
                const getItemPromise = utilitiesManager.getItem(spellId).then((item) => {
                  spellItem = item;
                  if (spellItem) data.memorizations[spellType].memslots[level][slot].spellItem = spellItem;
                });
                promiseArray.push(getItemPromise);
              }
            }
          }
        }
      }
    }
    return Promise.all(promiseArray);
  }

  /**
  * 
  * Flip through classes and calculate levels for @ranks.levels.{}
  * 
  * @param {*} data 
  */
  _prepareCasterLevels(data) {
    // console.log("actor.js", "_prepareCasterLevels", "data", data);

    // build casting structure
    data.rank = {
      levels: {
        arcane: 0,
        divine: 0
      }
    }
    data.rank.levels.arcane = parseInt(data.spellInfo.level.arcane.value + parseInt(data.mods?.levels?.arcane || 0));
    data.rank.levels.divine = parseInt(data.spellInfo.level.divine.value + parseInt(data.mods?.levels?.divine || 0));

    // Go through classes on character and get levels so we can reference as @rank.levels.fighter @rank.levels.paladin etc...
    this.classes.forEach(classEntry => {
      // const match = classEntry.name.match(/^(\w+)/);
      // const className = match ? match[1].toLowerCase() : '';
      const className = classEntry.name.slugify({ strict: true });
      if (className) {
        // get advancement records for this class to find level
        const advancement = classEntry.system?.advancement ? Object.values(classEntry.system.advancement) : undefined;
        const level = this.getClassLevel(classEntry);
        if (level) {
          data.rank.levels[className] =
            level + parseInt(data.mods?.levels?.[className] ? data.mods.levels[className] : 0);
        }
      }
    });

    data.rank.levels.max = this.getMaxLevel();
    data.rank.levels.min = this.getMinLevel();
    // console.log("actor.js _prepareCasterLevels====== data 2", data)
  }

  /**
   * 
   * Calculate avaliable weapon/non-weapon slots based on class/levels
   * 
   * @param {*} data 
   */
  _prepareClassProficiencySlots(data) {
    let nonProfPenalty = -5;
    let weaponProfs = 0;
    let weaponEarn = 999;
    let weaponStart = 0;
    let skillProfs = 0;
    let skillEarn = 999;
    let skillStart = 0;

    // find the best weapon/non-weapon prof slot count starting and earned per level
    this.classes.forEach(classEntry => {
      if (classEntry.system.proficiencies.weapon.earnLevel < weaponEarn) weaponEarn = classEntry.system.proficiencies.weapon.earnLevel;
      if (classEntry.system.proficiencies.skill.earnLevel < skillEarn) skillEarn = classEntry.system.proficiencies.skill.earnLevel;

      if (classEntry.system.proficiencies.weapon.starting > weaponStart) weaponStart = classEntry.system.proficiencies.weapon.starting;
      if (classEntry.system.proficiencies.skill.starting > skillStart) skillStart = classEntry.system.proficiencies.skill.starting;

      if (classEntry.system.proficiencies.penalty > nonProfPenalty) nonProfPenalty = classEntry.system.proficiencies.penalty;
    });

    weaponProfs += weaponStart;
    skillProfs += skillStart;

    // now apply best prof values at specific levels
    const maxLevel = this.getMaxLevel();
    for (let level = 1; level < maxLevel; level++) {
      if (level % weaponEarn === 0) {
        weaponProfs++;
      }
      if (level % skillEarn === 0) {
        skillProfs++;
      }
    }

    // calculate used weapon/non-weapon profs
    let spentWeapon = 0;
    let spentNonWeapon = 0;
    for (const profItem of this.proficiencies) {
      spentWeapon += parseInt(profItem.system.cost);
    }
    for (const skillItem of this.skills) {
      spentNonWeapon += parseInt(skillItem.system.features.cost);
    }

    data.attributes.proficiencies.weapon.used = spentWeapon;
    data.attributes.proficiencies.skill.used = spentNonWeapon;
    data.attributes.proficiencies.weapon.value = weaponProfs;
    data.attributes.proficiencies.weapon.penalty = nonProfPenalty;
    data.attributes.proficiencies.skill.value = skillProfs;
  }


  /**
   * 
   * Go through inventory, find equipped gear, set armor values
   * 
   * @param {*} data 
   */
  _prepareArmorClass(data) {
    // console.log("actor.js _prepareArmorClass start", this.name, duplicate(data));

    const useArmorDamage = (game.ars.config.settings.systemVariant == '2' && game.ars.config.settings.useArmorDamage);
    const rollData = this.getRollData();
    data.armorClass = {};

    let bestArmor = data.attributes.ac.value;
    let bestArmorMod = 0;
    let shieldArmor = 0;
    let ringArmor = 0;
    let cloakArmor = 0;
    let otherArmor = 0;

    let wornMagicArmor = false;
    let wornArmor = false;
    let wornLeatherArmor = false;

    let wornMagicShield = false;
    let wornShield = false;

    let wornWarding = false;

    let wornRing = false;
    let bestWornRing = 0;
    let wornCloak = false;
    let bestWornCloak = 0;

    for (const item of this.armors) {

      //if using armor damage and the protection points are 0 and max protection points > 0 dont coint it.
      if (useArmorDamage &&
        parseInt(item.system.protection.points.value) < 1 &&
        parseInt(item.system.protection.points.max) > 0)
        continue;

      // console.log("actor.js _prepareArmorClass", item)
      if (item.system.location.state === 'equipped') {
        switch (item.system.protection.type) {
          case "armor":
          case 'warding':
            if (item.system.protection.ac < bestArmor) {

              // warding isn't "armor"
              if (item.system.protection.type === 'armor') {
                if (item.system.attributes.magic && !wornMagicArmor) wornMagicArmor = true;
                if (!wornArmor) wornArmor = true;
                if (!wornLeatherArmor && item.name.toLowerCase().includes('leather')) wornLeatherArmor = true;
              } else {
                if (!wornWarding) wornWarding = true;
              }

              bestArmor = parseInt(item.system.protection.ac);
              bestArmorMod = parseInt(item.system.protection.modifier);
            }
            break;

          case "shield":
            shieldArmor += parseInt(item.system.protection.ac) + parseInt(item.system.protection.modifier);
            if (item.system.attributes.magic && !wornMagicShield) wornMagicShield = true;
            if (!wornShield) wornShield = true;

            break;

          case "ring":
            ringArmor = parseInt(item.system.protection.modifier);
            if (!wornRing) wornRing = true;
            if (ringArmor > bestWornRing) bestWornRing = ringArmor;
            break;

          case "cloak":
            cloakArmor = parseInt(item.system.protection.modifier);
            if (!wornCloak) wornRing = true;
            if (cloakArmor > bestWornCloak) bestWornRing = cloakArmor;
            break;

          default:
            otherArmor += parseInt(item.system.protection.modifier);
            break;
        }
      } // is equipped?
    } // for all items

    /**
      * ActiveEffect
      * 
      * data.mods.ac.value 
      * data.mods.ac.base (use lowest)
      */
    if (data.mods?.ac?.base) {
      const modBase = parseInt(data.mods.ac.base);
      if (modBase < bestArmor) bestArmor = modBase;
    }
    let armorMod = 0;
    if (data.mods?.ac?.value) {
      const modValue = parseInt(data.mods.ac.value || 0);
      armorMod = -(modValue);
    }
    if (data.mods?.formula?.ac?.value) {
      const modFormulaValue = utilitiesManager.evaluateFormulaValue(data.mods.formula.ac.value, this.getRollData())
      armorMod = -(modFormulaValue);
    }
    // TODO: add an override like data.mods.ac.baseoverride and ac.valueoverride ?

    // we flip values in AC fields so AC: 1 is good, AC: -4 would be bad 
    // so things like shield +1 with AC: 1 make sense to people
    data.armorClass.armor = bestArmor - bestArmorMod;
    data.armorClass.shield = -(shieldArmor);
    // can't wear magic armor with rings, use only best ring
    data.armorClass.ring = -(wornMagicArmor ? 0 : bestWornRing);
    // can't wear non-leather armor, or magic armor of anytype or any shield
    data.armorClass.cloak = -(!wornLeatherArmor || wornShield || wornMagicArmor ? 0 : bestWornCloak);
    data.armorClass.other = -(otherArmor);
    // get dex mod
    data.armorClass.dex = parseInt(data.abilities.dex.defensive);

    // get the best class acDexmod and apply it
    if (Object.values(this.activeClasses).length) {
      let acDexMod = 0;
      this.classes.forEach((classEntry) => {
        // const newAcDex = parseInt(classEntry.classDetails?.acDex) || 0;
        const newAcDex = parseInt(utilitiesManager.evaluateFormulaValue(classEntry.system.features.acDexFormula, rollData)) || 0;
        if (acDexMod > newAcDex) acDexMod = newAcDex;
      });
      if (acDexMod) {
        const dexACOverride = data.mods?.ac?.formula?.dex ? utilitiesManager.evaluateFormulaValue(data.mods.formula.ac.dex, rollData) : 0;
        data.armorClass.dex = acDexMod;
      }
    }

    /**
     * ActiveEffect
     * 
     * data.mods.ac.melee.value
     * data.mods.ac.ranged.value
     * data.mods.ac.melee.base (use lowest)
     * data.mods.ac.ranged.base (use lowest)
     * 
     * data.mods.ac.rear.value
     * data.mods.ac.rear.ranged
     * data.mods.ac.rear.melee
     * data.mods.ac.front.value
     * data.mods.ac.front.ranged
     * data.mods.ac.front.melee
     * 
     * let armorFront = parseInt(system.mods.ac.front.value || 0);
     * let armorRear  = parseInt(data.mods.ac.rear.value || 0);
     * 
     * let armorMeleeFront = parseInt(data.mods.ac.front.melee || 0);
     * let armorMeleeRear  = parseInt(data.mods.ac.rear.ranged || 0);
     * 
     * let armorRangedFront = parseInt(data.mods.ac.front.melee || 0);
     * let armorRangedRear  = parseInt(data.mods.ac.rear.ranged || 0);
     * 
     */

    // melee/ranged specific AC fields
    let armorRangedBase = data.armorClass.armor;
    let armorRangedMod = 0;

    if (data.mods?.ac?.ranged?.base) {
      const modValue = parseInt(data.mods.ac.ranged.base || bestArmor);
      if (modValue < armorRangedBase) armorRangedBase = modValue;
    }

    if (data.mods?.ac?.ranged?.value) {
      const modValue = parseInt(data.mods.ac.ranged.value || 0);
      armorRangedMod = -(modValue);
    }

    //------------------
    let armorRangedBaseFront = armorRangedBase;
    let armorRangedModFront = armorRangedMod;
    if (data.mods?.ac?.ranged?.front?.base) {
      const modValue = parseInt(data.mods.ac.ranged.front.base || bestArmor);
      if (modValue < armorRangedBaseFront) armorRangedBaseFront = modValue;
    }
    if (data.mods?.ac?.ranged?.front?.value) {
      const modValue = parseInt(data.mods.ac.ranged.front.value || 0);
      armorRangedModFront = -(modValue);
    }
    if (data.mods?.formula?.ac?.ranged?.front?.value) {
      const modValue = utilitiesManager.evaluateFormulaValue(data.mods.formula.ac.ranged.front.value, rollData);
      armorRangedModFront = armorRangedModFront + -(modValue);
    }

    let armorRangedBaseRear = armorRangedBase;
    if (data.mods?.ac?.ranged?.rear?.base) {
      const modValue = parseInt(data.mods.ac.ranged.rear.base || bestArmor);
      if (modValue < armorRangedBaseRear) armorRangedBaseRear = modValue;
    }
    let armorRangedModRear = (armorRangedMod);
    if (data.mods?.ac?.ranged?.rear?.value) {
      const modValue = parseInt(data.mods.ac.ranged.rear.value || 0);
      armorRangedModRear = -(modValue);
    }
    if (data.mods?.formula?.ac?.ranged?.rear?.value) {
      const modValue = utilitiesManager.evaluateFormulaValue(data.mods.formula.ac.ranged.rear.value, rollData);
      armorRangedModRear = armorRangedModRear + -(modValue);
    }

    let armorBaseRear = data.armorClass.armor;
    if (data.mods?.ac?.rear?.base) {
      const modValue = parseInt(data.mods.ac.rear.base || bestArmor);
      if (modValue < armorBaseRear) armorBaseRear = modValue;
    }

    let armorBaseFront = data.armorClass.armor;
    if (data.mods?.ac?.front?.base) {
      const modValue = parseInt(data.mods.ac.front.base || bestArmor);
      if (modValue < armorBaseFront) armorBaseFront = modValue;
    }
    let armorFrontMod = (armorMod);
    if (data.mods?.ac?.front?.value) {
      const modValue = parseInt(data.mods.ac.front.value || 0);
      armorFrontMod = -(modValue);
    }
    if (data.mods?.formula?.ac?.front?.value) {
      const modValue = utilitiesManager.evaluateFormulaValue(data.mods.formula.ac.front.value, rollData);
      armorFrontMod = armorFrontMod + -(modValue);
    }
    let armorRearMod = (armorMod);
    if (data.mods?.ac?.rear?.value) {
      const modValue = parseInt(data.mods.ac.rear.value || 0);
      armorRearMod = -(modValue);
    }
    if (data.mods?.formula?.ac?.rear?.value) {
      const modValue = utilitiesManager.evaluateFormulaValue(data.mods.formula.ac.rear.value, rollData);
      armorRearMod = armorRearMod + -(modValue);
    }
    //----------------

    let armorMeleeBase = data.armorClass.armor;
    let armorMeleeMod = (armorMod);
    if (data.mods?.ac?.melee?.base) {
      const modValue = parseInt(data.mods.ac.melee.base || bestArmor);
      if (modValue < armorMeleeBase) armorMeleeBase = modValue;
    }
    if (data.mods?.ac?.melee?.value) {
      const modValue = parseInt(data.mods.ac.melee.value || 0);
      armorMeleeMod = -(modValue);
    }

    let armorMeleeBaseFront = armorMeleeBase;
    let armorMeleeModFront = armorMeleeMod;
    if (data.mods?.ac?.melee?.front?.base) {
      const modValue = parseInt(data.mods.ac.melee.front.base || bestArmor);
      if (modValue < armorMeleeBaseFront) armorMeleeBaseFront = modValue;
    }
    if (data.mods?.ac?.melee?.front?.value) {
      const modValue = parseInt(data.mods.ac.melee.front.value || 0);
      armorMeleeModFront = -(modValue);
    }
    if (data.mods?.formula?.ac?.melee?.front?.value) {
      const modValue = utilitiesManager.evaluateFormulaValue(data.mods.formula.ac.melee.front.value, rollData);
      armorMeleeModFront = armorMeleeModFront + -(modValue);
    }
    // mods.formula.ac.melee.front.value

    let armorMeleeBaseRear = armorMeleeBase;
    let armorMeleeModRear = 0;
    if (data.mods?.ac?.melee?.rear?.base) {
      const modValue = parseInt(data.mods.ac.melee.rear.base || bestArmor);
      if (modValue < armorMeleeBaseRear) armorMeleeBaseRear = modValue;
    }
    if (data.mods?.ac?.melee?.front?.value) {
      const modValue = parseInt(data.mods.ac.melee.rear.value || 0);
      armorMeleeModRear = -(modValue);
    }
    if (data.mods?.formula?.ac?.melee?.rear?.value) {
      const modValue = utilitiesManager.evaluateFormulaValue(data.mods.formula.ac.melee.rear.value, rollData);
      armorMeleeModRear = armorMeleeModRear + -(modValue);
    }

    // let armorFront = data.mods?.ac?.front?.value ? parseInt(data.mods.ac.front.value || 0) : 0;
    // let armorRear = data.mods?.ac?.rear?.value ? parseInt(data.mods.ac.rear.value) : 0;

    // let armorMeleeFront = data.mods?.ac?.front?.melee ? parseInt(data.mods.ac.front.melee) : 0;
    // let armorMeleeRear = data.mods?.ac?.rear?.melee ? parseInt(data.mods.ac.rear.melee) : 0;

    // let armorRangedFront = data.mods?.ac?.front?.ranged ? parseInt(data.mods.ac.front.ranged) : 0;
    // let armorRangedRear = data.mods?.ac?.rear?.ranged ? parseInt(data.mods.ac.rear.ranged) : 0;

    // console.log("actor.js _prepareArmorClass", { armorBaseFront, armorFrontMod, armorBaseRear, armorRearMod, armorRangedFront, armorRangedRear, })

    // complete AC with everything
    data.armorClass.normal = Math.min(10,
      // data.armorClass.armor +
      armorBaseFront +
      armorFrontMod +
      data.armorClass.shield +
      data.armorClass.ring +
      data.armorClass.cloak +
      // data.armorClass.modEffects +
      data.armorClass.other +
      data.armorClass.dex
    );

    // remove shield
    data.armorClass.shieldless = Math.min(10,
      // data.armorClass.armor +
      armorBaseFront +
      armorFrontMod +
      data.armorClass.ring +
      data.armorClass.cloak +
      // data.armorClass.modEffects +
      data.armorClass.other +
      data.armorClass.dex
    )

    // remove dex/shield
    data.armorClass.rear = Math.min(10,
      // data.armorClass.armor +
      armorBaseRear +
      armorRearMod +
      data.armorClass.ring +
      data.armorClass.cloak +
      // data.armorClass.modEffects +
      data.armorClass.other
    )

    // ignore armor base AC but keep mods
    data.armorClass.touch = Math.min(10,
      data.attributes.ac.value +
      data.armorClass.shield +
      data.armorClass.ring +
      data.armorClass.cloak +
      // data.armorClass.modEffects +
      data.armorClass.other +
      data.armorClass.dex - bestArmorMod
    )

    // ignore armor base ac but keep mods minus dex/shield from rear
    data.armorClass.touchrear = Math.min(10,
      data.attributes.ac.value +
      data.armorClass.ring +
      data.armorClass.cloak +
      // data.armorClass.modEffects +
      data.armorClass.other - bestArmorMod
    )

    // ignore dex
    data.armorClass.nodex = Math.min(10,
      data.armorClass.armor +
      data.armorClass.shield +
      data.armorClass.ring +
      data.armorClass.cloak +
      // data.armorClass.modEffects +
      armorFrontMod +
      data.armorClass.other
    )

    // ranged specific AC
    data.armorClass.ranged = Math.min(10,
      parseInt(
        // armorRangedBase +
        // armorRangedMod +
        armorRangedBaseFront +
        armorRangedModFront +
        data.armorClass.shield +
        data.armorClass.ring +
        data.armorClass.cloak +
        // data.armorClass.modEffects +
        data.armorClass.other +
        // armorRangedFront +
        data.armorClass.dex)
    )

    data.armorClass.rangedrear = Math.min(10,
      parseInt(
        // armorRangedBase +
        // armorRangedMod +
        armorRangedBaseRear +
        armorRangedModRear +
        data.armorClass.ring +
        data.armorClass.cloak +
        // data.armorClass.modEffects +
        data.armorClass.other
        //+ armorRangedRear
      )
    )

    //TODO
    /**
     * I'm not sure if I should use these. Normal ac isnt melee things get complicated. 
     * What do you display as normal? normal front? Shieldless?
     */

    // melee specific AC
    data.armorClass.melee = parseInt(
      armorMeleeBase +
      armorMeleeModFront +
      data.armorClass.shield +
      data.armorClass.ring +
      data.armorClass.cloak +
      // data.armorClass.modEffects +
      data.armorClass.other +
      // armorMeleeFront +
      data.armorClass.dex);

    data.armorClass.meleerear = parseInt(
      armorMeleeBaseRear +
      armorMeleeModRear +
      // data.armorClass.shield +
      data.armorClass.ring +
      data.armorClass.cloak +
      // data.armorClass.modEffects +
      data.armorClass.other
      // +armorMeleeRear
    );
    // data.armorClass.dex;

    data.armorClass.tooltip =
      `<b>AC</b><p/>` +
      `Normal ${data.armorClass.normal}<p/>` +
      `Rear ${data.armorClass.rear}<p/>` +
      `Shieldless ${data.armorClass.shieldless}<p/>` +
      `No Dexterity ${data.armorClass.nodex}<p/>` +
      `Melee ${data.armorClass.melee}<p/>` +
      `Melee Rear ${data.armorClass.meleerear}<p/>` +
      `Ranged ${data.armorClass.ranged}<p/>` +
      `Ranged Rear ${data.armorClass.rangedrear}`;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} data The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(data) {
    // console.log("actor.js _prepareCharacterItems data-->", data);

    data.weapons = this.items.filter(function (item) { return item.type === 'weapon' }).sort(utilitiesManager.sortByRecordName);

    data.potions = this.items.filter(function (item) { return item.type === 'potion' });

    data.proficiencies = this.items.filter(function (item) { return item.type === 'proficiency' }).sort(utilitiesManager.sortByRecordName);

    data.skills = this.items.filter(function (item) { return (item.type === 'skill') }).sort(utilitiesManager.sortByRecordName);

    // spells but not type scroll
    data.spells = this.items.filter(function (item) { return item.type === 'spell' && item.system?.attributes?.type.toLowerCase() !== 'scroll' }).sort(utilitiesManager.sortByRecordName);

    // spells but type set to scroll
    data.scrolls = this.items.filter(function (item) {
      return item.type === 'spell' && item.system?.attributes?.type.toLowerCase() === 'scroll'
    });

    data.armors = this.items.filter(function (item) { return game.ars.config.itemProtectionTypes.includes(item.type) });

    data.containers = this.items.filter(function (item) { return item.type === 'container' });

    data.backgrounds = this.items.filter(function (item) { return item.type === 'background' });

    data.classes = this.items.filter(function (item) { return item.type === 'class' });

    data.abilityList = this.items.filter(function (item) { return item.type === 'ability' });

    data.activeClasses = this.items.filter(function (item) { return item.type === 'class' && item.system.active });
    data.deactiveClasses = this.items.filter(function (item) { return item.type === 'class' && !item.system.active });

    // data.gear = this.items.filter(function (item) { return item.type === 'item' });
    data.gear = this.items.filter(function (item) { return game.ars.config.itemGearTypes.includes(item.type) });

    // find a race item and set it to the details.race
    data.races = this.items.filter(function (item) { return item.type === 'race' });
    if (!data.details) data.details = {}
    data.details.race = data.races[0];

    data.inventory = this.items.filter(function (item) {
      return !game.ars.config.nonInventoryTypes.includes(item.type)
    });

    data.inventory.sort(utilitiesManager.sortByRecordName);

    data.actionInventory = this.items.filter(function (item) {
      if (!item.isIdentified) return false;
      if ((item.type === 'spell' && item.system?.attributes?.type.toLowerCase() === 'scroll'))
        return true;
      if (item.type !== 'spell') return true;
    });
    data.actionInventory.sort(utilitiesManager.sortByRecordName);

    data.equipped = this.items.filter(function (item) {
      return item.system?.location?.state === 'equipped'
    });

    data.carried = this.items.filter(function (item) {
      return item.system?.location?.state === 'carried'
    });

    data.nocarried = this.items.filter(function (item) {
      return item.system?.location?.state !== 'equipped' && item.system?.location?.state !== 'carried';
    });

    data.provisions = data.carried.filter(function (item) {
      return item.system?.attributes?.type.toLowerCase() === 'provisions' ||
        item.system?.attributes?.subtype.toLowerCase() === 'provisions';
    });

    data.ammo = data.carried.filter(function (item) {
      return item.system?.attributes?.type.toLowerCase() === 'ammunition' ||
        item.system?.attributes?.subtype.toLowerCase() === 'ammunition';
    });

    // calculate weight carried/encumbrance
    const weightItems = this.items.filter((item) => {
      return ['equipped', 'carried'].includes(item.system?.location?.state);
    });

    let carriedweight = 0;
    weightItems.forEach(item => {
      const count = parseFloat(item.system?.quantity) || 0;
      const weight = parseFloat(item.system?.weight) || 0;
      carriedweight += (count * weight);
    });

    //add coin weight carried 
    if (game.ars.config.settings.encumbranceIncludeCoin) {
      const coinWeight = (1 / ARS.currencyWeight[game.ars.config.settings.systemVariant]);
      let coinCount = 0;
      for (const coin in this.system.currency) {
        if (!isNaN(this.system.currency[coin]))
          coinCount += parseInt(this.system.currency[coin]) || 0;
      }
      if (coinCount) {
        const coinTotalWeight = (coinCount * coinWeight);
        carriedweight += coinTotalWeight;
      }
    }

    // osric/1e have a 150 base + str allow
    // 2e uses value listed
    let maxWeight = parseInt(this.system.abilities.str.allow)
    const currentStr = parseInt(this.system.abilities.str.value);
    switch (game.ars.config.settings.systemVariant) {

      // ACKs we will always be case zero
      case '0':
      case '1':

        maxWeight += 150;
        break;

      default:
        break;
    }

    this.maxWeight = maxWeight;
    this.carriedweight = Number(carriedweight).toFixed(2);

    this.dailyprovisions = {
      food: this.system.details?.provisions?.food ? this.getEmbeddedDocument('Item', this.system.details.provisions.food) : undefined,
      water: this.system.details?.provisions?.water ? this.getEmbeddedDocument('Item', this.system.details.provisions.water) : undefined,
    }
  }

  /**
     * This populates the ability fields for the sheet display and
     * it also populates values that can be used for modifiers such as 
     * @data.abilities.str.dmg 
     * 
     * @param {*} data 
     */
  _buildAbilityFields(data) {
    const systemVariant = ARS.settings.systemVariant;

    // console.log("_buildAbilityFields", { data })

    function sanitizeValue(value) {
      let sanitizedValue = parseInt(value) || 1;
      if (!Number.isInteger(sanitizedValue)) {
        console.log(`${this.name} ${key}:${sanitizedValue} is bogus`);
        sanitizedValue = 1;
      }
      return Math.min(Math.max(sanitizedValue, 1), 25);
    }

    function getStrengthValue(abl) {
      if (abl.value !== 18 || abl.percent <= 0) return abl.value;
      if (abl.percent >= 100) return 100;
      if (abl.percent >= 91) return 99;
      if (abl.percent >= 76) return 90;
      if (abl.percent >= 51) return 75;
      return 50;
    }

    /**
     * Builds fields onto abilities for display 
     * @param {String} key str/dex/con/etc
     * @param {Array} table ARS.strengthTable[systemVariant]
     * @param {Number} value Ability score 1-25
     * @param {Array} ignoreIndices Index entries in the table to ignore
     * @param {Number} endIndex The last entry to include in the fields
     * @returns 
     */
    function buildFields(key, table, value, ignoreIndices = [], endIndex = table[0].length) {
      return table[0]
        .slice(0, endIndex)
        .map((label, index) => ({
          value: table[value][index],
          label,
        }))
        .filter((_, index) => !ignoreIndices.includes(index))
        .reduce((acc, field, index) => {
          const propName = table[0][index].split('.').pop();
          if (!acc.fields)
            acc.fields = {};
          // set fields
          acc.fields[propName] = field;
          // set values
          acc[propName] = field.value;
          return acc;
        }, {});
    }


    for (let [key, abl] of Object.entries(data.abilities)) {
      abl.value = sanitizeValue(abl.value);

      switch (key) {
        case 'str': {
          const strValue = getStrengthValue(abl);
          abl.fields = buildFields(key, ARS.strengthTable[systemVariant], strValue, [], 6);
          Object.assign(abl, abl.fields);
          break;
        }
        case 'dex': {
          abl.fields = buildFields(key, ARS.dexterityTable[systemVariant], abl.value, [], 3);
          Object.assign(abl, abl.fields);
          break;
        }
        case 'con': {
          abl.fields = buildFields(key, ARS.constitutionTable[systemVariant], abl.value, [], 5);
          Object.assign(abl, abl.fields);
          break;
        }
        case 'int': {
          abl.fields = buildFields(key, ARS.intelligenceTable[systemVariant], abl.value, [], 5);
          Object.assign(abl, abl.fields);
          break;
        }
        case 'wis': {
          abl.fields = buildFields(key, ARS.wisdomTable[systemVariant], abl.value, [], 4);
          Object.assign(abl, abl.fields);
          if (abl.value >= 17) {
            // these are to long for char sheet display so add to tooltip
            abl.fields['bonus'].tip = ARS.wisdomTable[systemVariant][(parseInt(abl.value) + 100)][1];
            abl.fields['imm'].tip = ARS.wisdomTable[systemVariant][(parseInt(abl.value) + 100)][3];
          }
          break;
        }
        case 'cha': {
          abl.fields = buildFields(key, ARS.charismaTable[systemVariant], abl.value, [], 3);
          Object.assign(abl, abl.fields);
          break;
        }
        default: {
          console.log(`Unknown ability type ${key}`);
          ui.notifications.error(`Unknown ability type ${key}`);
          break;
        }
      }
    }
  }

  /**
   * Get the appropriate token for the current instance.
   * @returns {Object} The token object.
   */
  getToken() {
    let token;

    // Check if there is no active link to an actor.
    // If true, use the default token from the current instance.
    if (!this.prototypeToken.actorLink) {
      token = this.token;
    } else {
      // Otherwise, try to find the first active token among all tokens.
      const activeTokens = this.getActiveTokens(true, true);
      token = activeTokens.length > 0 ? activeTokens[0] : this.sheet?.token;
    }

    return token;
  }


  /**
   * Get the token ID.
   *
   * This function returns the ID of the token from either the instance property (this.token)
   * or by calling the method this.getToken().
   *
   * @return {number} The token ID.
   */
  getTokenId() {
    // If the token property exists in the current instance, we'll use it
    if (this.token) {
      // Using optional chaining and nullish coalescing to safely access the token ID
      // and return 'undefined' if the token or its ID is not available
      return this.token.id ?? undefined;
    } else {
      // If the token property doesn't exist, we'll call the getToken method to obtain the token object
      const token = this.getToken();

      // Using optional chaining and nullish coalescing to safely access the token ID
      // and return 'undefined' if the token or its ID is not available
      return token?.id ?? undefined;
    }
  }


  /**
   * 
   * _chatRoll: create chatCard for action/item/etc
   * 
   * @param {*} data 
   */
  async _chatRoll(data = {}, actionSource = this) {
    let chatData = {
      speaker: ChatMessage.getSpeaker(),
      user: game.user.id
    };

    const token = this.getToken();

    // console.log("actor.js _chatRoll this ", this);
    // console.log("actor.js _chatRoll token===================", { token });
    console.log("actor.js _chatRoll", { data, actionSource });

    const actions = data.actionGroup ? actionSource.system.actionList[data.actionGroup].actions : actionSource.system.actionList;
    const rAG = actionSource.system.actionList[data.actionGroup];

    let cardData = {
      actionGroupData: rAG,
      actionGroups: actionSource.system.actionList,
      ...data,
      actions: actions,
      config: ARS,
      ...this,
      item: data.item,
      owner: this.id,
      sourceActor: this,
      sourceToken: token,
    };

    chatData.content = await renderTemplate(this.chatTemplate[data.type], cardData);

    return ChatMessage.create(chatData);
  }


  /**
   * Returns the level of the given class record.
   *
   * @param {Object} classEntry - The class entry object.
   * @returns {number} - The level of the class record.
   */
  getClassLevel(classEntry) {
    // Initialize level variable to store the class level.
    let level = 0;

    // Check if 'system' and 'advancement' properties exist in classEntry, and retrieve values if so.
    const advancement = classEntry.system?.advancement ? Object.values(classEntry.system.advancement) : undefined;

    // If advancement array exists and is not empty, set level to its length.
    if (advancement && advancement.length) {
      level = advancement.length;
    }

    // Return the calculated level.
    return level;
  }


  // Get the maximum level from all classes
  getMaxLevel() {
    return this._getLevel('max');
  }

  // Get the minimum level from all classes
  getMinLevel() {
    return this._getLevel('min');
  }

  // Get the maximum level from active classes
  getMaxActiveLevel() {
    return this._getLevel('max', true);
  }

  // Consolidated function to reduce code size and improve maintainability
  _getLevel(type, activeOnly = false) {
    // Initialize level according to the required type (min or max)
    let level = type === 'max' ? 1 : Number.MAX_SAFE_INTEGER;

    // Iterate over each class entry
    this.classes.forEach((classEntry) => {
      // Get class source from item ID
      const classSource = this.items.get(classEntry.id);

      // Check if we should consider only active classes
      if (activeOnly && !classSource.active) return;

      // Get the advancement bundle length
      const advBundleLength = Object.values(classSource.system.advancement).length;

      // Update the level based on the type and the advancement bundle length
      if (type === 'max' && advBundleLength > level) {
        level = advBundleLength;
      } else if (type === 'min' && advBundleLength < level) {
        level = advBundleLength;
      }
    });

    // Return the calculated level
    return level;
  }

  /**
   * 
   * Return the max active classes for this character
   * 
   * @returns 
   */
  getActiveClassCount() {
    let classCount = 0;
    this.classes.forEach((classEntry) => {
      if (classEntry.system.active) classCount++;
    });

    return classCount;
  }

  /**
   * 
   * @returns array of active classes
   */
  getActiveClasses() {
    let activeClasses = []
    this.classes.forEach((classEntry) => {
      if (classEntry.system.active) activeClasses.push(classEntry);
    });

    return activeClasses;
  }

  /**
   * 
   * @returns max level for deactive class
   */
  getMaxDeactiveLevel() {
    let maxLevel = 1;
    this.classes.forEach((classEntry) => {
      const classSource = this.items.get(classEntry.id);
      const advBundle = Object.values(classSource.system.advancement);
      if (!classSource.active && advBundle.length > maxLevel) maxLevel = advBundle.length;
    });

    return maxLevel;
  }


  /**
  * This function creates a token prototype for a given actor data object.
  * 
  * @param {object} data - Actor data object
  */
  async _createTokenPrototype(data) {
    console.log("actor.js _createTokenPrototype", { data }, duplicate(data));
    let createData = {};

    // Create prototype token for characters
    if (data.type === "character") {
      console.log("actor.js _createTokenPrototype createData:PC");

      // Set default values for character tokens
      mergeObject(createData, {
        "prototypeToken.displayName": CONST.TOKEN_DISPLAY_MODES.ALWAYS,    // Always display name
        "prototypeToken.displayBars": CONST.TOKEN_DISPLAY_MODES.ALWAYS,    // Always display bars
        "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.FRIENDLY,   // Set disposition as friendly
        "prototypeToken.name": data.name,                                  // Set token name to actor name
        "prototypeToken.vision": true,                                     // Enable vision
        "prototypeToken.actorLink": true,                                  // Link token to actor
        "prototypeToken.bar1.attribute": "attributes.hp",
      });

      // Create prototype token for NPCs
    } else if (data.type === 'npc') {
      console.log("actor.js _createTokenPrototype createData:NPC");

      let visionRange = 0;
      let sizeSetting = 1;

      // Set vision range and size settings for NPCs with system data
      if (data.system) {
        const visionCheck = (data.system?.specialDefenses + data.system?.specialAttacks) || '';
        const match = visionCheck?.match(/vision (\d+)/i);
        if (match && match[1]) visionRange = parseInt(match[1]);

        switch (data.system.attributes.size) {
          case 'tiny':
            sizeSetting = 0.25;
            break;
          case 'small':
            sizeSetting = 0.5;
            break;
          case 'medium':
            sizeSetting = 1;
            break;
          case 'large':
            sizeSetting = 1;
            break;
          case 'huge':
            sizeSetting = 2;
            break;
          case 'gargantuan':
            sizeSetting = 3;
            break;
        }
      }

      // Set default values for NPC tokens
      mergeObject(createData, {
        "prototypeToken.vision": visionRange ? true : false,
        "prototypeToken.brightSight": visionRange,
        "prototypeToken.dimSight": visionRange,
        "prototypeToken.width": sizeSetting,
        "prototypeToken.height": sizeSetting,
        "prototypeToken.displayName": CONST.TOKEN_DISPLAY_MODES.HOVER,    // Display name on hover
        "prototypeToken.displayBars": CONST.TOKEN_DISPLAY_MODES.OWNER,    // Display bars for owner
        "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.HOSTILE,   // Set disposition as hostile
        "prototypeToken.name": data.name,                                  // Set token name to actor name
        "prototypeToken.bar1.attribute": "attributes.hp",
      }, { insertValues: true });

      // Create prototype token for lootable objects
    } else if (data.type === 'lootable') {

      // Set default values for lootable tokens
      mergeObject(createData, {
        "prototypeToken.vision": false,
        "prototypeToken.brightSight": 0,                                  // No vision range without light
        "prototypeToken.dimSight": 0,
        "prototypeToken.displayName": CONST.TOKEN_DISPLAY_MODES.OWNER,    // Display name for owner
        "prototypeToken.displayBars": CONST.TOKEN_DISPLAY_MODES.NONE, // Do not display bars
        "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.HOSTILE, // Set disposition as hostile
        "prototypeToken.name": data.name, // Set token name to actor name
        "prototypeToken.bar1.-=attribute": null,
      }, { insertValues: true });

      // Handle unknown actor types
    } else {
      // No specific token prototype settings for unknown actor types
    }

    console.log("actor.js _createTokenPrototype", { createData });
    await this.updateSource(createData);
  }


  /**
  * 
  * @override We override to remove sub-items also
  * 
  * @param {String} embeddedName The name of the embedded Document type
  * @param {Array.<string>} ids An array of string ids for each Document to be deleted
  * @param {{}} contextopt  Additional context which customizes the deletion workflow
  * @returns 
  */
  async deleteEmbeddedDocuments(embeddedName, ids, contextopt) {
    // console.log("actor.js EmbeddedDocuments delete", { embeddedName, ids, contextopt });
    // console.trace();
    if (embeddedName === 'Item') {
      for (const itemId of ids) {
        const source = this.items.get(itemId);
        if (source && source.system?.itemList && source.system.itemList.length) {
          let itemIdList = [];
          for (const entry of source.system.itemList) {
            const deleteItem = this.getEmbeddedDocument("Item", entry.id);
            if (deleteItem) itemIdList.push(entry.id);
          }
          if (itemIdList.length) {
            if (!contextopt?.hideChanges && !this.isLooting)
              await dialogManager.showItems(this, itemIdList, `Contained Items Deleted`, `Items Removed`);
            await this.deleteEmbeddedDocuments("Item", itemIdList, contextopt);
          }
        }
      }
    }
    // return super.deleteEmbeddedDocuments(embeddedName, ids, contextopt);
    const result = await super.deleteEmbeddedDocuments(embeddedName, ids, contextopt);
    // we do this so when a class is deleted or items that adjust hp in some way we update them
    const hpData = this._getClassHPData();
    if (hpData)
      await this.update(hpData)
    return result;
  }

  /**
   * 
   * Override to create itemList sub-items
   * 
   * @param {String} embeddedName The name of the embedded Document type
   * @param {Array.<object>} data An array of data objects used to create multiple documents
   * @param {DocumentModificationContext} contextopt Additional context which customizes the creation workflow
   */
  async createEmbeddedDocuments(embeddedName, data, contextopt) {
    // console.trace("actor.js createEmbeddedDocuments create", { embeddedName, data, contextopt });

    for (const newItem of data) {
      const itemsFound = utilitiesManager.findSimilarItem(this, newItem);
      if (itemsFound?.length) {
        for (let i = 0; i < itemsFound.length; i++) {
          const itemFound = itemsFound[i];
          // console.log("actor.js createEmbeddedDocuments create", { itemFound });
          const combine = await dialogManager.confirm(`Combine ${newItem.name} and ${itemFound.name}?`,
            `Found Similar Item ${itemFound.type.toUpperCase()}:${itemFound.name}`);
          if (combine) {
            const addQuantity = parseInt(newItem.system.quantity);
            await itemFound.update({ 'system.quantity': (parseInt(itemFound.system.quantity) + addQuantity) })
            const index = data.findIndex(item => item.name === newItem.name);
            if (index !== -1) {
              data.splice(index, 1);
            }
            break;
          }
        }
      }
    }
    // if we didnt splice (dups) everything out then we continue
    if (data.length) {
      // console.trace();
      if (embeddedName === 'Item') {
        // console.log("actor.js createEmbeddedDocuments checking for sub-items");
        for (const source of data) {
          // console.log("actor.js createEmbeddedDocuments source", { source });

          // check for sub-items and add them
          if (source && source.system?.itemList && source.system.itemList.length) {
            const createSubItems = [];
            const addedSubItemIds = [];
            for (const subItem of source.system.itemList) {
              const subItemId = subItem.uuid.split(".").pop();
              console.log("actor.js createEmbeddedDocuments sub-item", { subItem, subItemId });
              // we manage 'class' subitems as characters level up
              // so if it's a class item we skip it and if the id is same as us we skip it
              if (!ARS.levelBasedSubitemTypes.includes(source.type) && subItemId !== source._id) {
                // let newSubItem = game.items.get(subItem.id);
                let newSubItem = subItem.uuid ? await fromUuid(subItem.uuid) : await utilitiesManager.getItem(subItem.id);
                // if we checked uuid and it doesnt exist, lets try by id because getItem() searches packs for same ID
                if (!newSubItem && subItem.uuid) newSubItem = await utilitiesManager.getItem(subItemId);
                // console.log("actor.js createEmbeddedDocuments newSubItem 2", { newSubItem });
                if (newSubItem) {
                  const newItemData = foundry.utils.deepClone(newSubItem.toObject());
                  // console.log("actor.js createEmbeddedDocuments", { newItemData });
                  if (newItemData) {
                    newItemData.system.quantity = subItem.quantity;
                    createSubItems.push(newItemData);
                  }
                }
              }
            }

            if (createSubItems.length) {
              const newList = await this.createEmbeddedDocuments("Item", createSubItems, contextopt);
              // rebuild itemList
              if (newList?.length) {
                source.system.itemList = [];
                for (const itm of newList) {
                  addedSubItemIds.push(itm.id);
                  source.system.itemList.push(utilitiesManager.makeItemListRecord(itm));
                }
                if (!contextopt?.hideChanges && !this.isLooting)
                  await dialogManager.showItems(this, addedSubItemIds, `Included Items`, `Items Added`)
              }
              // console.log("actor.js createEmbeddedDocuments newList", { newList });
            }
          }
          // save the original origin/source item id to the item
          if (source.system) source.system.sourceId = source._id;
        }
      }

      let items;
      try {
        items = await super.createEmbeddedDocuments(embeddedName, data, contextopt);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          switch (item.type) {

            case 'background':
              if (this.sheet) {
                this.sheet._reconfigureAcademics(item, this.getMaxLevel());
              }
              break

            case 'weapon':
              const foundProfs = utilitiesManager.findSimilarItem(this, item, ['weapon'], 'proficiency');
              if (foundProfs?.length) {
                for (let i = 0; i < foundProfs.length; i++) {
                  const foundProf = foundProfs[i];
                  const include = await dialogManager.confirm(`Add ${item.name} to proficiency ${foundProf.name}?`, `Include in proficiency?`);
                  if (include) {
                    let appliedBundle = foundry.utils.deepClone(Object.values(getProperty(foundProf, "system.appliedto")) || []);
                    // appliedBundle = Object.values(appliedBundle);
                    appliedBundle.push({ id: item.id })
                    await foundProf.update({ "system.appliedto": appliedBundle });
                    break;
                  }
                }
              }
              break;

            default:
              break;
          }
        }

      } catch (error) {
        ui.notifications.warn(`Error: ${error}.`);
        // console.log("actor.js createEmbeddedDocuments", error);
      }

      return items;
    }
    return undefined;
  }

  /**
  * Does this actor have spell slots
  * 
  * @returns boolean
  */
  canCastSpells() {
    let hasSlots = false;
    for (const spellType in this.system.spellInfo.slots) {
      Object.values(this.system.spellInfo.slots[spellType].value).forEach((slotCount, index) => {
        if (slotCount > 0) {
          hasSlots = true;
        }
      });
    }
    return hasSlots;
  }

  /**
   * getter to retrieve complete inventory list for Equipment tab
   * This sorts it by alpha and containers.
   */
  get inventoryItems() {
    // console.log("actor.js inventoryItems", this)
    const sortedItems = foundry.utils.deepClone(Array.from(this.items));
    // console.log("actor.js inventoryItems", { sortedItems })
    sortedItems.sort(utilitiesManager.sortBySort);
    const inventory = [];

    for (const item of sortedItems) {
      // console.log("actor.js inventoryItems", item.name, item.inContainer)
      if (!game.ars.config.nonInventoryTypes.includes(item.type) && !item.inContainer) {
        inventory.push(item);
        if (item.contains) {
          const sortSubItems = item.contains;
          sortSubItems.sort(utilitiesManager.sortBySort);
          for (const subItem of sortSubItems) {
            if (!game.ars.config.nonInventoryTypes.includes(item.type))
              inventory.push(subItem);
          }
        }

      }
    }
    // console.log("actor.js inventoryItems", { inventory })
    return inventory;
  }

  // is this npc dead?
  get isDead() {
    if (this.type === 'character') return false;
    // console.log("actor.js isDead", this.system.attributes.hp)
    return (this.system.attributes.hp.max !== 0 && this.system.attributes.hp.value === 0);
  }

  get isLootable() {

    // console.log("actor.js permission", this.isDead, game.ars.config.settings.npcLootable, this.system.lootable)

    switch (this.type) {
      case 'npc':
        const npcLootable = game.ars.config.settings.npcLootable;
        if (this.isDead && npcLootable) return true;
        break;

      case 'lootable':
        const lootable = this.system.lootable;
        // if this is loot actor and it's a token
        if (lootable && this.isToken) return true;
        break;
    }

    return false;
  }

  // give pcs limited view if the npc is lootable
  get permission() {
    // console.log("actor.js permission", super.permission, Math.max(super.permission, 1), this.isLootable)
    if (game.user.isGM || !this.isLootable) {
      return super.permission;
    }
    if (['lootable', 'npc'].includes(this.type)) return Math.max(super.permission, 1);
  }

  /**
   * 
   * give pcs limited permissions if npc is lootable (dead)
   * 
   * @param {*} user 
   * @param {*} permission 
   * @param {*} options 
   * @returns 
   */
  testUserPermission(user, permission, options) {
    // console.log("actor.js testUserPermission", [user, permission, options])
    if (game.user.isGM || !this.isLootable) {
      return super.testUserPermission(user, permission, options);
    }
    if ([1, "LIMITED"].includes(permission) && !options) {
      return this.permission >= CONST.DOCUMENT_PERMISSION_LEVELS.LIMITED;
    }
    return super.testUserPermission(user, permission, options);
  }

  // re-render if sheet is showing
  reRender() {
    if (this.sheet && this.type === 'character') {
      if (this.sheet.rendered)
        this.sheet.render(true);
    }

  }


  /**
   * Perform a long rest for the actor
   * 
   * reset memorizations for the day
   * reset all items with daily resets
   * 
   */
  async longRest() {
    console.log("actor.js longRest:", this.name)
    let updates = [];
    // reset all spell memorizations
    const memBundle = foundry.utils.deepClone(this.system.spellInfo.memorization);
    for (const spellType of ['arcane', 'divine']) {
      for (let level = 0; level < memBundle[spellType].length; level++) {
        for (let slot = 0; slot < Object.values(memBundle[spellType][level]).length; slot++) {
          memBundle[spellType][level][slot].cast = false;
        }
      }
    }
    //

    // reset daily actions on actor directly
    const actionBundle = foundry.utils.deepClone(this.system.actions) || [];
    for (let act = 0; act < actionBundle.length; act++) {
      if (actionBundle[act].resource.reusetime === 'daily') {
        actionBundle[act].resource.count.value = 0;
      }
    }
    this.update({
      'system.spellInfo.memorization': memBundle,
      'system.actions': actionBundle
    });

    // scan invenfory of actor for items with daily resets
    for (const item of this.items) {
      if (item.system?.charges?.reuse === 'daily') {
        item.update({ 'system.charges.value': 0 });
      }
    }

    // scan inventory of actor for items with daily resets actions
    for (const item of this.items) {
      const itemActionBundle = foundry.utils.deepClone(item.system.actions) || [];
      for (let act = 0; act < itemActionBundle.length; act++) {
        if (itemActionBundle[act].resource.type === 'charged'
          && itemActionBundle[act].resource.reusetime === 'daily') {
          itemActionBundle[act].resource.count.value = 0;
        }
      }
      item.update({
        'system.actions': itemActionBundle
      });
    }

    // Only execute if game settings allow for food and water consumption and the entity type is 'character'
    if (game.ars.config.settings.consumeFoodWater && this.type === 'character') {

      // Prepare an array for chat messages
      const chatText = [];

      // Function to select inventory item to consume
      const provision = async (type) => {
        // Get the item ID of the provision type from the system details, or ask user for input if not found
        const itemId = this.system.details.provisions[type]
          ? this.system.details.provisions[type]
          : await dialogManager.getInventoryItem(this, `Daily ${type}`, `Select ${type} for ${this.name}`,
            { inventory: this.provisions });

        if (itemId) {
          const item = this.getEmbeddedDocument('Item', itemId);

          // Check if the item exists and has a quantity greater than 0
          if (item && parseInt(item.system.quantity) > 0) {
            // Update the provision id if available
            this.update({ [`system.details.provisions.${type}`]: item.id });
            return item;
          } else {
            // Clear the provision id if not available
            this.update({ [`system.details.provisions.-=${type}`]: null });
          }
        }
        return undefined;
      };

      // Iterate over each type of consumable (Food and Water)
      for (const type of ['Food', 'Water']) {
        let isFound = false;
        let item = undefined;

        while (!isFound) {
          item = await provision(type.toLowerCase());

          // Check if the item has been provisioned
          if (item) {
            isFound = true;
          } else {
            // If the choice is empty, confirm if the user wants to select one
            if (await dialogManager.confirm(`${type} choice is empty, select one?`, `Select ${type} for ${this.name}`)) {
              isFound = false;
            } else {
              isFound = true;
            }
          }
        }

        // If the item exists, update the chat output and decrease the item quantity
        if (item) {
          console.log(`${this.name} consumed a use of ${item.name}`)
          item.update({ "system.quantity": (item.system.quantity - 1) });
          chatText.push(`${this.name} consumed a use of ${item.name} with ${item.system.quantity - 1} remaing`);
        } else {
          // If the item does not exist, inform the user
          console.log(`${this.name} did not have ${type} to consume`)
          chatText.push(`<b>${this.name} did not have ${type} to consume</b>`);
        }
      }
      // Output the consumption log to chat
      utilitiesManager.chatMessage(ChatMessage.getSpeaker(), 'Daily Food/Water', chatText.join("<p/>"), 'icons/consumables/food/bowl-ribs-meat-rice-mash-brown-white.webp');
    }


  }

  /**
   * getter for spellsByLevel array
   */
  get spellsByLevel() {
    const actor = this;
    // console.log("actor.js _prepareSpellsByLevel", actor.name);

    const _insertSpellByLevel = (spellsByLevel, spell, spellType) => {
      const spellLevel = spell.system.level;
      const spellId = spell.id;
      if (!spellsByLevel[spellType][spellLevel])
        spellsByLevel[spellType][spellLevel] = {};
      spellsByLevel[spellType][spellLevel][spellId] = spell.name;

      // Sort the entries by spell.name value
      spellsByLevel[spellType][spellLevel] = Object.fromEntries(
        Object.entries(spellsByLevel[spellType][spellLevel]).sort((a, b) => {
          return a[1].localeCompare(b[1]);
        })
      );

      return spellsByLevel;
    };

    // const arcaneSpellList = game.collections.get('Item').filter(i =>
    //   i.type === 'spell' &&
    //   i.system?.attributes?.type.toLowerCase() !== 'scroll' &&
    //   i.system.type.toLowerCase() === 'arcane');
    // const divineSpellList = game.collections.get('Item').filter(i =>
    //   i.type === 'spell' &&
    //   i.system?.attributes?.type.toLowerCase() !== 'scroll' &&
    //   i.system.type.toLowerCase() === 'divine');

    // const packItems = game.ars.library.packs?.items;

    // // console.log("actor.js _prepareSpellsByLevel", { packItems });
    // const arcanePackList = packItems?.filter(i =>
    //   i.type === 'spell' &&
    //   i.system?.attributes?.type.toLowerCase() !== 'scroll' &&
    //   i.system.type.toLowerCase() === 'arcane');
    // const divinePackList = packItems?.filter(i =>
    //   i.type === 'spell' &&
    //   i.system?.attributes?.type.toLowerCase() !== 'scroll' &&
    //   i.system.type.toLowerCase() === 'divine');

    // // console.log("actor.js _prepareSpellsByLevel", { arcaneSpellList, divineSpellList, divinePackList, arcanePackList });

    // const arcaneSpells = arcanePackList ? arcaneSpellList.concat(arcanePackList) : arcaneSpellList;
    // const divineSpells = divinePackList ? divineSpellList.concat(divinePackList) : divineSpellList;
    const filterSpells = (spells, spellType) =>
      spells.filter(
        (i) =>
          i.type === "spell" &&
          i.system?.attributes?.type.toLowerCase() !== "scroll" &&
          i.system.type.toLowerCase() === spellType
      );

    const allSpells = game.collections.get("Item");
    const packItems = game.ars.library.packs?.items;

    const arcaneSpells = filterSpells(allSpells, "arcane");
    const divineSpells = filterSpells(allSpells, "divine");
    const arcanePackSpells = packItems ? filterSpells(packItems, "arcane") : [];
    const divinePackSpells = packItems ? filterSpells(packItems, "divine") : [];

    arcaneSpells.push(...arcanePackSpells);
    divineSpells.push(...divinePackSpells);
    arcaneSpells.sort(utilitiesManager.sortByRecordName);
    divineSpells.sort(utilitiesManager.sortByRecordName);

    // console.log("actor.js _prepareSpellsByLevel", { arcaneSpells, divineSpells });
    const spellsByLevel = { arcane: {}, divine: {} };

    // // arcane and local divine spells
    // for (const typeOfSpell of ['arcane', 'divine']) {
    //   // check inventory for arcane spells for everyone
    //   actor.spells.forEach(spell => {
    //     const spellType = spell.system.type.toLowerCase();
    //     if (spellType && spellType === typeOfSpell) {
    //       const spellLevel = spell.system.level;
    //       //check if the spell is "known" ?
    //       const spellLearned = spell.system?.learned;
    //       if ((actor.system.spellInfo.slots[spellType].value[spellLevel])) {
    //         if ((spellType === 'arcane' && spellLearned) || (spellType === 'divine'))
    //           _insertSpellByLevel(spellsByLevel, spell, spellType);
    //       }
    //     }
    //   });
    // } // end for
    for (const typeOfSpell of ["arcane", "divine"]) {
      actor.spells.forEach((spell) => {
        const spellType = spell.system.type.toLowerCase();
        if (spellType === typeOfSpell) {
          const spellLevel = spell.system.level;
          const spellLearned = spell.system?.learned;
          const isSpellAvailable =
            actor.system.spellInfo.slots[spellType].value[spellLevel];
          const isArcaneSpell = spellType === "arcane" && spellLearned;
          const isDivineSpell = spellType === "divine";

          if (isSpellAvailable && (isArcaneSpell || isDivineSpell)) {
            _insertSpellByLevel(spellsByLevel, spell, spellType);
          }
        }
      });
    }

    if (actor.type === 'npc') {
      //they get everything
      arcaneSpells.forEach(spell => {
        _insertSpellByLevel(spellsByLevel, spell, 'arcane');
      });
    }

    // // for divine spells, filter by minor/major focus
    // let minorFocusFilters = '';
    // let majorFocusFilters = '';
    // let majorFilter = [];
    // let minorFilter = [];
    // actor.classes.forEach(c => {
    //   if (c.system.features.focus.minor)
    //     minorFilter.push(c.system.features.focus.minor.replace(/\s/g, ''))
    //   if (c.system.features.focus.major)
    //     majorFilter.push(c.system.features.focus.major.replace(/\s/g, ''))
    // });
    // if (minorFilter) minorFocusFilters = minorFilter.join("|").replace(/,/g, '|');
    // if (majorFilter) majorFocusFilters = majorFilter.join("|").replace(/,/g, '|');

    // // console.log("actor.js _prepareSpellsByLevel", { minorFocusFilters, majorFocusFilters });
    // if (minorFocusFilters || majorFocusFilters) {

    //   let minorSpells;
    //   let majorSpells;
    //   if (minorFocusFilters) {
    //     //level 1-3
    //     minorSpells = divineSpells.filter(i => {
    //       // console.log("actor.js _prepareSpellsByLevel minorSpell sphere:", i.system.sphere);
    //       return (
    //         (parseInt(i.system.level) || 0) <= 3 &&
    //         String(i.system.sphere)?.match(new RegExp(`${minorFocusFilters}`, 'ig')));
    //     });
    //     if (minorSpells) {
    //       minorSpells.forEach(spell => {
    //         _insertSpellByLevel(spellsByLevel, spell, 'divine');
    //       });
    //     }
    //   }
    //   if (majorFocusFilters) {
    //     //level 1-max
    //     majorSpells = divineSpells.filter(i => {
    //       // console.log("actor.js _prepareSpellsByLevel majorSpells sphere:", i.system.sphere);
    //       return (String(i.system.sphere)?.match(new RegExp(`${majorFocusFilters}`, 'ig')));
    //     });

    //     majorSpells.forEach(spell => {
    //       _insertSpellByLevel(spellsByLevel, spell, 'divine');
    //     });
    //   }
    //   // console.log("actor.js _prepareSpellsByLevel", { majorSpells, minorSpells });
    // } else {
    //   //no major/minor, they get everything
    //   divineSpells.forEach(spell => {
    //     _insertSpellByLevel(spellsByLevel, spell, 'divine');
    //   });
    // }

    /**
     * collect focus (major/minor) that are used to filter spell list for divine spells
     * @param {*} classes 
     * @returns 
     */
    function extractFocusFilters(classes) {
      const majorFilter = [];
      const minorFilter = [];

      classes.forEach(c => {
        if (c.system.features.focus.minor) {
          const filter = c.system.features.focus.minor.toLowerCase().replace(/\s/g, '').split(',');
          minorFilter.push(...filter);
        }
        if (c.system.features.focus.major) {
          const filter = c.system.features.focus.major.toLowerCase().replace(/\s/g, '').split(',');
          majorFilter.push(...filter);
        }
      });

      const minorFocusFilters = minorFilter.join('|');
      const majorFocusFilters = majorFilter.join('|');

      return { minorFocusFilters, majorFocusFilters };
    }

    /**
     * 
     * filter spells by allowed focus spheres
     * 
     * @param {*} divineSpells 
     * @param {*} focusFilters 
     * @param {*} levelRange 
     * @returns 
     */
    function filterSpellsByFocus(divineSpells, focusFilters, levelRange = null) {
      return divineSpells.filter(spell => {
        const spellLevel = parseInt(spell.system.level) || 0;
        if (levelRange && (spellLevel > levelRange)) {
          return false;
        }
        return String(spell.system.sphere)?.match(new RegExp(`${focusFilters}`, 'ig'));
      });
    }

    /**
     * add spells to list
     * 
     * @param {*} spellsByLevel 
     * @param {*} filteredSpells 
     * @param {*} type 
     */
    function insertSpells(spellsByLevel, filteredSpells, type) {
      filteredSpells.forEach(spell => {
        _insertSpellByLevel(spellsByLevel, spell, type);
      });
    }

    const { minorFocusFilters, majorFocusFilters } = extractFocusFilters(actor.classes);

    if (minorFocusFilters || majorFocusFilters) {
      const minorSpells = filterSpellsByFocus(divineSpells, minorFocusFilters, 3);
      const majorSpells = filterSpellsByFocus(divineSpells, majorFocusFilters);

      insertSpells(spellsByLevel, minorSpells, 'divine');
      insertSpells(spellsByLevel, majorSpells, 'divine');
    } else {
      insertSpells(spellsByLevel, divineSpells, 'divine');
    }

    // console.log("actor.js _prepareSpellsByLevel 1", { spellsByLevel });
    return spellsByLevel;
  } // end spellsByLevel


  /**
 *This getter calculates the effective level of an actor based on hit dice (HD)
 * 
 * HD 1+1 is 2HD, HD 1+4 is 3HD, HD 1+8 is HD4.
 * If any +mod, they get +1, after than % 4 for mod value.
 * 
 * @returns 
 */
  get effectiveLevel() {
    // Return the max level if the actor is not an NPC
    if (this.type !== 'npc') {
      return this.getMaxLevel();
    }

    // Get the system variant
    const variant = ARS.settings.systemVariant;

    // Get the hit dice and modifier value
    const [hdValue, modValue] = this.getHitDice;

    let effectiveHD = -1;

    // Handle different system variants (0 for OSRIC, others for different versions)
    if (Number(variant) === 0) {
      if (hdValue > 0 && modValue > 0) {
        effectiveHD = hdValue + 2;
      } else if (hdValue === 1 && modValue === -1) {
        effectiveHD = hdValue;
      } else if (hdValue === 1 && modValue < -1) {
        effectiveHD = 0;
      } else if (hdValue > 0) {
        effectiveHD = hdValue + 1;
      } else {
        effectiveHD = hdValue;
      }
    } else {
      const bonusHD = Math.floor(modValue / 4);
      effectiveHD = hdValue + bonusHD + (modValue > 0 ? 1 : modValue < 0 ? -1 : 0);
    }

    // Ensure the effective HD is within the valid range of 0 to 21
    effectiveHD = Math.min(Math.max(effectiveHD, 0), 21);

    // Return the effective HD
    return effectiveHD;
  }


  //getter to return effective HD like 4+4 is 5/etc.
  get effectiveHD() {
    return this.effectiveLevel;
  }

  /**
   * This class method returns the hit dice and hit dice modifier values
   * for an object depending on its type.
   * @returns {Array} An array containing the hit dice and hit dice modifier values.
   */
  get getHitDice() {
    // Check if the object type is 'npc'
    if (this.type === 'npc') {
      // Retrieve the hit dice string from the system object
      const hitDiceString = String(this.system.hitdice);

      if (hitDiceString) {
        // Extract the hit dice value and modifier from the hit dice string using a regex pattern
        const [, hitDiceValue, , modifierType, modifierValue] = hitDiceString?.match(/^(\d+)(([+\-])(\d+))?/);

        // If there is a hit dice value and/or modifier in the hit dice string
        if (hitDiceValue) {
          // Parse the hit dice value as an integer
          const parsedHitDiceValue = parseInt(hitDiceValue);

          // Set default modifier type and value
          const parsedModifierType = modifierType || '';
          const parsedModifierValue = modifierValue || 0;

          // Calculate the modifier value by combining the modifier type and value
          const calculatedModifierValue = parseInt(`${parsedModifierType}${parsedModifierValue}`) || 0;

          // Return the hit dice value and modifier as an array
          return [parsedHitDiceValue, calculatedModifierValue];
        }
      } else {
        // If the object type is not 'npc', return the maximum level and 0 as the modifier
        return [this.getMaxLevel(), 0];
      }
    }

    // If no hit dice value is found, return 0 for both the hit dice and modifier
    return [0, 0];
  }


  /**
   * Calculates the effective magic potency based on the type, hit dice, and system modifiers
   * 
   * Table 48: Hit Dice Vs. Immunity
   * Hit Dice             Hits creatures requiring
   * 4+1 or more          +1 weapon
   * 6+2 or more          +2 weapon
   * 8+3 or more          +3 weapon
   * 10+4 or more         +4 weapon
   * 
   * if system.mods.magicpotency use it if it's higher
   * 
   * return nMod 
   */
  effectiveMagicPotency() {
    // Initialize the magic potency modifier
    let magicPotencyModifier = 0;

    // Check if the current instance is of type 'npc'
    if (this.type === 'npc') {
      // Destructure hit dice and hit dice modifier
      const [hitDice, hitDiceModifier] = this.getHitDice;
      // Get the effective hit dice value
      const effectiveHitDice = this.getEffectiveHD;

      // Determine the magic potency modifier based on effective hit dice and hit dice values
      if (effectiveHitDice > 10 || (hitDice >= 10 && hitDiceModifier >= 4)) {
        magicPotencyModifier = 4;
      } else if (effectiveHitDice > 9 || (hitDice >= 8 && hitDiceModifier >= 3)) {
        magicPotencyModifier = 3;
      } else if (effectiveHitDice > 7 || (hitDice >= 6 && hitDiceModifier >= 2)) {
        magicPotencyModifier = 2;
      } else if (effectiveHitDice > 5 || (hitDice >= 4 && hitDiceModifier >= 1)) {
        magicPotencyModifier = 1;
      }
    }

    // Get the magic potency system modifier, defaulting to 0 if not set
    const systemMagicPotencyModifier = parseInt(this.system.mods?.magicpotency) || 0;

    // Set the final magic potency modifier as the greater of the calculated modifier or the system modifier
    if (!magicPotencyModifier || magicPotencyModifier < systemMagicPotencyModifier) {
      magicPotencyModifier = systemMagicPotencyModifier;
    }

    // check for 
    const potencyResistFormula = utilitiesManager.evaluateFormulaValue(this.system.mods?.formula?.potency?.resist, this.getRollData()) || 0;
    if (potencyResistFormula && !isNaN(potencyResistFormula))
      magicPotencyModifier += potencyResistFormula;

    // Return the final magic potency modifier
    return magicPotencyModifier;
  }


  /**
   * 
   * Use a item to initiate a attack
   * 
   * @param {*} item 
   */
  async _makeAttackWithItem(event, item) {
    // const byPass = event?.ctrlKey;

    // let situationalFlavor = item ? await item.getStatBlock() : 'Attacking ...';
    // const attackDetails = byPass ? null : await dialogManager.getAttack('Attack', 'Cancel', 'Attack Details', situationalFlavor);
    // if (attackDetails || byPass) {
    const dd = ARSDicer.create(
      {
        event: event,
        sourceActor: this,
        sourceItem: item,
        sourceAction: null,
      },
      {
        isCastSpell: false,
        isWeapon: true,
        isAction: false,
        // acLocation: attackDetails ? attackDetails.acLocation : 'normal',
        // situational: { mod: attackDetails ? attackDetails.mod : 0, rollMode: attackDetails ? attackDetails.rollMode : undefined },
      });
    DiceManager.rollAttack(dd);
    // }

  }


  /**
   * 
   * Get any modifiers applied for name from equipped items
   * and some specials like race
   * 
   * @param {String} name 
   * @returns { mod, modItemList }
   */
  getEquipmentSkillMods(name) {
    let total = 0;
    const modItemList = [];
    // get list of equipped items
    const equippedItems = this.items.filter((item) => {
      return ['equipped'].includes(item.system?.location?.state);
    });
    // get items that are not "equipped" like skills/race/etc
    const specialItems = this.items.filter((item) => {
      return ['race', 'background', 'ability'].includes(item.type);
    });
    const itemList = equippedItems.concat(specialItems);

    itemList.forEach(item => {
      if (item.system.attributes?.skillmods)
        for (const skillmod of Object.values(item.system.attributes.skillmods)) {
          if (name.toLowerCase() === skillmod.name.toLowerCase()) {
            total += skillmod.value;
            modItemList.push('@' + item.name.slugify());
          }
        }
    });
    return { total, modItemList };
  }

  /**
   * 
   * Returns enabled/active effects
   * 
   * @param {*} sourceItem Item this is from? (or not)
   * @returns {Array}
   */
  getActiveEffects(sourceItem = undefined) {
    // let activeEffects = [];
    // console.log("actor.js getActiveEffects", { sourceItem })
    let activeEffects = this.effects.filter(effect => !effect.disabled && !effect.isSuppressed);

    // check for effects that are on the item only used in combat
    if (sourceItem) {
      const inCombatOnly = sourceItem.getItemUseOnlyEffects();
      if (inCombatOnly.length)
        activeEffects = activeEffects.concat(inCombatOnly);
    }
    return activeEffects;
  }


  /**
  * 
  * 
  * 
  * @param {*} actor (target)
  * @param {*} thisActor (this)
  * @param {*} sourceItem 
  * @returns 
  */
  getModifiers(actor, thisActor = this, processDirection = undefined, sourceItem = undefined) {
    // console.log("actor.js getModifiers", { actor, thisActor, processDirection, sourceItem })
    const modifiers = {
      attacker: {
        attack: {
          melee: [],
          ranged: [],
          thrown: [],
          value: [],
        },
        damage: {
          melee: [],
          ranged: [],
          thrown: [],
          value: [],
        },
        save: {
          all: [],
          "paralyzation": [],
          "poison": [],
          "death": [],
          "rod": [],
          "staff": [],
          "wand": [],
          "petrification": [],
          "polymorph": [],
          "breath": [],
          "spell": [],

        }
      },
      target: {
        attack: {
          melee: [],
          ranged: [],
          thrown: [],
          value: [],
        },
        damage: {
          melee: [],
          ranged: [],
          thrown: [],
          value: [],
        },
        save: {
          all: [],
          "paralyzation": [],
          "poison": [],
          "death": [],
          "rod": [],
          "staff": [],
          "wand": [],
          "petrification": [],
          "polymorph": [],
          "breath": [],
          "spell": [],

        }
      }
    };

    function _applyModifierFormula(direction, details) {
      // console.log("actor.js _applyModifierFormula", { direction, details })

      if (details.type.startsWith('attack')) {
        switch (details.type) {
          case 'attack':
            modifiers[direction].attack.value.push(details.formula);
            break;
          case 'attack.melee':
            modifiers[direction].attack.melee.push(details.formula);
            break;
          case 'attack.ranged':
            modifiers[direction].attack.ranged.push(details.formula);
            break;
          case 'attack.thrown':
            modifiers[direction].attack.thrown.push(details.formula);
            break;
          default:
            ui.notifications.warn(`actor.js getModifiers() unknown resultAction ${details.type}`);
            console.log("actor.js getModifiers", { details })
            break;
        }

      } else if (details.type.startsWith('damage')) {
        switch (details.type) {
          //TODO: add support for details.dmgType like this??
          //modifiers[direction].damage.value.push({formula: details.formula, dmgType: details?.dmgType | undefined}); 
          case 'damage':
            modifiers[direction].damage.value.push(details.formula);
            break;
          case 'damage.melee':
            modifiers[direction].damage.melee.push(details.formula);
            break;
          case 'damage.ranged':
            modifiers[direction].damage.ranged.push(details.formula);
            break;
          case 'damage.thrown':
            modifiers[direction].damage.thrown.push(details.formula);
            break;

          default:
            ui.notifications.warn(`actor.js getModifiers() unknown resultAction ${details.type}`);
            console.log("actor.js getModifiers", { details })
            break;
        }

      } else if (details.type.startsWith('save')) {
        // console.log("actor.js _applyModifierFormula save", { direction, details })
        // split save,poison,spell,rod
        // const saveTypes = details.type.toLowerCase().split(',').map(text => text.trim());
        // saveTypes.splice(0, 1);
        const saveTypes = details?.saveTypes?.toLowerCase()?.split(',')?.map(text => text.trim()) || ['all'];

        if (saveTypes.length) {
          for (const sType of saveTypes) {
            modifiers[direction]['save'][sType].push(details.formula);
          }
        } else {
          modifiers[direction]['save']['all'].push(details.formula);
        }
      } else {
        ui.notifications.warn(`actor.js getModifiers() unknown resultAction ${details.type}`);
        console.log("actor.js getModifiers", { details })
      }
    }

    function _processEffectTests(change, weapon) {
      // '{trigger: "ne,ce,le", type: "attack", formula: "1d6"}'
      const details = JSON.parse(change.value);
      const triggerValue = details.trigger;
      // take "target.alignment" and split into direction and triggerType
      const triggers = change.key.toLowerCase().split('.').map(text => text.trim());
      const [direction, triggerType] = triggers;

      // console.log("actor.js getModifiers _processEffectTests", { change, weapon, actor, triggers, details, direction, triggerType, triggerValue })

      switch (triggerType) {

        case 'alignment':
          const alignments = triggerValue.toLowerCase().split(',').map(text => text.trim());
          if (alignments.includes(actor.system.details.alignment)) {
            _applyModifierFormula(direction, details)
          }
          break;

        case 'type':
          const types = actor.type === 'character' ?
            [actor.system.details?.race?.name?.toLowerCase()?.trim()] :
            actor.system.details.type.toLowerCase().split(',').map(text => text.trim());
          const triggerTypes = triggerValue?.toLowerCase().split(',').map(text => text.trim());
          const foundTypeMatch = triggerTypes?.some(typeTrigger => { return types.includes(typeTrigger) })
          if (foundTypeMatch) _applyModifierFormula(direction, details);
          break;

        case 'size':
          const sizes = triggerValue.toLowerCase().split(',').map(text => text.trim());
          if (sizes.includes(actor.system.attributes.size)) {
            _applyModifierFormula(direction, details)
          }
          break;

        case 'distance':
          // console.log("actor.js getModifiers", { thisActor, actor, triggerType, details, triggerValue })
          const distances = triggerValue.split(',').map(text => text.trim());
          const minValue = parseInt(distances[0] || 0);
          const maxValue = parseInt(distances[1] || 1);
          const distance = thisActor.getToken().getDistance(actor.getToken());
          if (distance <= maxValue && distance >= minValue) {
            _applyModifierFormula(direction, details)
          }
          break;

        case 'always':
          console.log("actor.js getModifiers always", { triggerType, details });
          _applyModifierFormula(direction, details);
          break;

        case 'hitdice':
          console.log("actor.js getModifiers TODO", { triggerType, details })
          break;

        case 'weapontype':
          console.log("actor.js getModifiers TODO", { triggerType, details })
          break;

        case 'properties_all': {
          const actorPropertiesSanitized = Object.values(actor.system?.properties).map(value => value.toLowerCase().trim());
          const propsSearch = triggerValue.toLowerCase().split(',').map(text => text.trim());
          console.log("actor.js getModifiers TODO", { triggerType, details, actorPropertiesSanitized, propsSearch })
          if (propsSearch.every(prop => actorPropertiesSanitized.includes(prop))) {
            _applyModifierFormula(direction, details);
          }
        }
          break;
        case 'properties_any': {
          const actorPropertiesSanitized = Object.values(actor.system?.properties).map(value => value.toLowerCase().trim());
          const propsSearch = triggerValue.toLowerCase().split(',').map(text => text.trim());
          console.log("actor.js getModifiers TODO", { triggerType, details, actorPropertiesSanitized, propsSearch })
          if (propsSearch.some(prop => actorPropertiesSanitized.includes(prop))) {
            _applyModifierFormula(direction, details);
          }
        }
          break;
        // case 'properties_missing': {
        //   const actorPropertiesSanitized = Object.values(actor.system?.properties).map(value => value.toLowerCase().trim());
        //   const propsSearch = triggerValue.toLowerCase().split(',').map(text => text.trim());
        //   console.log("actor.js getModifiers TODO", { triggerType, details, actorPropertiesSanitized, propsSearch })
        //   if (actorPropertiesSanitized.every(prop => !propsSearch.includes(prop))) {
        //     _applyModifierFormula(direction, details);
        //   }
        // }
        //   break;

        default:
          ui.notifications.warn(`actor.js _processEffectTests() unknown triggerType (${triggerType})`)
          console.log("actor.js _processEffectTests() unknown triggerType", { triggerType })
          break;
      }
    }

    // we only want inCombatOnly item effects when we're processing for "target" not "attacker"
    for (const effect of this.getActiveEffects((processDirection === 'target' ? sourceItem : undefined))) {
      for (const change of effect.changes) {
        if (change?.key &&
          (change.key.toLowerCase().startsWith("target.") || change.key.toLowerCase().startsWith("attacker."))) {
          _processEffectTests(change, sourceItem);
        }
      }
    }

    //check for item conditionals
    const itemConditionals = sourceItem ? sourceItem.conditionals : [];
    for (const cond of itemConditionals) {
      // console.log("actor.js getModifiers cond", { cond })
      _processEffectTests(cond, sourceItem);
    }


    return modifiers;
  }

  /**
   * Helper to set direction field for getCombatMods()
   * 
   * @param {*} actor Actor targeted for this attack
   * @param {*} type 'attack|damage' combat mods
   * @param {*} itemSource 
   * @returns 
   */
  getTargetCombatMods(actor, type = 'attack', itemSource) {
    return this.getCombatMods(actor, type, 'target', itemSource)
  }
  /**
   * 
   * @param {*} actor Actor targeted for this attack
   * @param {*} type 'attack|damage' combat mods
   * @param {*} itemSource 
   * @returns 
   */
  getAttackerCombatMods(actor, type = 'attack', itemSource) {
    return this.getCombatMods(actor, type, 'attacker', itemSource)
  }
  /**
   * 
   * @param {*} actor Actor targeted for this attack
   * @param {*} type 'attack|damage' combat mods
   * @param {*} itemSource 
   * @returns 
   */
  getCombatMods(actor, type = 'attack', direction = 'target', itemSource) {
    // console.log("actor.js getCombatMods", { actor, type, direction, itemSource })
    const atkMods = {
      value: 0,
      melee: 0,
      thrown: 0,
      ranged: 0,
      save: {
        all: 0,
        "paralyzation": 0,
        "poison": 0,
        "death": 0,
        "rod": 0,
        "staff": 0,
        "wand": 0,
        "petrification": 0,
        "polymorph": 0,
        "breath": 0,
        "spell": 0,

      }
    };

    if (!actor) return atkMods;

    const EffectMods = this.getModifiers(actor, this, direction, itemSource);
    // console.log("actor.js getAttackMods", { EffectMods })

    //TODO consider not evaluating the formula here and leaving it to the roll? We might need to do it here
    // to get the rollData from target/attacker when applied to other side?
    function _updateEffModsHelper(thisActor, modsArray, iType, nested = undefined) {
      // console.log("actor.js _updateEffModsHelper", { thisActor, modsArray, iType, nested })
      if (modsArray && modsArray.length) {
        for (const formula of modsArray) {
          // console.log("actor.js _updateEffModsHelper", { formula })
          const mod = parseInt(utilitiesManager.evaluateFormulaValue(formula, thisActor.getRollData())) || 0;
          // console.log("actor.js _updateEffModsHelper", { mod })
          if (nested) {
            atkMods[nested][iType] += mod;
          } else {
            atkMods[iType] += mod;
          }
        }
      }
    };

    // console.log("actor.js _updateEffModsHelper", this, { EffectMods, direction, type }, EffectMods[direction][type])
    // for (const direction of ['target', 'attacker']) {
    switch (type) {

      case 'save':
        console.log("actor.js _updateEffModsHelper", { type, EffectMods })
        for (const saveType in EffectMods[direction][type]) {
          // console.log("actor.js _updateEffModsHelper", { saveType })
          if (EffectMods[direction][type][saveType].length)
            _updateEffModsHelper(this, EffectMods[direction][type][saveType], saveType, 'save');
        }
        break;

      default:
        _updateEffModsHelper(this, EffectMods[direction][type].value, 'value');
        _updateEffModsHelper(this, EffectMods[direction][type].melee, 'melee');
        _updateEffModsHelper(this, EffectMods[direction][type].thrown, 'thrown');
        _updateEffModsHelper(this, EffectMods[direction][type].ranged, 'ranged');
        break;

    }
    // };

    // console.log("actor.js _updateEffModsHelper END", { atkMods })
    return atkMods;
  }
  /**
   * 
   * This finds modifiers from effects and creates a formula that is returned.
   * Special save modifiers, look for system.mods.saves.{type} with value \d+ (fire,cold,acid property optional)
   * or a formula
   * 
   * @param {String} saveType 
   * @param {*} action 
   * @returns String
   */
  getSaveModifiersFromEffects(saveType, action) {
    // const effectMods = ['@mods.saves.all', `@mods.saves.${saveType}`];
    const effectMods = this.getSystemSaveModifiers(action);
    // if (this.system?.mods?.saves?.all)
    //   effectMods.push('@mods.saves.all');
    // if (this.system?.mods?.saves?.[`${saveType}`])
    //   effectMods.push(`@mods.saves.${saveType}`);
    const modes = game.ars.const.ACTIVE_EFFECT_MODES;
    for (const effect of this.getActiveEffects()) {
      for (const change of effect.changes) {
        if (change.mode == modes.CUSTOM) {
          if (change.key === `system.mods.saves.all` || change.key === `system.mods.saves.${saveType}`) {
            const details = JSON.parse(change.value.toLowerCase());
            if (details.properties) {
              if (action && action.properties.length) {
                const actionProperties = action?.properties?.map(text => text.toLowerCase().trim()) || [];
                const effectProperties = details.properties.split(',').map(text => text.toLowerCase().trim());

                // see if the properties of the effect save mod matchines the property of the action such as "fire" or "charm"
                if (actionProperties.some(prop => effectProperties.includes(prop))) {
                  effectMods.push(details.formula);
                }
              }
            } else {
              effectMods.push(details.formula);
            }

            // } else if (change.key === `system.mods.saves.all`) {
            //   effectMods.push(change.value);
          } // test change.keys
        } // test modes
      } // for changes
    } // for effects

    const sEffectMods = effectMods.length ? `${effectMods.join('+')}` : '';
    console.log("actor.js getSaveModifiersFromEffects", { sEffectMods, effectMods })
    return sEffectMods;
  }

  /**
   * 
   * Return system based "global" saves for things like wis/dex bonuses 
   * to mental/dodgeable spells for this action
   * 
   * @param {*} action 
   * @returns 
   */
  getSystemSaveModifiers(action) {
    const effectMods = [];
    // test for "metal" and "dodge" property actions
    if (action && action.properties.length) {
      const actionProperties = action.properties.map(text => text.toLowerCase().trim()) || [];
      for (let key in CONFIG.ARS.saveProperties) {
        const testProperties = CONFIG.ARS.saveProperties[key].property.split(',').map(text => text.toLowerCase().trim());
        if (actionProperties.some(prop => testProperties.includes(prop))) {
          effectMods.push(CONFIG.ARS.saveProperties[key].formula);
        }
      }
    }

    console.log("actor.js getSystemSaveModifiers", { effectMods })
    return effectMods;
  }

  /**
   * recalculate save values for npcs by HD
   */
  async recalculateSaves() {
    console.log("actor.js recalculateSaves", this.name)
    const systemVariant = game.ars.config.settings.systemVariant;
    const systemSaveTable = ARS.npcSaveTable[systemVariant];
    let nonIntellgent = false;
    const hdValue = this.effectiveHD;
    const halfHD = Math.ceil(hdValue / 2);

    // check for non-intelligent actors
    if (this.type === 'npc') {
      const nonRegex = /non/;
      // find a 0 without ajacent numbers 
      const zeroRegEx = /(?<=^|\D)0(?=$|\D)/;
      if (nonRegex.test(this.system.intelligence.toLowerCase()) ||
        zeroRegEx.test(this.system.intelligence)) {
        nonIntellgent = true;
        ui.notifications.warn(`${this.name} is considered non-intelligent, reducing HD 1/2 for some save settings`);
      }
    }

    const saveBundle = foundry.utils.deepClone(this.system.saves);
    for (let [key, cSaveType] of Object.entries(saveBundle)) {
      // non-intelligent creatures
      if (nonIntellgent && !['poison', 'death'].includes(key)) {
        saveBundle[key].value = systemSaveTable[halfHD][ARS.saveArrayMap[key]];
      } else {
        saveBundle[key].value = systemSaveTable[hdValue][ARS.saveArrayMap[key]];
      }
    };
    this.update({ 'system.saves': saveBundle });
  }

  /**
   * Calculate max hp from class(s)
   * 
   * Set class name/level 
   * 
   */
  _prepareClassData() {
    // const rollData = this.getRollData();
    const updates = {};
    const systemVariant = ARS.settings.systemVariant;
    const activeClassCount = Object.values(this.activeClasses).length;

    if (activeClassCount) { // unless n/pc has a class we dont mess with this
      for (let classEntry of this.classes) {
        // console.log("actor.js _prepareClassData classEntry", { classEntry });
        const maxLevel = Object.keys(classEntry.system.advancement).length;
        // console.log("actor.js _prepareClassData", { classEntry, maxLevel }, classEntry.system.ranks[maxLevel]?.xp);
        classEntry.classDetails = {
          "level": maxLevel,
          "xp": classEntry.xp || 0,
          "neededxp": classEntry.system.ranks[maxLevel - 1]?.xp || 0,
          // disable wisdom spell bonus using toggle in class entry
          "wisSpellBonusDisabled": classEntry.system.features.wisSpellBonusDisabled,
        }
      };
      const classname = this.classes.map(c => {
        return [c.name, Object.values(c.system.advancement).length].filterJoin(" ");
      }).join("/");

      this.system.classname = classname;
    } else {
      // no classes
      if (this.type === 'character') {
        this.system.classname = 'No Class';
      }
    }

    const backgroundname = this.backgrounds.length ? this.backgrounds.map(c => c.name).join("/") : null;
    const racename = this.races.length ? this.races.map(c => c.name).join("/") : null;
    // set "class #level" name

    if (racename) {
      this.racename = racename;
    }
    if (backgroundname) {
      this.system.backgroundname = backgroundname;
    }
  }

  /** this is used in _preUpdate() to make sure max hps is correctly set */
  _getClassHPData(actor = this) {
    // console.log("actor.js _getClassHPData", duplicate(actor));
    let updates = null;
    const systemVariant = ARS.settings.systemVariant;
    if (actor.activeClasses) {
      updates = {};
      const activeClassCount = Object.values(actor.activeClasses).length;
      if (activeClassCount) { // unless n/pc has a class we dont mess with this
        const hpMaxOrig = actor.system.attributes.hp.max;

        let maxHP = actor.system.attributes.hp.base || 0;
        let currentHP = actor.system.attributes.hp.value || 0;

        const conScore = actor.system.abilities.con.value;
        // get normal con bonus from table
        const conBonus = game.ars.config.constitutionTable[systemVariant][conScore][0][0];
        // get warrior style con bonus from table
        let conBonusWarrior = game.ars.config.constitutionTable[systemVariant][conScore][0][1];
        if (!conBonusWarrior) conBonusWarrior = conBonus;
        let conBonusTotal = 0;
        for (let classEntry of actor.classes) {
          const usehpConFormula = (classEntry.system.features.hpConFormula ? true : false);
          const hpBonusConResult = parseInt(
            utilitiesManager.evaluateFormulaValue(classEntry.system.features.hpConFormula,
              this.getRollData()
            )) || 0;
          const lastHDLevel = parseInt(classEntry.system.features.lasthitdice) ?? 999;
          Object.values(classEntry.system.advancement).forEach((entry, index) => {
            const addHP = activeClassCount > 0 ? Math.ceil(entry.hp / activeClassCount) : entry.hp;
            const conBonusMod = classEntry.system.features.bonuscon ? conBonusWarrior : conBonus;
            if (entry.level <= lastHDLevel)
              if (usehpConFormula) {
                conBonusTotal += (hpBonusConResult / activeClassCount);
              } else {
                conBonusTotal += (conBonusMod / activeClassCount);
              }
            maxHP += addHP;
          });
        };
        // add in Constitution HP modifier
        maxHP += (Math.ceil(conBonusTotal));

        // if hp.max changed adjust value for that change
        // if (data.system.attributes.hp.max > hpMaxOrig) {
        if (maxHP > hpMaxOrig) {
          const diff = maxHP - hpMaxOrig;
          if (diff != 0) {
            // data.system.attributes.hp.value += diff;
            currentHP += diff;
          }
        }
        // if current hp is greater than max now or currentHP == 0, adjust to current max.

        // changing on currentHP 0 resets hp when they are "dead" or at 0.
        // if (currentHP > maxHP || currentHP === 0) {
        if (currentHP > maxHP || currentHP === undefined || currentHP === null) {
          currentHP = maxHP;
        }

        // console.log("actor.js _prepareClassData", { backgroundname, racename, classname });
        updates['system.attributes.hp.max'] = maxHP;
        updates['system.attributes.hp.value'] = currentHP;

      } else {
        // no classes
        if (actor.type === 'character') {
          updates['system.attributes.hp.max'] = 0;
          updates['system.attributes.hp.value'] = 0;
        }
      }
    }


    return updates;
  }


  /**
   * 
   * @param {String} statusName such as "dead" "blind" "deaf" "sleep"
   * @returns Boolean
   * 
   */
  hasStatusEffect(statusName = '') {
    // const status = statusName ? (this.getActiveEffects().find(e => e.getFlag("core", "statusId") === statusName)) : false;
    const status = statusName ? this.getActiveEffects().some(eff => eff.statuses?.has(statusName)) : false;
    // const status = this.getToken().hasStatusEffect(statusName);
    return status;
  }

  // Function to apply status effects
  statusModifiers() {
    const actor = this;
    const variant = parseInt(game.ars.config.settings.systemVariant);

    // Define the base structure of the status effect object
    const statusEffect = {
      attack: {
        value: 0,
        melee: 0,
        ranged: 0,
        thrown: 0,
        tags: [],
      },
      attacked: {
        value: 0,
        melee: 0,
        ranged: 0,
        thrown: 0,
        tags: [],
      },
      damage: {
        value: 0,
        melee: 0,
        ranged: 0,
        thrown: 0,
        tags: [],
      },
      save: {
        all: 0,
        "paralyzation": 0,
        "poison": 0,
        "death": 0,
        "rod": 0,
        "staff": 0,
        "wand": 0,
        "petrification": 0,
        "polymorph": 0,
        "breath": 0,
        "spell": 0,
        tags: [],
      },
      ac: {
        mod: 0,
        tags: [],
      },
      acRanged: {
        mod: 0,
      },
      statusList: [],
    };

    /**
  * Helper function to determine if the active effects include a particular status.
  * @param {string} status - The status to be checked.
  * @returns {boolean} - Return true if the status is found in the active effects, otherwise false.
  */
    function isStatusInActiveEffects(status) {
      // Fetch all active effects.
      const activeEffects = actor.getActiveEffects();

      // Iterate over each effect.
      for (let effect of activeEffects) {
        // Each effect has a list of changes. 
        // We're looking for the 'special.status' key and its associated value in these changes.
        const changeFound = effect.changes.find(change => {
          // Make sure the change has a key and a value.
          if (change?.key && change?.value) {
            // Check if the key includes 'special.status' (case-insensitive).
            const keyMatches = change.key.toLowerCase().includes('special.status');
            // Convert the value (which is an array of strings) to lowercase and trim whitespace.
            const normalizedValues = change.value.toLowerCase().trim();
            // Check if the transformed values include the status we're looking for.
            const valueMatches = normalizedValues.includes(status);
            // If both key and value match our criteria, we've found our change.
            return keyMatches && valueMatches;
          }

          // By default, assume this change is not what we're looking for.
          return false;
        });

        // If we found a matching change in this effect, there's no need to continue looking.
        if (changeFound) {
          return true;
        }
      }

      // If we've checked all effects and found no matching change, the status is not in the active effects.
      return false;
    }


    // Helper function to apply a status effect and update the status list
    function applyStatusEffect(status, effectFn, statusList) {
      // Check if the current instance has the given status or the status is on an effect
      if (this.hasStatusEffect(status) || isStatusInActiveEffects(status)) {
        effectFn();
        // Add the status to the status list if it's not already included
        if (!statusList.includes(status)) {
          statusList.push(status);
        }
      }
    }

    const statusEffects = [
      {
        status: 'invisible',
        effect: () => {
          statusEffect.attack.value += 2;
          statusEffect.attacked.value += -4;
        },
      },
      {
        status: 'blind',
        effect: () => {
          statusEffect.attack.value += -4;
          // statusEffect.attacked.value += -4;
          statusEffect.ac.mod += 4;
          statusEffect.save.all += -4;
          //  initiative += 2;
          //  move should be 1/3 also
        },
      },
      {
        status: 'stun',
        effect: () => {
          statusEffect.attacked.value += 4;
        },
      },
      {
        status: 'paralysis',
        effect: () => {
          statusEffect.attacked.value += 4;
        },
      },
      {
        status: 'prone',
        effect: () => {
          statusEffect.attacked.melee += 4;
          statusEffect.attacked.ranged += -2;
          statusEffect.attacked.thrown += -2;
        },
      },
      {
        status: 'restrain',
        effect: () => {
          statusEffect.attacked.value += 2;
        },
      },
      {
        status: 'charge',
        effect: () => {
          statusEffect.attack.value += 2;
          statusEffect.ac.mod += 2;
          //negate dex?!?!?
          statusEffect.ac.tags.push('nodex');
        },
      },
      // ... other status effects
    ];

    // Iterate through the global status effects and apply them
    statusEffects.forEach(({ status, effect }) => {
      applyStatusEffect.call(this, status, effect, statusEffect.statusList);
    });

    // Check if the game variant is set to 0 or 1
    if (variant === 0 || variant === 1) {

      const variant0or1StatusEffects = [
        // ... other variant status effects
        {
          status: 'cover-25%',
          effect: () => {
            statusEffect.acRanged.mod += -2;
            statusEffect.save.all += 2;
          },
        },
        {
          status: 'cover-50%',
          effect: () => {
            statusEffect.acRanged.mod += -4;
            statusEffect.save.all += 4;
          },
        },
        {
          status: 'cover-75%',
          effect: () => {
            statusEffect.acRanged.mod += -7;
            statusEffect.save.all += 7;
          },
        },
        {
          status: 'cover-90%',
          effect: () => {
            statusEffect.acRanged.mod += -10;
            statusEffect.save.all += 10;
          },
        },
        {
          status: 'concealed-25%',
          effect: () => {
            statusEffect.acRanged.mod += -1;
          },
        },
        {
          status: 'concealed-50%',
          effect: () => {
            statusEffect.acRanged.mod += -2;
          },
        },
        {
          status: 'concealed-75%',
          effect: () => {
            statusEffect.acRanged.mod += -3;
          },
        },
        {
          status: 'concealed-90%',
          effect: () => {
            statusEffect.acRanged.mod += -4;
          },
        },
        {
          status: 'encumbrance-light',
          effect: () => {
            //TODO: variant 0 and 1 settings?
            // nothing
          },
        },
        {
          status: 'encumbrance-moderate',
          effect: () => {
            // statusEffect.attack.value += -1;
          },
        },
        {
          status: 'encumbrance-heavy',
          effect: () => {
            statusEffect.attacked.value += 2;
            statusEffect.ac.tags.push('nodex');
          },
        },
        {
          status: 'encumbrance-severe',
          effect: () => {
            statusEffect.attacked.value += 2;
            statusEffect.ac.tags.push('nodex');
          },
        },
      ];

      // Iterate through the variant-specific status effects and apply them
      variant0or1StatusEffects.forEach(({ status, effect }) => {
        applyStatusEffect.call(this, status, effect, statusEffect.statusList);
      });
    }

    // Check if the game variant is set to 2
    if (variant === 2) {

      const variant2StatusEffects = [
        {
          status: 'cover-25%',
          effect: () => {
            statusEffect.attacked.ranged += -2;
            statusEffect.attacked.thrown += -2;
            statusEffect.save.all += 2;
          },
        },
        {
          status: 'cover-50%',
          effect: () => {
            statusEffect.attacked.ranged += -4;
            statusEffect.attacked.thrown += -4;
            statusEffect.save.all += 4;
          },
        },
        {
          status: 'cover-75%',
          effect: () => {
            statusEffect.attacked.ranged += -7;
            statusEffect.attacked.thrown += -7;
            statusEffect.save.all += 7;
          },
        },
        {
          status: 'cover-90%',
          effect: () => {
            statusEffect.attacked.ranged += -10;
            statusEffect.attacked.thrown += -10;
            statusEffect.save.all += 10;
          },
        },
        {
          status: 'concealed-25%',
          effect: () => {
            statusEffect.attacked.ranged += -1;
            statusEffect.attacked.thrown += -1;
          },
        },
        {
          status: 'concealed-50%',
          effect: () => {
            statusEffect.attacked.ranged += -2;
            statusEffect.attacked.thrown += -2;
          },
        },
        {
          status: 'concealed-75%',
          effect: () => {
            statusEffect.attacked.ranged += -3;
            statusEffect.attacked.thrown += -3;
          },
        },
        {
          status: 'concealed-90%',
          effect: () => {
            statusEffect.attacked.ranged += -4;
            statusEffect.attacked.thrown += -4;
          },
        },
        {
          status: 'encumbrance-light',
          effect: () => {
            // nothing
          },
        },
        {
          status: 'encumbrance-moderate',
          effect: () => {
            statusEffect.attack.value += -1;
          },
        },
        {
          status: 'encumbrance-heavy',
          effect: () => {
            statusEffect.ac.mod += 1;
            statusEffect.attack.value += -2;
          },
        },
        {
          status: 'encumbrance-severe',
          effect: () => {
            statusEffect.ac.mod += 3;
            statusEffect.attack.value += -4;
          },
        },
        // ... other variant status effects
      ];

      // Iterate through the variant-specific status effects and apply them
      variant2StatusEffects.forEach(({ status, effect }) => {
        applyStatusEffect.call(this, status, effect, statusEffect.statusList);
      });
    }

    // Return the updated status effect object
    return statusEffect;
  }



  /**
   * 
   * get combatant record
   * 
   * @returns 
   */
  getCombatant() {
    const token = this.getToken();
    if (token) {
      return token.combatant;
    }
    return false;
  }

  /**getter returns initiative */
  get initiative() {
    const combatant = this.getCombatant();
    return combatant ? combatant.initiative : null;
  }

  /**
  * Determines the Armor Class (AC) hit based on the hitRoll value.
  * @param {number} hitRoll - The value to be checked against the combat matrix.
  * @returns {number} - The AC hit value based on the hitRoll.
  */
  acHit(hitRoll) {
    let acHit = 10;

    const variant = parseInt(game.ars.config.settings.systemVariant) || 0;
    switch (variant) {
      case 0:
      case 1:
        acHit = this.acHitByMatrix(hitRoll);
        break;

      case 2:
      default:
        acHit = this.acHitByTHACO(hitRoll);
        break;
    }

    console.log("actor.js acHit()", { hitRoll, acHit })
    return acHit;
  }

  /**
   * Calculates and returns the Armor Class (AC) hit value based on a hit roll.
   * @param {number} hitRoll - The hit roll to calculate AC hit from.
   * @returns {number} The AC hit value.
   */
  acHitByTHACO(hitRoll) {
    // Get the THACO value from the system attributes.
    const thaco = this.system.attributes.thaco.value;

    // Calculate the AC hit value using the hit roll and THACO values.
    const acHit = thaco - hitRoll;

    // Log the THACO, AC hit, and hit roll values for debugging purposes.
    // console.log("acHitByTHACO:", { thaco, acHit, hitRoll });

    // Return the AC hit value.
    return acHit;
  }

  /**
   * Get the AC hit from hitRoll using the OSRIC combat matrix
   * @param {number} hitRoll - The roll needed to hit the target
   * @returns {number} - The AC hit value
   */
  acHitByMatrix(hitRoll) {
    const matrixVariant = parseInt(game.ars.config.settings.systemVariant) || 0;

    function lowestACHit(matrixSlice) {
      // Find the first occurrence of hitRoll in the matrix slice to determine AC hit
      let lowAC = 11;
      let hitIndex = -1;
      for (let i = 0; i < matrixSlice.length; i++) {
        if (matrixSlice[i] === hitRoll) {
          hitIndex = i;
          break;
        }
      }

      // Calculate the AC hit value based on the index of the hitRoll in the matrix slice
      if (hitIndex > -1) {
        lowAC = hitIndex - 10;
      } else {
        // If the hitRoll is greater than the lowest AC that can be hit, set AC hit to -10
        if (hitRoll > matrixSlice[0]) {
          lowAC = -10;
        }
      }
      return lowAC;
    }

    return lowestACHit(this.matrixSlice);
  }



} // end export

