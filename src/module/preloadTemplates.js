export const preloadTemplates = async function () {
    const templatePaths = [
        //Character Sheets

        // character-sheet-tab
        "systems/ars/templates/actor/tabs/character-sheet-tab-main.hbs",


        "systems/ars/templates/actor/parts/character-general-block.hbs",
        "systems/ars/templates/actor/parts/description.hbs",
        "systems/ars/templates/actor/parts/abilityScore-block.hbs",
        "systems/ars/templates/actor/parts/save-block.hbs",
        "systems/ars/templates/actor/parts/inventoryList-Sorted-block.hbs",
        "systems/ars/templates/actor/parts/inventoryList-item.hbs",

        "systems/ars/templates/actor/parts/weaponlist-block.hbs",
        "systems/ars/templates/actor/parts/weaponlist-block-mini.hbs",
        "systems/ars/templates/actor/parts/currency-block.hbs",
        "systems/ars/templates/actor/parts/memorization-block.hbs",
        "systems/ars/templates/actor/parts/memorization-block-mini.hbs",
        "systems/ars/templates/actor/parts/skills-block.hbs",
        "systems/ars/templates/actor/parts/skills-block-mini.hbs",
        "systems/ars/templates/actor/parts/classlist-block.hbs",
        "systems/ars/templates/actor/parts/combat-stats-block.hbs",
        "systems/ars/templates/actor/parts/daily-consume.hbs",
        // NPC
        "systems/ars/templates/actor/parts/npc-stat-block.hbs",

        // general Actor
        "systems/ars/templates/actor/tabs/tab-combat.hbs",

        "systems/ars/templates/actor/parts/actions-block-list.hbs",
        "systems/ars/templates/actor/parts/actions-block-inventory.hbs",
        "systems/ars/templates/actor/parts/actions-block-inventory-mini.hbs",

        // hud actions
        "systems/ars/templates/actor/parts/actions-block-list-mini.hbs",
        "systems/ars/templates/actor/parts/itemsByTypeList-block.hbs",
        "systems/ars/templates/actor/hud/hud-mini.hbs",

        // Items sheets
        "systems/ars/templates/item/parts/item-header.hbs",
        "systems/ars/templates/item/parts/item-description-block.hbs",
        "systems/ars/templates/item/parts/item-nav.hbs",
        "systems/ars/templates/item/parts/actions-block-list.hbs",
        "systems/ars/templates/item/parts/subitem-ability-block.hbs",
        "systems/ars/templates/item/parts/contents-block.hbs",
        "systems/ars/templates/item/parts/item-attributes.hbs",
        "systems/ars/templates/item/parts/item-attributes-audio.hbs",
        "systems/ars/templates/item/parts/item-skillmods-block.hbs",
        "systems/ars/templates/item/parts/conditionals-block.hbs",


        // Actions
        "systems/ars/templates/apps/parts/action-properties-block.hbs",
        "systems/ars/templates/apps/parts/actions-block.hbs",
        // Effects
        "systems/ars/templates/effects/parts/active-effects.hbs",
        //mini
        "systems/ars/templates/apps/parts/actions-block-mini.hbs",
        //sidebar
        "systems/ars/templates/sidebar/party-tracker.hbs",
        "systems/ars/templates/sidebar/combat-tracker-actor-entry.hbs",
        "systems/ars/templates/sidebar/party-dialog-addmember.hbs",
        // Chat Cards
        "systems/ars/templates/chat/parts/chatCard-actions-block.hbs",
        "systems/ars/templates/chat/parts/chatCard-action-block-entry.hbs",
        "systems/ars/templates/chat/chat-message.hbs",
        "systems/ars/templates/chat/parts/chatCard-weapon.hbs",
        "systems/ars/templates/chat/parts/chatCard-dice-roll.hbs",
        "systems/ars/templates/chat/parts/chatCard-sidevside-roll.hbs",

        // dialogs
        "systems/ars/templates/dialogs/dialog-quantity.hbs",
        "systems/ars/templates/dialogs/dialog-get-attack.hbs",
        "systems/ars/templates/dialogs/dialog-get-damage.hbs",
        "systems/ars/templates/dialogs/dialog-trade-requested.hbs",
        "systems/ars/templates/dialogs/dialog-trade-make-request.hbs",
        "systems/ars/templates/dialogs/parts/dialog-rollMode-selection.hbs",

        //scene
        "systems/ars/templates/scene/token-config.hbs",
        //scene/parts
        "systems/ars/templates/scene/parts/token-aura.hbs",

        //apps
        "systems/ars/templates/apps/settings-audio.hbs",
        "systems/ars/templates/apps/settings-combat.hbs",
        "systems/ars/templates/apps/item-browser.hbs",
        "systems/ars/templates/apps/changelog-view.hbs",
        "systems/ars/templates/apps/import-sheet.hbs",


    ];
    return loadTemplates(templatePaths);
};
