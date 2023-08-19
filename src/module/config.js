import * as utilitiesManager from "./utilities.js";

export const ARS = {};

ARS.settings = {};

// ARS.icons.general = {
//     combat = {
//         "cast": "systems/ars/icons/general/RangedColor.png",
//         "damage": "systems/ars/icons/general/DamageColor.png",
//         "heal": "systems/ars/icons/general/HealColor.png",
//         "effect": "systems/ars/icons/general/EffectColor.png",
//         "castmelee": "systems/ars/icons/general/MeleeColor.png",
//         "castrange": "systems/ars/icons/general/RangedColor.png",
//         "range": "systems/ars/icons/general/RangedColor.png",
//         "melee": "systems/ars/icons/general/MeleeColor.png",
//         "thrown": "systems/ars/icons/general/RangedColor.png",
//     },
// }

ARS.icons = {
    "general": {
        "actors": {
            "lootable": "icons/containers/chest/chest-reinforced-steel-brown.webp"
        },
        "combat": {
            "cast": "icons/weapons/staves/staff-ornate-red.webp",
            "castmelee": "icons/weapons/swords/sword-winged-pink.webp",
            "castranged": "icons/weapons/wands/wand-gem-purple.webp",
            "damage": "icons/skills/wounds/blood-drip-droplet-red.webp",
            "effect": "icons/magic/time/hourglass-yellow-green.webp",
            "effects": {
                "defeated": "systems/ars/icons/general/rip.png"
            },
            "heal": "icons/magic/holy/prayer-hands-glowing-yellow-white.webp",
            "melee": "icons/weapons/swords/swords-cutlasses-white.webp",
            "ranged": "icons/skills/ranged/target-bullseye-arrow-glowing.webp",
            "save": "icons/magic/defensive/illusion-evasion-echo-purple.webp",
            "thrown": "icons/weapons/thrown/bomb-fuse-red-black.webp"
        },
        "currency": {
            "cp": "icons/commodities/currency/coin-engraved-waves-copper.webp",
            "ep": "icons/commodities/currency/coin-engraved-oval-steel.webp",
            "gp": "icons/commodities/currency/coin-plain-portal-gold.webp",
            "pp": "icons/commodities/currency/coin-inset-lightning-silver.webp",
            "sp": "icons/commodities/currency/coin-embossed-unicorn-silver.webp"
        },
        "items": {
            "ability": "icons/skills/social/wave-halt-stop.webp",
            "armor": "icons/equipment/chest/breastplate-banded-steel.webp",
            "background": "icons/environment/settlement/house-farmland-small.webp",
            "bundle": "icons/containers/chest/chest-worn-oak-tan.webp",
            "class": "icons/skills/trades/academics-merchant-scribe.webp",
            "container": "icons/containers/bags/case-simple-brown.webp",
            "encounter": "icons/creatures/eyes/lizard-single-slit-green.webp",
            "item": "icons/commodities/leather/leather-bolt-brown.webp",
            "potion": "icons/consumables/potions/bottle-round-corked-pink.webp",
            "proficiency": "icons/weapons/swords/sword-guard-bronze.webp",
            "race": "icons/environment/people/group.webp",
            "skill": "icons/tools/hand/hammer-and-nail.webp",
            "spell": "icons/sundries/scrolls/scroll-bound-sealed-red.webp",
            "weapon": "icons/weapons/hammers/hammer-war-rounding.webp"
        },
        "move": "systems/ars/icons/general/leather-boot.webp"
    }
}

ARS.markupPhrases = [
    // "acid",
    "at will",
    "at-will",
    "damage dice",
    "drain energy",
    "drains energy",
    "can employ",
    // "fire",
    "half damage",
    "harmed by magical",
    "immune",
    "immunity",
    "innate",
    "not affect",
    "not effect",
    "only be hit by",
    "only hit by",
    "of damage",
    "paralyze",
    "per day",
    "perform the following",
    "poison",
    "points of",
    "regenerate",
    "resistant",
    "resistance to",
    "save vs",
    "save vrs",
    "save versus",
    "saving throw",
    "savingthrow",
    "spell-like",
    "stun",
    "surprise",
    "vision",
    "vulnerable",
    "weapons of less than",
    "\\d+ attack",
    "\\d+ on attack",
    "attack \\d+",
    "\\d+ damage",
    "damage \\d+",
];

ARS.sounds = {
    combat: {
        'death': 'systems/ars/sounds/combat/death-wilhelm.wav',
        'melee-hit': 'systems/ars/sounds/combat/sword-hit.wav',
        'melee-hit-crit': 'systems/ars/sounds/combat/sword-hit-crit.wav',
        'melee-miss': 'systems/ars/sounds/combat/sword-miss.mp3',
        'missile-hit': 'systems/ars/sounds/combat/arrow-hit.wav',
        'missile-hit-crit': 'systems/ars/sounds/combat/sword-hit-crit.wav',
        'missile-miss': 'systems/ars/sounds/combat/arrow-miss.WAV',
        'cast-spell': 'systems/ars/sounds/magic/magic-shot.mp3'
    },
    initiative: {
        'start': 'systems/ars/sounds/init/alert1.wav',
        'turn': 'systems/ars/sounds/init/alert2.wav'
    },
    save: {
        'failure': 'systems/ars/sounds/checks/failure_slide.mp3',
        'success': 'systems/ars/sounds/checks/success-fanfare-trumpets.mp3'
    }
};

ARS.chargedActions = [
    'cast',
    'castmelee',
    'castranged',
    'ranged',
    'melee',
    'thrown'
]
ARS.ammoAttacks = [
    'ranged',
    'thrown'
]


ARS.weaponAttackTypes = [
    "melee",
    "ranged",
    "thrown",
]

ARS.itemProtectionTypes = [
    'armor',
    'shield',
    'ring',
    'cloak',
    'warding',
    'other'
]

ARS.itemGearTypes = [
    "item",
    "container",
]

ARS.notLargeCreature = [
    'tiny',
    'small',
    'medium'
];

ARS.inventoryTypes = [
    "item",
    "armor",
    "potion",
    "spell",
    "weapon",
    // "container",
];

ARS.tradeableInventoryTypes = [
    "item",
    "armor",
    "potion",
    "spell",
    "weapon",
    "container",
];
ARS.lootableItemTypes = [
    "spell",
    "item",
    // "container",
]
ARS.academicTypes = [
    "proficiency",
    "ability",
    // "skill",
]
ARS.detailsItemTypes = [
    "race",
    "background",
]
ARS.nonInventoryTypes = [
    "class",
    "race",
    "background",
    "proficiency",
    "ability",
    "skill",
]

ARS.classSubItemTypes = [
    'ability',
    'skill',
    'proficiency'
]

// These items do not get their subItems copied and are applied
// via the reconfigureAcademics code because they can be based on level
ARS.levelBasedSubitemTypes = [
    'class',
    'race',
]

ARS.skillGroupNames = [
    "warrior",
    "priest",
    "rogue",
    "mage",
    "other",
    "none"
]

// ARS.attackLocations = [
//     "normal",
//     "rear",
//     "shieldless"
// ]
ARS.attackLocations = {
    "normal": "ARS.defensestyle.normal",
    "rear": "ARS.defensestyle.rear",
    "shieldless": "ARS.defensestyle.shieldless"
};

ARS.auraPermissisions = {
    "all": "ARS.aura.permissions.all",
    "limited": "ARS.aura.permissions.limited",
    "observer": "ARS.aura.permissions.observer",
    "owner": "ARS.aura.permissions.owner",
    "gm": "ARS.aura.permissions.gm"
};


ARS.damageStyles = {
    "normal": "ARS.damageAdjustments.normal",
    "half": "ARS.damageAdjustments.half",
    "max": "ARS.damageAdjustments.max",
    "x2": "ARS.damageAdjustments.x2",
    "x3": "ARS.damageAdjustments.x3",
    "x4": "ARS.damageAdjustments.x4",
    "x5": "ARS.damageAdjustments.x5",
    "x6": "ARS.damageAdjustments.x6",
    "double": "ARS.damageAdjustments.double",
};

ARS.inventoryTypeMaps = {
    "ability": "abilityList",
    "armor": "armors",
    "background": "backgrounds",
    "class": "classes",
    "container": "containers",
    // "item": "gear",
    "item": "inventory",
    "potion": "potions",
    "proficiency": "proficiencies",
    "race": "races",
    "skill": "skills",
    "spell": "spells",
    "weapon": "weapons"
};

ARS.abilities = {
    "str": "ARS.abilityTypes.str",
    "dex": "ARS.abilityTypes.dex",
    "con": "ARS.abilityTypes.con",
    "int": "ARS.abilityTypes.int",
    "wis": "ARS.abilityTypes.wis",
    "cha": "ARS.abilityTypes.cha"
};
ARS.abilityTypes = {
    "none": "ARS.abilityTypes.none",
    "str": "ARS.abilityTypes.str",
    "dex": "ARS.abilityTypes.dex",
    "con": "ARS.abilityTypes.con",
    "int": "ARS.abilityTypes.int",
    "wis": "ARS.abilityTypes.wis",
    "cha": "ARS.abilityTypes.cha",
};

ARS.abilitiesShort = {
    "str": "ARS.abilityTypes.strabbr",
    "dex": "ARS.abilityTypes.dexabbr",
    "con": "ARS.abilityTypes.conabbr",
    "int": "ARS.abilityTypes.intabbr",
    "wis": "ARS.abilityTypes.wisabbr",
    "cha": "ARS.abilityTypes.chaabbr"
};
ARS.armorTypes = {
    "armor": "ARS.armorTypes.armor",
    "shield": "ARS.armorTypes.shield",
    "warding": "ARS.armorTypes.warding",
    "ring": "ARS.armorTypes.ring",
    "cloak": "ARS.armorTypes.cloak",
    "other": "ARS.armorTypes.other"
};
ARS.armorBulk = {
    "none": "ARS.armorBulk.none",
    "fairly": "ARS.armorBulk.fairly",
    "bulky": "ARS.armorBulk.bulky",
    "heavy": "ARS.armorBulk.heavy",
};
ARS.saves = {
    "paralyzation": "ARS.saveTypes.paralyzation",
    "poison": "ARS.saveTypes.poison",
    "death": "ARS.saveTypes.death",
    "rod": "ARS.saveTypes.rod",
    "staff": "ARS.saveTypes.staff",
    "wand": "ARS.saveTypes.wand",
    "petrification": "ARS.saveTypes.petrification",
    "polymorph": "ARS.saveTypes.polymorph",
    "breath": "ARS.saveTypes.breath",
    "spell": "ARS.saveTypes.spell"
};

ARS.targeting = {
    "target": "ARS.targeting.target",
    "self": "ARS.targeting.self"
};
ARS.successAction = {
    "none": "ARS.successAction.none",
    "halve": "ARS.successAction.halve",
    "remove": "ARS.successAction.remove"
};
ARS.targetShapeSelection = {
    "all": "ARS.targetShapeSelection.all",
    "none": "ARS.targetShapeSelection.none", // Added to support spells such as "wall of force"
    "self": "ARS.targetShapeSelection.self",
    "hostile": "ARS.targetShapeSelection.hostile",
    "friendly": "ARS.targetShapeSelection.friendly"
};
ARS.targetShape = {
    "none": "ARS.targetShape.none", // added for later support of "Number of Targets"    
    "cone": "ARS.targetShape.cone",
    "circle": "ARS.targetShape.circle",
    "ray": "ARS.targetShape.ray",
    "ray2": "ARS.targetShape.ray2",
    "rectangle": "ARS.targetShape.rectangle"
};

ARS.targetShapeConeType = {
    "angle": "ARS.targetShapeConeType.angle",
    "ratio": "ARS.targetShapeConeType.ratio"
};
ARS.resources = {
    "none": "ARS.resources.none",
    "charged": "ARS.resources.charged",
    "item": "ARS.resources.item",
    "powered": "ARS.resources.powered"
};
ARS.consumed = {
    "item": "ARS.consumed.item",
    "charged": "ARS.consumed.charged"
};
ARS.reusetime = {
    "none": "ARS.reusetime.none",
    "daily": "ARS.reusetime.daily",
    "weekly": "ARS.reusetime.weekly",
    "monthly": "ARS.reusetime.monthly",
};
ARS.saveTypes = {
    "paralyzation": "ARS.saveTypes.paralyzation",
    "poison": "ARS.saveTypes.poison",
    "death": "ARS.saveTypes.death",
    "rod": "ARS.saveTypes.rod",
    "staff": "ARS.saveTypes.staff",
    "wand": "ARS.saveTypes.wand",
    "petrification": "ARS.saveTypes.petrification",
    "polymorph": "ARS.saveTypes.polymorph",
    "spell": "ARS.saveTypes.spell",
    "breath": "ARS.saveTypes.breath",
    "none": "ARS.actions.abilityTypes.none",
};
ARS.currency = {
    "pp": "ARS.currency.pp",
    "ep": "ARS.currency.ep",
    "gp": "ARS.currency.gp",
    "sp": "ARS.currency.sp",
    "cp": "ARS.currency.cp"
};
ARS.currencyAbbrv = {
    "pp": "ARS.currency.abbr.pp",
    "ep": "ARS.currency.abbr.ep",
    "gp": "ARS.currency.abbr.gp",
    "sp": "ARS.currency.abbr.sp",
    "cp": "ARS.currency.abbr.cp"
};
ARS.ArmorClass = "ARS.ArmorClass";
ARS.ArmorClassShort = "ARS.ArmorClassShort";
ARS.HitPoints = "ARS.HitPoints";
ARS.BaseHitPoints = "ARS.BaseHitPoints";
ARS.hpbase = "ARS.hpbase";
ARS.HitPointsShort = "ARS.HitPointsShort";

