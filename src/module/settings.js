import { ARS } from './config.js';
import * as debug from "./debug.js"
import { ARSSettingsAudio } from './apps/settings-audio.js'
import { ARSSettingsCombat } from './apps/settings-combat.js'

export const registerSystemSettings = function () {

  game.settings.registerMenu("ars", "arsAudio", {
    name: "Audio",
    label: "Audio Options",      // The text label used in the button
    hint: "Configuration options for ruleset specific audio",
    icon: "fas fa-cog",               // A Font Awesome icon used in the submenu button
    type: ARSSettingsAudio,   // A FormApplication subclass which should be created
    restricted: false                   // Restrict this submenu to gamemaster only?
  });

  game.settings.registerMenu("ars", "arsCombat", {
    name: "Combat",
    label: "Combat Options",
    hint: "Configuration options for ruleset specific combat",
    icon: "fas fa-cog",
    type: ARSSettingsCombat,
    restricted: true,
  });


  // Internal System Migration Version tracking
  game.settings.register("ars", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  // Internal System Changelog Version tracking
  game.settings.register("ars", "systemChangeLogVersion", {
    name: "System Changelog Version",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });


  /**
   * 
   * Settings used internally for Party-Tracker
   * 
   */
  game.settings.register("ars", "partyMembers", {
    name: "System Party Tracker - Members",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
  game.settings.register("ars", "partyAwards", {
    name: "System Party Tracker - Awards",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
  game.settings.register("ars", "partyLogs", {
    name: "System Party Tracker - Logs",
    requiresReload: false,
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
  // end Party-Tracker settings

  //const systemVariant = game.settings.get("ars", "systemVariant");
  game.settings.register("ars", "systemVariant", {
    name: "SETTINGS.systemVariantLabel",
    hint: "SETTINGS.systemVariantTT",
    scope: "world",
    requiresReload: true,
    config: true,
    type: String,
    choices: {
      "0": "SETTINGS.systemVariant.0",
      "1": "SETTINGS.systemVariant.1",
      "2": "SETTINGS.systemVariant.2"
    },
    default: "0",
    onChange: systemVariant => {
      CONFIG.ARS.settings.systemVariant = systemVariant;
      // change initiative based on variant
      switch (systemVariant) {
        case '0':
          game.settings.set("ars", "initiativeFormula", "1d6");
          break;
        case '1':
          game.settings.set("ars", "initiativeFormula", "1d6");
          break;
        case '2':
          game.settings.set("ars", "initiativeFormula", "1d10");
          break;
        default:
          game.settings.set("ars", "initiativeFormula", "1d6");
          break;
      }

    }
  });

  //const initiativeUseSpeed = game.settings.get("ars", "initiativeUseSpeed");
  game.settings.register("ars", "initiativeUseSpeed", {
    name: "SETTINGS.initiativeUseSpeed",
    hint: "SETTINGS.initiativeUseSpeedTT",
    scope: "world",
    config: false,
    default: false,
    restricted: true,
    type: Boolean,
    onChange: initiativeUseSpeed => CONFIG.ARS.settings.initiativeUseSpeed = initiativeUseSpeed
  });

  //const initiativeFormula = game.settings.get("ars", "initiativeFormula");
  game.settings.register("ars", "initiativeFormula", {
    name: "SETTINGS.initiativeFormula",
    hint: "SETTINGS.initiativeFormulaTT",
    scope: "world",
    config: false,
    default: "1d6",
    restricted: true,
    type: String,
    onChange: initiativeFormula => CONFIG.Combat.initiative.formula = initiativeFormula
  });

  //const ascendingInitiative = game.settings.get("ars", "InitiativeAscending");
  game.settings.register("ars", "InitiativeAscending", {
    name: "SETTINGS.InitiativeAscending",
    hint: "SETTINGS.InitiativeAscendingTT",
    scope: "world",
    config: false,
    default: true,
    restricted: true,
    type: Boolean,
  });


  //const initSideVSide = game.settings.get("ars", "initSideVSide");
  game.settings.register("ars", "initSideVSide", {
    name: "SETTINGS.initSideVSide",
    hint: "SETTINGS.initSideVSideTT",
    scope: "world",
    config: false,
    default: false,
    restricted: true,
    type: Boolean,
  });


  //const useArmorDamage = game.settings.get("ars", "useArmorDamage");
  game.settings.register("ars", "useArmorDamage", {
    name: "SETTINGS.useArmorDamage",
    hint: "SETTINGS.useArmorDamageTT",
    scope: "world",
    config: false,
    default: false,
    restricted: true,
    type: Boolean,
    onChange: useArmorDamage => CONFIG.ARS.settings.useArmorDamage = useArmorDamage
  });

  //const useAutoHitFailDice = game.settings.get("ars", "useAutoHitFailDice");
  game.settings.register("ars", "useAutoHitFailDice", {
    name: "SETTINGS.useAutoHitFailDice",
    hint: "SETTINGS.useAutoHitFailDiceTT",
    scope: "world",
    config: false,
    default: true,
    restricted: true,
    type: Boolean,
    onChange: useAutoHitFailDice => CONFIG.ARS.settings.autohitfail = useAutoHitFailDice
  });


  //const autoDamage = game.settings.get("ars", "autoDamage");
  game.settings.register("ars", "autoDamage", {
    name: "SETTINGS.autoDamage",
    hint: "SETTINGS.autoDamageTT",
    scope: "world",
    config: false,
    default: false,
    restricted: true,
    type: Boolean,
  });

  //const autoCheck = game.settings.get("ars", "autoCheck");
  game.settings.register("ars", "autoCheck", {
    name: "SETTINGS.autoCheck",
    hint: "SETTINGS.autoCheckTT",
    scope: "world",
    config: false,
    default: false,
    restricted: true,
    type: Boolean,
  });

  //const weaponVarmor = game.settings.get("ars", "weaponVarmor");
  game.settings.register("ars", "weaponVarmor", {
    name: "SETTINGS.weaponVarmor",
    hint: "SETTINGS.weaponVarmorTT",
    scope: "world",
    config: false,
    default: true,
    restricted: true,
    type: Boolean,
  });


  //const rollInitEachRound = game.settings.get("ars", "rollInitEachRound");
  game.settings.register("ars", "rollInitEachRound", {
    name: "SETTINGS.rollInitEachRound",
    hint: "SETTINGS.rollInitEachRoundTT",
    scope: "world",
    config: false,
    default: true,
    restricted: true,
    type: Boolean,
  });


  //const automateLighting = game.settings.get("ars", "automateLighting");
  game.settings.register("ars", "automateLighting", {
    name: "SETTINGS.automateLighting",
    hint: "SETTINGS.automateLightingTT",
    scope: "world",
    config: true,
    default: true,
    restricted: true,
    type: Boolean,
    onChange: automateLighting => {
      CONFIG.ARS.settings.automateLighting = automateLighting
    }
  });

  //const automateVision = game.settings.get("ars", "automateVision");
  game.settings.register("ars", "automateVision", {
    name: "SETTINGS.automateVision",
    hint: "SETTINGS.automateVisionTT",
    scope: "world",
    config: true,
    default: true,
    restricted: true,
    type: Boolean,
    onChange: automateVision => {
      CONFIG.ARS.settings.automateVision = automateVision
    }
  });


  //const consumeFoodWater = game.settings.get("ars", "consumeFoodWater");
  game.settings.register("ars", "consumeFoodWater", {
    name: "SETTINGS.consumeFoodWater",
    hint: "SETTINGS.consumeFoodWaterTT",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: consumeFoodWater => CONFIG.ARS.settings.consumeFoodWater = consumeFoodWater
  });


  //const automateEncumbrance = game.settings.get("ars", "automateEncumbrance");
  game.settings.register("ars", "automateEncumbrance", {
    name: "SETTINGS.automateEncumbrance",
    hint: "SETTINGS.automateEncumbranceTT",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: automateEncumbrance => {
      if (game.user.isGM) {
        // trigger encumbrance check or remove all
        // encumbrance statuses
        const disable = !automateEncumbrance;
        CONFIG.ARS.settings.automateEncumbrance = automateEncumbrance
        canvas.tokens.placeables
          .filter(token => token?.document?.actor?.type === 'character')
          .forEach(token => token.document.updateEncumbranceStatus(disable))
      }
    }
  });


  //const initRoundSound = game.settings.get("ars", "initRoundSound");
  game.settings.register("ars", "initRoundSound", {
    name: "SETTINGS.initRoundSound",
    hint: "SETTINGS.initRoundSoundTT",
    scope: "world",
    config: false,
    default: ARS.sounds.initiative.start,
    type: String,
  });
  //const playRoundSound = game.settings.get("ars", "playRoundSound");
  game.settings.register("ars", "playRoundSound", {
    name: "SETTINGS.initRoundSound",
    hint: "SETTINGS.initRoundSoundTT",
    scope: "client",
    config: false,
    default: true,
    type: Boolean,
  });


  //const initTurnSound = game.settings.get("ars", "initTurnSound");
  game.settings.register("ars", "initTurnSound", {
    name: "SETTINGS.initTurnSound",
    hint: "SETTINGS.initTurnSoundTT",
    scope: "world",
    config: false,
    default: ARS.sounds.initiative.turn,
    type: String,
  });
  //const playTurnSound = game.settings.get("ars", "playTurnSound");
  game.settings.register("ars", "playTurnSound", {
    name: "SETTINGS.initTurnSound",
    hint: "SETTINGS.initTurnSoundTT",
    scope: "client",
    config: false,
    default: true,
    type: Boolean,
  });


  //const initVolumeSound = game.settings.get("ars", "initVolumeSound");
  game.settings.register("ars", "initVolumeSound", {
    name: "SETTINGS.initVolumeSound",
    hint: "SETTINGS.initVolumeSoundTT",
    scope: "client",
    config: false,
    range: {
      min: 0,
      max: 1,
      step: 0.1,
    },
    default: 0.5,
    type: Number,
  });


  //const audioPlayTriggers = game.settings.get("ars", "audioPlayTriggers");
  game.settings.register("ars", "audioPlayTriggers", {
    name: "SETTINGS.audioPlayTriggers",
    hint: "SETTINGS.audioPlayTriggersTT",
    scope: "client",
    config: false,
    default: true,
    type: Boolean,
  });

  //const audioTriggersVolume = game.settings.get("ars", "audioTriggersVolume");
  game.settings.register("ars", "audioTriggersVolume", {
    name: "SETTINGS.audioTriggersVolume",
    hint: "SETTINGS.audioTriggersVolumeTT",
    scope: "client",
    config: false,
    range: {
      min: 0,
      max: 1,
      step: 0.1,
    },
    default: 0.5,
    type: Number,
  });

  //const audioTriggerCheckSuccess = game.settings.get("ars", "audioTriggerCheckSuccess");
  game.settings.register("ars", "audioTriggerCheckSuccess", {
    name: "SETTINGS.audioTriggerCheckSuccess",
    hint: "SETTINGS.audioTriggerCheckSuccessTT",
    scope: "client",
    config: false,
    default: ARS.sounds.save.success,
    onChange: audioTriggerCheckSuccess => {
      CONFIG.ARS.sounds.save.success = audioTriggerCheckSuccess
    },
    type: String,
  });
  //const audioTriggerCheckFail = game.settings.get("ars", "audioTriggerCheckFail");
  game.settings.register("ars", "audioTriggerCheckFail", {
    name: "SETTINGS.audioTriggerCheckFail",
    hint: "SETTINGS.audioTriggerCheckFailTT",
    scope: "client",
    config: false,
    default: ARS.sounds.save.failure,
    onChange: audioTriggerCheckFail => {
      CONFIG.ARS.sounds.save.failure = audioTriggerCheckFail
    },
    type: String,
  });
  //const audioTriggerMeleeHit = game.settings.get("ars", "audioTriggerMeleeHit");
  game.settings.register("ars", "audioTriggerMeleeHit", {
    name: "SETTINGS.audioTriggerMeleeHit",
    hint: "SETTINGS.audioTriggerMeleeHitTT",
    scope: "client",
    config: false,
    default: ARS.sounds.combat['melee-hit'],
    onChange: audioTriggerMeleeHit => {
      CONFIG.ARS.sounds.combat['melee-hit'] = audioTriggerMeleeHit
    },
    type: String,
  });
  //const audioTriggerMeleeMiss = game.settings.get("ars", "audioTriggerMeleeMiss");
  game.settings.register("ars", "audioTriggerMeleeMiss", {
    name: "SETTINGS.audioTriggerMeleeMiss",
    hint: "SETTINGS.audioTriggerMeleeMissTT",
    scope: "client",
    config: false,
    default: ARS.sounds.combat['melee-miss'],
    onChange: audioTriggerMeleeMiss => {
      CONFIG.ARS.sounds.combat['melee-miss'] = audioTriggerMeleeMiss
    },
    type: String,
  });
  //const audioTriggerMeleeCrit = game.settings.get("ars", "audioTriggerMeleeCrit");
  game.settings.register("ars", "audioTriggerMeleeCrit", {
    name: "SETTINGS.audioTriggerMeleeCrit",
    hint: "SETTINGS.audioTriggerMeleeCritTT",
    scope: "client",
    config: false,
    default: ARS.sounds.combat['melee-hit-crit'],
    onChange: audioTriggerMeleeCrit => {
      CONFIG.ARS.sounds.combat['melee-hit-crit'] = audioTriggerMeleeCrit
    },
    type: String,
  });
  //const audioTriggerRangeHit = game.settings.get("ars", "audioTriggerRangeHit");
  game.settings.register("ars", "audioTriggerRangeHit", {
    name: "SETTINGS.audioTriggerRangeHit",
    hint: "SETTINGS.audioTriggerRangeHitTT",
    scope: "client",
    config: false,
    default: ARS.sounds.combat['missile-hit'],
    onChange: audioTriggerRangeHit => {
      CONFIG.ARS.sounds.combat['missile-hit'] = audioTriggerRangeHit
    },
    type: String,
  });
  //const audioTriggerRangeMiss = game.settings.get("ars", "audioTriggerRangeMiss");
  game.settings.register("ars", "audioTriggerRangeMiss", {
    name: "SETTINGS.audioTriggerRangeMiss",
    hint: "SETTINGS.audioTriggerRangeMissTT",
    scope: "client",
    config: false,
    default: ARS.sounds.combat['missile-miss'],
    onChange: audioTriggerRangeMiss => {
      CONFIG.ARS.sounds.combat['missile-miss'] = audioTriggerRangeMiss
    },
    type: String,
  });
  //const audioTriggerRangeCrit = game.settings.get("ars", "audioTriggerRangeCrit");
  game.settings.register("ars", "audioTriggerRangeCrit", {
    name: "SETTINGS.audioTriggerRangeCrit",
    hint: "SETTINGS.audioTriggerRangeCritTT",
    scope: "client",
    config: false,
    default: ARS.sounds.combat['missile-hit-crit'],
    onChange: audioTriggerRangeCrit => {
      CONFIG.ARS.sounds.combat['missile-hit-crit'] = audioTriggerRangeCrit
    },
    type: String,
  });
  //const audioTriggerCast = game.settings.get("ars", "audioTriggerCast");
  game.settings.register("ars", "audioTriggerCast", {
    name: "SETTINGS.audioTriggerCast",
    hint: "SETTINGS.audioTriggerCastTT",
    scope: "client",
    config: false,
    default: ARS.sounds.combat['cast-spell'],
    onChange: audioTriggerCast => {
      CONFIG.ARS.sounds.combat['cast-spell'] = audioTriggerCast
    },
    type: String,
  });
  //const audioTriggerDeath = game.settings.get("ars", "audioTriggerDeath");
  game.settings.register("ars", "audioTriggerDeath", {
    name: "SETTINGS.audioTriggerDeath",
    hint: "SETTINGS.audioTriggerDeathTT",
    scope: "client",
    config: false,
    default: ARS.sounds.combat.death,
    onChange: audioTriggerDeath => {
      CONFIG.ARS.sounds.combat.death = audioTriggerDeath
    },
    type: String,
  });

  //const ctShowOnlyVisible = game.settings.get("ars", "ctShowOnlyVisible");
  game.settings.register("ars", "ctShowOnlyVisible", {
    name: "SETTINGS.ctShowOnlyVisible",
    hint: "SETTINGS.ctShowOnlyVisibleTT",
    scope: "world",
    config: false,
    default: true,
    type: Boolean,
    onChange: ctShowOnlyVisible => {
      CONFIG.ARS.settings.ctShowOnlyVisible = ctShowOnlyVisible
      ui.combat.render();
    }
  });

  //const combatAutomateRangeMods = game.settings.get("ars", "combatAutomateRangeMods");
  game.settings.register("ars", "combatAutomateRangeMods", {
    name: "SETTINGS.combatAutomateRangeMods",
    hint: "SETTINGS.combatAutomateRangeModsTT",
    scope: "world",
    config: false,
    default: true,
    type: Boolean,
  });

  //const floatingHudStaticPosition = game.settings.get("ars", "floatingHudStaticPosition");
  game.settings.register("ars", "floatingHudStaticPosition", {
    name: "SETTINGS.floatingHudStaticPosition",
    hint: "SETTINGS.floatingHudStaticPositionTT",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });

  //const encumbranceIncludeCoin = game.settings.get("ars", "encumbranceIncludeCoin");
  game.settings.register("ars", "encumbranceIncludeCoin", {
    name: "SETTINGS.encumbranceIncludeCoin",
    hint: "SETTINGS.encumbranceIncludeCoinTT",
    scope: "world",
    config: true,
    default: true,
    restricted: true,
    type: Boolean,
    onChange: encumbranceIncludeCoin => {
      CONFIG.ARS.settings.encumbranceIncludeCoin = encumbranceIncludeCoin
    }
  });


  //const identificationActor = game.settings.get("ars", "identificationActor");
  game.settings.register("ars", "identificationActor", {
    name: "SETTINGS.identificationActor",
    hint: "SETTINGS.identificationActorTT",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: identificationActor => {
      CONFIG.ARS.settings.identificationActor = identificationActor
    }
  });

  //const identificationItem = game.settings.get("ars", "identificationItem");
  game.settings.register("ars", "identificationItem", {
    name: "SETTINGS.identificationItem",
    hint: "SETTINGS.identificationItemTT",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: identificationItem => {
      CONFIG.ARS.settings.identificationItem = identificationItem
    }
  });

  //const panOnInitiative = game.settings.get("ars", "panOnInitiative");
  game.settings.register("ars", "panOnInitiative", {
    name: "SETTINGS.panOnInitiative",
    hint: "SETTINGS.panOnInitiativeTT",
    scope: "client",
    config: true,
    default: true,
    restricted: true,
    type: Boolean,
  });


  //const npcNumberedNames = game.settings.get("ars", "npcNumberedNames");
  game.settings.register("ars", "npcNumberedNames", {
    name: "SETTINGS.nPCNumberedName",
    hint: "SETTINGS.nPCNumberedNameTT",
    scope: "world",
    config: true,
    default: true,
    restricted: true,
    type: Boolean,
  });

  //const npcLootable = game.settings.get("ars", "npcLootable");
  game.settings.register("ars", "npcLootable", {
    name: "SETTINGS.npcLootable",
    hint: "SETTINGS.npcLootableTT",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: npcLootable => CONFIG.ARS.settings.npcLootable = npcLootable
  });

  //const itemBrowserMargin = game.settings.get("ars", "itemBrowserMargin");
  game.settings.register("ars", "itemBrowserMargin", {
    name: "SETTINGS.itemBrowserMargin",
    hint: "SETTINGS.itemBrowserMarginTT",
    scope: "world",
    config: true,
    restricted: true,
    range: {
      min: -100,
      max: 100,
      step: 1,
    },
    default: 0,
    type: Number,
    onChange: itemBrowserMargin => {
      if (game.ars.ui?.itembrowser && game.ars.ui.itembrowser.rendered)
        game.ars.ui.itembrowser.render(true);
    }
  });


  //const debugMode = game.settings.get("ars", "debugMode");
  game.settings.register("ars", "debugMode", {
    name: "SETTINGS.debugMode",
    hint: "SETTINGS.debugModeTT",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: debugMode => {
      CONFIG.debug.hooks = debugMode;
      CONFIG.ARS.settings.debugMode = debugMode;
    }
  });




}