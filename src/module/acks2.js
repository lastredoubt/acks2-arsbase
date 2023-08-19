// Import Modules
import { ARS } from './config.js';
import { registerSystemSettings } from "./settings.js";
import { preloadTemplates } from "./preloadTemplates.js";

// Overrides
import { ARSActor } from "./actor/actor.js";
import { ARSItem } from "./item/item.js";
import { ARSCombatTracker, ARSCombat } from "./combat/combatTracker.js";
import { CombatManager } from "./combat/combat.js";
import { PartySidebar } from "./sidebar/party.js";
import { ARSToken, ARSTokenDocument, ARSTokenLayer } from "./token/token.js";
import { ARSRollTable, ARSActiveEffect, ARSCombatant, ARSPermissionControl, ARSJournalDirectory, ARSRollTableDirectory, ARSItemDirectory, ARSPlaylistDirectory, ARSCompendiumDirectory, ARSTokenConfig, ARSActiveEffectConfig, ARSRollTableConfig, ARSChatLog } from "./overrides.js";
// Applications
import { ARSActorSheet } from "./actor/actor-sheet.js";
import { ARSLootableSheet } from "./actor/actor-sheet-lootable.js";
import { ARSNPCSheet } from "./actor/actor-sheet-npc.js";
import { ARSCharacterSheet } from "./actor/actor-sheet-character.js";
import { ARSJournalSheet } from "./journal/journal-sheet.js";
import { ARSItemSheet } from "./item/item-sheet.js";
import { ARSItemBrowser } from "./apps/item-browser.js";
import { ActionSheet } from "./apps/action-sheet.js";
import { ImportSheet, ImportManager } from "./apps/import-tools.js";
// Import Helpers
// import * as chat from "./chat.js";
import * as debug from "./debug.js"
import { DiceManager } from "./dice/dice.js";
import * as effectManager from "./effect/effects.js";
import * as chatManager from "./chat.js";
import * as utilitiesManager from "./utilities.js";
import * as macrosManager from "./macros.js";
import * as actionManager from "./apps/action.js";
import * as dialogManager from "./dialog.js";
import * as migrationManager from "./system/migration.js";
import * as initHooks from "./hooks.js"
import * as initHandlebars from "./handlebars.js"

