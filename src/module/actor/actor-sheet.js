// import { ARS } from '../config.js';
import { DiceManager } from "../dice/dice.js";
// import * as utils from "../utils.js";
import { onManageActiveEffect, prepareActiveEffectCategories } from "../effect/effects.js";
import * as actionManager from "../apps/action.js";
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import { ARSDicer } from "../dice/dicer.js";
import * as debug from "../debug.js"

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ARSActorSheet extends ActorSheet {
  // constructor(...args) {
  //   super(...args);
  //   // for use later 
  // }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ars", "sheet", "actor"],
      template: "systems/ars/templates/actor/character-sheet.hbs",
      actor: this.actor, // for actor access in character-sheet.hbs
      width: 550,
      height: 900,
      // height: "auto",
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
      // dragDrop: [{ dragSelector: ".item-list .item", dropSelector: "form" }],
      // dragDrop: [{ dropSelector: 'action-block' }],
    });
  }

  /**
   * @override
   * getData function is an asynchronous function that prepares and returns data for the actor sheet
   */
  async getData() {
    const sheetData = super.getData();

    console.log("actor-sheet.js getData", { sheetData }, this)

    // Data bundle object contains all the necessary data for the actor sheet
    const dataBundle = {
      isGM: game.user.isGM,
      isNPC: this.actor.type === "npc",
      isPC: this.actor.type === "character",
      cssClass: this.actor.owner ? "editable" : "locked",
      owner: this.actor.isOwner,
      editable: this.isEditable,
      config: CONFIG.ARS,
      const: CONST,
      game: game,

      enrichedBiography: await TextEditor.enrichHTML(this.object.system.details.biography.value, { async: true }),
      actor: this.object,
      token: this.token,
      effects: this.actor.effects,
      items: this.actor.items,
      system: this.actor.system,

      // Check if the actor has any actions or action inventory
      hasActions: this.actor.system?.actions?.length > 0 || this.actor.actionInventory.some(item => item.system?.actions?.length > 0),
    };

    if (this.actor.isOwner) {
      // Prepare active effects
      dataBundle.effects = prepareActiveEffectCategories(this.actor.effects);

      // Prepare ability and save labels, weapon proficiency indicators, and matrix
      this._prepareAbilityAndSaveLabels(dataBundle);
      this._prepareWeaponProficiencyIndicator(dataBundle);
      this._hitTable(dataBundle);
    }

    // Initialize source names for actor effects
    // const sourceNamePromises = this.actor.effects.map(ae => ae._getSourceName());
    // await Promise.allSettled(sourceNamePromises);

    // Populate formula evaluations and prepare action items
    await actionManager.populateFormulaEvals(this.actor, this.actor.system.actions);
    await this._prepareActionItems();

    return dataBundle;
  }


  /** @override so we can drop coins */
  async _onDrop(event) {
    // console.log("actor-sheet.js _onDrop", { event })

    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;

    console.log("actor-sheet.js _onDrop", { event, data })

    /**
     * A hook event that fires when some useful data is dropped onto an ActorSheet.
     * @function dropActorSheetData
     * @memberof hookEvents
     * @param {Actor} actor      The Actor
     * @param {ActorSheet} sheet The ActorSheet application
     * @param {object} data      The data that has been dropped onto the sheet
     */
    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if (allowed === false) return;

    return this._handleOnDrop(event, data);
  }

  // handle the ondrop w/data
  _handleOnDrop(event, data) {
    // Handle different data types
    console.log("actor-sheet.js _handleOnDrop", { event, data })
    switch (data.type) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      case "Actor":
        return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
        return this._onDropFolder(event, data);
      case "Coin":
        return this._onDropCoin(event, data);
    }
  }

  /**
   * Handle dropping coins onto the actor sheet
   * @param {Event} event - The drop event
   * @param {Object} data - The data associated with the dropped coins
   */
  async _onDropCoin(event, data) {
    if (data.loot) {
      // Parse the currency count and type
      const currencyCount = parseInt(data.currencyCount);
      const currencyType = data.currencyType;

      // Get the coin label based on the currency type
      const coinLabel = game.i18n.localize(game.ars.config.currency[currencyType]);

      // Determine the loot count based on the currency count
      let lootCount = currencyCount === 1 ? 1 : await dialogManager.getQuantity(
        0, currencyCount, 0, `Take how many ${coinLabel} coins (1-${currencyCount})?`, `Loot Coins`
      );

      if (lootCount) {
        // Get the source token and actor for the loot
        // const sourceToken = await fromUuid(data.actorUuid);
        // const sourceActor = sourceToken.actor;
        const sourceActor = await fromUuid(data.actorUuid);

        // Update the source actor's remaining currency
        const sourceCountRemaining = sourceActor.system.currency[currencyType] - lootCount;
        await utilitiesManager.runAsGM({
          sourceFunction: '_onDropCoin',
          operation: 'actorUpdate',
          user: game.user.id,
          targetTokenId: sourceActor.token.id,
          update: { [`system.currency.${currencyType}`]: sourceCountRemaining },
        });

        // Update the target actor's new currency count
        const newTargetCount = parseInt(this.actor.system.currency[currencyType]) + parseInt(lootCount);
        this.actor.update({ [`system.currency.${currencyType}`]: newTargetCount });

        // Send a chat message about the acquired coin
        utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: this.actor }), `Aquired Coin`, `${this.actor.name} looted ${lootCount} ${currencyType} from ${sourceActor.name}.`, 'icons/commodities/currency/coins-plain-stack-gold-yellow.webp');
      }
    }

    return null;
  }

  /**
   * _onDropActor
   * 
   * @param {*} event 
   * @param {*} data 
   * @returns 
   */
  async _onDropActor(event, data) {
    if (data.type === 'Actor') {
      const actor = game.actors.get(data.id);
      if (actor.type === 'lootable') {
        await this.handleDroppedLootable(actor);
      }
    }

    return await super._onDropActor(event, data);
  }

  /** @override */
  /**
   * 
   * We override this so we can ask for quantity taken when "looting" body/chest/etc
   * 
   * @param {*} event 
   * @param {*} data 
   * @returns 
   */
  async _onDropItem(event, data) {
    console.log("actor-sheet.js _onDropItem", { event, data });

    if (data.type === 'Item' && data.loot) {
      this.actor.isLooting = true;
      const item = await fromUuid(data.uuid);
      // let count = data.data.system.quantity;
      let count = item.system.quantity;
      // ask how many to take
      const lootCount = count == 1 ? 1 : await dialogManager.getQuantity(0, count, count,
        `Loot how many (0-${count})?`, `Looting ${item.system.name}`);
      if (lootCount) {
        // change the quantity of the item to the amount taken
        data.data = item.toObject();
        data.data.system.quantity = lootCount;

        // get actor/owner of item looted
        const sourceActor = await fromUuid(data.actorUuid);

        await super._onDropItem(event, data);

        // item coming from actor
        if (sourceActor) {
          // drag/dropping item on same actor they are looting, nope
          if (sourceActor == this.actor) {
            this.actor.isLooting = false;
            return;
          }
          // get the original item
          // const item = await sourceActor.getEmbeddedDocument("Item", data.itemId);
          // const item = await fromUuid(data.uuid);
          let sourceItemCount = parseInt(item.system.quantity)
          let remainingQuantity = (sourceItemCount - lootCount)
          // if (lootCount && sourceItemCount) {
          if (remainingQuantity <= 0) {
            utilitiesManager.runAsGM({
              operation: 'deleteEmbeddedDocuments',
              user: game.user.id,
              targetTokenId: data.tokenId,
              targetItemId: data.itemId,
            });
          } else {
            // update the removed quantity
            utilitiesManager.runAsGM({
              operation: 'itemUpdate',
              user: game.user.id,
              targetTokenId: data.tokenId,
              targetItemId: data.itemId,
              update: { 'system.quantity': remainingQuantity },
            });
          }
          // }
        }
        // we let the default methods of putting the item on the actor from here
        // since we dont have the item yet we have to check if it's ID'd.
        const itemName = item.system.attributes.identified ?
          item.name : `${game.i18n.localize("ARS.unknown")} ${data.type}`;
        utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: this.actor }), `Aquired Item`, `${this.actor.name} looted ${lootCount} ${itemName} from ${sourceActor.name ?? 'Unknown-SourceActor-OnDrop'}.`, data.data.img)
      }
      this.actor.isLooting = false;
      return;
    } // look for "bundle" items dropped on someone and place contents of item only
    else if (data.type === 'Item') {
      // const item = game.items.get(data.id);
      const item = data.uuid ? await fromUuid(data.uuid) : await utilitiesManager.getItem(data.id);
      if (item && item.type === 'bundle') {
        await this.handleDroppedBundle(item);
        return null;
      }
    }

    // console.log("actor-sheet.js _onDropItem _isFromSameActor", (await this._isFromSameActor(data)));

    // if data.data exists it will be used to create the item and wont have a parent.
    if (data.hasOwnProperty('data') && data.hasOwnProperty('uuid'))
      delete data.data;

    return super._onDropItem(event, data);
  }

  /**@override */
  /**
   *
   * This handles item move/sorting as well as placing items in containers
   *
   * @param {*} event
   * @param {*} itemData
   * @returns
   */
  //TODO revisit this and split out container management?
  async _onSortItem(event, itemData) {
    console.log("actor-sheet.js _onSortItem ", { event, itemData });

    // Get the drag source and its siblings
    const source = this.actor.items.get(itemData._id);
    // const siblings = this.actor.items.filter(i => {
    //   return (i.type === source.type) && (i._id !== source.da._id);
    // });
    const siblings = this.actor.items.filter(i => {
      return (i._id !== source._id);
    });
    // Get the drop target
    const dropTarget = event.target.closest("[data-item-id]");
    const targetId = dropTarget ? dropTarget.dataset.itemId : null;
    const target = siblings.find(s => s._id === targetId);

    console.log("actor-sheet.js _onSortItem ", { dropTarget, targetId, target });

    // Ensure we are only sorting like-types
    // if (target && (source.type !== target.type)) return;

    if (!target) {
      // drag/drop outside of container removes item
      return this._removeItemFromContainer(source);
    } else if (target.type === 'container') {
      if (source.containedIn != null && source.containedIn.id == target.id) {
        console.log("tried to drag item to container it was already in")
        return;
      }

      // TODO: Should find a better place for this method to live.
      function containsItem(currentItem, targetItem) {
        if (targetItem == null || currentItem == null) {
          return false;
        }

        if (targetItem.id === currentItem.id) {
          return true;
        }

        if (currentItem.contains != null) {
          return currentItem.contains.some(function (item) {
            return containsItem(item, targetItem);
          });
        }
      }

      // Don't allow someone to drop a container inside a container it contains
      if (containsItem(source, target)) {
        console.log("prevented container from being placed in a container it contains");
        return;
      }

      this._removeItemFromContainer(source);

      const bundle = foundry.utils.deepClone(target.system.itemList) || [];
      console.log("bundle", bundle);

      bundle.push(utilitiesManager.makeItemListRecord(source));


      // source.containedIn = target;
      // change the equipped state since it's going into a container
      await source.update({
        // had to remove the containedIn piece, if we do that we get "expandedObject errors" because of depth 
        // 'containedIn': target,
        'system.location.state': source.isEquipped ? 'carried' : source.system.location.state
      });
      await target.update({ 'system.itemList': bundle });

    } else if ((source.inContainer && target.inContainer != source.inContainer)) {
      // dropped on item that isnt in same container as source, remove us from this container
      this._removeItemFromContainer(source);
    }

    if (target) {
      const sortUpdates = SortingHelpers.performIntegerSort(source, { target: target, siblings });
      const updateData = sortUpdates.map(u => {
        const update = u.update;
        update._id = u.target._id;
        return update;
      });
      // Perform the update
      return this.actor.updateEmbeddedDocuments("Item", updateData);
    }
    // end _onSortItem
  }

  /**
   * Remove a contained item from container
   *
   * @param {*} item
   */
  async _removeItemFromContainer(item) {
    if (item.inContainer && item.containedIn) {
      const containedIn = item.containedIn;
      const newBundle = containedIn.system.itemList.filter((sub) => { return sub.id != item.id });
      delete item.containedIn;
      await containedIn.update({ 'system.itemList': newBundle });
    }
  }

  //for  lootable sheet 
  get canLoot() {
    // add check to see if game.user has permissions?
    return this.actor.isLootable && !this.actor.isOwner;
  }

  get title() {
    if (this.canLoot) {
      const actorName = this.token?.name ?? this.actor.name;
      if (this.actor.isDead) {
        return `${actorName} [DEAD]`; // `;
      } else {
        return actorName;
      }
    }
    return super.title;
  }

  /* -------------------------------------------- */

  /**
   * ACKS changes
   * 
   * Populate Ability score and Save labels
   * 
   * @param {*} data 
   */
  _prepareAbilityAndSaveLabels(data) {
    // console.log("actor-sheet.js _prepareAbilityAndSaveLabels", "data", data)
    // ability labels
    console.log(' _prepareAbilityAndSaveLabels to populate ability and save labels from "data"')
    for (let [key, abil] of Object.entries(data.system.abilities)) {
      // added sanity check on off chance someone adds additional ability like oh, ".dexvalue" by mistake/on purpose ;)
      if (CONFIG.ARS.abilitiesShort?.[key]) {
        abil.label = game.i18n.localize(data.config.abilitiesShort[key])
        abil.labelExtended = game.i18n.localize(data.config.abilities[key])
      }
    }

    // save labels
    for (let [key, sav] of Object.entries(data.system.saves)) {
      // console.log("_prepareAbilityAndSaveLabels key", key)
      // console.log("_prepareAbilityAndSaveLabels data.config.saves[key]", data.config.saves[key])
      sav.label = game.i18n.localize(data.config.saves[key])
    }
  }

  /**
   * 
   * Create a "matrix" array for display in the actor-sheet
   * 
   * @param {*} data 
   */
  _hitTable(data) {
    const thaco = parseInt(data.system.attributes.thaco.value);
    // console.log("_hitTable", { data, thaco })
    const hits = [];
    for (let i = 10; i > -11; i--) {
      hits.push({ ac: i, hit: thaco - i });
    }
    data.system.matrix = hits;
    // console.log("_hitTable", { hits })
  }

  /**
   * 
   * populate variables used to indicate proficiency
   * 
   * @param {*} data 
   */
  _prepareWeaponProficiencyIndicator(data) {

    let profWeapons = {};
    for (const profItem of this.actor.proficiencies) {
      for (const weapon of Object.values(profItem.system.appliedto)) {
        profWeapons[weapon.id] = weapon.id;
      }
    } // end profs check
    // for (const weap of data.system.weapons) {
    for (const weap of this.actor.weapons) {
      let prof = false;
      if (profWeapons[weap.id]) {
        weap.system.proficient = true;
      }
      // weap.update({ 'system.proficient': prof });
    }

    // console.log("actor-sheet.js _prepareWeaponProficiencyIndicator", [profWeapons, data])
  }

  /**
   * initialize the formula evaluations of actions on items held for QOL view
   */
  async _prepareActionItems() {
    for (const item of this.actor.items) {
      await actionManager.populateFormulaEvals(item, item.system.actions);
    }
  }


  /**
   * Used for added edit/delete context menu to items
   * 
   */

  combatItemContext = [
    {
      name: "Roll Initiative",
      icon: '<i class="actor-sheet fas fa-dice"></i>',
      callback: async (element) => {
        const itemId = element[0].dataset.id;
        const itemUuid = element[0].dataset.uuid;
        let item = this.actor.items.get(itemId);
        if (!item && itemUuid)
          item = await fromUuid(itemUuid);
        if (this.actor.initiative && !game.user.isGM) {
          ui.notifications.notify('You have already rolled initiative for this round.')
        } else if (!this.actor.getCombatant()) {
          ui.notifications.notify('You are not in combat.')
        } else {
          await utilitiesManager.rollInitiativeWithSpeed(this.actor, item, true);
        }
      }
    },
    // {
    //   name: "Edit",
    //   icon: '<i class="actor-sheet fas fa-edit"></i>',
    //   callback: element => {
    //     const item = this.actor.items.get(element[0].dataset.id);
    //     item.sheet.render(true);
    //   }
    // },
    // {
    //   name: "Delete",
    //   icon: '<i class="actor-sheet fas fa-trash"></i>',
    //   callback: element => {
    //     // console.log("actor-sheet.js weaponCombatContext", element)
    //     this.actor.deleteEmbeddedDocuments("Item", [element[0].dataset.id]);
    //   }
    // }
  ];

  _onItemSummary(event) {
    // TODO this is not implemented yet.

    // event.preventDefault();
    // let li = $(event.currentTarget).parents(".item");
    // let item = this.actor.items.get(li.data("id"));
    // let description = TextEditor.enrichHTML(item.system.description);

    // console.log("actor-sheet.js _onItemSummary", { event, li, item, description })
    // // Toggle summary
    // if (li.hasClass("expanded")) {
    //   let summary = li.parents(".item-entry").children(".item-summary");
    //   summary.slideUp(200, () => summary.remove());
    //   console.log("actor-sheet.js _onItemSummary summary", { summary })
    // } else {
    //   // Add item tags
    //   let div = $(
    //     `<div class="item-summary">${description}</div>`
    //   );
    //   li.parents(".item-entry").append(div.hide());
    //   div.slideDown(200);
    //   console.log("actor-sheet.js _onItemSummary summary", { div })
    // }
    // li.toggleClass("expanded");
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // allow drag/drop of token from npc-sheet to link
    let _dragLinkHandler = event => {
      console.log("actor-sheet.js _dragLinkHandler", { event }, this)
      event.dataTransfer.setData("text/plain", JSON.stringify({
        type: 'Actor',
        pack: this.actor.pack,
        id: this.actor.id,
        // data: this.actor.toObject(),
        uuid: this.actor.uuid,
      }));
    };
    html.find('#drag-link').each((i, draglink) => {
      draglink.setAttribute("draggable", true);
      draglink.addEventListener("dragstart", _dragLinkHandler, false);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable && !this.actor.isLootable) return;

    // Item Dragging
    let _dragHandler = ev => this._onDragItemStart(ev);
    html.find('li.item').each((i, li) => {
      // console.log("actor-sheet.js _dragHandler", [li])
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", _dragHandler, false);
    });
    html.find('li.coin-loot').each((i, li) => {
      // console.log("actor-sheet.js _dragHandler", [li])
      li.setAttribute("draggable", true);
      li.addEventListener("dragstart", _dragHandler, false);
    });

    // owner specific listeners
    if (this.actor.isOwner) {

      html.find(".actor-longrest").click(async (event) => {
        if (await dialogManager.confirm('Perform long rest?', 'Rest')) {
          this.actor.longRest();
        }
      });

      html.find(".roll-initiative").click((event) => this._initiativeRoll(event));

      //TODO switch to a non-jquery for all the event listeners at some point
      // html[0].querySelector(".item .item-name").addEventListener("click", event => this._onItemSummary(event));
      // html.find(".item .item-name").click((event) => this._onItemSummary(event));

      html.find('button.apply-experience').on("click", this._applyExperience.bind(this));

      // mouseover/out
      html.find('.reveal-hidden').on("mouseover mouseout", this._onToggleHidden.bind(this));

      // Add Inventory Item
      html.find('.item-create').click(this._onItemCreate.bind(this));
      // click add for missing weapon prof in action tab
      html.find('.click-prof-missing').click(this._onMissingProficiency.bind(this));

      // Update Inventory Item
      html.find('.item-edit').click(ev => {
        const li = $(ev.currentTarget).parents(".item");
        // const item = this.actor.items.get(li.data("id"));
        const item = this.actor.getEmbeddedDocument("Item", li.data("id"));
        if (!item) {
          ui.notifications.error(`Item cannot be found in inventory.`)
          return;
        }
        item.sheet.render(true);
      });
      html.find('.item-provisions-edit').click(event => {
        const element = event.currentTarget;
        const li = element.closest("li");
        const item = this.actor.getEmbeddedDocument("Item", li.dataset.id);
        if (!item) {
          ui.notifications.error(`Item cannot be found in inventory.`)
          return;
        }
        item.sheet.render(true);
      });
      html.find('.item-provisions-delete').click(async (event) => {
        const element = event.currentTarget;
        const li = element.closest("li");
        const type = li.dataset.type;

        if (type) {
          if (await dialogManager.confirm(`Remove daily ${type} item`, 'Confirm')) {
            this.actor.update({ [`system.details.provisions.-=${type}`]: null })
          }
        }
      });
      html.find('.item-provisions-select').click(async (event) => {
        const element = event.currentTarget;
        const type = element.dataset.type;

        if (type) {
          const itemId = await dialogManager.getInventoryItem(this.actor, `Select ${type}`, `${type} Item`,
            { inventory: this.actor.provisions });
          const item = this.actor.getEmbeddedDocument('Item', itemId);
          if (item) {
            this.actor.update({ [`system.details.provisions.${type}`]: item.id });
          } else {
            ui.notifications.error(`'${type}' was not selected`)
          }
        }
      });

      html.find('.item-preview').click(event => {
        const element = event.currentTarget;
        // console.log("actor-sheet.js item-view", { element })
        const li = element.closest("li");
        const item = this.actor.getEmbeddedDocument("Item", li.dataset.id);
        if (!item) {
          ui.notifications.error(`Item cannot be found in inventory.`)
          return;
        }
        item.sheet.render(true, { editable: false });
      });

      // item-view, used for pack items in memorization-slots
      html.find('.item-view').click(async (ev) => {
        const li = $(ev.currentTarget).parents(".item");
        const item = await utilitiesManager.getItem(li.data("id"));
        if (!item) {
          ui.notifications.error(`Item cannot be found in world inventory.`)
          return;
        }
        item.sheet.render(true);
      });

      html.find('.item-delete').click(event => this._confirmItemDelete(event));

      // Rollable abilities.
      html.find('.ability-check').click(DiceManager.rollAbility.bind(this));
      html.find('.save-check').click(DiceManager.rollSave.bind(this));
      // html.find('.skill-check').click(this._rollSkillCheck.bind(this));

      // Roll handlers, click handlers, etc. would go here.
      html.find('.spellCard-roll').click(this._itemChatRoll.bind(this));
      html.find('.chatCard-roll').click(this._itemChatRoll.bind(this));
      // direct action roll
      html.find('.actionCard-roll').click(this._actionChatRoll.bind(this));

      // Active Effect management
      //TODO switch to a non-jquery for all the event listeners at some point
      // html[0].querySelector(".effect-control").addEventListener("click", ev => onManageActiveEffect(ev, this.document));
      html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.document));

      // memorization controls
      html.find('.memorization-controls').click(this.memorizationControl.bind(this));
      html.find('.memspell-select').change(this._onSelectedSpell.bind(this));
      // this is no longer used in favor of combo box selection
      // html.find('.memorization-slot-empty').on("drop", this._onDropSpell.bind(this));


      // html.find('.action-block').on("drop", this._onDropAction.bind(this));
      html.find('.action-sheet-block').on("drop", this._onDropAction.bind(this));

      // management links for action data
      html.find('.action-controls').click(this._onManage_action.bind(this));

      html.find('.action-toggle-view').click(actionManager.toggleActionView.bind(this));

      // management of class options
      html.find('.class-control').click(this._classControl.bind(this));

      html.find(".weapon-metal-controls").click(this._manageWeaponMetals.bind(this));

      html.find('.item-location-controls').click(this._itemLocationControls.bind(this));
      html.find('.item-image').click(event => this.onItemImageClicked(event, html));

      html.find('.clone-covert-actor').click(async (event) => {
        const newType = this.actor.type === 'character' ? 'npc' : 'character';
        if (await dialogManager.confirm(`Are you sure you want to clone and convert ${this.actor.name} to a ${newType}?`, 'Clone Conversion')) {
          const actorData = this.actor.toObject();
          actorData.type = newType;
          actorData.name = this.actor.name + ` (${newType})`;
          actorData.folder = undefined;
          const newActor = Actor.create({ ...actorData }, {
            renderSheet: true
          });
        }
      });


      html.find('.general-properties-controls').click(this._manageProperties.bind(this));

      /**
       * This is a context menu for weapons and mem-slots to roll initiative with them
       * 
       */
      new ContextMenu(html, ".weapon-combat", this.combatItemContext);
      new ContextMenu(html, ".memorization-slot", this.combatItemContext);
      //

    } // end was owner

    this._disableOverriddenFields(html);
  }

  /* -------------------------------------------- */


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

    const propertiesBundle = foundry.utils.deepClone(Object.values(this.object.system.properties || []));
    switch (action) {
      case 'create':
        propertiesBundle.push('');
        await this.object.update({ 'system.properties': propertiesBundle });
        break;

      case 'remove':
        if (index) {
          propertiesBundle.splice(index, 1);
          await this.object.update({ 'system.properties': propertiesBundle });
        }
        break;
    }
  }

  /**
   * 
   * Fires when someone drops a spell onto the combat tab.
   * We copy the actions from the spell to the actor directly
   * 
   * @param {*} event 
   */
  async _onDropAction(event) {
    event.preventDefault();
    console.log("actor-sheet.js _onDropAction", { event })

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
   * When an item is dragged we populate data for the transfer
   * 
   * @param {*} event 
   */
  async _onDragItemStart(event) {
    console.log("actor-sheet.js _onDragItemStart", [event]);
    const rootAttr = event.currentTarget.getAttribute("root");
    const element = event.currentTarget;
    const li = element.closest("li");
    const itemId = li.dataset.id;
    const itemUuid = li.dataset.uuid;
    const type = li.dataset.type;
    const currencyType = li.dataset.currency;
    const currencyCount = li.dataset.count;
    const owned = ((li.dataset?.owned === 'true') || false);
    const loot = ((li.dataset?.loot === 'true') || false);

    // specific to memslots
    const controlType = li.dataset.controlType;
    const index = li.dataset.index;
    const level = li.dataset.level;

    console.log("actor-sheet.js _onDragItemStart", { itemId, itemUuid, type, owned });

    if (controlType === 'memorization') {
      // ui.notifications.warn(`Memorization slots are not currently able to be set as macros.`);
      const itemSource = owned ? await this.actor.getEmbeddedDocument("Item", itemId) : await utilitiesManager.getItem(itemId);//await this.actor._getSpellById(game.ars.library.spells[type].all, itemId);
      const item = itemSource.toObject();

      event.dataTransfer.setData("text/plain", JSON.stringify({
        type: "Memorization",
        actorId: this.actor.id,
        actorUuid: this.actor.uuid,
        id: itemId,
        uuid: itemUuid,
        macroData: {
          type: type,
          index: index,
          level: level,
          img: item.img,
          name: item.name,
        },
        root: rootAttr
      }));

    } else {
      console.log("actor-sheet.js _onDragItemStart", { itemId });
      if (itemId) {
        const itemSource = this.actor.getEmbeddedDocument("Item", itemId);
        if (itemSource) {
          const droppedItem = itemSource.toObject()
          console.log("actor-sheet.js _onDragItemStart", { itemSource, droppedItem, loot }, this.actor.id)
          event.dataTransfer.setData("text/plain", JSON.stringify({
            type: "Item",
            id: itemSource.id,
            uuid: itemSource.uuid,
            loot: loot,
            actorId: itemSource.parent?.id,
            actorUuid: itemSource.parent?.uuid,
            tokenId: this.actor?.token?.id,
            sceneId: this.actor?.token?.parent.documentName === 'Scene' ? this.actor.token.parent.id : '',
            // data: droppedItem,
            itemUuid: itemSource.uuid,
            itemId: itemSource.id,
            root: rootAttr
          }));
        }
      } else if (currencyType && currencyCount) {
        event.dataTransfer.setData("text/plain", JSON.stringify({
          type: "Coin",
          loot: loot,
          actorId: this.actor.id,
          actorUuid: this.actor.uuid,
          tokenId: this.actor?.token?.id,
          sceneId: this.actor?.token?.parent?.documentName === 'Scene' ? this.actor.token.parent.id : '',
          currencyCount: currencyCount,
          currencyType: currencyType,
        }));
      }
    }
  }

  /**
   * 
   * Actor applies applyxp to classes
   * 
   * @param {*} event 
   */
  async _applyExperience(event) {
    console.log("actor-sheet.js _applyExperience", { event })
    const xpToApply = this.actor.system.applyxp;
    const xp = this.actor.system.xp;
    const classCount = this.actor.getActiveClassCount();
    if (!classCount) ui.notifications.error(`No class to apply experience towards.`);
    if (xpToApply > 0 && classCount > 0) {
      const xpPerClass = Math.round(xpToApply / classCount);
      this.actor.classes.forEach((classEntry) => {
        // const classSource = this.items.get(classEntry.id);
        if (classEntry.system.active) {
          const xpBonus = classEntry.system.xpbonus;
          // calculate for bonus/penalty xp for this class
          const xpModifiedPerClass = xpBonus ? xpPerClass + Math.round(xpPerClass * (xpBonus * .01)) : xpPerClass;
          const newXPTotal = classEntry.system.xp + xpModifiedPerClass;
          classEntry.update({ 'system.xp': newXPTotal });
          let chatData = {
            content: `
                <div><h2>Applied Experience</h2></div>    
                <div>${this.actor.name} applied ${xpModifiedPerClass} experience to ${classEntry.name}</div>
            `,
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            type: game.ars.const.CHAT_MESSAGE_TYPES.OTHER,
          };
          ChatMessage.create(chatData);

        }
      });
      // applyxp used, reset to 0
      this.actor.update({ 'system.applyxp': 0 });
    }
  }

  /**
     * Event triggered when a memorization spell slot drop down is selected
     * 
     * @param {*} event 
     */
  async _onSelectedSpell(event) {
    event.preventDefault()
    // console.log("actor-sheet.js _onSelectedSpell", { event });

    const element = event.currentTarget;
    const li = element.closest("li");
    const dataset = li.dataset;
    const actor = this.actor;
    const spellId = element.value;
    console.log("actor-sheet.js _onSelectedSpell", { event, element, dataset, spellId });

    const type = dataset.type;
    const level = dataset.level;
    const index = dataset.index; // use this to replace existing spell
    // console.log("actor-sheet.js", "_onSelectedSpell", { type, level, index });

    // get item id (spell) as item
    let campaignItem = false;
    let item = this.actor.getEmbeddedDocument("Item", spellId);
    // spell isnt local so we check the global list
    if (!item) {
      item = await utilitiesManager.getItem(spellId);// this.actor._getSpellById(game.ars.library.spells[type].all, spellId);
      campaignItem = true;
    }


    if (!item) {
      spellInfogetData
      ui.notifications.error(`Unable to find spell item.`);
      return;
    }
    // console.log("actor-sheet.js _onSelectedSpell", { item });

    let memSlots = foundry.utils.deepClone(actor.system.spellInfo.memorization);
    if (!memSlots[type][level]) memSlots[type][level] = new Array();

    memSlots[type][level][index] = {
      name: item.name,
      level: level,
      img: item.img,
      cast: false,
      id: item.id,
      uuid: item.uuid,
      owned: item.isOwned
    };

    await this.actor.update({ "system.spellInfo.memorization": memSlots })
  }
  /**
   * 
   * Remove, reset events for memorization slots
   * 
   * @param {*} event 
   */
  async memorizationControl(event) {

    // console.log("actor-sheet.js", "memorizationControl", this);

    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const actionToPerform = dataset.action;
    const li = element.closest("li");
    const type = li.dataset.type;
    const index = li.dataset.index;
    const level = li.dataset.level || 0;

    // console.log("actor-sheet.js", "memorizationControl", { element, dataset, li, level, index, type, actionToPerform });


    if (actionToPerform) {
      let memSlots = foundry.utils.deepClone(this.actor.system.spellInfo.memorization);
      // if (memSlots[type][level][index].cast && !game.user.isGM)
      //   return ui.notifications.error(`GM is required to toggle use or remove memorized spell for spell slots once it's been used.`)

      if (await dialogManager.confirm(`Are you sure you want to ${actionToPerform} this spell?`)) {
        switch (actionToPerform) {
          case "remove":
            memSlots[type][level][index] = {
              name: null,
              img: null,
              id: null,
              uuid: null,
              cast: false,
              level: level
            };
            break;

          case "toggle":
            memSlots[type][level][index].cast = !memSlots[type][level][index].cast;
            break;
        }

        await this.actor.update({ "system.spellInfo.memorization": memSlots })
      }
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * 
   * Used when they click the "new item" from inventory lists.
   * 
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    // console.log("actor-sheet.js _onItemCreate event", event);
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Initialize a default name.
    const name = `New ${type.capitalize()
      }`;
    //const bNPC = (this.actor.type === 'npc');

    console.log("actor-sheet.js _onItemCreate event", { header, type });

    //const name = game.i18n.format(ARS.NewItem, {itemType: type.capitalize()})
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
    };
    // console.log("actor-sheet.js _onItemCreate itemData", itemData);
    const items = await this.actor.createEmbeddedDocuments("Item", [itemData]);
    // open up the item when it's made
    items[0].sheet.render(true);
  }

  /**
   * 
   * one click add prof for weapon in actions tab w/o proficiency
   * 
   * @param {*} event 
   */
  async _onMissingProficiency(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const li = element.closest("li");
    const itemId = li.dataset.id;
    const itemSource = this.actor.getEmbeddedDocument("Item", itemId);
    if (itemSource) {
      if (await dialogManager.confirm(`Create proficiency for ${itemSource.name}?`, 'Auto-Create Weapon Proficiency')) {
        let itemData = {
          name: itemSource.name,
          type: 'proficiency',
          // img: CONFIG.ARS.icons.general.proficiency.weapon,
          data: {
            cost: 1,
            appliedto: [{ id: itemSource.id }],
            description: `Auto-created for ${itemSource.name}`,
          }
        };
        this.actor.createEmbeddedDocuments("Item", [itemData], { renderSheet: true });
      }
    }
  }


  /**
   * Confirm a click to delete item
   * @param {Event} event 
   */
  async _confirmItemDelete(event) {
    // console.log("actor-sheet.js", "_confirmItemDelete");
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.getEmbeddedDocument("Item", li.data("id"))
    if (await dialogManager.confirm(`<b>Delete ${item.name} ${item?.system?.itemList?.length ? ' (and its contents)' : ''}</b><p/>Are you sure?`, 'Confirm Delete')) {
      this.actor.deleteEmbeddedDocuments("Item", [li.data("id")]);
    }

    // let d = new Dialog({
    //   title: game.i18n.localize('ARS.confirm'),
    //   content: game.i18n.localize('ARS.areyousure'),
    //   buttons: {
    //     yes: {
    //       icon: '<i class="fas fa-check"></i>',
    //       label: game.i18n.localize('ARS.yes'),
    //       callback: () => this._onItemDelete(event)
    //     },
    //     cancel: {
    //       icon: '<i class="fas fa-times"></i>',
    //       label: game.i18n.localize('ARS.cancel'),
    //     }
    //   },
    //   default: "cancel",
    //   //render: html => console.log("Register interactivity in the rendered dialog"),
    //   //close: html => console.log("This always is logged no matter which option is chosen")
    // });
    // d.render(true);
  }

  /**
   * Handle deleting of items
   * @param {Event} event 
   */
  _onItemDelete(event) {
    const li = $(event.currentTarget).parents(".item");
    // console.log("actor-sheet.js _onItemDelete", { li });
    // console.log("actor-sheet.js _onItemDelete li.data(id)", li.data("id"));
    this.actor.deleteEmbeddedDocuments("Item", [li.data("id")]);
    li.slideUp(200, () => this.render(false));
  }

  async setItemLocationState(item, newState) {
    const locationState = game.ars.library.const.location;

    // If the item is a container, we need to set the state for everything under it too.
    if (item.contains) {
      // "Contained" items can't be equipped, so if that's the target state, make them carried instead.
      var containedItemState = newState == locationState.EQUIPPED ? locationState.CARRIED : newState;
      Promise.all(item.contains.map(i => this.setItemLocationState(i, containedItemState)));
    }

    await item.update({ 'system.location.state': newState });
  }


  /**
   * 
   * This is triggered when clicking the equip/carried/notcarried icon in inventory list
   * 
   * @param {*} event 
   */
  async _itemLocationControls(event) {
    // console.log("actor-sheet.js _itemLocationControls", { event });
    const li = $(event.currentTarget).parents(".item");
    const itemId = li.data("id");

    const item = this.actor.getEmbeddedDocument("Item", itemId)

    const carriedState = item.system.location.state;
    const locationState = game.ars.library.const.location;
    let newState = locationState.NOCARRIED;

    let containedItems = [];
    switch (carriedState) {

      case locationState.NOCARRIED:
        newState = locationState.CARRIED;
        break;

      case locationState.CARRIED:
        if (item.containedIn) {
          // cannot equip something in a bag
          newState = locationState.NOCARRIED;
        } else {
          newState = locationState.EQUIPPED;
        }
        break;
    }

    await this.setItemLocationState(item, newState);
    Hooks.call("updateItemLocationState", this.actor, item);
  }

  /**
   * 
   * This is triggered when clicking an item image
   * 
   * @param {*} event 
   */
  async onItemImageClicked(event, html) {
    let parentData = event.currentTarget.parentElement.dataset;
    if (parentData.type == "container") {
      const itemContainer = this.actor.getEmbeddedDocument("Item", parentData.id);
      const hiddenState = itemContainer.getFlag("ars", 'display.collapsedState') || 'block';
      const newState = hiddenState === 'none' ? 'block' : 'none';
      itemContainer.setFlag("ars", 'display.collapsedState', newState);
      // html.find(`.in-container[data-container-id='${parentData.id}']`).toggle();
      // console.log("actor-sheet.js onItemImageClicked", { itemContainer, hiddenState, newState, parentData }, parentData.id)
    }
  }


  /**
   * 
   * Add/remove weapon-metals entries on npcs (silver/iron/cold-iron)
   * 
   * @param {*} event 
   */
  async _manageWeaponMetals(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const action = dataset.action;

    const metalBundle = foundry.utils.deepClone(Object.values(this.actor.system.resistances.weapon.metals) || []);
    switch (action) {
      case 'create':
        metalBundle.push({
          type: 'Silver',
          protection: 'full',
        });
        await this.actor.update({ 'system.resistances.weapon.metals': metalBundle });
        break;

      case 'remove':
        const li = element.closest("li");
        const index = li.dataset.index;
        metalBundle.splice(index, 1);
        await this.actor.update({ 'system.resistances.weapon.metals': metalBundle });
        break;
    }

  }

  /**
   * 
   * Clicking a use action button from Actions tab to generate chatCard with options
   * 
   * @param {*} event 
   */
  async _actionChatRoll(event) {
    // console.log("actor-sheet.js _actionChatRoll", { event });

    // console.log("actor-sheet.js _actionChatRoll this", this)
    const li = event.currentTarget.closest("li");
    const actionGroup = li.dataset.actionGroup;
    const itemId = li.dataset.sourceitemId;

    // console.log("actor-sheet.js _actionChatRoll 213123", { li, itemId, actionGroup }, li.dataset);

    let item;
    if (itemId) {
      item = this.actor.getEmbeddedDocument("Item", itemId);
    }

    const data = {
      actionGroup: actionGroup,
      type: 'action',
      item: item,
    }

    const actionSource = item ? item : this.actor;

    // console.log("actor-sheet.js _actionChatRoll item", item);
    // console.log("actor-sheet.js _actionChatRoll actionSource", actionSource);
    this.actor._chatRoll(data, actionSource);
  }


  /**
   * Handle clickable items (spell slots or weapons) from Actions tab on npc/character sheet
   * 
   * @param {Event} event   The originating click event
   * @private
   */
  async _itemChatRoll(event) {
    console.log("actor-sheet.js _itemChatRoll", event);

    const itemID = event.currentTarget.closest(".item").dataset.id;
    const itemIdPath = event.currentTarget.closest(".item");
    let slotIndex, slotType, slotLevel, slotCast = undefined;

    if (event.currentTarget.closest(".memorization-slot")) {
      slotIndex = event.currentTarget.closest(".memorization-slot").dataset.index || undefined;
      slotType = event.currentTarget.closest(".memorization-slot").dataset.type || undefined;
      slotLevel = event.currentTarget.closest(".memorization-slot").dataset.level || undefined;
      slotCast = true;
    }

    let data = undefined;
    let item = this.actor.items.get(itemID);

    if (slotType) {
      // if spell not in inventory, check global
      if (!item) {
        // item = await this.actor._getSpellById(game.ars.library.spells[slotType].all, itemID);
        item = await utilitiesManager.getItem(itemID);
      }

      if (!item) {
        ui.notifications.error(`Spell item is no longer present in this slot.`, { permanent: true });
        return;
      } else {
        data = {
          event: event,
          slotIndex: slotIndex,
          slotType: slotType,
          slotLevel: slotLevel,
          slotCast: slotCast,
          item: item,
          sourceActor: this.actor,
          sourceToken: this.token,
          actions: item.system.actions
        }
      }
    } else {
      data = {
        event: event,
        item: item,
        sourceActor: this.actor,
        sourceToken: this.token,
        actions: this.actor.system.actions
      }
    }

    // console.log("actor-sheet.js _itemChatRoll", { item });
    // if using initiativeUseSpeed and actor has not rolled initiative, will trigger roll with casttime or speed factor
    const rolledInitiative = await utilitiesManager.rollInitiativeWithSpeed(this.actor, item);
    if (!rolledInitiative) {
      // if we didnt roll init then do weapon/spell bits
      if (item.type === 'weapon') {
        // dialog for weapon use
        this.actor._makeAttackWithItem(event, item);
      } else {
        // chatCard for actions/etc
        item._chatRoll(data);
      }
    }

  }

  /**
   * Toggle hidden controls on mouseover event.
   * 
   * @param {Event} event 
   */
  _onToggleHidden(event) {
    const li = event.currentTarget.closest("li");
    let hidden = event.currentTarget.getElementsByClassName('item-control');
    if (!hidden.length) {
      // we look for li's parent and then from there look for item-control otherwise
      hidden = li.parentNode.getElementsByClassName('item-control');
    }
    $.each(hidden, function (index, value) {
      $(value).toggleClass('hidden');
    });
  }




  /**
   * This manages the events tied to action edit/add/remove/etc
   * 
   * @param {*} event 
   */
  async _onManage_action(event) {
    // console.log("actor-sheet.js _onManage_action", { event });

    event.preventDefault();
    const element = event.currentTarget;
    // const item = this.object;
    const dataset = element.dataset;
    const actionToPerform = dataset.action;
    const li = element.closest("li");
    let index = 0;
    let itemId;
    // let actionGroup;
    // let actionId;
    const actionInfo = {
      index: 0,
      actionGroup: '',
      actionId: '',
    };
    if (li) {
      actionInfo.actionId = li.dataset.actionId;
      actionInfo.index = li.dataset.id;
      actionInfo.actionGroup = li.dataset.actionGroup || "";
      itemId = li.dataset.sourceitemId;
    }
    let item = itemId ? this.actor.getEmbeddedDocument("Item", itemId) : undefined;
    let sourceObject = item ? item : this.actor;
    return actionManager.onManage_action(sourceObject, actionToPerform, actionInfo);
  }

  /**
   * 
   * controls to manage class on an actor-sheet
   * 
   * @param {*} event 
   */
  async _classControl(event) {
    // console.log("actor-sheet.js _classControl", { event }, this)
    event.preventDefault();

    const element = event.currentTarget;
    const dataset = element.dataset;
    const actionToPerform = dataset.action;
    const itemId = element.closest("li")?.dataset.id || undefined;
    const actor = this.actor;

    // const itemId = element.closest("li")?.dataset.id || undefined;
    const sourceClass = this.actor.items.get(itemId);
    // console.log("actor-sheet.js _classControl", { event, element, actionToPerform, itemId, actor, sourceClass });

    if (await dialogManager.confirm(`${(actionToPerform === 'addlevel' ? 'Add' : 'Remove')} level for ${sourceClass.name} ? `)) {

      // console.log("actor-sheet.js _classControl dialogConfirm", { actionToPerform })
      switch (actionToPerform) {

        case "addlevel":
          await this._addLevel(sourceClass);
          break;

        case "removelevel":
          await this._removeLevel(sourceClass);
          break;

        default:
          ui.notifications.warn(`actor-sheet.js _classControl INVALID ACTION: ${actionToPerform}`)
          console.log("actor-sheet.js _classControl INVALID ACTION", { actionToPerform, element, dataset })
          break;

      }

    } else {
      console.log("actor-sheet.js _classControl FALSE CONFIRM");
    }
  }

  _addLevel(sourceClass) {
    // console.log("actor-sheet.js _addLevel", sourceClass);
    this._updateForLevelChange(sourceClass, true);
  }

  _removeLevel(sourceClass) {
    // console.log("actor-sheet.js _removeLevel", sourceClass);
    this._updateForLevelChange(sourceClass, false);
  }

  async _updateForLevelChange(sourceClass, levelup, processingDrop = false) {
    // console.trace("actor-sheet.js _updateForLevelChange", { sourceClass, levelup, processingDrop });
    // the advancement records from all level ups
    let advancementBundle = Object.values(foundry.utils.deepClone(sourceClass.system.advancement));
    // console.log("actor-sheet.js _updateForLevelChange 1", { advancementBundle });
    // the record we store on the class item to track what happened in this level
    let advancement = levelup ? {} : advancementBundle[advancementBundle.length - 1];
    // const level = levelup ? advancementBundle.length + 1 : (advancementBundle[advancementBundle.length - 2].level || 1);
    const level = levelup ? advancementBundle.length + 1 : (advancementBundle.length - 1 || 1);
    const levelIndex = level - 1;
    advancement.level = level;

    const maxLevel = Object.values(sourceClass.system.ranks).length;
    const currentLevel = advancementBundle.length;

    if (levelup && (currentLevel >= maxLevel)) {
      ui.notifications.error(`Already highest level in "${sourceClass.name}".`);
    } else if (!levelup && currentLevel <= 1) {
      ui.notifications.error(`Already lowest level in "${sourceClass.name}".`);
    } else {
      // dataBundle, advancementBundle, advancement =
      //   this._reconfigureHealth(sourceClass, dataBundle, advancementBundle, advancement, levelup);
      await this._configureHealth(sourceClass, advancementBundle, advancement, levelup, processingDrop);
      // console.log("actor-sheet.js", "_updateForLevelChange dataBundle=--", duplicate(dataBundle));

      // pop last entry in advancement records if removing level
      if (!levelup) {
        advancementBundle.pop();
      } else {
        advancementBundle.push(advancement);
      }
      //this needs to be updated before updateFromClasses is run
      // console.log("actor-sheet.js _updateForLevelChange 2", { advancementBundle });
      await sourceClass.update({ "system.advancement": advancementBundle });

      // update for classes data
      await this._updateFromClasses(level, levelIndex, sourceClass);
    }
  }

  /**
   * 
   * Update various features/attributes for class/level change
   * 
   * @param {*} level 
   * @param {*} levelIndex 
   * @param {*} sourceClass 
   */
  async _updateFromClasses(level, levelIndex, sourceClass) {
    // console.trace("actor-sheet.js _updateFromClasses", { level, levelIndex, sourceClass });
    await this._reconfigureAcademics(sourceClass, level);
    await this._reconfigureRacialsAndBackground(level);
    await this._reconfigureSaves(levelIndex, sourceClass);
    // this needs to be updated before spells are reconfigured.
    // await this.actor.update({ "data": dataBundle });

    this._reconfigureAttributes();
    this._reconfigureSpellInfo();
  }

  /**
   * 
   * Configure health for level change
   * 
   * @param {*} sourceClass 
   * @param {*} advancementBundle 
   * @param {*} advancement 
   * @param {*} levelup 
   * @returns 
   */
  async _configureHealth(sourceClass, advancementBundle, advancement, levelup, processingDrop) {
    const currentRanks = Object.values(sourceClass.system.ranks);
    if (levelup) {
      let activeClassCount = Object.values(this.actor.activeClasses).length;
      const deactiveClassCount = Object.values(this.actor.deactiveClasses).length;

      // console.log("actor-sheet.js _configureHealth", activeClassCount, deactiveClassCount);

      // if we're processing a class add from a new drag/dropped, we add 1 to the list.
      activeClassCount += processingDrop ? 1 : 0;

      if (advancement.level > 1 &&
        deactiveClassCount > 0 && this.actor.getMaxDeactiveLevel() > advancement.level) {
        // this is a dual class character that has not made it past previous class
        // so they do not get HD rolled
        advancement.hp = 0;
      } else {
        const levelIndex = advancement.level - 1;

        const hpFormula = currentRanks[levelIndex].hdformula;
        const roll = await new Roll(String(hpFormula), this.actor.getRollData()).roll({ async: true });
        let speaker = ChatMessage.getSpeaker({ actor: this.actor });
        // we calculate hp based on number classes/etc in _prepareClassData using the advancement[] array
        const addHP = roll.total;
        // console.log("actor-sheet.js", "_configureHealth addHp=--", { addHP });

        const label = `Rolled ${addHP} hitpoints for ${sourceClass.name}`;
        roll.toMessage({ speaker: speaker, flavor: label }, {});

        // calculate hp on character in _prepareClassData 
        // update item advancement records
        advancement.hp = addHP;
      }
    } else {
      if (advancementBundle.length) {
        const previousHP = advancementBundle[advancementBundle.length - 1].hp;
        let newMaxHP = this.actor.system.attributes.hp.max -= previousHP;
        let newValueHP = this.actor.system.attributes.hp.value;
        // dataBundle.attributes.hp.max -= previousHP;
        if (this.actor.system.attributes.hp.value > newMaxHP) {
          newValueHP = newMaxHP;
        }
        const updates = {
          'system.attributes.hp.max': newMaxHP,
          'system.attributes.hp.value': newValueHP,
        }
        await this.actor.update(updates);
      }
    }

    // console.log("actor-sheet.js", "_configureHealth dataBundle=--", duplicate(dataBundle));
  }

  /**
   * 
   * Reconfigure saves for class add/level changes
   * 
   * @param {*} levelIndex the index of the level to configure for (level-1)
   * @returns 
   */
  async _reconfigureSaves(levelIndex, sourceClass) {
    let saves = {
      "paralyzation": {
        "value": 20
      },
      "poison": {
        "value": 20
      },
      "death": {
        "value": 20
      },
      "rod": {
        "value": 20
      },
      "staff": {
        "value": 20
      },
      "wand": {
        "value": 20
      },
      "petrification": {
        "value": 20
      },
      "polymorph": {
        "value": 20
      },
      "breath": {
        "value": 20
      },
      "spell": {
        "value": 20
      }
    };

    // check all active classes for save values for this level
    this.actor.classes.forEach((classEntry) => {
      let currentLevelIndex = levelIndex;
      if (classEntry != sourceClass) {
        currentLevelIndex = this.actor.getClassLevel(classEntry) - 1;
      }
      console.log("actor.js _reconfigureSaves", { currentLevelIndex, classEntry })
      for (let [key, saveType] of Object.entries(saves)) {
        const currentRanks = Object.values(classEntry.system.ranks);
        // console.log("actor.js _reconfigureSaves", { key, saveType, currentRanks })
        if (currentLevelIndex >= 0 && (currentLevelIndex <= (currentRanks.length - 1))) {
          const classSaveValue = currentRanks[currentLevelIndex][key];
          if (saveType.value > classSaveValue) {
            saves[key].value = classSaveValue;
          }
        }
      };
    });

    // set new save values on character
    const saveBundle = foundry.utils.deepClone(this.actor.system.saves);
    for (let [key, cSaveType] of Object.entries(saveBundle)) {
      saveBundle[key].value = saves[key].value;
    };
    await this.actor.update({ 'system.saves': saveBundle });
  }

  /**
   * 
   * Add/remove abilities/skills (class.system.itemList items) on this class for this level
   * 
   * Supports adding and removing if the levels change.
   * 
   * @param {*} sourceClass 
   * @param {*} dataBundle 
   * @param {*} levelIndex 
   * @returns 
   */
  async _reconfigureAcademics(source, level) {
    const actor = this.actor;
    // console.trace("actor-sheet.js _reconfigureAcademics", { source, level, actor })
    // console.log("actor-sheet.js _reconfigureAcademics", { source, level })
    const addAbilities = [];
    const addAbilitiesIds = [];
    const removeAbilityIds = [];
    // check itemList on the class object to see if we have a skill/ability to add/remove at this level
    for (const subItem of source.system.itemList) {
      const subItemLevel = parseInt(subItem.level) || 0;
      // console.log("actor-sheet.js _reconfigureAcademics", { subItem })
      let abilityItem = this.actor.getEmbeddedDocument("Item", subItem.id);
      // console.log("actor-sheet.js _reconfigureAcademics", { abilityItem })
      // we have ability and yet we're to low for it now
      if (abilityItem && subItemLevel > level) {
        removeAbilityIds.push(subItem.id);
        // dont have ability but we can use it
      } else if (!abilityItem && (!subItemLevel || subItemLevel <= level)) {
        // const newAbility = game.items.get(subItem.id);
        // let newAbility = await utilitiesManager.getItem(subItem.id);
        // if (!newAbility) newAbility = await fromUuid(subItem.uuid);
        // get the source of the item
        // let newAbility = await fromUuid(subItem.uuid);
        let newAbility = await utilitiesManager.getItem(subItem.id);

        // class items do not have their sub-items added until proper level.
        // if (!newAbility && source.type === 'class') newAbility = await utilitiesManager.getItem(subItem.id);

        // console.log("actor-sheet.js _reconfigureAcademics", { newAbility })
        if (newAbility) {
          const newAbilityData = foundry.utils.deepClone(newAbility.toObject());
          addAbilities.push(newAbilityData);
          addAbilitiesIds.push(newAbility.id);
        }
      }
    }

    if (source.type === 'race') {
      const raceSize = source.system.attributes.size;
      await actor.update({ 'system.attributes.size': raceSize });
    }
    // console.trace("actor-sheet.js _reconfigureAcademics", { addAbilities, removeAbilityIds })
    // add any abilities missing
    if (addAbilities.length) {
      await this.actor.createEmbeddedDocuments("Item", addAbilities, { keepId: true });
      await dialogManager.showItems(null, addAbilitiesIds, `Added the following`, `Items Added`)
    }
    // remove any abilities we dont have
    if (removeAbilityIds.length) {
      await this.actor.deleteEmbeddedDocuments("Item", removeAbilityIds);
      await dialogManager.showItems(null, removeAbilityIds, `Removed the following`, `Items Added`)
    }
  }

  /**
   * 
   * Update abilities/skills for race and background items
   * 
   * @param {*} level 
   */
  async _reconfigureRacialsAndBackground(level) {

    for (const background of this.actor.backgrounds) {
      await this._reconfigureAcademics(background, level);
    }

    for (const race of this.actor.races) {
      await this._reconfigureAcademics(race, level);
    }
  }

  /**
   * 
   * Reconfigure attributes for class/level change
   * 
   * @param {*} dataBundle 
   * @param {*} levelIndex 
   * @returns 
   */
  async _reconfigureAttributes() {
    let ac = 10;
    let move = 0;
    let thaco = 20;

    this.actor.classes.forEach((classEntry) => {
      const currentRanks = Object.values(classEntry.system.ranks);
      const maxLevelIndex = classEntry.system.advancement.length - 1;
      const index = maxLevelIndex < 0 ? 0 : maxLevelIndex;
      // console.log("actor.js _reconfigureAttributes", { currentRanks, maxLevelIndex, index })
      if (currentRanks[index]?.ac && currentRanks[index].ac < ac) ac = currentRanks[index].ac;
      if (currentRanks[index]?.thaco && currentRanks[index].thaco < thaco) thaco = currentRanks[index].thaco;
      if (currentRanks[index]?.move && currentRanks[index].move > move) move = currentRanks[index].move;
    });

    // dataBundle.attributes.ac.value = ac;
    // dataBundle.attributes.thaco.value = thaco;
    // dataBundle.attributes.movement.value = move;

    // console.log("actor.js _reconfigureAttributes", { ac, thaco, move })

    const updates = {
      'system.attributes.ac.value': ac,
      'system.attributes.thaco.value': thaco,
      'system.attributes.movement.value': move,
    }

    await this.actor.update(updates);
  }

  /**
   * Recalculate all spell slots and cast level
   * 
   */
  async _reconfigureSpellInfo() {
    // console.log("actor-sheet.js _reconfigureSpellInfo", { dataBundle, levelIndex });
    let dataBundle = foundry.utils.deepClone(this.actor.system.spellInfo);

    for (const spellType of ['arcane', 'divine']) {
      // set spell cast level to 0
      dataBundle.level[spellType].value = 0;
      // iterate over each level of spell reset to 0

      Object.values(dataBundle.slots[spellType].value).forEach((value, spellLevel) => {
        dataBundle.slots[spellType].value[spellLevel] = 0;
      });
    }

    // go through each class and add in spell slots for levelIndex
    // this.actor.classes.forEach((classEntry) => {
    for (const classEntry of this.actor.classes) {
      const currentRanks = Object.values(classEntry.system.ranks);
      const maxLevelIndex = classEntry.system.advancement.length - 1;
      // if (levelIndex <= currentRanks.length - 1) {
      if (maxLevelIndex >= 0) {
        for (const spellType of ['arcane', 'divine']) {
          // set "effective cast level"
          if (dataBundle.level[spellType].value < currentRanks[maxLevelIndex].casterlevel[spellType]) {
            dataBundle.level[spellType].value = currentRanks[maxLevelIndex].casterlevel[spellType];
          }

          // iterate over each level of spell and add slots in total
          // Object.values(dataBundle.slots[spellType].value).forEach((value, spellLevel) => {
          // for (const fuckoff of Object.values(dataBundle.slots[spellType].value)((value, spellLevel) => {
          for (let spellLevel = 0; spellLevel < Object.values(dataBundle.slots[spellType].value).length; spellLevel++) {
            dataBundle.slots[spellType].value[spellLevel] += currentRanks[maxLevelIndex][spellType][spellLevel];
          }

        }
      }

    }

    await this.actor.update({ "system.spellInfo": dataBundle });
  }

  async handleDroppedBundle(bundle) {
    console.log("actor-sheet.js handleDroppedBundle", { bundle })
    await this.handleCurrencyCopy(bundle.system.currency);
    let itemList = bundle.system.itemList;
    if (itemList.length) {
      let itemsData = await Promise.all(itemList.map(async (i) => {
        return {
          item: await utilitiesManager.getItem(i.id),
          quantity: i.count
        }
      }));
      itemsData = itemsData.filter(i => i.item); // remove undefined/null
      await this.handleItemsCopy(itemsData);
    }
  }

  async handleDroppedLootable(lootable) {
    await this.handleCurrencyCopy(lootable.system.currency);
    let itemsData = lootable.inventory.map(i => {
      return {
        item: i,
        quantity: i.system.quantity
      }
    });
    await this.handleItemsCopy(itemsData);
  }

  async handleItemsCopy(itemsData) {
    const createSubItems = [];
    if (itemsData.length) {
      itemsData.map(i => {
        const newItemData = foundry.utils.deepClone(i.item.toObject());
        // set the number of items
        newItemData.system.quantity = parseInt(i.quantity);
        if (newItemData) createSubItems.push(newItemData);
      });

      if (createSubItems.length) {
        await this.actor.createEmbeddedDocuments("Item", createSubItems);
      }
    }
  }

  async handleCurrencyCopy(currency) {
    Object.keys(currency).forEach(coin => {
      if (currency[coin] > 0) {
        let currentCoin = parseInt(this.actor.system.currency[coin]);
        if (isNaN(currentCoin)) {
          currentCoin = 0;
        }
        this.actor.update({ [`system.currency.${coin}`]: (currentCoin + parseInt(currency[coin])) });
      }
    });
  }



  /**
   * Disable any fields that are overridden by active effects and display an informative tooltip.
   * @param {jQuery} html  The sheet's rendered HTML.
   * @protected
   */
  _disableOverriddenFields(html) {
    for (const override of Object.keys(foundry.utils.flattenObject(this.actor.overrides))) {
      // const proficiencyToggles = {
      //   ability: /system\.abilities\.([^.]+)\.proficient/,
      //   skill: /system\.skills\.([^.]+)\.value/,
      //   tool: /system\.tools\.([^.]+)\.value/
      // };

      html.find(`input[name="${override}"],select[name="${override}"]`).each((i, el) => {
        el.disabled = true;
        el.dataset.tooltip = "ARS.ActiveEffectOverrideWarning";
      });

      // for ( const [key, regex] of Object.entries(proficiencyToggles) ) {
      //   const [, match] = override.match(regex) || [];
      //   if ( match ) {
      //     const toggle = html.find(`li[data-${key}="${match}"] .proficiency-toggle`);
      //     toggle.addClass("disabled");
      //     toggle.attr("data-tooltip", "DND5E.ActiveEffectOverrideWarning");
      //   }
      // }      

      // const [, spell] = override.match(/system\.spells\.(spell\d)\.override/) || [];
      // if (spell) {
      //   html.find(`.spell-max[data-level="${spell}"]`).attr("data-tooltip", "ARS.ActiveEffectOverrideWarning");
      // }

    }
  }
} // end actor-sheet
