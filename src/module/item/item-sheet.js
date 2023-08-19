// import { ARS } from '../config.js';
import { onManageActiveEffect, prepareActiveEffectCategories } from "../effect/effects.js";
// import * as utils from "../utils.js";
import * as actionManager from "../apps/action.js";
import * as utilitiesManager from "../utilities.js";
import * as debug from "../debug.js"
import { ARSItem } from "./item.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ARSItemSheet extends ItemSheet {
  constructor(...args) {
    super(...args);
    switch (this.object.type) {
      case "class":
        this._tabs[0].active = "main";
        // dont save on change, do it on close only
        this.options.submitOnChange = false;
        break;

      case "encounter":
      case "bundle":
      case "proficiency":
        this._tabs[0].active = "main";
        break;
    }
    console.log("item-sheet.js ARSItemSheet", this)
  }

  /** @override */
  static get defaultOptions() {
    // console.log("item-sheet.js defaultOptions this", this);
    return mergeObject(super.defaultOptions, {
      classes: ["ars", "sheet", "item"],
      closeOnSubmit: false,
      submitOnClose: true,
      submitOnChange: true,
      resizable: true,
      width: 500,
      height: 600,
      // height: "auto",
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
    });
  }


  /**@override */
  _disableFields(form) {
    // console.log("item-sheet.js _disableFields", { form })
    const inputs = ["INPUT", "SELECT", "TEXTAREA", "BUTTON"];
    for (let i of inputs) {
      for (let el of form.getElementsByTagName(i)) {
        if (!el?.classList.contains('allow-owner-edit'))
          el.setAttribute("disabled", "");
      }
    }
  }

  /** @override */
  get template() {
    const path = "systems/ars/templates/item";
    return `${path}/${this.item.type}-sheet.hbs`;
  }

  /** @inheritdoc */
  get title() {
    return `${utilitiesManager.capitalize(this.item.type)}: ${this.document.name}`;
  }
  /* -------------------------------------------- */

  /** @override so we can check if is identified also*/
  get isEditable() {
    if (!this.item.isIdentified)
      return false;

    return super.isEditable;
  }
  /** @override */
  async getData() {
    const variant = parseInt(game.ars.config.settings.systemVariant) ?? 0;
    const baseData = await super.getData();

    const sheetData = {
      isGM: game.user.isGM,
      owner: this.item.isOwner,
      editable: this.isEditable,
      item: baseData.item,
      // data: baseData.item.system,
      system: baseData.item.system,
      config: CONFIG.ARS,
      const: CONST,
      enrichedDMOnly: await TextEditor.enrichHTML(this.object.system.dmonlytext, { async: true }), //secrets: this?.actor?.isOwner,rollData: this.object.getRollData(),
      enrichedBiography: await TextEditor.enrichHTML(this.object.system.description, { async: true }), //secrets: this?.actor?.isOwner,rollData: this.object.getRollData(),
      actor: this.item.actor,
    };

    sheetData.config = CONFIG.ARS;

    baseData.item.isScroll = (this.item.type === 'spell' && this.item.system?.attributes?.type.toLowerCase() === 'scroll');

    // sheetData.item.wvaDetails = (this.item.type === 'armor' && this.item.system.armorstyle? '' : '')
    if (variant === 2 && this.item.type === 'armor' && this.item.system.armorstyle) {
      const atkMods = game.ars.config.weaponVarmor[variant]?.[this.item.system.armorstyle] ?? '';
      const atkDetails = Object.entries(atkMods).map(([dmgType, modifierValue]) => `${dmgType}: ${modifierValue}`).join(", ");
      sheetData.item.wvaDetails = atkMods;
    } else if ((variant === 0 || variant === 1) &&
      this.item.type === 'weapon' && this.item.system.weaponstyle) {
      let variant = parseInt(game.ars.config.settings.systemVariant);
      if (variant <= 1) variant = 1;
      const atmMods = game.ars.config.weaponVarmor[variant]?.[this.item.system.weaponstyle] ?? '';
      sheetData.item.wvaDetails = atmMods;
    } else {
      sheetData.item.wvaDetails = undefined;
    }
    // Prepare Active Effects
    sheetData.effects = prepareActiveEffectCategories(this.item.effects);

    // console.log("item-sheet.js prepareData this", this);
    // console.log("item-sheet.js prepareData data", sheetData);

    await this._prepareSubItems(sheetData);

    await actionManager.populateFormulaEvals(this.item, this.item.system.actions);

    return sheetData;
  }


  /* -------------------------------------------- */

  /**
   * 
   * This makes sure various fields of itemList are populated with current data
   * 
   * @param {*} data 
   */
  async _prepareSubItems(data) {

    // console.log("item.js _prepareSubItems", duplicate(data));

    if (data.system.itemList) {
      // data.system.itemList.forEach((entry) => {
      for (const entry of data.system.itemList) {
        if (!data.item.actor && !entry.uuid) {
          console.log("item-sheet.js _prepareSubItems", `Item ${data.item.name} contains ${entry.name} and it does not have actor/owner and is missing uuid.`, { data, entry });
          continue;
        }

        const item = data.item.actor ? data.item.actor.items.get(entry.id) : await fromUuid(entry.uuid)
        // console.log("item.js _prepareSubItems===> 1", { item });
        if (item) {
          if (!entry.type || entry.type !== item.type) {
            entry.type = item.type;
          }
          if (!entry.name || entry.name !== item.name) {
            entry.name = item.name;
          }
          if (!entry.img || entry.img !== item.img) {
            entry.img = item.img;
          }
          if (!entry.uuid) {
            entry.uuid = item.uuid;
          }
          if (!entry.id) {
            entry.id = item.id;
          }
          if (entry.type === 'class' && !entry.level) {
            entry.level = 0;
          }
          if (entry.type === 'bundle' && entry.count == undefined) {
            entry.count = 1;
          }

        } else {
          // console.log("item.js _prepareSubItems===>", { item });
          const spliceIndex = data.system.itemList.findIndex((itm => { return itm.id === entry.id }));
          data.system.itemList.splice(spliceIndex, 1);
        }
      }
    }

    // console.log("item.js _prepareSubItems===> 2", { data });

    data.system.itemList?.sort(utilitiesManager.sortByLevel);
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // this only works for compendium/world items
    if (!this.item.isOwned) {
      let _dragLinkHandler = event => {
        event.dataTransfer.setData("text/plain", JSON.stringify({
          type: 'Item',
          pack: this.item.pack,
          id: this.item.id,
          uuid: this.item.uuid,
        }));
      };
      html.find('#drag-link').each((i, draglink) => {
        draglink.setAttribute("draggable", true);
        draglink.addEventListener("dragstart", _dragLinkHandler, false);
      });
    }

    // certain values can be edited by owner directly when not identified
    if (this.item.isOwner) {
      html.find('.item-edit-alias').change((event) => {
        event.preventDefault();
        const element = event.currentTarget;
        const aliasName = element?.value;
        if (aliasName)
          this.item.update({ 'system.alias': aliasName });
      });
    }


    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find('.action-toggle-view').click(actionManager.toggleActionView.bind(this));

    html.find('.tab, .actions, .active').on("drop", this._onDropAction.bind(this));

    // Update sub-items on items
    html.find('.item-delete').click(event => this._confirmItemDelete(event));
    // Update sub-items on items
    html.find('.item-edit').click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const itemId = li.data("id");
      // check if the item is owned, if so open it from that actor
      const item = this.item.isOwned ? await this.item.actor.getEmbeddedDocument("Item", itemId) : await utilitiesManager.getItem(itemId);
      if (!item) {
        ui.notifications.error(`Item ${itemId} cannot be found in inventory.`)
        return;
      }
      item.sheet.render(true);
    });

    /**
     * remove a item from a container
     */
    html.find('.item-takeout').click(async (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const itemId = li.data("id");
      // check if the item is owned, if so open it from that actor
      const item = this.item.isOwned ? await this.item.actor.getEmbeddedDocument("Item", itemId) : await utilitiesManager.getItem(itemId);
      if (!item) {
        ui.notifications.error(`Item ${itemId} cannot be found in inventory.`)
        return;
      }
      const containedIn = item.containedIn;
      const newBundle = containedIn.system.itemList.filter((sub) => { return sub.id != item.id });
      item.containedIn = undefined;
      item.contains = undefined; // shouldn't need this but, to be safe
      await containedIn.update({ 'system.itemList': newBundle });
    });


    html.find('.npc-delete').click(event => {
      const li = $(event.currentTarget).parents(".npc");
      const index = li.data("index")
      const bundle = foundry.utils.deepClone(this.object.system.npcList || []);
      bundle.splice(index, 1);
      this.object.update({ 'system.npcList': bundle });
    });
    // Update sub-items on items
    html.find('.npc-edit').click(async (ev) => {
      // console.log("item-sheet.js item-edit", "ev", ev);
      const li = $(ev.currentTarget).parents(".npc");
      const npcId = li.data("id");
      const packName = li.data("pack");
      let npc;
      if (packName) {
        // const pack = await game.packs.get(packName);
        // npc = await pack.getDocument(npcId);
        npc = await game.packs.get(packName).getDocument(npcId);
      } else {
        npc = game.actors.get(npcId);
      }
      if (npc) {
        npc.sheet.render(true);
      } else {
        ui.notifications.error(`Unable to find NPC record ${packName ? packName + '.' : ''}${npcId}`)
      }
    });
    html.find('.npc-refresh').click(async (ev) => {
      const li = $(ev.currentTarget).parents(".npc");
      const npcId = li.data("id");
      const index = li.data("index")
      const packName = li.data("pack");
      let npc = game.actors.get(npcId);
      // if (packName) {
      //   const pack = await game.packs.get(packName);
      //   npc = await pack.getDocument(npcId);
      // } else {
      //   npc = game.actors.get(npcId);
      // }
      const bundle = foundry.utils.deepClone(this.object.system.npcList || []);
      bundle[index].xp = parseInt(npc.system.xp.value);
      bundle[index].name = npc.name;
      bundle[index].img = npc.img;
      this.object.update({ 'system.npcList': bundle });
    });
    html.find('.action-controls').click(this._onManage_action.bind(this));

    // class-sheet
    html.find(".rank-controls").click(this.onManage_ClassRanks.bind(this));

    //proficiency sheet
    html.find(".proficiency-controls").click(this.onManage_Proficiency.bind(this));

    // skill-sheet
    html.find(".skill-groups-controls").click(this.onManage_SkillGroups.bind(this));

    // "other" damage for weapons/items
    html.find(".damage-other-control").click(this._onDamageOtherControl.bind(this));

    html.find('.reveal-hidden').on("mouseover mouseout", this._onToggleHidden.bind(this));

    // Roll handlers, click handlers, etc. would go here.
    html.find(".effect-control").click(ev => {
      onManageActiveEffect(ev, this.item)
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // direct action roll
    html.find('.actionCard-roll').click(this._actionChatRoll.bind(this));

    html.find('.general-properties-controls').click(this._manageProperties.bind(this));

    html.find('.item-skill-modifier-controls').click(this._manageSkillModifiers.bind(this));

    html.find('.item-conditionals-controls').click(this._manageConditionals.bind(this));


    // html.find('.class-subitem-level').change(this._classSubItemLevel.bind(this));
    html.find('.class-subitem-level').change(this._subItemAdjustment.bind(this));
    html.find('.bundle-subitem-count').change(this._subItemAdjustment.bind(this));
    html.find('.encounter-npc-count').change(this._npcListAdjustment.bind(this));
    html.find('.item-subitem-quantity').change(this._subItemAdjustment.bind(this));

    this.form.ondrop = event => this._onDrop(event);

    html.find('.class-attack-matrix .class-attack-matrix-select select').change((event) => this._updateMatrix(event));

    // item sound files picker
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

  /**
   * 
   * @param {*} event 
   */
  async _updateMatrix(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const value = element.value;
    // console.log("item-sheet.js _updateMatrix", { event, element, value })
    this.item.update({ 'system.matrixTable': value });
  }

  /**
   * 
   * Fires when someone drops a spell onto the actions tab.
   * We copy the actions from the spell to the item directly
   * 
   * @param {*} event 
   */
  async _onDropAction(event) {
    event.preventDefault();
    // console.log("actor-sheet.js _onDropAction", { event })

    const data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));

    if (data && data.type === 'Item') {
      const item = await fromUuid(data.uuid);
      if (item && item.type === 'spell') {
        event.stopPropagation();
        actionManager.copyActionsToObject(this.object, item);
      }
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()
      }`;

    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    // delete itemData.data["type"];

    // console.log("item-sheet.js _onItemCreate", { event, type, data, name, itemData });
    // console.log("item-sheet.js _onItemCreate", "this", this, this.object);

    //Create item and add it to a list of "owned" item ids on this item.
    const created = await ARSItem.create(itemData); // Returns one Entity, saved to the database
    // console.log("item-sheet.js _onItemCreate", { created });
    const bundle = foundry.utils.deepClone(this.object.system.itemList || []);

    bundle.push({ id: created.id, uuid: created.uuid });

    this.object.update({ 'system.itemList': bundle });
  }


  /**
   * Capture ondrop event
   * 
   * @param {*} event 
   */
  async _onDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    // console.log("item-sheet.js _onDrop event", event);
    console.log("item-sheet.js _onDrop this", this);
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
      // if (data.type !== "Item" && data.type !== "Actor") return;
    }
    catch (err) {
      console.log(`item-sheet.js _onDrop error:${err}`);
      console.log(event.dataTransfer.getData('text/plain'));
      console.log(err);
      return false;
    }

    console.log("item-sheet.js _onDrop ", { data });

    if (data.type === 'Item') {
      if (['skill', 'proficiency', 'potion'].includes(this.type)) {
        // skills dont have items in items
      }
      else {
        if (this.item.id !== data.id &&
          !this.object.system.itemList.find(entry => { entry.id === data.id })) {
          const bundle = foundry.utils.deepClone(this.object.system.itemList || []);
          bundle.push({ id: data.id, uuid: data.uuid, sourceuuid: this.object.uuid });
          console.log("item-sheet.js _onDrop bundle", bundle, data);
          this.object.update({ 'system.itemList': bundle });
        } else {
          console.log("item-sheet.js _onDrop already there or is self !", { data }, this.item);
          ui.notifications.error(`Item already there or is self`);
        }
      }
    } else if (data.type === 'Actor' && this.object.type === 'encounter') {
      const npcBundle = foundry.utils.deepClone(this.object.system.npcList || []);

      let npc = duplicate(game.system.template.Item['npclist']);
      if (npc.templates instanceof Array) {
        npc.templates.forEach((t) => {
          npc = mergeObject(npc, game.system.template.Item.templates[t]);
        });
      }
      let npcRecord = {};
      if (data.pack) {
        npcRecord = await game.packs.get(data.pack).getDocument(data.id);
      } else {
        npcRecord = data.id ? game.actors.get(data.id) : await fromUuid(data.uuid);
      }

      npc.name = npcRecord.name;
      npc.id = npcRecord.id;
      npc.uuid = npcRecord.uuid;
      npc.img = npcRecord.img;
      npc.count = 1;
      npc.xp = npcRecord.system.xp.value;
      npc.pack = npcRecord.pack;
      npcBundle.push(npc);

      this.object.update({ 'system.npcList': npcBundle });

    } else {
      // console.log("item-sheet.js _onDrop", data.type)
    }

    // let item = game.items.get(data.id);
    // // await this.object.addAction(item.data);
    // console.log("item-sheet.js", "_onDrop", "event.dataTransfer.getData('text/plain')", event.dataTransfer.getData('text/plain'))
    // console.log("Drop completed", { item });
    // console.log(item.data)

    return false;
  }

  // /**
  //  * Open the ActionSheet window to edit a record 
  //  * 
  //  * @param {*} event 
  //  */
  // _onActionEdit(event) {
  //   event.preventDefault();
  //   const actionId = event.currentTarget.dataset.id;
  //   new ActionSheet(this.item, { actionId: actionId }).render(true);
  // }

  /**
  * Toggle hidden controls on mouseover event.
  * 
  * @param {Event} event 
  */
  _onToggleHidden(event) {
    const hidden = event.currentTarget.getElementsByClassName('item-control');
    $.each(hidden, function (index, value) {
      $(value).toggleClass('hidden');
    });
  }

  /**
   * Add/remove additional damage formula/types
   * 
   * @param {*} event 
   */
  _onDamageOtherControl(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // console.log("_onDamageOtherControl", "event", event);
    // console.log("_onDamageOtherControl", "element", element);
    // console.log("_onDamageOtherControl", "dataset", dataset);


    if (element.classList.contains("add-damage")) {
      let otherdmg = foundry.utils.deepClone(this.item.system.damage.otherdmg);
      otherdmg = Object.values(otherdmg);

      // console.log("_onDamageOtherControl", "add-damage otherdmg", otherdmg);

      let newDMG = {};
      newDMG.type = "slashing";
      newDMG.formula = "1d4";
      otherdmg.push(newDMG);

      this.item.update({
        "system.damage.otherdmg": otherdmg
      });

    }

    if (element.classList.contains("delete-damage")) {
      let index = Number(dataset.index);
      // console.log("_onDamageOtherControl", "index", index);

      let otherdmg = foundry.utils.deepClone(this.item.system.damage.otherdmg);
      otherdmg = Object.values(otherdmg);

      // console.log("_onDamageOtherControl", "delete-damage otherdmg", otherdmg);
      // console.log("_onDamageOtherControl", "delete-damage typeof otherdmg", typeof otherdmg);

      otherdmg.splice(index, 1);
      this.item.update({
        "system.damage.otherdmg": otherdmg,
      });

    }
  }


  /**
   * 
   * Adjust the level this ability/skill is gained for a class item when edited 
   * from within a class
   * 
   * @param {*} event 
   */
  _classSubItemLevel(event) {
    const index = $(event.currentTarget).closest('li').data("index");
    const value = event.target.value;
    const bundle = foundry.utils.deepClone(this.object.system.itemList || []);
    bundle[index].level = value;
    this.object.update({ 'system.itemList': bundle });
  }
  /**
   * 
   * Change the count # for a bundle subitem
   * 
   * @param {*} event 
   */
  _subItemAdjustment(event) {
    const index = $(event.currentTarget).closest('li').data("index");
    const type = $(event.currentTarget).closest('li').data("type")
    const value = event.target.value;
    const bundle = foundry.utils.deepClone(this.object.system.itemList || []);
    bundle[index][type] = value;
    this.object.update({ 'system.itemList': bundle });
  }

  _npcListAdjustment(event) {
    const index = $(event.currentTarget).closest('li').data("index");
    const type = $(event.currentTarget).closest('li').data("type")
    const value = event.target.value;
    const bundle = foundry.utils.deepClone(this.object.system.npcList || []);
    bundle[index][type] = value;
    this.object.update({ 'system.npcList': bundle });
  }

  /**
   * 
   * Add/remove conditionals on items
   * 
   * @param {*} event 
   */
  async _manageConditionals(event) {
    console.log("", { event })
    const element = event.currentTarget;
    const dataset = element.dataset;
    const li = element.closest("li");
    const index = li?.dataset?.index || undefined;
    const action = dataset.action;

    // console.log("", { element, dataset, li, index, action })

    const conditionals = this.object.system?.attributes?.conditionals || [];

    const bundle = foundry.utils.deepClone(Object.values(conditionals));
    switch (action) {
      case 'create':
        // await this._onSubmit(event); // do this first as we don't save items onchange (it's onclose)
        bundle.push({ name: '', value: '' });
        await this.object.update({ 'system.attributes.conditionals': bundle });
        break;

      case 'remove':
        if (index) {
          bundle.splice(index, 1);
          await this.object.update({ 'system.attributes.conditionals': bundle });
        }
        break;
    }

  }

  /**
   * 
   * Add/remove skill mods properties on items
   * 
   * @param {*} event 
   */
  async _manageSkillModifiers(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const li = element.closest("li");
    const index = li?.dataset?.index || undefined;
    const action = dataset.action;

    const currentSkillMods = this?.object?.system?.attributes?.skillmods || [];
    const bundle = foundry.utils.deepClone(Object.values(currentSkillMods)) || [];
    switch (action) {
      case 'create':
        // await this._onSubmit(event); // do this first as we don't save items onchange (it's onclose)
        bundle.push({ name: '', value: 0 });
        await this.object.update({ 'system.attributes.skillmods': bundle });
        break;

      case 'remove':
        if (index) {
          bundle.splice(index, 1);
          await this.object.update({ 'system.attributes.skillmods': bundle });
        }
        break;
    }

  }
  /**
   * 
   * Add/remove properties fields
   * 
   * @param {*} event 
   */
  async _manageProperties(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const li = element.closest("li");
    const index = li?.dataset?.index || undefined;
    const action = dataset.action;

    const currentPropertiesMods = this?.object?.system?.attributes?.properties || [];
    const propertiesBundle = foundry.utils.deepClone(Object.values(currentPropertiesMods)) || [];
    switch (action) {
      case 'create':
        // await this._onSubmit(event); // do this first as we don't save items onchange (it's onclose)
        propertiesBundle.push('');
        await this.object.update({ 'system.attributes.properties': propertiesBundle });
        break;

      case 'remove':
        if (index) {
          propertiesBundle.splice(index, 1);
          await this.object.update({ 'system.attributes.properties': propertiesBundle });
        }
        break;
    }
  }

  /**
   * Manage skill groups array
   * 
   * @param {*} event 
   */
  async onManage_SkillGroups(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const item = this.object;
    const dataset = element.dataset;
    const actionToPerform = dataset.action;
    const index = dataset.index;

    // console.log("action-sheet.js", "onManage_SkillGroups", "item", item);

    switch (actionToPerform) {
      case "add":
        if (item.system.features.group) {
          let featureBundle = getProperty(item, "system.features");
          featureBundle.groups.push(featureBundle.group);
          featureBundle.group = "";
          await item.update({ "system.features": featureBundle });
        }
        break

      case "remove":
        let deleteBundle = getProperty(item, "system.features");
        deleteBundle.groups.splice(index, 1);
        await item.update({ "system.features": deleteBundle });
        this.render();
        break

      default:
        break

    }
  }

  async onManage_Proficiency(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const item = this.object;
    const dataset = element.dataset;
    const li = element.closest("li");
    const actionToPerform = dataset.action;
    const index = li?.dataset?.index;

    // console.log("action-sheet.js onManage_SkillGroups item", { event, index, actionToPerform, li, element });

    switch (actionToPerform) {
      case "create":
        let appliedBundle = foundry.utils.deepClone(getProperty(item, "system.appliedto") || []);
        appliedBundle = Object.values(appliedBundle);
        appliedBundle.push({ id: '' })
        await item.update({ "system.appliedto": appliedBundle });
        break;

      case "remove":
        if (index) {
          let deleteBundle = foundry.utils.deepClone(getProperty(item, "system.appliedto") || []);
          deleteBundle = Object.values(deleteBundle);
          deleteBundle.splice(index, 1);
          await item.update({ "system.appliedto": deleteBundle });
        }
        break

    }
  }
  /**
   * manage create/remove of class ranks
   * 
   * @param {*} event 
   */
  async onManage_ClassRanks(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const item = this.object;
    const dataset = element.dataset;
    const li = element.closest("li");
    const actionToPerform = dataset.action;
    const index = li?.dataset?.index || null;

    // console.log("action-sheet.js", "onManage_ClassRanks", "item", item);
    // console.log("action-sheet.js", "onManage_ClassRanks", "event", event);
    // console.log("action-sheet.js", "onManage_ClassRanks", "element", element);
    // console.log("action-sheet.js", "onManage_ClassRanks", "dataset", dataset);
    // console.log("action-sheet.js", "onManage_ClassRanks", "li", li);
    // console.log("action-sheet.js", "onManage_ClassRanks", "actionToPerform", actionToPerform);
    // console.log("action-sheet.js", "onManage_ClassRanks", "index", index);

    switch (actionToPerform) {
      case "create":
        await this._onSubmit(event);
        let rankBundle = foundry.utils.deepClone(getProperty(item, "system.ranks") || []);
        rankBundle = Object.values(rankBundle);

        let newRank = undefined;
        if (rankBundle.length) {
          // use previous level rank as a copy for next rank
          const previousRank = rankBundle.length - 1;
          newRank = foundry.utils.deepClone(rankBundle[previousRank]);
          newRank.level = rankBundle[previousRank].level + 1;
          newRank.xp = 0;
          newRank.casterlevel['arcane'] = rankBundle[previousRank].casterlevel['arcane'] > 0 ? rankBundle[previousRank].casterlevel['arcane'] + 1 : 0;
          newRank.casterlevel['divine'] = rankBundle[previousRank].casterlevel['divine'] > 0 ? rankBundle[previousRank].casterlevel['divine'] + 1 : 0;
          newRank.title = "";
        } else {
          newRank = foundry.utils.deepClone(game.system.template.Item['rank']);
          if (newRank.templates instanceof Array) {
            newRank.templates.forEach((t) => {
              newRank = mergeObject(newRank, game.system.template.Item.templates[t]);
            });
          }

          if (!newRank.id) {
            newRank.id = randomID(16);
          }
          delete newRank.templates;
        }

        rankBundle.push(newRank);
        // console.log("action-sheet.js", "onManage_ActionEffects", "rankBundle", rankBundle);
        await item.update({ "system.ranks": rankBundle });
        break

      case "remove":
        let deleteBundle = foundry.utils.deepClone(getProperty(item, "system.ranks") || []);
        deleteBundle = Object.values(deleteBundle);
        deleteBundle.splice(index, 1);
        await item.update({ "system.ranks": deleteBundle });
        break

      default:
        break

    }
  }

  async _onManage_action(event) {
    // console.log("item-sheet.js _onManage_action", { event });

    event.preventDefault();
    const element = event.currentTarget;
    // const item = this.object;
    const dataset = element.dataset;
    const actionToPerform = dataset.action;
    const li = element.closest("li");
    // const index = li.dataset.id;
    // const actionId = li.dataset.actionId;
    // const actionGroup = li.dataset.actionGroup || "";

    const actionInfo = {
      index: 0,
      actionGroup: '',
      actionId: '',
    };

    actionInfo.actionId = li.dataset.actionId;
    actionInfo.index = li.dataset.id;
    actionInfo.actionGroup = li.dataset.actionGroup || "";

    return actionManager.onManage_action(this.item, actionToPerform, actionInfo);
  }

  /**
     * Confirm a click to delete item
     * @param {Event} event 
     */
  _confirmItemDelete(event) {

    // console.log("item-sheet.js", "_confirmItemDelete");

    let d = new Dialog({
      title: game.i18n.localize('ARS.confirm'),
      content: game.i18n.localize('ARS.areyousure'),
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('ARS.yes'),
          callback: () => this._onItemDelete(event)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('ARS.cancel'),
        }
      },
      default: "cancel",
      //render: html => console.log("Register interactivity in the rendered dialog"),
      //close: html => console.log("This always is logged no matter which option is chosen")
    });
    d.render(true);
  }

  /**
   * Handle deleting of item of items
   * @param {Event} event 
   */
  _onItemDelete(event) {
    const li = $(event.currentTarget).parents(".item");
    const index = li.data("index")
    const bundle = foundry.utils.deepClone(this.object.system.itemList || []);
    bundle.splice(index, 1);
    this.object.update({ 'system.itemList': bundle });
    // li.slideUp(200, () => this.render(false));
  }


  /**
   * 
   * When a action group button is clicked on a item
   * 
   * @param {*} event 
   */
  async _actionChatRoll(event) {
    const actionGroup = event.currentTarget.closest("li.action-header").dataset.actionGroup;
    // console.log("item-sheet.js _actionChatRoll", { event, actionGroup });
    // console.log("item-sheet.js _actionChatRoll", this);

    if (this.item.isOwned) { // items need to be owned to trigger an action on them
      let data = undefined;
      if (actionGroup) {
        data = {
          item: this.item,
          sourceActor: this.actor,
          sourceToken: this.actor.token,
          actions: this.item.system.actions,
          owner: this.actor.id,
          actionGroup: actionGroup,
          type: 'action'
        }
      }
      this.item._chatRoll(data);
    } else {
      ui.notifications.error(`Items can only be used when it has an owner.`);
    }
  }

}