ARS.spellTypes = {
    "arcane": "ARS.spellTypes.arcane",
    "divine": "ARS.spellTypes.divine"
}

ARS.weaponTypes = {
    "melee": "ARS.weaponTypes.melee",
    "ranged": "ARS.weaponTypes.ranged",
    "thrown": "ARS.weaponTypes.thrown"
};
ARS.weaponDamageTypes = {
    "slashing": "ARS.damageTypes.slashing",
    "piercing": "ARS.damageTypes.piercing",
    "bludgeoning": "ARS.damageTypes.bludgeoning",
    "acid": "ARS.damageTypes.acid",
    "cold": "ARS.damageTypes.cold",
    "fire": "ARS.damageTypes.fire",
    "force": "ARS.damageTypes.force",
    "gas": "ARS.damageTypes.gas",
    "lightning": "ARS.damageTypes.lightning",
    "necrotic": "ARS.damageTypes.necrotic",
    "poison": "ARS.damageTypes.poison",
    "radiant": "ARS.damageTypes.radiant",
    "none": "ARS.damageTypes.none"
};

ARS.dmgTypeIcons = {
    "fire": "icons/svg/fire.svg",
    "lightning": "/icons/svg/lightning.svg"
}

ARS.resistTypes = {
    "resist": "ARS.resistTypes.resist",
    "immune": "ARS.resistTypes.immune",
    "vulnerable": "ARS.resistTypes.vulnerable",
    "magicpotency": "ARS.resistTypes.magicpotency",
    "perdice": "ARS.resistTypes.perdice"
};

ARS.metalprotections = {
    "halve": "ARS.metalprotections.halve",
    "full": "ARS.metalprotections.full",
};

ARS.alignmentTypes = {
    "n": "ARS.alignmentTypes.n",
    "ng": "ARS.alignmentTypes.ng",
    "ne": "ARS.alignmentTypes.ne",
    "cn": "ARS.alignmentTypes.cn",
    "cg": "ARS.alignmentTypes.cg",
    "ce": "ARS.alignmentTypes.ce",
    "ln": "ARS.alignmentTypes.ln",
    "lg": "ARS.alignmentTypes.lg",
    "le": "ARS.alignmentTypes.le"
};

ARS.alignmentLongNameMap = {
    "n": "neutral",
    "ng": "neutralgood",
    "ne": "neutralevil",
    "cn": "chaoticevil",
    "cg": "chaoticgood",
    "ce": "chaotieneutral",
    "ln": "lawfulneutral",
    "lg": "lawfulgood",
    "le": "lawfulevil"
};

ARS.sizeTypes = {
    "tiny": "ARS.sizeTypes.tiny",
    "small": "ARS.sizeTypes.small",
    "medium": "ARS.sizeTypes.medium",
    "large": "ARS.sizeTypes.large",
    "huge": "ARS.sizeTypes.huge",
    "gargantuan": "ARS.sizeTypes.gargantuan",
};
ARS.skillTypes = {
    "ascending": "ARS.skillTypes.ascending",
    "decending": "ARS.skillTypes.decending",
};

ARS.actions = {};
ARS.actions.abilityTypes = {
    "str": "ARS.actions.abilityTypes.str",
    "dex": "ARS.actions.abilityTypes.dex",
    "none": "ARS.actions.abilityTypes.none"
};
ARS.actions.types = {
    "cast": "ARS.actions.type.cast",
    "castshape": "ARS.actions.type.castshape",
    "damage": "ARS.actions.type.damage",
    "heal": "ARS.actions.type.heal",
    "effect": "ARS.actions.type.effect",
    "use": "ARS.actions.type.use",
    // "castmelee": "ARS.actions.type.castmelee",
    // "castranged": "ARS.actions.type.castranged",
    "melee": "ARS.actions.type.melee",
    "thrown": "ARS.actions.type.thrown",
    "ranged": "ARS.actions.type.ranged",
};
ARS.actions.durationTypes = {
    "round": "ARS.actions.duration.type.round",
    "turn": "ARS.actions.duration.type.turn",
    "hour": "ARS.actions.duration.type.hour",
    "day": "ARS.actions.duration.type.day"
};
ARS.actions.effect_modes = {
    0: "ARS.actions.effect_modes.custom",
    1: "ARS.actions.effect_modes.multiply",
    2: "ARS.actions.effect_modes.add",
    3: "ARS.actions.effect_modes.downgrade",
    4: "ARS.actions.effect_modes.upgrade",
    5: "ARS.actions.effect_modes.override",
};

ARS.locationStates = {
    "carried": "ARS.locationStates.carried",
    "nocarried": "ARS.locationStates.nocarried",
    "equipped": "ARS.locationStates.equipped"
};
ARS.locationStates.images = {
    "carried": "icons/svg/chest.svg",
    "nocarried": "icons/svg/cancel.svg",
    "equipped": "icons/svg/combat.svg"
};

ARS.locationStates.fasicons = {
    "carried": "box",
    "nocarried": "exclamation-circle",
    "equipped": "tshirt"
};

/**
 * 
 * Drop down list of effect keys, sample values and mode included.
 * 
 * actionOnly is for status, it requires flags to make Foundry work. Can't be applied as effect manually.
 * 
 * MODES
 * {
    "CUSTOM": 0,
    "MULTIPLY": 1,
    "ADD": 2,
    "DOWNGRADE": 3,
    "UPGRADE": 4,
    "OVERRIDE": 5
 * }
 */