Hooks.once('init', async function () {

  console.log("ars | Initializing ARS.System");

  // DEBUG hooks
  // CONFIG.debug.hooks = true;

  game.ars = {
    // Variable we use to make sure we don't run the same request if we have multiple GMs.
    runAsGMRequestIds: [],
    applications: {
      ActionSheet,
      ARSCharacterSheet,
      ARSNPCSheet,
      ARSLootableSheet,
      ARSCombatant,
      ARSPermissionControl,
      // ARSFolder,
      ARSActiveEffectConfig,
      // ARSJournalSheet,
      ARSJournalDirectory,
      ARSRollTableDirectory,
      ARSRollTableConfig,
      ARSChatLog,
      ARSItemDirectory,
      ARSPlaylistDirectory,
      ARSCompendiumDirectory,
      ARSItemBrowser,
      ImportSheet,
    },
    ARSActor,
    ARSItem,
    ARSActorSheet,
    // ARSJournalSheet,
    ARSTokenDocument,
    ARSRollTable,
    config: ARS,
    const: CONST,
    diceManager: DiceManager,
    macrosManager: macrosManager,
    chatManager: chatManager,
    effectManager: effectManager,
    actionManager: actionManager,
    utilitiesManager: utilitiesManager,
    dialogManager: dialogManager,
    combatManager: CombatManager,
    migrationManager: migrationManager,
    importManager: ImportManager,
    library: {},
    //    chat: chat,
    // rollItemMacro: macrosManager.rollItemMacro,
  };

  // ars config
  CONFIG.ARS = ARS

  // default initiative
  CONFIG.Combat.initiative = {
    formula: "1d6",
    decimals: 2
  };

  //TODO: this should be a configurable setting
  if (CONFIG.Combat?.skipDefeated === undefined)
    CONFIG.Combat.skipDefeated = true;

  // round/turn time (in seconds)
  CONFIG.time.roundTime = 60;
  CONFIG.time.turnTime = 600;

  // Define custom Entity classes
  CONFIG.Actor.documentClass = ARSActor;
  CONFIG.Item.documentClass = ARSItem;
  CONFIG.Combat.documentClass = ARSCombat;
  CONFIG.Combatant.documentClass = ARSCombatant;
  CONFIG.RollTable.documentClass = ARSRollTable;
  CONFIG.ActiveEffect.documentClass = ARSActiveEffect;
  CONFIG.Token.documentClass = ARSTokenDocument;
  CONFIG.Token.objectClass = ARSToken;
  CONFIG.Token.prototypeSheetClass = ARSTokenConfig;

  // CONFIG.Token.documentClass = ARSFormApplication;

  /**
   * Configuration for the ChatMessage document
   * 
   * needed to tweak the chat-message template
   */
  CONFIG.ChatMessage = {
    documentClass: ChatMessage,
    collection: Messages,
    template: "systems/ars/templates/chat/chat-message.hbs",
    sidebarIcon: "fas fa-comments",
    batchSize: 100
  }

  console.log("CONFIG===============", CONFIG)
  CONFIG.Canvas.layers.tokens.layerClass = ARSTokenLayer;
  CONFIG.ui.chat = ARSChatLog;
  CONFIG.ui.combat = ARSCombatTracker;
  CONFIG.ui.journal = ARSJournalDirectory;
  CONFIG.ui.items = ARSItemDirectory;
  CONFIG.ui.tables = ARSRollTableDirectory;
  CONFIG.ui.playlists = ARSPlaylistDirectory;
  CONFIG.ui.compendium = ARSCompendiumDirectory;
  CONFIG.ui.party = PartySidebar;
  // CONFIG.Folder.documentClass = ARSFolder;
  // this overrides/extends the PermissionControl app class, we 
  // do subfolder permission settings with this.
  DocumentOwnershipConfig = ARSPermissionControl;

  // Register System Settings
  registerSystemSettings();

  CONFIG.Combat.initiative.formula = game.settings.get("ars", "initiativeFormula");
  CONFIG.ARS.settings = {
    autohitfail: game.settings.get("ars", "useAutoHitFailDice"),
    automateLighting: game.settings.get("ars", "automateLighting"),
    automateVision: game.settings.get("ars", "automateVision"),
    npcLootable: game.settings.get("ars", "npcLootable"),
    debugMode: game.settings.get("ars", "debugMode"),
    ctShowOnlyVisible: game.settings.get("ars", "ctShowOnlyVisible"),
    encumbranceIncludeCoin: game.settings.get("ars", "encumbranceIncludeCoin"),
    identificationActor: game.settings.get("ars", "identificationActor"),
    identificationItem: game.settings.get("ars", "identificationItem"),
    systemVariant: game.settings.get("ars", "systemVariant"),
    useArmorDamage: game.settings.get("ars", "useArmorDamage"),
    initiativeUseSpeed: game.settings.get("ars", "initiativeUseSpeed"),
    consumeFoodWater: game.settings.get("ars", "consumeFoodWater"),
    automateEncumbrance: game.settings.get("ars", "automateEncumbrance"),
  }
  // set this setting dependant on variant type
  // game.settings.settings.get("ars.useArmorDamage").config = CONFIG.ARS.settings.systemVariant == '2';

  // hook debug
  CONFIG.debug.hooks = CONFIG.ARS.settings.debugMode;

  //include ruleset specific statusEffects
  ARS.statusEffects.forEach(status => {
    CONFIG.statusEffects.push(status);
  })

  // set defeated icon to something special
  CONFIG.controlIcons.defeated = ARS.icons.general.combat.effects.defeated;
  const deadIndex = CONFIG.statusEffects.findIndex((entry) => { return entry.id === 'dead' });
  if (deadIndex > -1) CONFIG.statusEffects[deadIndex].icon = ARS.icons.general.combat.effects.defeated;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  // Actors.registerSheet("ars", ARSActorSheet, { makeDefault: true });
  Actors.registerSheet("ars", ARSCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "ARS.sheet.actor.character"
  });
  Actors.registerSheet("ars", ARSNPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "ARS.sheet.actor.npc"
  });
  Actors.registerSheet("ars", ARSLootableSheet, {
    types: ["lootable"],
    makeDefault: true,
    label: "ARS.sheet.actor.lootable"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ars", ARSItemSheet, { makeDefault: true });

  DocumentSheetConfig.registerSheet(TokenDocument, "ars", ARSTokenConfig, { makeDefault: true });
  DocumentSheetConfig.registerSheet(ActiveEffect, "ars", ARSActiveEffectConfig, { makeDefault: true });
  DocumentSheetConfig.registerSheet(RollTable, "ars", ARSRollTableConfig, { makeDefault: true });

  // DocumentSheetConfig.registerSheet(ActiveEffect, "ars", ARSActiveEffect, {
  //   makeDefault: true, 
  //   label: "ARS.ActiveEffect"
  // });

  // DocumentSheetConfig.unregisterSheet(JournalEntry, "core", JournalSheet);
  // DocumentSheetConfig.registerSheet(JournalEntry, "ars", ARSJournalSheet, { makeDefault: true });

  // set some global consts to be used

  initHandlebars.default();

  await preloadTemplates();
});

initHooks.default();

