import { ARS } from '../config.js';
import * as actionManager from "../apps/action.js";
import { DiceManager } from "../dice/dice.js";
import * as effectManager from "../effect/effects.js";
import * as utilitiesManager from "../utilities.js";
import * as action from "../apps/action.js";
import * as debug from "../debug.js"
import { ARSDicer } from "../dice/dicer.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ARSItem extends Item {

  chatTemplate = {
    // "armor": "systems/ars/templates/chat/parts/chatCard-armor.hbs",
    "skill": "systems/ars/templates/chat/parts/chatCard-skill.hbs",
    "weapon": "systems/ars/templates/chat/parts/chatCard-weapon.hbs",
    "spell": "systems/ars/templates/chat/parts/chatCard-spell.hbs",
    "action": "systems/ars/templates/chat/parts/chatCard-action.hbs",
    "potion": "systems/ars/templates/chat/parts/chatCard-action.hbs",
    // "power": "systems/ars/templates/chat/parts/chatCard-power.hbs"
  }


  /**
     * Augment the basic Item data model with additional dynamic data.
     */
  prepareData() {
    super.prepareData();
    // console.log("item.js prepareData ITEM ====> this", this);
    // const data = this.data;
  }

  /** @override */
  prepareDerivedData() {
    new Promise((resolve, reject) => {
      super.prepareDerivedData();
      resolve();
    }).then(async () => {

      // for v10
      this.name = this.getName();

      // console.log("item.js prepareDerivedData itemData", itemData);
      action.prepareDerivedData(this);

      if (this.isOwned && this.system.quantity > 0 &&
        !game.ars.config.nonInventoryTypes.includes(this.type) &&
        (this.system.location.state === 'equipped' || this.system.location.state === 'carried')) {

        this.system.carriedweight = parseFloat((this.system.quantity * this.system.weight).toFixed(2));
      }
      if (this.isOwned) {
        this.ammo = await this.getAmmo();
      }
      // // console.log("item.js prepareDerivedData this.actor", this, this.actor);
      // if (this.actor?.data) action.populateFormulaEvals(this.actor, this.system.actions);

      this._prepareContains();
    })
  }

  /**
   * prepare contans list for contained items
   */
  async _prepareContains() {
    // console.log("item.js _prepareContains", this);
    let contains = [];
    if (this.system.itemList.length) {
      for (const carried of this.system.itemList) {
        try {
          // const subItem = this.actor ? this.actor.items.get(carried.id) : game.items.get(carried.id);
          // const subItem = this.actor ? this.actor.items.get(carried.id) : await utilitiesManager.getItem(carried.id);
          if (!this.actor && !carried.uuid) {
            // ui.notifications.warn(`Item ${this.name} contains ${carried.name} and it does not have actor/owner and is missing uuid.`);
            console.log(`Item ${this.name} contains ${carried.name} and it does not have actor/owner and is missing uuid.`)
          }

          const subItem = this.actor ? this.actor.items.get(carried.id) : (carried.uuid ? await fromUuid(carried.uuid) : game.items.get(carried.id));
          // console.log("item.js _prepareContainers", carried.id, { subItem })
          if (subItem) {
            contains.push(subItem);
            subItem.containedIn = this;
          }
        } catch (err) {
          // error, this happens due to sequencing. game.items and 
          // this.actor.items don't exist during certain phases but eventually do.
        }

      }
    }

    this.contains = contains;
  }

  //getter to return item alias
  get alias() {
    return this.system.alias;
  }

  /** getter to get profs that are applied to this item */
  get appliedProfs() {
    let profs = [];
    if (this.isOwned) {
      // get the modifiers for hit from proficiencies
      for (const profItem of this.parent?.proficiencies) {
        for (const weapon of Object.values(profItem.system.appliedto)) {
          if (weapon.id === this.id) {
            profs.push(profItem);
          }
        }
      } // end profs check
    } else {
      profs = null;
    }

    // console.log("item.js getter appliedProfs", { profs })
    return profs;
  }
  /** Getter of conditionals from item */
  get conditionals() {
    let conditionals = this?.system?.conditionals || [];
    // console.log("item.js getter conditionals", { conditionals })
    // TODO: append conditionals from profs applied to this item (weapons)
    const profs = this.appliedProfs;
    if (profs && profs.length) {
      for (const prof of profs) {
        if (prof.system?.attributes?.conditionals)
          for (const cond of Object.values(prof.system.attributes.conditionals)) {
            conditionals.push(cond);
          }
      }
    }

    // console.log("item.js getter conditionals", { conditionals })
    return conditionals;
  }

  /**getter to determine if item is identified  */
  get isIdentified() {
    if (game.user.isGM) {
      return true;
    } else {
      const identified = this.system?.attributes ? this.system.attributes.identified : true;
      return identified;
    }
  }
  get isIdentifiedRaw() {
    const identified = this.system?.attributes ? this.system.attributes.identified : true;
    return identified;
  }
  get notIdentified() {
    return !this.isIdentified;
  }
  get isMagic() {
    return this.system?.attributes ? this.system.attributes.magic : false;
  }
  get notMagic() {
    return this.system?.attributes ? !this.system.attributes.magic : true;
  }
  get isArmor() {
    return (this.type === 'armor' &&
      this.system?.protection?.type.toLowerCase() === 'armor'
    );
  }
  get isShield() {
    const fuck = this.type === 'armor'
    const off = this.system?.protection?.type.toLowerCase() === 'shield'
    return (this.type === 'armor' &&
      this.system?.protection?.type.toLowerCase() === 'shield'
    );
  }
  get isWornArmor() {
    return (this.isArmor
      && ['equipped'].includes(this.system?.location?.state)
    );
  }
  get isWornShield() {
    const fuck = this.isShield
    const off = ['equipped'].includes(this.system?.location?.state)

    return (this.isShield
      && ['equipped'].includes(this.system?.location?.state)
    );
  }
  // /** @override */
  // get name() {
  //   if (!game.ars.config.settings.identificationItem)
  //     return super.name();

  //   if (game.user.isGM)
  //     return `${super.name}`;
  //   if (['item', 'armor', 'container', 'potion', 'spell', 'weapon'].includes(this.type) && !this.isIdentified) {
  //     return this.alias ? this.alias : `${game.i18n.localize("ARS.unknown")} ${this.type}`;
  //   }
  //   return super.name;
  // }

  /**
   * 
   * Wrapper for old getting for item.name
   * 
   * @returns 
   */
  getName() {
    if (!game.ars.config.settings.identificationItem)
      return this.name;

    if (game.user.isGM)
      return `${this.name}`;
    if (['item', 'armor', 'container', 'potion', 'spell', 'weapon'].includes(this.type) && !this.isIdentified) {
      return this.alias ? this.alias : `${game.i18n.localize("ARS.unknown")} ${this.type}`;
    }
    return this.name;
  }

  get nameRaw() {
    return this.name;
  }

  /**
   * inContainer getter
   */
  get inContainer() {
    if (this.containedIn)
      return true;

    return false;
  }

  //getter to return if this is ammo
  get isAmmo() {
    if (['ammunition'].includes(this.system?.attributes?.type.toLowerCase()) ||
      ['ammunition'].includes(this.system?.attributes?.subtype.toLowerCase())) {
      return true;
    }
    return false;
  }
  get notAmmo() {
    return !this.isAmmo;
  }

  //getter for css used for items
  get css() {
    return [
      !this.isIdentifiedRaw && game.user.isGM ? "gm-unidentified" : '',
      this.isMagic && this.isIdentified ? "magic" : '',
    ].filterJoin(" ");
  }
  /**
   * is this item equpped?
   */
  get isEquipped() {
    return (this.isOwned && this.system.location?.state === 'equipped');
  }

  /** getter to return "retail" price (with margin) or item */
  get retail() {
    const margin = game.settings.get("ars", "itemBrowserMargin")
    let itemAtCost = parseInt(this.system?.cost?.value) ?? 0;
    if (isNaN(itemAtCost))
      itemAtCost = 0;
    // convert -100 to 100 to percent and get value markup/down value
    return itemAtCost ? Math.ceil(itemAtCost + (itemAtCost * (margin * 0.01))) : 0;
  }

  /** getter to return boolean if this item can be looted */
  get lootable() {
    return (this.system?.attributes?.type !== 'No-Drop' && this.system?.attributes?.subtype !== 'No-Drop');
  }
  get notLootable() {
    return (!this.lootable);
  }

  async _preCreate(data, options, user) {
    // do stuff to data, options, etc
    // console.log("item.js _preCreate", { data, options, user })
    await super._preCreate(data, options, user);
  }

  // _onCreate(data, options, userId) {
  //   console.log("item.js _onCreate", { data, options, userId });
  //   const item = super._onCreate(data, options, userId);
  //   console.log("item.js _onCreate", { item });
  // }

  /**
   * Send data from chat click roll to a chatCard template
   * 
   * @param {*} data 
   */
  async _chatRoll(data = {}) {
    console.log("item.js _chatRoll");
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker()
    };

    // console.log("item.js _chatRoll", { data });

    await actionManager.populateFormulaEvals(data.sourceActor, data.actions);

    const rAG = this.system.actionList[this.system.actions[0]?.name];
    let cardData = {
      config: ARS,
      ...this,
      item: data.item,
      sourceActor: data.sourceActor,
      sourceToken: data.sourceToken,
      owner: data.sourceActor.id,
      actions: data.actions,
      actionGroupData: rAG,
      actionGroups: this.system.actionList,
      ...data
    };

    const templateType = data.type ? data.type : this.type;
    chatData.content = await renderTemplate(this.chatTemplate[templateType], cardData);

    return ChatMessage.create(chatData);
  }

  /**
  * 
  * This runs a item in macro bar, looking for actions, skill item or memslots
  * 
  * @param {*} actor 
  */
  async runMacro(macroData = {}) {
    const actor = this.actor;

    console.log("item.js runMacro", { actor, macroData }, this);

    switch (this.type) {
      case 'skill':
        const dd = ARSDicer.create(
          {
            sourceActor: actor,
            sourceItem: this,
          },
          {
          });
        DiceManager.rollSkillCheck(dd);
        break;

      case 'weapon':
        actor._makeAttackWithItem(null, this);
        break;

      case 'spell':
      case 'memorization':
        // actor might not exist for a spell since it can use 
        // spells from World or Compendium directly
        // so it has to exist in the macroData
        const data = {
          item: this,
          sourceActor: macroData.actor,
          actions: this.system.actions,
          slotIndex: macroData.index,
          slotLevel: macroData.level,
          slotType: macroData.type,
        }
        // data.slotIndex = macroData.index;
        // data.slotLevel = macroData.level;
        // data.slotType = macroData.type;
        this._chatRoll(data);
        break;

      default:
        ui.notifications.error(`Unknown macro type ${this.type}`)
        break;
    }

  }

  /**
   * 
   * Some after create things to adjust for specific items.
   * 
   */
  postCreateItem() {
    let updates = {};
    // console.log("item.js postCreateItem")
    if (this.isOwned) {
      // set quantity to 1 if it's set to 0
      // console.log("item.js postCreateItem", this);
      if (!this.system.quantity) {
        updates['system.quantity'] = 1;
      }
      // look for inventory items, set default equip state
      if (!game.ars.config.nonInventoryTypes.includes(this.type)) {
        switch (this.type) {
          case 'armor':
          case 'weapon':
            updates['system.location.state'] = game.ars.library.const.location.EQUIPPED;
            break;
          default:
            updates['system.location.state'] = game.ars.library.const.location.CARRIED;
            break;
        }
      }

      if (['background', 'race'].includes(this.type)) {
        this.actor.sheet._reconfigureAcademics(this, this.actor.getMaxLevel());
      }
      console.log(`${this.actor.name} added ${this.name} to inventory.`);
    }

    // set a defailt icon when first made
    if (!this.img || this.img === 'icons/svg/item-bag.svg') updates['img'] = CONFIG.ARS.icons.general.items[this.type];
    // console.log("item.js postCreateItem ", { updates });
    this.update(updates);
  }

  /**
   * 
   * Return ammo
   * 
   * @param {Boolean} (optional) If set, only return ammo if it's a valid weapon type
   * 
   * @returns Item
   */
  async getAmmo(ammoIsWeapon = false) {
    let ammo = null;
    if (this.isOwned && this.actor && this.type === 'weapon') {
      const ammoId = this.system?.resource?.itemId;
      if (ammoId) {
        ammo = await this.actor.getEmbeddedDocument("Item", ammoId);
        // only return ammo if it's a weapon if ammoIsWeapon
        if (ammo && ammo.type !== 'weapon' && ammoIsWeapon) ammo = null;
      }
    }
    return ammo;
  }


  /**
   * Creates a small text block (html) for this item, typically weapons
   * 
   * @returns 
   */
  async getStatBlock() {
    //TODO make this look pretty, add image?
    let statblock = `<div style="text-align:center;border: 2px groove grey"><b>${this.name}</b>`;
    // ARS.has one range/dmg for ammo so we use weapon otherwise we use ammo for variants
    const ammo = game.ars.config.settings.systemVariant == '0' ? this : await this.getAmmo(true);
    const item = game.ars.config.settings.systemVariant == '0' ? this : (ammo ? ammo : this);
    if (item?.system?.attack?.type && item.isIdentified) {
      statblock += ` #ATK <b>${item.system.attack.perRound}</b> SPD <b>${this.system.attack.speed}</b>`

      switch (item.system.attack.type) {
        case 'ranged':
          const ranged = await this.getRange();
          statblock += ` RNG <b>${ranged.short}/${ranged.medium}/${ranged.long}</b>`;
          break;

        default:
          break;
      }
    }

    statblock += '</div>';
    return statblock;
  }

  /**
   * IF this is a ranged weapon return it's range.
   * 
   */
  async getRange() {
    const ammo = await this.getAmmo(true);
    let ranged = null;
    switch (this.system?.attack?.type) {
      case 'thrown':
      case 'ranged':
        // juggle things around to allow ammo w/o range mods to default to weapon range mods
        ranged = {
          short: this.system?.attack?.range?.short || 0,
          medium: this.system?.attack?.range?.medium || 0,
          long: this.system?.attack?.range?.long || 0,
        }
        if (ammo) {
          // set things to ammo's if they exist, otherwise use the weapon range
          ranged = {
            short: !ammo.system?.attack?.range?.short ?
              ranged.short : ammo.system.attack.range.short,
            medium: !ammo.system?.attack?.range?.medium ?
              ranged.medium : ammo.system.attack.range.medium,
            long: !ammo.system?.attack?.range?.long ?
              ranged.long : ammo.system.attack.range.long,
          }
        }
        // sanity checks
        ranged.short = parseInt(ranged.short);
        ranged.medium = parseInt(ranged.medium);
        ranged.long = parseInt(ranged.long);
        break;

      default:
        break;
    }

    console.log("item.js getRange", { ranged })
    return ranged;
  }

  /**
   * 
   * Returns enables/!suppressed but NOT transfered effects
   * 
   * We ONLY want effects that are marked "!transfer to actor" meaning
   * they only work when the weapon is used during an attack/damage roll
   * 
   * @param {*} sourceItem Item this is from? (or not)
   * @returns {Array}
   */
  getItemUseOnlyEffects() {
    // console.log("item.js getItemUseOnlyEffects", this)
    const activeEffects = this.effects.filter(effect => !effect.disabled && !effect.isSuppressed && !effect.transfer);
    return activeEffects;
  }

  /**
   * Method to play audio.
   * Utilizes the AudioHelper.play() function.
   */
  playAudio() {
    // Use optional chaining to ensure that system, audio, and file properties exist
    // If they don't exist, the code execution inside the if statement will be skipped
    const audioFile = this.system?.audio?.file;

    if (audioFile) {
      // If audio file is present, construct the configuration object for the audio playback
      const audioConfig = {
        // Source of the audio file
        src: audioFile,
        // Volume of the audio file
        // Parse system.audio.volume into a float, but if it doesn't exist, default to 0.5
        volume: parseFloat(this.system.audio?.volume) || 0.5,
      };

      // Play the audio file using AudioHelper.play()
      // The second parameter is a boolean for autoplay. Setting it as false to manually control the audio playback
      AudioHelper.play(audioConfig, false);
    }
  }


  // Function that plays an audio clip based on roll success or failure
  playCheck(rollMode = 'publicroll', success = false, crit = false) {

    console.log("playCheck", { rollMode, success, crit })
    // Ternary operator to select appropriate audio file based on success or failure of roll
    const audioFile = success ? this.system.audio.success : this.system.audio.failure;

    // If there is an audio file, proceed
    if (audioFile) {

      // Array of valid roll modes
      const validRollModes = ['publicroll', 'selfroll', 'gmroll'];

      // Checks if roll mode is valid
      if (validRollModes.includes(rollMode)) {

        // Sets timeout to delay audio playing, 3D dice animation requires longer delay
        const delay = game.dice3d ? 2500 : 0;

        // Promise to play audio after a delay
        const playAudioPromise = setTimeout(async () => {

          // Prepare audio parameters
          const audioParams = {
            src: audioFile,
            // Use volume if it exists, else default to 0.5
            volume: parseFloat(this.system.audio?.volume) || 0.5,
          };

          // If roll is public, audio is played to all users
          const isPublicRoll = rollMode === 'publicroll';

          // Call AudioHelper to play audio
          AudioHelper.play(audioParams, isPublicRoll);

        }, delay);
      }
    }
  }

  /**
   * 
   * This will remove existing effects applied by this item
   * and refresh them.
   * 
   * Typically used when a item's effects are directly edited
   * 
   */
  refreshEffects() {
    const actor = this.parent;
    console.log("item.js refreshEffects", { actor }, this)
    const removeIds = actor.effects
      .filter(effect => effect?.origin?.endsWith(this.uuid))
      .map(effect => effect.id);
    if (removeIds.length)
      actor.deleteEmbeddedDocuments("ActiveEffect", removeIds);
    const effectCreateData = [];
    for (let e of this.effects) {
      if (!e.transfer) continue;
      const effectData = e.toJSON();
      effectData.origin = this.uuid;
      effectCreateData.push(effectData);
    }
    actor.createEmbeddedDocuments("ActiveEffect", effectCreateData);
  }

}//