ARS.selectEffectKeys = [
    { name: "system.abilities.cha.value", mode: 2, value: "1" },
    { name: "system.abilities.con.value", mode: 2, value: "1" },
    { name: "system.abilities.dex.value", mode: 2, value: "1" },
    { name: "system.abilities.int.value", mode: 2, value: "1" },
    { name: "system.abilities.str.value", mode: 2, value: "1" },
    { name: "system.abilities.wis.value", mode: 2, value: "1" },

    { name: "system.abilities.cha.percent", mode: 2, value: "10" },
    { name: "system.abilities.con.percent", mode: 2, value: "10" },
    { name: "system.abilities.dex.percent", mode: 2, value: "10" },
    { name: "system.abilities.int.percent", mode: 2, value: "10" },
    { name: "system.abilities.str.percent", mode: 2, value: "10" },
    { name: "system.abilities.wis.percent", mode: 2, value: "10" },

    { name: "special.absorb", mode: 0, value: '{"amount":10, "damageType":"fire"}' },
    { name: "special.aura", mode: 0, value: '{"distance": 10, "color": "red", "faction": "friendly", "permission": "gm", "opacity": "0.50", "shape": "round"}' },
    { name: "special.light", mode: 0, value: '{"color":"#FFFFFF", "dim": 10, "bright": 5, "angle": 360, "animation": "torch", "alpha": 0.25, "luminosity": 0.1}' },
    { name: "special.mirrorimage", mode: 0, value: 5 },
    { name: "special.ongoing", mode: 0, value: '{"type":"heal", "rate":"1", "cycle": "round", "dmgType": "", "formula": "1d4"}' },
    // { name: "special.status", actionOnly: true, mode: 0, value: 'blind' },
    { name: "special.status", mode: 0, value: 'blind' },
    { name: "special.stoneskin", mode: 0, value: 5 },
    { name: "special.vision", mode: 0, value: '{"range": 10, "angle": 360, "mode": "basic"}' },


    { name: "system.attributes.hp.base", mode: 2, value: "5" },
    { name: "system.attributes.movement.value", mode: 2, value: "6" },

    { name: "system.mods.ac.base", mode: 3, value: "8" },
    { name: "system.mods.ac.value", mode: 2, value: "1" },
    { name: "system.mods.ac.front.base", mode: 3, value: "1" },
    { name: "system.mods.ac.front.value", mode: 2, value: "1" },
    { name: "system.mods.ac.rear.base", mode: 3, value: "8" },
    { name: "system.mods.ac.rear.value", mode: 2, value: "1" },

    { name: "system.mods.ac.ranged.base", mode: 3, value: "8" },
    { name: "system.mods.ac.ranged.value", mode: 2, value: "1" },
    { name: "system.mods.ac.ranged.front.base", mode: 3, value: "8" },
    { name: "system.mods.ac.ranged.front.value", mode: 2, value: "1" },
    { name: "system.mods.ac.ranged.rear.base", mode: 2, value: "1" },
    { name: "system.mods.ac.ranged.rear.value", mode: 2, value: "1" },

    { name: "system.mods.attack.value", mode: 2, value: "1" },
    { name: "system.mods.attack.melee", mode: 2, value: "1" },
    { name: "system.mods.attack.ranged", mode: 2, value: "1" },
    { name: "system.mods.magicpotency", mode: 2, value: "1" },

    { name: "system.mods.check.formula", mode: 5, value: "(floor(@rank.levels.max)+1)" },
    { name: "system.mods.check.value", mode: 2, value: "1" },

    { name: "system.mods.damage.value", mode: 2, value: "1" },
    { name: "system.mods.damage.melee", mode: 2, value: "1" },
    { name: "system.mods.damage.ranged", mode: 2, value: "1" },
    { name: "system.mods.damage.multiplier.value", mode: 4, value: "2" },
    { name: "system.mods.damage.multiplier.melee", mode: 4, value: "2" },

    { name: "system.mods.damage.multiplier.ranged", mode: 4, value: "2" },
    { name: "system.mods.damage.multiplier.thrown", mode: 4, value: "2" },

    { name: "system.mods.formula.ac.dex", mode: 5, value: "@abilities.dex.defensive*2" },
    { name: "system.mods.formula.ac.value", mode: 5, value: "(floor(@rank.levels.max/2)+1)" },
    { name: "system.mods.formula.ac.front.value", mode: 5, value: "(floor(@rank.levels.max/2)+1)" },
    { name: "system.mods.formula.ac.rear.value", mode: 5, value: "(floor(@rank.levels.max/2)+1)" },
    // { name: "system.mods.formula.ac.melee.front.value", mode: 5, value: "(floor(@rank.levels.max/2)+1)" },
    // { name: "system.mods.formula.ac.melee.rear.value", mode: 5, value: "(floor(@rank.levels.max/2)+1)" },
    { name: "system.mods.formula.ac.ranged.front.value", mode: 5, value: "(floor(@rank.levels.max/2)+1)" },
    { name: "system.mods.formula.ac.ranged.rear.value", mode: 5, value: "(floor(@rank.levels.max/2)+1)" },
    { name: "system.mods.formula.potency.resist", mode: 5, value: "floor(@rank.levels.max/4)" },
    { name: "system.mods.formula.potency.attack", mode: 5, value: "floor(@rank.levels.max/4)" },

    { name: "system.mods.initiative", mode: 2, value: "1" },

    { name: "system.mods.levels.arcane", mode: 2, value: "1" },
    { name: "system.mods.levels.divine", mode: 2, value: "1" },

    { name: "system.mods.resist", mode: 0, value: "fire" },
    { name: "system.mods.immune", mode: 0, value: "cold" },
    { name: "system.mods.vuln", mode: 0, value: "lightning" },
    { name: "system.mods.resists.magicpotency", mode: 2, value: "1" },
    { name: "system.mods.resists.perdice.lightning", mode: 2, value: "1" },
    { name: "system.mods.resists.perdice.fire", mode: 2, value: "1" },
    { name: "system.mods.resists.perdice.cold", mode: 2, value: "1" },
    { name: "system.mods.resists.perdice.all", mode: 2, value: "1" },


    // { name: "system.mods.saves.all", mode: 2, value: "1" },
    { name: "system.mods.saves.all", mode: 0, value: '{"formula": "1", "properties": ""}' },

    { name: "system.mods.saves.paralyzation", mode: 0, value: '{"formula": "1", "properties": ""}' },
    { name: "system.mods.saves.poison", mode: 0, value: '{"formula": "1", "properties": ""}' },
    { name: "system.mods.saves.death", mode: 0, value: '{"formula": "1", "properties": ""}' },
    { name: "system.mods.saves.rod", mode: 0, value: '{"formula": "1", "properties": ""}' },
    { name: "system.mods.saves.staff", mode: 0, value: '{"formula": "1", "properties": ""}' },
    { name: "system.mods.saves.wand", mode: 0, value: '{"formula": "1", "properties": ""}' },
    { name: "system.mods.saves.petrification", mode: 0, value: '{"formula": "1", "properties": ""}' },
    { name: "system.mods.saves.polymorph", mode: 0, value: '{"formula": "1", "properties": ""}' },
    { name: "system.mods.saves.breath", mode: 0, value: '{"formula": "1", "properties": ""}' },
    { name: "system.mods.saves.spell", mode: 0, value: '{"formula": "1", "properties": ""}' },

    { name: "system.mods.skill.pick-pockets", mode: 2, value: "10" },
    { name: "system.mods.skill.open-locks", mode: 2, value: "10" },
    { name: "system.mods.skill.findremove-traps", mode: 2, value: "10" },
    { name: "system.mods.skill.move-silently", mode: 2, value: "10" },
    { name: "system.mods.skill.hide-in-shadows", mode: 2, value: "10" },
    { name: "system.mods.skill.detect-noise", mode: 2, value: "10" },
    { name: "system.mods.skill.climb-walls", mode: 2, value: "10" },
    { name: "system.mods.skill.read-languages", mode: 2, value: "10" },


    { name: "system.spellInfo.slots.arcane.value.0", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.arcane.value.1", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.arcane.value.2", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.arcane.value.3", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.arcane.value.4", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.arcane.value.5", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.arcane.value.6", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.arcane.value.7", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.arcane.value.8", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.arcane.value.9", mode: 2, value: "1" },

    { name: "system.spellInfo.slots.divine.value.0", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.divine.value.1", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.divine.value.2", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.divine.value.3", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.divine.value.4", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.divine.value.5", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.divine.value.6", mode: 2, value: "1" },
    { name: "system.spellInfo.slots.divine.value.7", mode: 2, value: "1" },

    { name: "target.always", mode: 0, value: '{"properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "target.alignment", mode: 0, value: '{"trigger": "ne,ce,le", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "target.properties_any", mode: 0, value: '{"trigger": "regeneration, cold-using", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "target.properties_all", mode: 0, value: '{"trigger": "regeneration, cold-using", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "target.size", mode: 0, value: '{"trigger": "small,medium", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "target.type", mode: 0, value: '{"trigger": "ogre,troll", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "target.distance", mode: 0, value: '{"trigger": "0,20", "properties": "", "type": "attack", "formula": "1d6"}' },

    { name: "attacker.always", mode: 0, value: '{"properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "attacker.alignment", mode: 0, value: '{"trigger": "ne,ce,le", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "attacker.properties_any", mode: 0, value: '{"trigger": "regeneration, cold-using", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "attacker.properties_all", mode: 0, value: '{"trigger": "regeneration, cold-using", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "attacker.size", mode: 0, value: '{"trigger": "small,medium", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "attacker.type", mode: 0, value: '{"trigger": "ogre,troll", "properties": "", "type": "attack", "formula": "1d6"}' },
    { name: "attacker.distance", mode: 0, value: '{"trigger": "0,20", "properties": "", "type": "attack", "formula": "1d6"}' },
];
ARS.selectEffectKeys.sort(utilitiesManager.sortByRecordName);


ARS.strengthTable = {}
// Strength[abilityScore]={hit adj, dam adj, weight allow, max press, open doors, bend bars, light enc, moderate enc, heavy enc, severe enc, max enc}
ARS.strengthTable["0"] = {
    0: [
        "ARS.abilityFields.str.hit",
        "ARS.abilityFields.str.dmg",
        "ARS.abilityFields.str.allow",
        "ARS.abilityFields.str.press",
        "ARS.abilityFields.str.open",
        "ARS.abilityFields.str.bendbars",
        "ARS.abilityFields.str.encumbrance.light",
        "ARS.abilityFields.str.encumbrance.moderate",
        "ARS.abilityFields.str.encumbrance.heavy",
        "ARS.abilityFields.str.encumbrance.severe",
        "ARS.abilityFields.str.encumbrance.max"
    ],
    1: [-3, -1, -35, 0, "1(0)", 0, 1, 36, 71, 115],
    2: [-3, -1, -35, 0, "1(0)", 0, 1, 36, 71, 115],
    3: [-3, -1, -35, 0, "1(0)", 0, 1, 36, 71, 115],
    4: [-2, -1, -25, 0, "1(0)", 0, 11, 46, 81, 125],
    5: [-2, -1, -25, 0, "1(0)", 0, 11, 46, 81, 125],
    6: [-1, 0, -15, 0, "1(0)", 0, 21, 56, 91, 135],
    7: [-1, 0, -15, 0, "1(0)", 0, 21, 56, 91, 135],
    8: [0, 0, 0, 0, "1-2(0)", 1, 36, 71, 106, 150],
    9: [0, 0, 0, 0, "1-2(0)", 1, 36, 71, 106, 150],
    10: [0, 0, 0, 0, "1-2(0)", 2, 36, 71, 106, 150],
    11: [0, 0, 0, 0, "1-2(0)", 2, 36, 71, 106, 150],
    12: [0, 0, 10, 0, "1-2(0)", 4, 46, 81, 116, 160],
    13: [0, 0, 10, 0, "1-2(0)", 4, 46, 81, 116, 160],
    14: [0, 0, 20, 0, "1-2(0)", 7, 56, 91, 126, 170],
    15: [0, 0, 20, 0, "1-2(0)", 7, 56, 91, 126, 170],
    16: [0, 1, 35, 0, "1-3(0)", 10, 71, 106, 141, 185],
    17: [1, 1, 50, 0, "1-3(0)", 13, 86, 121, 156, 200],
    18: [1, 2, 75, 0, "1-3(0)", 16, 111, 146, 181, 225],
    19: [3, 6, 300, 0, "1-5(1)", 40, 336, 371, 406, 450],
    20: [3, 8, 535, 700, "17(10)", 60, 536, 580, 610, 670, 700],
    21: [4, 9, 635, 810, "17(12)", 70, 636, 680, 720, 790, 810],
    22: [4, 10, 785, 970, "18(14)", 80, 786, 830, 870, 900, 970],
    23: [5, 11, 935, 1130, "18(16)", 90, 936, 960, 1000, 1090, 1130],
    24: [6, 12, 1235, 1440, "19(17)", 95, 1236, 1290, 1300, 1380, 1440],
    25: [7, 14, 1535, 1750, "19(18)", 99, 1536, 1590, 1600, 1680, 1750],
    // Deal with 18 01-100 strength
    50: [1, 3, 100, 0, "1-3(0)", 20, 136, 171, 206, 250],
    75: [2, 3, 125, 0, "1-4(0)", 25, 161, 196, 231, 275],
    90: [2, 4, 150, 0, "1-4(0)", 30, 186, 221, 256, 300],
    99: [2, 5, 200, 0, "1-4(1)", 35, 236, 271, 306, 350],
    100: [3, 6, 300, 0, "1-5(1)", 40, 336, 371, 406, 450],
};
// Strength[abilityScore]={hit adj, dam adj, weight allow, max press, open doors, bend bars, light enc, moderate enc, heavy enc, severe enc, max enc}
ARS.strengthTable["1"] = {
    0: [
        "ARS.abilityFields.str.hit",
        "ARS.abilityFields.str.dmg",
        "ARS.abilityFields.str.allow",
        "ARS.abilityFields.str.press",
        "ARS.abilityFields.str.open",
        "ARS.abilityFields.str.bendbars",
        "ARS.abilityFields.str.encumbrance.light",
        "ARS.abilityFields.str.encumbrance.moderate",
        "ARS.abilityFields.str.encumbrance.heavy",
        "ARS.abilityFields.str.encumbrance.severe",
        "ARS.abilityFields.str.encumbrance.max"
    ],
    1: [-3, -1, -35, 0, "1(0)", 0, 0, 0, 0, 0, 0],
    2: [-3, -1, -35, 0, "1(0)", 0, 0, 0, 0, 0, 0],
    3: [-3, -1, -35, 0, "1(0)", 0, 0, 0, 0, 0, 0],
    4: [-2, -1, -25, 0, "1(0)", 0, 0, 0, 0, 0, 0],
    5: [-2, -1, -25, 0, "1(0)", 0, 0, 0, 0, 0, 0],
    6: [-1, 0, -15, 0, "1(0)", 0, 0, 0, 0, 0, 0],
    7: [-1, 0, -15, 0, "1(0)", 0, 0, 0, 0, 0, 0],
    8: [0, 0, 0, 0, "1-2(0)", 1, 0, 0, 0, 0, 0],
    9: [0, 0, 0, 0, "1-2(0)", 1, 0, 0, 0, 0, 0],
    10: [0, 0, 0, 0, "1-2(0)", 2, 0, 0, 0, 0, 0],
    11: [0, 0, 0, 0, "1-2(0)", 2, 0, 0, 0, 0, 0],
    12: [0, 0, 10, 0, "1-2(0)", 4, 0, 0, 0, 0, 0],
    13: [0, 0, 10, 0, "1-2(0)", 4, 0, 0, 0, 0, 0],
    14: [0, 0, 20, 0, "1-2(0)", 7, 0, 0, 0, 0, 0],
    15: [0, 0, 20, 0, "1-2(0)", 7, 0, 0, 0, 0, 0],
    16: [0, 1, 35, 0, "1-3(0)", 10, 0, 0, 0, 0, 0],
    17: [1, 1, 50, 0, "1-3(0)", 13, 0, 0, 0, 0, 0],
    18: [1, 2, 75, 0, "1-3(0)", 16, 0, 0, 0, 0, 0],
    19: [3, 6, 300, 0, "1-5(1)", 50, 0, 0, 0, 0, 0],
    20: [3, 8, 535, 700, "17(10)", 60, 0, 0, 0, 0, 0],
    21: [4, 9, 635, 810, "17(12)", 70, 0, 0, 0, 0, 0],
    22: [4, 10, 785, 970, "18(14)", 80, 0, 0, 0, 0, 0],
    23: [5, 11, 935, 1130, "18(16)", 90, 0, 0, 0, 0, 0],
    24: [6, 12, 1235, 1440, "19(17)", 100, 0, 0, 0, 0, 0],
    25: [7, 14, 1535, 1750, "19(18)", 100, 0, 0, 0, 0, 0],
    // Deal with 18 01-100 strength
    50: [1, 3, 100, 0, "1-3(0)", 20, 0, 0, 0, 0, 0],
    75: [2, 3, 125, 0, "1-3(0)", 25, 0, 0, 0, 0, 0],
    90: [2, 4, 150, 0, "1-4(0)", 30, 0, 0, 0, 0, 0],
    99: [2, 5, 200, 0, "1-4(1)", 35, 0, 0, 0, 0, 0],
    100: [3, 6, 300, 0, "1-5(2)", 40, 0, 0, 0, 0, 0],
};

// Strength[abilityScore]={hit adj, dam adj, weight allow, max press, open doors, bend bars, light enc, moderate enc, heavy enc, severe enc, max enc}
ARS.strengthTable["2"] = {
    0: [
        "ARS.abilityFields.str.hit",
        "ARS.abilityFields.str.dmg",
        "ARS.abilityFields.str.allow",
        "ARS.abilityFields.str.press",
        "ARS.abilityFields.str.open",
        "ARS.abilityFields.str.bendbars",
        "ARS.abilityFields.str.encumbrance.unencumbered",
        "ARS.abilityFields.str.encumbrance.light",
        "ARS.abilityFields.str.encumbrance.moderate",
        "ARS.abilityFields.str.encumbrance.heavy",
        "ARS.abilityFields.str.encumbrance.severe",
        "ARS.abilityFields.str.encumbrance.max"
    ],
    1: [-5, -4, 1, 3, "1(0)", 0, 1, 2, 3, 4, 6, 6],
    2: [-3, -2, 1, 5, "1(0)", 0, 1, 2, 3, 4, 6, 6],
    3: [-3, -1, 5, 10, "2(0)", 0, 5, 6, 7, 9, 10, 10],
    4: [-2, -1, 10, 25, "3(0)", 0, 10, 13, 16, 19, 25, 25],
    5: [-2, -1, 10, 25, "3(0)", 0, 10, 13, 16, 19, 25, 25],
    6: [-1, 0, 20, 55, "4(0)", 0, 20, 29, 38, 46, 55, 55],
    7: [-1, 0, 20, 55, "4(0)", 0, 20, 29, 38, 46, 55, 55],
    8: [0, 0, 35, 90, "5(0)", 1, 35, 50, 65, 80, 90, 90],
    9: [0, 0, 35, 90, "5(0)", 1, 35, 50, 65, 80, 90, 90],
    10: [0, 0, 40, 115, "6(0)", 2, 40, 58, 76, 96, 110, 110],
    11: [0, 0, 40, 115, "6(0)", 2, 40, 58, 76, 96, 110, 110],
    12: [0, 0, 45, 140, "7(0)", 4, 45, 69, 93, 117, 140, 140],
    13: [0, 0, 45, 140, "7(0)", 4, 45, 69, 93, 117, 140, 140],
    14: [0, 0, 55, 170, "8(0)", 7, 55, 85, 115, 145, 170, 170],
    15: [0, 0, 55, 170, "8(0)", 7, 55, 85, 115, 145, 170, 170],
    16: [0, 1, 70, 195, "9(0)", 10, 70, 100, 130, 160, 195, 195],
    17: [1, 1, 85, 220, "10(0)", 13, 85, 121, 157, 193, 220, 220],
    18: [1, 2, 110, 255, "11(0)", 16, 110, 149, 188, 227, 255, 255],
    19: [3, 7, 485, 640, "16(8)", 50, 450, 486, 500, 550, 600, 640],
    20: [3, 8, 535, 700, "17(10)", 60, 490, 536, 580, 610, 670, 700],
    21: [4, 9, 635, 810, "17(12)", 70, 590, 636, 680, 720, 790, 810],
    22: [4, 10, 785, 970, "18(14)", 80, 736, 786, 830, 870, 900, 970],
    23: [5, 11, 935, 1130, "18(16)", 90, 876, 936, 960, 1000, 1090, 1130],
    24: [6, 12, 1235, 1440, "19(17)", 95, 1180, 1236, 1290, 1300, 1380, 1440],
    25: [7, 14, 1535, 1750, "19(18)", 99, 1496, 1536, 1590, 1600, 1680, 1750],
    // Deal with 18 01-100 strength
    50: [1, 3, 135, 280, "12(0)", 20, 135, 174, 213, 252, 280, 280],
    75: [2, 3, 160, 305, "13(0)", 25, 160, 199, 238, 277, 305, 305],
    90: [2, 4, 185, 330, "14(0)", 30, 185, 224, 263, 302, 330, 330],
    99: [2, 5, 235, 380, "15(3)", 35, 235, 274, 313, 352, 380, 380],
    100: [3, 6, 335, 480, "16(6)", 40, 336, 374, 413, 452, 480, 480],
};

ARS.dexterityTable = {}
// Dexterity[abilityScore]={reaction, missile, defensive}
ARS.dexterityTable["0"] = {
    0: [
        "ARS.abilityFields.dex.reaction",
        "ARS.abilityFields.dex.missile",
        "ARS.abilityFields.dex.defensive"
    ],
    1: [-3, -3, 4],
    2: [-3, -3, 4],
    3: [-3, -3, 4],
    4: [-2, -2, 3],
    5: [-1, -1, 2],
    6: [0, 0, 1],
    7: [0, 0, 0],
    8: [0, 0, 0],
    9: [0, 0, 0],
    10: [0, 0, 0],
    11: [0, 0, 0],
    12: [0, 0, 0],
    13: [0, 0, 0],
    14: [0, 0, 0],
    15: [0, 0, -1],
    16: [1, 1, -2],
    17: [2, 2, -3],
    18: [3, 3, -4],
    19: [3, 3, -4],
    20: [3, 3, -4],
    21: [3, 3, -4],
    22: [3, 3, -4],
    23: [3, 3, -4],
    24: [3, 3, -4],
    25: [3, 3, -4]
};
ARS.dexterityTable["1"] = {
    0: ["ARS.abilityFields.dex.reaction", "ARS.abilityFields.dex.missile", "ARS.abilityFields.dex.defensive"],
    1: [-6, -6, 5],
    2: [-4, -4, 5],
    3: [-3, -3, 4],
    4: [-2, -2, 3],
    5: [-1, -1, 2],
    6: [0, 0, 1],
    7: [0, 0, 0],
    8: [0, 0, 0],
    9: [0, 0, 0],
    10: [0, 0, 0],
    11: [0, 0, 0],
    12: [0, 0, 0],
    13: [0, 0, 0],
    14: [0, 0, 0],
    15: [0, 0, -1],
    16: [1, 1, -2],
    17: [2, 2, -3],
    18: [3, 3, -4],
    19: [3, 3, -4],
    20: [3, 3, -4],
    21: [4, 4, -5],
    22: [4, 4, -5],
    23: [4, 4, -5],
    24: [5, 5, -6],
    25: [5, 5, -6]
};
ARS.dexterityTable["2"] = {
    0: ["ARS.abilityFields.dex.reaction", "ARS.abilityFields.dex.missile", "ARS.abilityFields.dex.defensive"],
    1: [-6, -6, 5],
    2: [-4, -4, 5],
    3: [-3, -3, 4],
    4: [-2, -2, 3],
    5: [-1, -1, 2],
    6: [0, 0, 1],
    7: [0, 0, 0],
    8: [0, 0, 0],
    9: [0, 0, 0],
    10: [0, 0, 0],
    11: [0, 0, 0],
    12: [0, 0, 0],
    13: [0, 0, 0],
    14: [0, 0, 0],
    15: [0, 0, -1],
    16: [1, 1, -2],
    17: [2, 2, -3],
    18: [2, 2, -4],
    19: [3, 3, -4],
    20: [3, 3, -4],
    21: [4, 4, -5],
    22: [4, 4, -5],
    23: [4, 4, -5],
    24: [5, 5, -6],
    25: [5, 5, -6]
};


ARS.wisdomBonusSlots = {}
// ability score (1-25) : 0,1,2,3,4,5,6,7 (level/slots)
ARS.wisdomBonusSlots["0"] = {
    0: [],
    1: [0, 0, 0, 0, 0, 0, 0, 0],
    2: [0, 0, 0, 0, 0, 0, 0, 0],
    3: [0, 0, 0, 0, 0, 0, 0, 0],
    4: [0, 0, 0, 0, 0, 0, 0, 0],
    5: [0, 0, 0, 0, 0, 0, 0, 0],
    6: [0, 0, 0, 0, 0, 0, 0, 0],
    7: [0, 0, 0, 0, 0, 0, 0, 0],
    8: [0, 0, 0, 0, 0, 0, 0, 0],
    9: [0, 0, 0, 0, 0, 0, 0, 0],
    10: [0, 0, 0, 0, 0, 0, 0, 0],
    11: [0, 0, 0, 0, 0, 0, 0, 0],
    12: [0, 0, 0, 0, 0, 0, 0, 0],
    13: [0, 1, 0, 0, 0, 0, 0, 0],
    14: [0, 2, 0, 0, 0, 0, 0, 0],
    15: [0, 2, 1, 0, 0, 0, 0, 0],
    16: [0, 2, 2, 0, 0, 0, 0, 0],
    17: [0, 2, 2, 1, 0, 0, 0, 0],
    18: [0, 2, 2, 1, 1, 0, 0, 0],
    19: [0, 3, 2, 1, 1, 0, 0, 0],
    20: [0, 3, 2, 1, 1, 0, 0, 0],
    21: [0, 3, 2, 1, 1, 0, 0, 0],
    22: [0, 3, 2, 1, 1, 0, 0, 0],
    23: [0, 3, 2, 1, 1, 0, 0, 0],
    24: [0, 3, 2, 1, 1, 0, 0, 0],
    25: [0, 3, 2, 1, 1, 0, 0, 0],
};
// ability score (1-25) : 0,1,2,3,4,5,6,7 (level/slots)
ARS.wisdomBonusSlots["1"] = {
    0: [],
    1: [0, 0, 0, 0, 0, 0, 0, 0],
    2: [0, 0, 0, 0, 0, 0, 0, 0],
    3: [0, 0, 0, 0, 0, 0, 0, 0],
    4: [0, 0, 0, 0, 0, 0, 0, 0],
    5: [0, 0, 0, 0, 0, 0, 0, 0],
    6: [0, 0, 0, 0, 0, 0, 0, 0],
    7: [0, 0, 0, 0, 0, 0, 0, 0],
    8: [0, 0, 0, 0, 0, 0, 0, 0],
    9: [0, 0, 0, 0, 0, 0, 0, 0],
    10: [0, 0, 0, 0, 0, 0, 0, 0],
    11: [0, 0, 0, 0, 0, 0, 0, 0],
    12: [0, 0, 0, 0, 0, 0, 0, 0],
    13: [0, 1, 0, 0, 0, 0, 0, 0],
    14: [0, 2, 0, 0, 0, 0, 0, 0],
    15: [0, 2, 1, 0, 0, 0, 0, 0],
    16: [0, 2, 2, 0, 0, 0, 0, 0],
    17: [0, 2, 2, 1, 0, 0, 0, 0],
    18: [0, 2, 2, 1, 1, 0, 0, 0],
    19: [0, 3, 2, 2, 1, 0, 0, 0],
    20: [0, 3, 3, 2, 2, 0, 0, 0],
    21: [0, 3, 3, 3, 2, 1, 0, 0],
    22: [0, 3, 3, 3, 3, 2, 0, 0],
    23: [0, 4, 3, 3, 3, 2, 1, 0],
    24: [0, 4, 3, 3, 3, 3, 2, 0],
    25: [0, 4, 3, 3, 3, 3, 3, 1],
};
// ability score (1-25) : 0,1,2,3,4,5,6,7 (level/slots)
ARS.wisdomBonusSlots["2"] = {
    0: [],
    1: [0, 0, 0, 0, 0, 0, 0, 0],
    2: [0, 0, 0, 0, 0, 0, 0, 0],
    3: [0, 0, 0, 0, 0, 0, 0, 0],
    4: [0, 0, 0, 0, 0, 0, 0, 0],
    5: [0, 0, 0, 0, 0, 0, 0, 0],
    6: [0, 0, 0, 0, 0, 0, 0, 0],
    7: [0, 0, 0, 0, 0, 0, 0, 0],
    8: [0, 0, 0, 0, 0, 0, 0, 0],
    9: [0, 0, 0, 0, 0, 0, 0, 0],
    10: [0, 0, 0, 0, 0, 0, 0, 0],
    11: [0, 0, 0, 0, 0, 0, 0, 0],
    12: [0, 0, 0, 0, 0, 0, 0, 0],
    13: [0, 1, 0, 0, 0, 0, 0, 0],
    14: [0, 2, 0, 0, 0, 0, 0, 0],
    15: [0, 2, 1, 0, 0, 0, 0, 0],
    16: [0, 2, 2, 0, 0, 0, 0, 0],
    17: [0, 2, 2, 1, 0, 0, 0, 0],
    18: [0, 2, 2, 1, 1, 0, 0, 0],
    19: [0, 3, 2, 2, 1, 0, 0, 0],
    20: [0, 3, 3, 2, 2, 0, 0, 0],
    21: [0, 3, 3, 3, 2, 1, 0, 0],
    22: [0, 3, 3, 3, 3, 2, 0, 0],
    23: [0, 4, 3, 3, 3, 2, 1, 0],
    24: [0, 4, 3, 3, 3, 3, 2, 0],
    25: [0, 4, 3, 3, 3, 3, 3, 1],
};
ARS.wisdomTable = {}
// Wisdom[abilityScore]={magic adj, spell bonuses, spell failure, spell imm., MAC base, PSP bonus }
ARS.wisdomTable["0"] = {
    0: [
        "ARS.abilityFields.wis.magic",
        "ARS.abilityFields.wis.bonus",
        "ARS.abilityFields.wis.failure",
        "ARS.abilityFields.wis.imm"
    ],
    1: [-3, "None", 0, 0, 0, 0],
    2: [-3, "None", 0, 0, 0, 0],
    3: [-3, "None", 0, 0, 0, 0],
    4: [-2, "None", 0, 0, 0, 0],
    5: [-1, "None", 0, 0, 0, 0],
    6: [-1, "None", 0, 0, 0, 0],
    7: [-1, "None", 0, 0, 0, 0],
    8: [0, "None", 0, 0, 0, 0],
    9: [0, "None", 0, 0, 0, 0],
    10: [0, "None", 0, 0, 0, 0],
    11: [0, "None", 0, 0, 0, 0],
    12: [0, "None", 0, 0, 0, 0],
    13: [0, "1x1st", 0, 0, 0, 0],
    14: [0, "2x1st", 0, 0, 0, 0],
    15: [1, "2x1st,1x2nd", 0, 0, 0, 0],
    16: [2, "2x1st,2x2nd", 0, 0, 0, 0],
    17: [3, "Various", 0, 0, 0, 0],
    18: [4, "Various", 0, 0, 0, 0],
    19: [5, "Various", 0, 0, 0, 0],
    20: [5, "Various", 0, 0, 0, 0],
    21: [5, "Various", 0, 0, 0, 0],
    22: [5, "Various", 0, 0, 0, 0],
    23: [5, "Various", 0, 0, 0, 0],
    24: [5, "Various", 0, 0, 0, 0],
    25: [5, "Various", 0, 0, 0, 0],
    //-- deal with long string bonus for tooltip
    117: [3, "Bonus Spells: 2x1st, 2x2nd, 1x3rd", 0, 0],
    118: [4, "Bonus Spells: 2x1st, 2x2nd, 1x3rd, 1x4th", 0, 0],
    119: [5, "Bonus Spells: 3x1st, 2x2nd, 1x3rd, 1x4th", 0, 0],
    120: [5, "Bonus Spells: 3x1st, 2x2nd, 1x3rd, 1x4th", 0, 0],
    121: [5, "Bonus Spells: 3x1st, 2x2nd, 1x3rd, 1x4th", 0, 0],
    122: [5, "Bonus Spells: 3x1st, 2x2nd, 1x3rd, 1x4th", 0, 0],
    123: [5, "Bonus Spells: 3x1st, 2x2nd, 1x3rd, 1x4th", 0, 0],
    124: [5, "Bonus Spells: 3x1st, 2x2nd, 1x3rd, 1x4th", 0, 0],
    125: [5, "Bonus Spells: 3x1st, 2x2nd, 1x3rd, 1x4th", 0, 0]
};
ARS.wisdomTable["1"] = {
    0: ["ARS.abilityFields.wis.magic", "ARS.abilityFields.wis.bonus", "ARS.abilityFields.wis.failure", "ARS.abilityFields.wis.imm"],
    1: [-3, "None", 50, "None", 0, 0],
    2: [-3, "None", 50, "None", 0, 0],
    3: [-3, "None", 50, "None", 0, 0],
    4: [-2, "None", 45, "None", 0, 0],
    5: [-1, "None", 40, "None", 0, 0],
    6: [-1, "None", 35, "None", 0, 0],
    7: [-1, "None", 30, "None", 0, 0],
    8: [0, "None", 25, "None", 0, 0],
    9: [0, "None", 20, "None", 0, 0],
    10: [0, "None", 15, "None", 0, 0],
    11: [0, "None", 10, "None", 0, 0],
    12: [0, "None", 5, "None", 0, 0],
    13: [0, "1x1st", 0, "None", 0, 0],
    14: [0, "2x1st", 0, "None", 0, 0],
    15: [1, "2x1st,1x2nd", 0, "None", 0, 0],
    16: [2, "2x1st,2x2nd", 0, "None", 0, 0],
    17: [3, "Various", 0, "None", 0, 0],
    18: [4, "Various", 0, "None", 0, 0],
    19: [4, "Various", 0, "Various", 0, 0],
    20: [4, "Various", 0, "Various", 0, 0],
    21: [4, "Various", 0, "Various", 0, 0],
    22: [4, "Various", 0, "Various", 0, 0],
    23: [4, "Various", 0, "Various", 0, 0],
    24: [4, "Various", 0, "Various", 0, 0],
    25: [4, "Various", 0, "Various", 0, 0],
    //-- deal with long string bonus for tooltip
    117: [3, "Bonus Spells: 2x1st, 2x2nd, 1x3rd", 0, "None"],
    118: [4, "Bonus Spells: 2x1st, 2x2nd, 1x3rd, 1x4th", 0, "None"],
    119: [4, "Bonus Spells: 3x1st, 2x2nd, 2x3rd, 1x4th", 0, "Spells: cause fear,charm person, command, friends, hypnotism"],
    120: [4, "Bonus Spells: 3x1st, 3x2nd, 2x3rd, 2x4th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare"],
    121: [4, "Bonus Spells: 3x1st, 3x2nd, 3x3rd, 2x4th, 5th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear"],
    122: [4, "Bonus Spells: 3x1st, 3x2nd, 3x3rd, 3x4th, 2x5th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear, charm monster, confusion, emotion, fumble, suggestion"],
    123: [4, "Bonus Spells: 4x1st, 3x2nd, 3x3rd, 3x4th, 2x5th, 1x6th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear, charm monster, confusion, emotion, fumble, suggestion, chaos, feeblemind, hold monster,magic jar,quest"],
    124: [4, "Bonus Spells: 4x1st, 3x2nd, 3x3rd, 3x4th, 3x5th, 2x6th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear, charm monster, confusion, emotion, fumble, suggestion, chaos, feeblemind, hold monster,magic jar,quest, geas, mass suggestion, rod of ruleship"],
    125: [4, "Bonus Spells: 4x1st, 3x2nd, 3x3rd, 3x4th, 3x5th, 3x6th,1x7th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear, charm monster, confusion, emotion, fumble, suggestion, chaos, feeblemind, hold monster,magic jar,quest, geas, mass suggestion, rod of ruleship, antipathy/sympath, death spell,mass charm"]
};
ARS.wisdomTable["2"] = {
    0: [
        "ARS.abilityFields.wis.magic",
        "ARS.abilityFields.wis.bonus",
        "ARS.abilityFields.wis.failure",
        "ARS.abilityFields.wis.imm",
        //MAC base?,
        //PSP bonus?,
    ],
    1: [-6, "None", 80, "None", 10, 0],
    2: [-4, "None", 60, "None", 10, 0],
    3: [-3, "None", 50, "None", 10, 0],
    4: [-2, "None", 45, "None", 10, 0],
    5: [-1, "None", 40, "None", 10, 0],
    6: [-1, "None", 35, "None", 10, 0],
    7: [-1, "None", 30, "None", 10, 0],
    8: [0, "None", 25, "None", 10, 0],
    9: [0, "None", 20, "None", 10, 0],
    10: [0, "None", 15, "None", 10, 0],
    11: [0, "None", 10, "None", 10, 0],
    12: [0, "None", 5, "None", 10, 0],
    13: [0, "1x1st", 0, "None", 10, 0],
    14: [0, "2x1st", 0, "None", 10, 0],
    15: [1, "2x1st,1x2nd", 0, "None", 10, 0],
    16: [2, "2x1st,2x2nd", 0, "None", 9, 1],
    17: [3, "Various", 0, "None", 8, 2],
    18: [4, "Various", 0, "None", 7, 3],
    19: [4, "Various", 0, "Various", 6, 4],
    20: [4, "Various", 0, "Various", 5, 5],
    21: [4, "Various", 0, "Various", 4, 6],
    22: [4, "Various", 0, "Various", 3, 7],
    23: [4, "Various", 0, "Various", 2, 8],
    24: [4, "Various", 0, "Various", 1, 9],
    25: [4, "Various", 0, "Various", 0, 10],
    //-- deal with long string bonus for tooltip
    117: [3, "Bonus Spells: 2x1st, 2x2nd, 1x3rd", 0, "None"],
    118: [4, "Bonus Spells: 2x1st, 2x2nd, 1x3rd, 1x4th", 0, "None"],
    119: [4, "Bonus Spells: 3x1st, 2x2nd, 2x3rd, 1x4th", 0, "Spells: cause fear,charm person, command, friends, hypnotism"],
    120: [4, "Bonus Spells: 3x1st, 3x2nd, 2x3rd, 2x4th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare"],
    121: [4, "Bonus Spells: 3x1st, 3x2nd, 3x3rd, 2x4th, 5th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear"],
    122: [4, "Bonus Spells: 3x1st, 3x2nd, 3x3rd, 3x4th, 2x5th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear, charm monster, confusion, emotion, fumble, suggestion"],
    123: [4, "Bonus Spells: 4x1st, 3x2nd, 3x3rd, 3x4th, 2x5th, 1x6th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear, charm monster, confusion, emotion, fumble, suggestion, chaos, feeblemind, hold monster,magic jar,quest"],
    124: [4, "Bonus Spells: 4x1st, 3x2nd, 3x3rd, 3x4th, 3x5th, 2x6th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear, charm monster, confusion, emotion, fumble, suggestion, chaos, feeblemind, hold monster,magic jar,quest, geas, mass suggestion, rod of ruleship"],
    125: [4, "Bonus Spells: 4x1st, 3x2nd, 3x3rd, 3x4th, 3x5th, 3x6th,1x7th", 0, "Spells: cause fear,charm person, command, friends, hypnotism, forget, hold person, enfeeble, scare, fear, charm monster, confusion, emotion, fumble, suggestion, chaos, feeblemind, hold monster,magic jar,quest, geas, mass suggestion, rod of ruleship, antipathy/sympath, death spell,mass charm"]
};
ARS.constitutionTable = {}
// Constitution[abilityScore]={hp, system shock, resurrection survivial, poison save, regeneration, psp bonus}
ARS.constitutionTable["0"] = {
    0: [
        "ARS.abilityFields.con.hp",
        "ARS.abilityFields.con.shock",
        "ARS.abilityFields.con.survival",
        "ARS.abilityFields.con.poison",
        "ARS.abilityFields.con.regen"
    ],
    1: [[-2], 35, 40, 0, 0, 0],
    2: [[-2], 35, 40, 0, 0, 0],
    3: [[-2], 35, 40, 0, 0, 0],
    4: [[-1], 40, 45, 0, 0, 0],
    5: [[-1], 45, 50, 0, 0, 0],
    6: [[-1], 50, 55, 0, 0, 0],
    7: [[0], 55, 60, 0, 0, 0],
    8: [[0], 60, 65, 0, 0, 0],
    9: [[0], 65, 70, 0, 0, 0],
    10: [[0], 70, 75, 0, 0, 0],
    11: [[0], 75, 80, 0, 0, 0],
    12: [[0], 80, 85, 0, 0, 0],
    13: [[0], 85, 90, 0, 0, 0],
    14: [[0], 88, 92, 0, 0, 0],
    15: [[1], 91, 94, 0, 0, 0],
    16: [[2], 95, 96, 0, 0, 1],
    17: [[2, 3], 97, 98, 0, 0, 0],
    18: [[2, 4], 99, 100, 0, 0, 0],
    19: [[2, 5], 99, 100, 0, 0, 0],
    20: [[2, 5], 99, 100, 0, 0, 0],
    21: [[2, 5], 99, 100, 0, 0, 0],
    22: [[2, 5], 99, 100, 0, 0, 0],
    23: [[2, 5], 99, 100, 0, 0, 0],
    24: [[2, 5], 99, 100, 0, 0, 0],
    25: [[2, 5], 99, 100, 0, 0, 0]
};
// Constitution[abilityScore]={hp, system shock, resurrection survivial, poison save, regeneration, psp bonus}
ARS.constitutionTable["1"] = {
    0: ["ARS.abilityFields.con.hp", "ARS.abilityFields.con.shock", "ARS.abilityFields.con.survival", "ARS.abilityFields.con.poison", "ARS.abilityFields.con.regen"],
    1: [[-2], 35, 40, 0, "None", 0],
    2: [[-2], 35, 40, 0, "None", 0],
    3: [[-2], 35, 40, 0, "None", 0],
    4: [[-1], 40, 45, 0, "None", 0],
    5: [[-1], 45, 50, 0, "None", 0],
    6: [[-1], 50, 55, 0, "None", 0],
    7: [[0], 55, 60, 0, "None", 0],
    8: [[0], 60, 65, 0, "None", 0],
    9: [[0], 65, 70, 0, "None", 0],
    10: [[0], 70, 75, 0, "None", 0],
    11: [[0], 75, 80, 0, "None", 0],
    12: [[0], 80, 85, 0, "None", 0],
    13: [[0], 85, 90, 0, "None", 0],
    14: [[0], 88, 92, 0, "None", 0],
    15: [[1], 91, 94, 0, "None", 0],
    16: [[2], 95, 96, 0, "None", 0],
    17: [[2, 3], 97, 98, 0, "None", 0],
    18: [[2, 4], 99, 100, 0, "None", 0],
    19: [[2, 5], 99, 100, 1, "None", 0],
    20: [[2, 5], 99, 100, 1, "1/6 turns", 0],
    21: [[2, 6], 99, 100, 2, "1/5 turns", 0],
    22: [[2, 6], 99, 100, 2, "1/4 turns", 0],
    23: [[2, 6], 99, 100, 3, "1/3 turns", 0],
    24: [[2, 7], 99, 100, 3, "1/2", 0],
    25: [[2, 7], 100, 100, 4, "1 turn", 0]
};
// Constitution[abilityScore]={hp, system shock, resurrection survivial, poison save, regeneration, psp bonus}
ARS.constitutionTable["2"] = {
    0: ["ARS.abilityFields.con.hp", "ARS.abilityFields.con.shock", "ARS.abilityFields.con.survival", "ARS.abilityFields.con.poison", "ARS.abilityFields.con.regen"],
    1: [[-3], 25, 30, -2, "None", 0],
    2: [[-2], 30, 35, -1, "None", 0],
    3: [[-2], 35, 40, 0, "None", 0],
    4: [[-1], 40, 45, 0, "None", 0],
    5: [[-1], 45, 50, 0, "None", 0],
    6: [[-1], 50, 55, 0, "None", 0],
    7: [[0], 55, 60, 0, "None", 0],
    8: [[0], 60, 65, 0, "None", 0],
    9: [[0], 65, 70, 0, "None", 0],
    10: [[0], 70, 75, 0, "None", 0],
    11: [[0], 75, 80, 0, "None", 0],
    12: [[0], 80, 85, 0, "None", 0],
    13: [[0], 85, 90, 0, "None", 0],
    14: [[0], 88, 92, 0, "None", 0],
    15: [[1], 90, 94, 0, "None", 0],
    16: [[2], 95, 96, 0, "None", 1],
    17: [[2, 3], 97, 98, 0, "None", 2],
    18: [[2, 4], 99, 100, 0, "None", 3],
    19: [[2, 5], 99, 100, 1, "None", 4],
    20: [[2, 5], 99, 100, 1, "1/6 turns", 5],
    21: [[2, 6], 99, 100, 2, "1/5 turns", 6],
    22: [[2, 6], 99, 100, 2, "1/4 turns", 7],
    23: [[2, 6], 99, 100, 3, "1/3 turns", 8],
    24: [[2, 7], 99, 100, 3, "1/2", 9],
    25: [[2, 7], 100, 100, 4, "1 turn", 10]
};
ARS.charismaTable = {};
// Charisma[abilityScore]={max hench,loyalty base, reaction adj}
ARS.charismaTable["0"] = {
    0: [
        "ARS.abilityFields.cha.max",
        "ARS.abilityFields.cha.loyalty",
        "ARS.abilityFields.cha.reaction"
    ],
    1: [1, -30, -25],
    2: [1, -30, -25],
    3: [1, -30, -25],
    4: [1, -25, -20],
    5: [2, -20, -15],
    6: [2, -15, -10],
    7: [3, -10, -5],
    8: [3, -5, 0],
    9: [4, 0, 0],
    10: [4, 0, 0],
    11: [4, 0, 0],
    12: [5, 0, 0],
    13: [5, 0, 5],
    14: [6, 5, 10],
    15: [7, 15, 15],
    16: [8, 20, 25],
    17: [10, 30, 30],
    18: [15, 40, 35],
    19: [20, 50, 40],
    20: [20, 50, 40],
    21: [20, 50, 40],
    22: [20, 50, 40],
    23: [20, 50, 40],
    24: [20, 50, 40],
    25: [20, 50, 40],
};

ARS.charismaTable["1"] = {
    0: ["ARS.abilityFields.cha.max", "ARS.abilityFields.cha.loyalty", "ARS.abilityFields.cha.reaction"],
    1: [1, -30, -25],
    2: [1, -30, -25],
    3: [1, -30, -25],
    4: [1, -25, -20],
    5: [2, -20, -15],
    6: [2, -15, -10],
    7: [3, -10, -5],
    8: [3, -5, 0],
    9: [4, 0, 0],
    10: [4, 0, 0],
    11: [4, 0, 0],
    12: [5, 0, 0],
    13: [5, 0, 5],
    14: [6, 5, 10],
    15: [7, 15, 15],
    16: [8, 20, 25],
    17: [10, 30, 30],
    18: [15, 40, 35],
    19: [20, 50, 40],
    20: [20, 50, 40],
    21: [20, 50, 40],
    22: [20, 50, 40],
    23: [20, 50, 40],
    24: [20, 50, 40],
    25: [20, 50, 40],
};

ARS.charismaTable["2"] = {
    0: ["ARS.abilityFields.cha.max", "ARS.abilityFields.cha.loyalty", "ARS.abilityFields.cha.reaction"],
    1: [0, -8, -7],
    2: [1, -7, -6],
    3: [1, -6, -5],
    4: [1, -5, -4],
    5: [2, -4, -3],
    6: [2, -3, -2],
    7: [3, -2, -1],
    8: [3, -1, 0],
    9: [4, 0, 0],
    10: [4, 0, 0],
    11: [4, 0, 0],
    12: [5, 0, 0],
    13: [5, 0, 1],
    14: [6, 1, 2],
    15: [7, 3, 3],
    16: [8, 4, 5],
    17: [10, 6, 6],
    18: [15, 8, 7],
    19: [20, 10, 8],
    20: [25, 12, 9],
    21: [30, 14, 10],
    22: [35, 16, 1],
    23: [40, 18, 12],
    24: [45, 20, 13],
    25: [50, 20, 14]
};


ARS.intelligenceTable = {}
// Intelligence[abilityScore]={# languages, spelllevel, learn spell, max spells, illusion immunity, MAC mod, PSP Bonus,MTHACO bonus}
ARS.intelligenceTable["0"] = {
    0: [
        "ARS.abilityFields.int.languages",
        "ARS.abilityFields.int.level",
        "ARS.abilityFields.int.chance",
        "ARS.abilityFields.int.max",
        "ARS.abilityFields.int.imm"
    ],
    1: [0, 0, 0, 0, 0, 0, 0, 0],
    2: [0, 0, 0, 0, 0, 0, 0, 0],
    3: [0, 0, 0, 0, 0, 0, 0, 0],
    4: [0, 0, 0, 0, 0, 0, 0, 0],
    5: [0, 0, 0, 0, 0, 0, 0, 0],
    6: [0, 0, 0, 0, 0, 0, 0, 0],
    7: [0, 0, 0, 0, 0, 0, 0, 0],
    8: [1, 0, 0, 0, 0, 0, 0, 0],
    9: [1, 0, 35, 6, 0, 0, 0, 0],
    10: [2, 0, 45, 7, 0, 0, 0, 0],
    11: [2, 0, 45, 7, 0, 0, 0, 0],
    12: [3, 0, 45, 7, 0, 0, 0, 0],
    13: [3, 0, 55, 9, 0, 0, 0, 0],
    14: [4, 0, 55, 9, 0, 0, 0, 0],
    15: [4, 0, 65, 11, 0, 0, 0, 0],
    16: [5, 0, 65, 11, 0, 0, 0, 0],
    17: [6, 0, 75, 14, 0, 0, 0, 0],
    18: [7, 0, 85, 18, 0, 0, 0, 0],
    19: [8, 0, 90, 22, 0, 0, 0, 0],
    20: [8, 0, 90, 22, 0, 0, 0, 0],
    21: [8, 0, 90, 22, 0, 0, 0, 0],
    22: [8, 0, 90, 22, 0, 0, 0, 0],
    23: [8, 0, 90, 22, 0, 0, 0, 0],
    24: [8, 0, 90, 22, 0, 0, 0, 0],
    25: [8, 0, 90, 22, 0, 0, 0, 0],
    //-- these have such long values we stuff them into tooltips instead
    119: [0, 0, 0, "", ""],
    120: [0, 0, 0, "", ""],
    121: [0, 0, 0, "", ""],
    122: [0, 0, 0, "", ""],
    123: [0, 0, 0, "", ""],
    124: [0, 0, 0, "", ""],
    125: [0, 0, 0, "", ""],
};
// Intelligence[abilityScore]={# languages, spelllevel, learn spell, max spells, illusion immunity, MAC mod, PSP Bonus,MTHACO bonus}
ARS.intelligenceTable["1"] = {
    0: ["ARS.abilityFields.int.languages", "ARS.abilityFields.int.level", "ARS.abilityFields.int.chance", "ARS.abilityFields.int.max", "ARS.abilityFields.int.imm"],
    1: [0, 0, 0, 0, "None", 0, 0, 0],
    2: [1, 0, 0, 0, "None", 0, 0, 0],
    3: [1, 0, 0, 0, "None", 0, 0, 0],
    4: [1, 0, 0, 0, "None", 0, 0, 0],
    5: [1, 0, 0, 0, "None", 0, 0, 0],
    6: [1, 0, 0, 0, "None", 0, 0, 0],
    7: [1, 0, 0, 0, "None", 0, 0, 0],
    8: [1, 0, 0, 0, "None", 0, 0, 0],
    9: [1, 4, 35, 6, "None", 0, 0, 0],
    10: [2, 5, 40, 7, "None", 0, 0, 0],
    11: [2, 5, 45, 7, "None", 0, 0, 0],
    12: [3, 6, 50, 7, "None", 0, 0, 0],
    13: [3, 6, 55, 9, "None", 0, 0, 0],
    14: [4, 7, 60, 9, "None", 0, 0, 0],
    15: [4, 7, 65, 11, "None", 0, 0, 0],
    16: [5, 8, 70, 11, "None", 0, 0, 0],
    17: [6, 8, 75, 14, "None", 0, 0, 0],
    18: [7, 9, 85, 18, "None", 0, 0, 0],
    19: [8, 9, 95, "All", "1st", 0, 0, 0],
    20: [9, 9, 96, "All", "1,2", 0, 0, 0],
    21: [10, 9, 97, "All", "1,2,3", 0, 0, 0],
    22: [11, 9, 98, "All", "1,2,3,4", 0, 0, 0],
    23: [12, 9, 99, "All", "1,2,3,4,5", 0, 0, 0],
    24: [15, 9, 100, "All", "1,2,3,4,5,6", 0, 0, 0],
    25: [20, 9, 100, "All", "1,2,3,4,5,6,7", 0, 0, 0],
    //-- these have such long values we stuff them into tooltips instead
    119: [8, 9, 95, "All", "Level: 1st"],
    120: [9, 9, 96, "All", "Level: 1st, 2nd"],
    121: [10, 9, 97, "All", "Level: 1st, 2nd, 3rd"],
    122: [11, 9, 98, "All", "Level: 1st, 2nd, 3rd, 4th"],
    123: [12, 9, 99, "All", "Level: 1st, 2nd, 3rd, 4th, 5th"],
    124: [15, 9, 100, "All", "Level: 1st, 2nd, 3rd, 4th, 5th, 6th"],
    125: [20, 9, 100, "All", "Level: 1st, 2nd, 3rd, 4th, 5th, 6th, 7th"]
};
// Intelligence[abilityScore]={# languages, spelllevel, learn spell, max spells, illusion immunity, MAC mod, PSP Bonus,MTHACO bonus}
ARS.intelligenceTable["2"] = {
    0: ["ARS.abilityFields.int.languages", "ARS.abilityFields.int.level", "ARS.abilityFields.int.chance", "ARS.abilityFields.int.max", "ARS.abilityFields.int.imm"],
    1: [0, 0, 0, 0, "None", 0, 0, 0],
    2: [1, 0, 0, 0, "None", 0, 0, 0],
    3: [1, 0, 0, 0, "None", 0, 0, 0],
    4: [1, 0, 0, 0, "None", 0, 0, 0],
    5: [1, 0, 0, 0, "None", 0, 0, 0],
    6: [1, 0, 0, 0, "None", 0, 0, 0],
    7: [1, 0, 0, 0, "None", 0, 0, 0],
    8: [1, 0, 0, 0, "None", 0, 0, 0],
    9: [2, 4, 35, 6, "None", 0, 0, 0],
    10: [2, 5, 40, 7, "None", 0, 0, 0],
    11: [2, 5, 45, 7, "None", 0, 0, 0],
    12: [3, 6, 50, 7, "None", 0, 0, 0],
    13: [3, 6, 55, 9, "None", 0, 0, 0],
    14: [4, 7, 60, 9, "None", 0, 0, 0],
    15: [4, 7, 65, 11, "None", 0, 0, 0],
    16: [5, 8, 70, 11, "None", 1, 1, 1],
    17: [6, 8, 75, 14, "None", 1, 2, 1],
    18: [7, 9, 85, 18, "None", 2, 3, 2],
    19: [8, 9, 95, "All", "1st", 2, 4, 2],
    20: [9, 9, 96, "All", "1,2", 3, 5, 3],
    21: [10, 9, 97, "All", "1,2,3", 3, 6, 3],
    22: [11, 9, 98, "All", "1,2,3,4", 3, 7, 3],
    23: [12, 9, 99, "All", "1,2,3,4,5", 4, 8, 4],
    24: [15, 9, 100, "All", "1,2,3,4,5,6", 4, 9, 4],
    25: [20, 9, 100, "All", "1,2,3,4,5,6,7", 4, 10, 4],
    //-- these have such long values we stuff them into tooltips instead
    119: [8, 9, 95, "All", "Level: 1st"],
    120: [9, 9, 96, "All", "Level: 1st, 2nd"],
    121: [10, 9, 97, "All", "Level: 1st, 2nd, 3rd"],
    122: [11, 9, 98, "All", "Level: 1st, 2nd, 3rd, 4th"],
    123: [12, 9, 99, "All", "Level: 1st, 2nd, 3rd, 4th, 5th"],
    124: [15, 9, 100, "All", "Level: 1st, 2nd, 3rd, 4th, 5th, 6th"],
    125: [20, 9, 100, "All", "Level: 1st, 2nd, 3rd, 4th, 5th, 6th, 7th"]
};

ARS.saveArrayMap = {
    'paralyzation': 0,
    'poison': 0,
    'death': 0,

    'rod': 1,
    'staff': 1,
    'wand': 1,

    'petrification': 2,
    'polymorph': 2,

    'breath': 3,
    'spell': 4,
}
/**
 * Check a action/spell properties and if it has any of the listed comma delimited 'property'
 * values then we include the formula in the save test
 * 
 * only works with automated saves, not manual saves
 */
ARS.saveProperties = {
    mental: {
        property: 'mental',
        formula: '(@abilities.wis.magic)'
    },
    dodge: {
        property: 'dodge',
        formula: '(-(@abilities.dex.defensive))',
    },
}
// para/poison/Death, Rod/staff/wand, petri/Poly, Breath, Spell
ARS.npcSaveTable = {
    // ARS 
    "0": {
        0: [16, 18, 17, 20, 19],
        1: [14, 16, 15, 17, 17],
        2: [14, 16, 15, 17, 17],
        3: [13, 15, 14, 16, 16],
        4: [13, 15, 14, 16, 16],
        5: [11, 13, 12, 13, 14],
        6: [11, 13, 12, 13, 14],
        7: [10, 12, 11, 12, 13],
        8: [10, 12, 11, 12, 13],
        9: [8, 10, 9, 9, 11],
        10: [8, 10, 9, 9, 11],
        11: [7, 9, 8, 8, 10],
        12: [7, 9, 8, 8, 10],
        13: [5, 7, 6, 5, 8],
        14: [5, 7, 6, 5, 8],
        15: [4, 6, 5, 4, 7],
        16: [4, 6, 5, 4, 7],
        17: [3, 5, 4, 4, 6],
        18: [3, 5, 4, 4, 6],
        19: [2, 4, 3, 3, 5],
        20: [2, 4, 3, 3, 5],
        21: [2, 4, 3, 3, 5]
    },
    // variant 1
    "1": {
        0: [16, 18, 17, 20, 19],
        1: [14, 16, 15, 17, 17],
        2: [14, 16, 15, 17, 17],
        3: [13, 15, 14, 16, 16],
        4: [13, 15, 14, 16, 16],
        5: [11, 13, 12, 13, 14],
        6: [11, 13, 12, 13, 14],
        7: [10, 12, 11, 12, 13],
        8: [10, 12, 11, 12, 13],
        9: [8, 10, 9, 9, 11],
        10: [8, 10, 9, 9, 11],
        11: [7, 9, 8, 8, 10],
        12: [7, 9, 8, 8, 10],
        13: [5, 7, 6, 5, 8],
        14: [5, 7, 6, 5, 8],
        15: [4, 6, 5, 4, 7],
        16: [4, 6, 5, 4, 7],
        17: [3, 5, 4, 4, 6],
        18: [3, 5, 4, 4, 6],
        19: [3, 5, 4, 4, 6],
        20: [3, 5, 4, 4, 6],
        21: [3, 5, 4, 4, 6]
    },
    // variant 2
    "2": {
        0: [16, 18, 17, 20, 19],
        1: [14, 16, 15, 17, 17],
        2: [14, 16, 15, 17, 17],
        3: [13, 15, 14, 16, 16],
        4: [13, 15, 14, 16, 16],
        5: [11, 13, 12, 13, 14],
        6: [11, 13, 12, 13, 14],
        7: [10, 12, 11, 12, 13],
        8: [10, 12, 11, 12, 13],
        9: [8, 10, 9, 9, 11],
        10: [8, 10, 9, 9, 11],
        11: [7, 9, 8, 8, 10],
        12: [7, 9, 8, 8, 10],
        13: [5, 7, 6, 5, 8],
        14: [5, 7, 6, 5, 8],
        15: [4, 6, 5, 4, 7],
        16: [4, 6, 5, 4, 7],
        17: [3, 5, 4, 4, 6],
        18: [3, 5, 4, 4, 6],
        19: [3, 5, 4, 4, 6],
        20: [3, 5, 4, 4, 6],
        21: [3, 5, 4, 4, 6]
    }
}
// v2 thaco table
ARS.thaco = {
    monster: {
        "0": 20,
        "1": 19,
        "2": 19,
        "3": 17,
        "4": 17,
        "5": 15,
        "6": 15,
        "7": 13,
        "8": 13,
        "9": 11,
        "10": 11,
        "11": 9,
        "12": 9,
        "13": 7,
        "14": 7,
        "15": 5,
        "16": 5,
        "17": 3,
        "18": 3,
        "19": 1,
        "20": 1,
        "21": 1,
    },
}

//To hit matrix
ARS.matrix = {
    // OSRIC
    "0": {
        'fighter': {
            //                             AC Hit
            //level [-10,-9,-8.-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10]
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            3: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            4: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            5: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            6: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            7: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            8: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            9: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            10: [20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            11: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            12: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            13: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2],
            14: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3],
            15: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4],
            16: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
            17: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6],
            18: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
            19: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8],
            20: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
        },
        'assassin': {
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            2: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            3: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            4: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            5: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            6: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            7: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            8: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            9: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            10: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            11: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            12: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            13: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            14: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            15: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            16: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            17: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            18: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            19: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            20: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
        },
        'cleric': {
            0: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            3: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            4: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            5: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            6: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            7: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            8: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            9: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            10: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            11: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            12: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            13: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            14: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            15: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            16: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            17: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            18: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            19: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            20: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1]
        },
        'druid': {
            0: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            3: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            4: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            5: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            6: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            7: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            8: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            9: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            10: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            11: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            12: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            13: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            14: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            15: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            16: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            17: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            18: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            19: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            20: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
        },
        'illusionist': {
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            2: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            3: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            4: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            5: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            6: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            7: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            8: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            9: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            10: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            11: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            12: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            13: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            14: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            15: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            16: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            17: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            18: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            19: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            20: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            21: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
        },
        'magic-user': {
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            2: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            3: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            4: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            5: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            6: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            7: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            8: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            9: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            10: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            11: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            12: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            13: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            14: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            15: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            16: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            17: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            18: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            19: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            20: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            21: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
        },
        'paladin': {
            0: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            3: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            4: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            5: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            6: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            7: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            8: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            9: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            10: [20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            11: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            12: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            13: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2],
            14: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3],
            15: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4],
            16: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
            17: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6],
            18: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
            19: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8],
            20: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
        },
        'ranger': {
            0: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            3: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            4: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            5: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            6: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            7: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            8: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            9: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            10: [20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            11: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            12: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            13: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2],
            14: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3],
            15: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4],
            16: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
            17: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6],
            18: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
            19: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8],
            20: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9],
        },
        'thief': {
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            2: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            3: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            4: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            5: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            6: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            7: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            8: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            9: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            10: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            11: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            12: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            13: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            14: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            15: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            16: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            17: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            18: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            19: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            20: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            21: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        }
    },
    "1": {
        'monster': {
            //                             AC Hit
            //level [-10,-9,-8.-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10]
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            // 1-1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            1: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            // 1+: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            2: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            3: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            4: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            5: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            6: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            7: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            8: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            9: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            10: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            11: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            12: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            13: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            14: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2],
            15: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2],
            16: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3],
            17: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3],
            18: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
            19: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
            20: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6],
            21: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6],
            22: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
            23: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
            24: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8],
            25: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8],
            26: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
        },
        'fighter': {
            //                             AC Hit
            //level [-10,-9,-8.-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10]
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            3: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            4: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            5: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            6: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            7: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            8: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            9: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            10: [20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            11: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            12: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            13: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2],
            14: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3],
            15: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4],
            16: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
            17: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6],
            18: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
            19: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8],
            20: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
        },
        'assassin': {
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            2: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            3: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            4: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            5: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            6: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            7: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            8: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            9: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            10: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            11: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            12: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            13: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            14: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            15: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            16: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            17: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            18: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            19: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            20: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
        },
        'cleric': {
            0: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            3: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            4: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            5: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            6: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            7: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            8: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            9: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            10: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            11: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            12: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            13: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            14: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            15: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            16: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            17: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            18: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            19: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            20: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1]
        },
        'druid': {
            0: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            3: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            4: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            5: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            6: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            7: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            8: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            9: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            10: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            11: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            12: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            13: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            14: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            15: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            16: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            17: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            18: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            19: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            20: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
        },
        'illusionist': {
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            2: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            3: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            4: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            5: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            6: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            7: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            8: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            9: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            10: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            11: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            12: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            13: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            14: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            15: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            16: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            17: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            18: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            19: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            20: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            21: [20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        },
        'magic-user': {
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            2: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            3: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            4: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            5: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            6: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            7: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            8: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            9: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            10: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            11: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            12: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            13: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            14: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            15: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            16: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            17: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            18: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            19: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            20: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            21: [20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        },

        'paladin': {
            0: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            3: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            4: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            5: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            6: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            7: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            8: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            9: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            10: [20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            11: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            12: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            13: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2],
            14: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3],
            15: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4],
            16: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
            17: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6],
            18: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
            19: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8],
            20: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
        },
        'ranger': {
            0: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            1: [25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10],
            2: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            3: [23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8],
            4: [22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            5: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            6: [20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
            7: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            8: [20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
            9: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            10: [20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            11: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            12: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
            13: [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2],
            14: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3],
            15: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4],
            16: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
            17: [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6],
            18: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
            19: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8],
            20: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9],
        },
        'thief': {
            0: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            1: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            2: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            3: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            4: [26, 25, 24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
            5: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            6: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            7: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            8: [24, 23, 22, 21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9],
            9: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            10: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            11: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            12: [21, 20, 20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
            13: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            14: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            15: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            16: [20, 20, 20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
            17: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            18: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            19: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            20: [20, 20, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
            21: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        }
    },
};


ARS.currencyType = [
    'cp', 'sp', 'ep', 'gp', 'pp'
]

// These values are a copper base value. 
// // game.ars.config.settings.systemVariant
ARS.currencyValue = {
    "0": {
        "cp": 1,
        "sp": 10,
        "ep": 50,
        "gp": 100,
        "pp": 500
    },
    "1": {
        "cp": 1,
        "sp": 20,
        "ep": 100,
        "gp": 200,
        "pp": 1000
    },
    "2": {
        "cp": 1,
        "sp": 10,
        "ep": 50,
        "gp": 100,
        "pp": 500
    }
}

ARS.currencyWeight = {
    "0": 10,
    "1": 10,
    "2": 50,
}
ARS.itemTypes = [
    "Alchemical",
    "Ammunition",
    "Animal",
    "Art",
    "Clothing",
    "Daily Food and Lodging",
    "Equipment Packs",
    "Gear",
    "Gem",
    "Jewelry",
    "Provisions",
    "Scroll",
    "Service",
    "Herb or Spice",
    "Tack and Harness",
    "Tool",
    "Transport",
    "Other",
    "No-Drop"
];

ARS.itemRarityTypes = [
    "Common",
    "Uncommon",
    "Rare",
    "Very Rare",
    "Unique",
    "Other"
]
// Modifiers to be applied when distance is > medium/long
ARS.rangeModifiers = {
    "short": 0,
    "medium": -2,
    "long": -5
}

ARS.htmlBasicColors = {
    "red": "#FF0000",
    "green": "#008000",
    "gold": "#FEB500",
    "blue": "#0000FF",
    "yellow": "#FFFF00",
    "cyan": "#00FFFF",
    "magenta": "#FF00FF",
    "pink": "#F300FE",
    "purple": "#582AEA",
    "black": "#000000",
    "white": "#FFFFFF",
    "gray": "#808080",
    "orange": "#FFA500",
}

ARS.variant1 = {
    // AC [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    weaponVarmor: {
        // melee weapons
        "aklys": [-7, -6, -5, -4, -3, -2, -1, -1, 0, 0, 1],
        "atlatl": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "axe, battle": [-5, -4, -3, -2, -1, -1, 0, 0, 1, 1, 2],
        "axe, hand": [-5, -4, -3, -2, -2, -1, 0, 0, 1, 1, 1],
        "bardiche": [-3, -2, -2, -1, 0, 0, 1, 1, 2, 2, 3],
        "bec de corbin": [2, 2, 2, 2, 2, 0, 0, 0, 0, 0, -1],
        "bill-guisarme": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        "blowgun": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "bo stick": [-13, -11, -9, -7, -5, -3, -1, 0, 1, 0, 3],
        "caltrop": [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2],
        "club": [-7, -6, -5, -4, -3, -2, -1, -1, 0, 0, 1],
        "dagger": [-4, -4, -3, -3, -2, -2, 0, 0, 1, 1, 3],
        "fauchard": [-3, -3, -2, -2, -1, -1, 0, 0, 0, -1, -1],
        "fauchard-fork": [-2, -2, -1, -1, -1, 0, 0, 0, 1, 0, 1],
        "fist or open hand": [-9, -8, -7, -5, -3, -1, 0, 0, 2, 0, 4],
        "flail, footman’s": [3, 3, 2, 2, 1, 2, 1, 1, 1, 1, -1],
        "flail, horseman’s": [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
        "fork, military": [-3, -3, -2, -2, -1, 0, 0, 1, 1, 0, 1],
        "garrot": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "glaive": [-2, -2, -1, -1, 0, 0, 0, 0, 0, 0, 0],
        "glaive-guisarme": [-2, -2, -1, -1, 0, 0, 0, 0, 0, 0, 0],
        "guisarme": [-3, -3, -2, -2, -1, -1, 0, 0, 0, -1, -1],
        "guisarme-voulge": [-2, -2, -1, -1, 0, 1, 1, 1, 0, 0, 0],
        "halberd": [0, 1, 1, 1, 1, 2, 2, 2, 1, 1, 0],
        "harpoon": [-3, -2, -2, -1, -1, -1, 0, 0, 0, 0, 0],
        "hammer, lucern": [0, 1, 1, 1, 2, 2, 2, 1, 1, 0, 0],
        "hammer": [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
        "hook fauchard": [-3, -3, -2, -2, -1, -1, 0, 0, 0, 0, -1],
        "jo stick": [-10, -9, -8, -6, -4, -2, -1, 0, 1, 0, 2],
        "knife": [-6, -5, -5, -4, -3, -2, -1, 0, 1, 1, 3],
        "lance (light horse)": [-3, -3, -2, -2, -1, 0, 0, 0, 0, 0, 0],
        "lance (medium horse)": [-1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
        "lance (heavy horse)": [4, 4, 3, 3, 2, 2, 2, 1, 1, 0, 0],
        "lasso": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "mace, footman’s": [2, 2, 1, 1, 0, 0, 0, 0, 0, 1, -1],
        "mace, horseman’s": [2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        "man catcher": [0, 0, 0, 0, 0, 0, 0, 0, -1, -2, -3],
        "morning star": [0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2],
        "partisan": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "pick, military, footman’s": [3, 3, 2, 2, 1, 1, 0, -1, -1, -1, -2],
        "pick, military, horseman’s": [2, 2, 1, 1, 1, 1, 0, 0, -1, -1, -1],
        "pike, awl": [-1, -1, -1, 0, 0, 0, 0, 0, 0, -1, -2],
        "ranseur": [-3, -3, -2, -1, -1, 0, 0, 0, 0, 0, 1],
        "sap": [-14, -13, -12, -10, -8, -6, -5, -4, -3, -2, 0],
        "scimitar": [-4, -3, -3, -2, -2, -1, 0, 0, 1, 1, 3],
        "spear": [-2, -2, -2, -1, -1, -1, 0, 0, 0, 0, 0],
        "spetum": [-2, -2, -2, -1, 0, 0, 0, 0, 0, 1, 2],
        "spiked buckler": [-7, -6, -5, -4, -3, -2, -1, 0, 0, 0, 2],
        "staff, quarter": [-9, -8, -7, -5, -3, -1, 0, 0, 1, 1, 1],
        "staff sling": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "sword, bastard": [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
        "sword, broad": [-5, -4, -3, -2, -1, 0, 0, 1, 1, 1, 2],
        "sword, falchion": [-3, -2, -2, -1, 0, 1, 1, 1, 1, 0, 0],
        "sword, khopesh": [-7, -6, -5, -4, -2, -1, 0, 0, 1, 1, 2],
        "sword, long": [-4, -3, -2, -1, 0, 0, 0, 0, 0, 1, 2],
        "sword, short": [-5, -4, -3, -2, -1, 0, 0, 0, 1, 0, 2],
        "sword, two-handed": [2, 2, 2, 2, 2, 2, 3, 3, 3, 1, 0],
        "trident": [-4, -3, -3, -2, -1, -1, 0, 0, 1, 0, 1],
        "voulge": [-2, -2, -1, -1, 0, 1, 1, 1, 0, 0, 0],
        "whip": [-14, -12, -10, -8, -6, -4, -2, -1, 1, 0, 3],

        // ranged weapon
        "aklys (hurled)": [-8, -7, -6, -5, -4, -3, -2, -1, 0, 0, 0],
        "atlatl (javelin)": [-6, -5, -4, -3, -2, -1, 0, 0, 1, 1, 2],
        "axe, hand": [-6, -5, -4, -3, -2, -1, -1, 0, 0, 0, 1],
        "blowgun needle": [-14, -12, -10, -8, -6, -4, -2, -1, -1, 1, 2],
        "bow, composite, long": [-4, -3, -2, -1, 0, 0, 1, 2, 2, 3, 3],
        "bow, composite, short": [-4, -4, -3, -3, -1, 0, 1, 2, 2, 2, 3],
        "bow, long": [-2, -1, -1, 0, 0, 1, 2, 3, 3, 3, 3],
        "bow, short": [-7, -6, -5, -4, -1, 0, 0, 1, 2, 2, 2],
        "club": [-9, -8, -7, -5, -3, -2, -1, -1, -1, 0, 0],
        "crossbow, hand": [-6, -4, -2, -1, 0, 0, 0, 1, 2, 2, 3],
        "crossbow, heavy": [-2, -1, -1, 0, 1, 2, 3, 3, 4, 4, 4],
        "crossbow, light": [-3, -2, -2, -1, 0, 0, 1, 2, 3, 3, 3],
        "dagger": [-7, -6, -5, -4, -3, -2, -1, -1, 0, 0, 1],
        "dart": [-7, -6, -5, -4, -3, -2, -1, 0, 1, 0, 1],
        "hammer": [-4, -3, -2, -1, 0, 0, 0, 0, 0, 0, 1],
        "harpoon": [-6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 1],
        "javelin": [-7, -6, -5, -4, -3, -2, -1, 0, 1, 0, 1],
        "knife": [-8, -7, -6, -5, -4, -3, -2, -1, 0, 0, 1],
        "lasso": [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
        "sling (bullet)": [-3, -3, -2, -2, -1, 0, 0, 0, 2, 1, 3],
        "sling (stone)": [-7, -6, -5, -4, -2, -1, 0, 0, 2, 1, 3],
        "spear": [-4, -4, -3, -3, -2, -2, -1, 0, 0, 0, 0],
        "staff sling (bullet)": [-5, -4, -3, -2, -1, 0, 0, 0, 0, 0, 0],
        "staff sling (stone)": [-6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 0]
    },
};

// variant 2 weapon damage type versus armor
ARS.variant2 = {
    // modifier applied to attack against this type of armor with this type of weapon damage
    weaponVarmor: {
        "banded mail": { "slashing": -2, "piercing": 0, "bludgeoning": -1 },
        "brigandine": { "slashing": -1, "piercing": -1, "bludgeoning": 0 },
        "chain mail": { "slashing": -2, "piercing": 0, "bludgeoning": 2 },
        "field plate": { "slashing": -3, "piercing": -1, "bludgeoning": 0 },
        "full plate": { "slashing": -4, "piercing": -3, "bludgeoning": 0 },
        "leather armor": { "slashing": 0, "piercing": 2, "bludgeoning": 0 },
        "plate mail": { "slashing": -3, "piercing": 0, "bludgeoning": 0 },
        "ring mail": { "slashing": -1, "piercing": -1, "bludgeoning": 0 },
        "scale mail": { "slashing": 0, "piercing": -1, "bludgeoning": 0 },
        "splint mail": { "slashing": 0, "piercing": -1, "bludgeoning": -2 },
        "studded leather": { "slashing": -2, "piercing": -1, "bludgeoning": 0 }
    }
};

ARS.weaponVarmor = {
    "0": {},
    // AC [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "1": {
        "aklys": [-7, -6, -5, -4, -3, -2, -1, -1, 0, 0, 1],
        "atlatl": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "axe, battle": [-5, -4, -3, -2, -1, -1, 0, 0, 1, 1, 2],
        "axe, hand": [-5, -4, -3, -2, -2, -1, 0, 0, 1, 1, 1],
        "bardiche": [-3, -2, -2, -1, 0, 0, 1, 1, 2, 2, 3],
        "bec de corbin": [2, 2, 2, 2, 2, 0, 0, 0, 0, 0, -1],
        "bill-guisarme": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        "blowgun": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "bo stick": [-13, -11, -9, -7, -5, -3, -1, 0, 1, 0, 3],
        "caltrop": [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2],
        "club": [-7, -6, -5, -4, -3, -2, -1, -1, 0, 0, 1],
        "dagger": [-4, -4, -3, -3, -2, -2, 0, 0, 1, 1, 3],
        "fauchard": [-3, -3, -2, -2, -1, -1, 0, 0, 0, -1, -1],
        "fauchard-fork": [-2, -2, -1, -1, -1, 0, 0, 0, 1, 0, 1],
        "fist or open hand": [-9, -8, -7, -5, -3, -1, 0, 0, 2, 0, 4],
        "flail, footman’s": [3, 3, 2, 2, 1, 2, 1, 1, 1, 1, -1],
        "flail, horseman’s": [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
        "fork, military": [-3, -3, -2, -2, -1, 0, 0, 1, 1, 0, 1],
        "garrot": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "glaive": [-2, -2, -1, -1, 0, 0, 0, 0, 0, 0, 0],
        "glaive-guisarme": [-2, -2, -1, -1, 0, 0, 0, 0, 0, 0, 0],
        "guisarme": [-3, -3, -2, -2, -1, -1, 0, 0, 0, -1, -1],
        "guisarme-voulge": [-2, -2, -1, -1, 0, 1, 1, 1, 0, 0, 0],
        "halberd": [0, 1, 1, 1, 1, 2, 2, 2, 1, 1, 0],
        "harpoon": [-3, -2, -2, -1, -1, -1, 0, 0, 0, 0, 0],
        "hammer, lucern": [0, 1, 1, 1, 2, 2, 2, 1, 1, 0, 0],
        "hammer": [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
        "hook fauchard": [-3, -3, -2, -2, -1, -1, 0, 0, 0, 0, -1],
        "jo stick": [-10, -9, -8, -6, -4, -2, -1, 0, 1, 0, 2],
        "knife": [-6, -5, -5, -4, -3, -2, -1, 0, 1, 1, 3],
        "lance (light horse)": [-3, -3, -2, -2, -1, 0, 0, 0, 0, 0, 0],
        "lance (medium horse)": [-1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
        "lance (heavy horse)": [4, 4, 3, 3, 2, 2, 2, 1, 1, 0, 0],
        "lasso": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "mace, footman’s": [2, 2, 1, 1, 0, 0, 0, 0, 0, 1, -1],
        "mace, horseman’s": [2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        "man catcher": [0, 0, 0, 0, 0, 0, 0, 0, -1, -2, -3],
        "morning star": [0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2],
        "partisan": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "pick, military, footman’s": [3, 3, 2, 2, 1, 1, 0, -1, -1, -1, -2],
        "pick, military, horseman’s": [2, 2, 1, 1, 1, 1, 0, 0, -1, -1, -1],
        "pike, awl": [-1, -1, -1, 0, 0, 0, 0, 0, 0, -1, -2],
        "ranseur": [-3, -3, -2, -1, -1, 0, 0, 0, 0, 0, 1],
        "sap": [-14, -13, -12, -10, -8, -6, -5, -4, -3, -2, 0],
        "scimitar": [-4, -3, -3, -2, -2, -1, 0, 0, 1, 1, 3],
        "spear": [-2, -2, -2, -1, -1, -1, 0, 0, 0, 0, 0],
        "spetum": [-2, -2, -2, -1, 0, 0, 0, 0, 0, 1, 2],
        "spiked buckler": [-7, -6, -5, -4, -3, -2, -1, 0, 0, 0, 2],
        "staff, quarter": [-9, -8, -7, -5, -3, -1, 0, 0, 1, 1, 1],
        "staff sling": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "sword, bastard": [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
        "sword, broad": [-5, -4, -3, -2, -1, 0, 0, 1, 1, 1, 2],
        "sword, falchion": [-3, -2, -2, -1, 0, 1, 1, 1, 1, 0, 0],
        "sword, khopesh": [-7, -6, -5, -4, -2, -1, 0, 0, 1, 1, 2],
        "sword, long": [-4, -3, -2, -1, 0, 0, 0, 0, 0, 1, 2],
        "sword, short": [-5, -4, -3, -2, -1, 0, 0, 0, 1, 0, 2],
        "sword, two-handed": [2, 2, 2, 2, 2, 2, 3, 3, 3, 1, 0],
        "trident": [-4, -3, -3, -2, -1, -1, 0, 0, 1, 0, 1],
        "voulge": [-2, -2, -1, -1, 0, 1, 1, 1, 0, 0, 0],
        "whip": [-14, -12, -10, -8, -6, -4, -2, -1, 1, 0, 3],

        // ranged weapon
        "aklys-ranged": [-8, -7, -6, -5, -4, -3, -2, -1, 0, 0, 0],
        "atlatl (javelin)": [-6, -5, -4, -3, -2, -1, 0, 0, 1, 1, 2],
        "axe, hand-ranged": [-6, -5, -4, -3, -2, -1, -1, 0, 0, 0, 1],
        "blowgun needle": [-14, -12, -10, -8, -6, -4, -2, -1, -1, 1, 2],
        "bow, composite, long": [-4, -3, -2, -1, 0, 0, 1, 2, 2, 3, 3],
        "bow, composite, short": [-4, -4, -3, -3, -1, 0, 1, 2, 2, 2, 3],
        "bow, long": [-2, -1, -1, 0, 0, 1, 2, 3, 3, 3, 3],
        "bow, short": [-7, -6, -5, -4, -1, 0, 0, 1, 2, 2, 2],
        "club-ranged": [-9, -8, -7, -5, -3, -2, -1, -1, -1, 0, 0],
        "crossbow, hand": [-6, -4, -2, -1, 0, 0, 0, 1, 2, 2, 3],
        "crossbow, heavy": [-2, -1, -1, 0, 1, 2, 3, 3, 4, 4, 4],
        "crossbow, light": [-3, -2, -2, -1, 0, 0, 1, 2, 3, 3, 3],
        "dagger-ranged": [-7, -6, -5, -4, -3, -2, -1, -1, 0, 0, 1],
        "dart": [-7, -6, -5, -4, -3, -2, -1, 0, 1, 0, 1],
        "hammer-ranged": [-4, -3, -2, -1, 0, 0, 0, 0, 0, 0, 1],
        "harpoon-ranged": [-6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 1],
        "javelin-ranged": [-7, -6, -5, -4, -3, -2, -1, 0, 1, 0, 1],
        "knife-ranged": [-8, -7, -6, -5, -4, -3, -2, -1, 0, 0, 1],
        "lasso": [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1],
        "sling (bullet)": [-3, -3, -2, -2, -1, 0, 0, 0, 2, 1, 3],
        "sling (stone)": [-7, -6, -5, -4, -2, -1, 0, 0, 2, 1, 3],
        "spear-ranged": [-4, -4, -3, -3, -2, -2, -1, 0, 0, 0, 0],
        "staff sling (bullet)": [-5, -4, -3, -2, -1, 0, 0, 0, 0, 0, 0],
        "staff sling (stone)": [-6, -5, -4, -3, -2, -1, 0, 0, 0, 0, 0]
    },
    "2": {
        // modifier applied to attack against this type of armor with this type of weapon damage
        "banded mail": { "slashing": -2, "piercing": 0, "bludgeoning": -1 },
        "brigandine": { "slashing": -1, "piercing": -1, "bludgeoning": 0 },
        "chain mail": { "slashing": -2, "piercing": 0, "bludgeoning": 2 },
        "field plate": { "slashing": -3, "piercing": -1, "bludgeoning": 0 },
        "full plate": { "slashing": -4, "piercing": -3, "bludgeoning": 0 },
        "leather armor": { "slashing": 0, "piercing": 2, "bludgeoning": 0 },
        "plate mail": { "slashing": -3, "piercing": 0, "bludgeoning": 0 },
        "ring mail": { "slashing": -1, "piercing": -1, "bludgeoning": 0 },
        "scale mail": { "slashing": 0, "piercing": -1, "bludgeoning": 0 },
        "splint mail": { "slashing": 0, "piercing": -1, "bludgeoning": -2 },
        "studded leather": { "slashing": -2, "piercing": -1, "bludgeoning": 0 }
    },
};

ARS.statusEffects = [
    {
        "id": "encumbrance-light",
        "label": "EFFECT.encumbrance-light",
        "icon": "systems/ars/icons/general/encumbrance-light.png"
    },
    {
        "id": "encumbrance-moderate",
        "label": "EFFECT.encumbrance-moderate",
        "icon": "systems/ars/icons/general/encumbrance-moderate.png"
    },
    {
        "id": "encumbrance-heavy",
        "label": "EFFECT.encumbrance-heavy",
        "icon": "systems/ars/icons/general/encumbrance-heavy.png"
    },
    {
        "id": "encumbrance-severe",
        "label": "EFFECT.encumbrance-severe",
        "icon": "systems/ars/icons/general/encumbrance-severe.png"
    },
    {
        "id": "cover-25%",
        "label": "EFFECT.cover25",
        "icon": "systems/ars/icons/svg/shield25.svg"
    },
    {
        "id": "cover-50%",
        "label": "EFFECT.cover50",
        "icon": "systems/ars/icons/svg/shield50.svg"
    },
    {
        "id": "cover-75%",
        "label": "EFFECT.cover75",
        "icon": "systems/ars/icons/svg/shield75.svg"
    },
    {
        "id": "cover-90%",
        "label": "EFFECT.cover90",
        "icon": "systems/ars/icons/svg/shield90.svg"
    },
    {
        "id": "concealed-25%",
        "label": "EFFECT.concealed25",
        "icon": "icons/consumables/plants/dried-leaf-stem-herb-brown.webp"
    },
    {
        "id": "concealed-50%",
        "label": "EFFECT.concealed50",
        "icon": "icons/consumables/plants/dried-pointy-stems-brown.webp"
    },
    {
        "id": "concealed-75%",
        "label": "EFFECT.concealed75",
        "icon": "icons/consumables/plants/grass-dried-bundle-brown.webp"
    },
    {
        "id": "concealed-90%",
        "label": "EFFECT.concealed90",
        "icon": "icons/magic/nature/root-vine-barrier-wall-brown.webp"
    },
    {
        "id": "charge",
        "label": "EFFECT.charge",
        "icon": "icons/creatures/mammals/ox-bull-horned-glowing-orange.webp"
    }

];


