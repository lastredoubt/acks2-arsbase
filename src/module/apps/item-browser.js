import { ARS } from '../config.js';
import { DiceManager } from "../dice/dice.js";
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js"

export function addBrowserButton(app, html) {
    // console.log("item-browser.js addBrowserButton", { app, html })
    if (app.id == "compendium" || app.id == "items") {
        const browserButton = $(`<button class='item-browser' data-tooltip='Browse Items'> ` +
            `<i class='fas fa-shopping-basket'></i>` +
            `Item Browser` +
            `</button>`);

        browserButton.click(function (env) {
            console.log("item-browser.js browserButton", { env })
            if (!game.ars.ui.itembrowser) {
                ui.notifications.warn(`Item browser is loading data...please wait.`);
                // return;
                game.ars.ui = {
                    itembrowser: new ARSItemBrowser(),
                }
            }
            if (game.ars.ui?.itembrowser._getTargetOfItem()) {
                game.ars.ui.itembrowser.render(true);
            } else {
                ui.notifications.error(`Must control an actor or select token to aquire items.`);
            }

        });

        // html.find(".directory-header").append(browserButton);
        html.find(".header-search").before(browserButton);
    }
}
export class ARSItemBrowser extends Application {
    constructor(app) {
        super(app);
        this.items = [];

        // Initialize filters object with default values and optional listOptions for future implementation
        this.initFilters();
    }

    /**
     * Initialize filters object
     * - The idea behind listOptions (not used right now) is that we might add a dropdown instead of free form text
     * - Each time a filter is run, it would build the dropdown based on that field's options
     * - But, free form gives the option to use regex so... not sure, will see
     */
    initFilters() {
        this.filters = {
            type: 'item', // Filter by item type
            source: 'all', // Filter by source, default is 'All'
            general: {
                name: '', // Filter by name
                description: '', // Filter by description
            },
            spell: {
                type: {
                    value: '', // Filter by spell type
                },
                level: {
                    value: '1', // Filter by spell level, default is '1'
                    listOptions: [], // Optional listOptions for future implementation
                },
                sphere: {
                    value: '', // Filter by spell sphere
                    listOptions: [], // Optional listOptions for future implementation
                },
                school: {
                    value: '', // Filter by spell school
                    listOptions: [], // Optional listOptions for future implementation
                },
            },
            weapon: {
                'attack.type': {
                    value: '', // Filter by weapon attack type
                    listOptions: [], // Optional listOptions for future implementation
                },
                'damage.normal': {
                    value: '', // Filter by weapon normal damage
                    listOptions: [], // Optional listOptions for future implementation
                },
                'damage.type': {
                    value: '', // Filter by weapon damage type
                    listOptions: [], // Optional listOptions for future implementation
                },
            },
            armor: {
                'protection.type': {
                    value: '', // Filter by armor protection type
                    listOptions: [], // Optional listOptions for future implementation
                },
                'protection.ac': {
                    value: '', // Filter by armor protection AC value
                    listOptions: [], // Optional listOptions for future implementation
                },
            },
            skill: {
                'groups': {
                    value: '', // Filter by skill group
                    listOptions: [], // Optional listOptions for future implementation
                },
                'features.cost': {
                    value: '', // Filter by skill feature cost
                    listOptions: [], // Optional listOptions for future implementation
                },
                'features.ability': {
                    value: '', // Filter by skill feature ability
                    listOptions: [], // Optional listOptions for future implementation
                },
                'features.modifiers.formula': {
                    value: '', // Filter by skill feature modifiers formula
                    listOptions: [], // Optional listOptions for future implementation
                },
            },
            item: {
                'attributes.type': {
                    value: '', // Filter by item attribute type
                    listOptions: [], // Optional listOptions for future implementation
                },
                'attributes.subtype': {
                    value: '', // Filter by item attribute subtype
                    listOptions: [], // Optional listOptions for future implementation
                },
                'attributes.rarity': {
                    value: '', // Filter by item attribute rarity
                    listOptions: [], // Optional listOptions for future implementation
                },
            },
        };
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            resizable: true,
            minimizable: true,
            id: "item-browser-sheet",
            classes: ["ars", "item-browser"],
            title: "Item Browser",
            template: "systems/ars/templates/apps/item-browser.hbs",
            width: 700,
            height: 830,
            scrollY: [".filter-list", ".item-list"],
        });
    }

    /** @override */
    async getData() {
        const data = await super.getData();

        data.this = this;
        data.filters = this.filters;
        data.game = game;
        data.config = ARS;

        data.items = this.items;
        // filter item list by source
        if (this.filters.source && this.filters.source !== 'all') {
            data.items = data.items.filter((i) => {
                return (
                    (this.filters.source === 'world' && !i.pack) ||
                    (i.pack === this.filters.source)
                );
            });
        }
        // filter item list by name
        data.items = data.items.filter((i) =>
            i.isIdentified &&
            i.type === this.filters.type &&
            ((!this.filters.general.name) || (i.name.match(new RegExp(`${this.filters.general.name}`, 'ig'))))
        );

        // if this item type has special filters...
        if (this.filters[this.filters.type]) {
            const specialFilters = this.filters[this.filters.type];
            for (const filter of Object.keys(specialFilters)) {
                const value = String(specialFilters[filter].value);
                // console.log("item-browser.js getData", { filter, value })
                if (value) {
                    data.items = data.items.filter(i => {
                        const dataValue = getProperty(i.system, filter);
                        return (dataValue && String(dataValue)?.match(new RegExp(`${value}`, 'ig')));
                    });
                }

            }
        }
        // end special filters

        // const sourceList = ['All', 'World'];
        // const sources = this.items.filter(i => i.pack).forEach(m => { if (!sourceList.includes(m.pack)) sourceList.push(m.pack) });

        const sourceList = [{ 'label': 'All', 'value': 'all' }, { 'label': 'World', 'value': 'world' }];
        const sources = this.items.filter(i => i.pack).forEach(m => {
            if (!sourceList.some(obj => obj.value === m.pack)) {
                const pack = game.packs.get(m.pack);
                sourceList.push({ 'label': pack.metadata.label, 'value': m.pack });
            }
        });
        // set the source filter to a readable name
        data.filters.sourceName = sourceList.find(entry => entry.value === this.filters.source).label || 'MISSING';

        data.sourceList = sourceList;
        // console.log("item-browser.js getData", { data })
        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);


        html.find('.filter-item-type').change((event) => this._searchGeneral(event));
        html.find('.filter-name').change((event) => this._searchGeneral(event));
        html.find('.filter-source').change((event) => this._searchGeneral(event));

        html.find('.filter-search').click((event) => this._performSearch(event));

        // add listeners for the specific fields
        for (const tag of game.system.documentTypes.Item) {
            if (this.filters[tag]) {
                const specialFilters = this.filters[tag];
                for (const filter of Object.keys(specialFilters)) {
                    const nodotsFilter = filter.replace(/\./g, '_');
                    html.find(`.filter-field-${nodotsFilter}`).change((event) => this._performSearch(event));
                }
            }

        }
        html.find('.item-take').click((event) => this._itemTake(event));
        html.find('.item-buy').click((event) => this._itemBuy(event));

        html.find('.item-edit').click(async (ev) => {
            const li = $(ev.currentTarget).parents(".item");
            const itemId = li.data("id");
            const itemPack = li.data("pack");
            let item;
            if (itemPack && itemId) {
                item = await game.packs.get(itemPack).getDocument(itemId);
            } else {
                item = game.items.get(itemId);
            }
            if (!item) {
                ui.notifications.error(`Item ${itemId} cannot be found in inventory.`)
                return;
            }
            item.sheet.render(true);
        });
    }

    /** @override to add item population */
    async _render(force = false, options = {}) {

        let worldItems = [];
        // const packItems = await utilitiesManager.getPackItems('Item', game.user.isGM);
        if (!game?.ars?.library?.packs?.items) {
            ui.notifications.warn(`Item browser is loading pack data...please wait.`);
            return;
        }
        const packItems = game.ars.library.packs.items;
        // console.log("item-browser.js _render", { packItems });

        if (game.user.isGM) {
            worldItems = game.items.contents;
        } else {
            worldItems = game.items.contents.filter(i => i.permission > 1);
        }
        this.items = worldItems.concat(packItems);
        this.items.sort(utilitiesManager.sortByRecordName);
        await super._render(force, options);
    }

    _searchGeneral(event) {
        // console.log("item-browser.js _searchGeneral", { event }, this)
        event.preventDefault();
        const element = event.currentTarget;
        const filterFields = element.closest('.filter-fields');

        const itemFilter = filterFields.querySelector('select[name="item-type"]')?.value;
        const sourceFilter = filterFields.querySelector('select[name="filter-source"]')?.value;
        const nameFilter = filterFields.querySelector('input[name="filter-name"]')?.value;

        if (itemFilter) {
            this.filters.type = itemFilter;
            this.filters.source = sourceFilter;
            this.filters.general.name = nameFilter;
            this.render();
        }
    }

    /**
     * 
     * Apply current filters to item list
     * 
     * @param {*} event 
     */
    _performSearch(event) {
        console.log("item-browser.js _performSearch", { event }, this)
        event.preventDefault();
        const element = event.currentTarget;
        const filterFields = element.closest('.filter-fields');

        //special filters
        if (this.filters[this.filters.type]) {
            for (const filter of Object.keys(this.filters[this.filters.type])) {
                const nodotsFilter = filter.replace(/\./g, '_');
                const value = filterFields.querySelector(`input[name="filter-field-${nodotsFilter}"]`)?.value;
                this.filters[this.filters.type][filter].value = value;
            }
            // console.log("item-browser.js _performSearch ==>", this.filters[this.filters.type])
        }
        //

        this.render();
    }

    //** take a item */
    _itemTake(event) {
        // console.log("item-browser.js _itemTake", { event }, this)
        this._itemAquire(false, event)
    }
    //** buy a item */
    _itemBuy(event) {
        // console.log("item-browser.js _itemBuy", { event }, this)
        this._itemAquire(true, event)
    }
    async _itemAquire(buy, event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".item").dataset.id;
        const pack = event.currentTarget.closest(".item").dataset.pack;
        console.log("item-browser.js _itemAquire", { pack, itemId })
        let item;
        if (pack) {
            console.log("item-browser.js _itemAquire 1", { pack, itemId })
            // item = await game.packs.get(pack).get(itemId);
            // after some period of time the "loaded" packs for remote users don't show any longer, this forces it.
            item = await game.packs.get(pack).getDocument(itemId);
        } else {
            console.log("item-browser.js _itemAquire 2", { pack, itemId })
            item = game.items.get(itemId);
        }

        console.log("item-browser.js _itemAquire 3", { item, buy })
        if (item) {
            this._aquireItem(item, buy);
        } else {
            ui.notifications.error(`Unable to find item ${pack ? pack : ''} ${itemId}`);
        }
    }

    //** get actor to place item on */
    _getTargetOfItem() {
        const token = canvas.tokens.controlled?.[0];
        let actor = game.user.character;
        // console.log("item-browser.js _getTargetOfItem", { token, actor })
        if (token && token.isOwner) {
            actor = token.actor;
        }
        return actor;
    }
    /**
     * 
     * Take or purchase a item
     * 
     * @param {*} item 
     * @param {Boolean} purchase 
     * @returns 
     */
    async _aquireItem(item, purchase) {
        console.log("item-browser.js _aquireItem", { item, purchase })
        if (item) {
            const actor = this._getTargetOfItem();
            if (actor) {

                const count =
                    ['item', 'container', 'potion', 'weapon'].includes(item.type) ?
                        await dialogManager.getQuantity(0, 10000, 1, `${purchase ? 'Buy' : 'Take'} how many ${item.name}?`, `Aquire Item`, `${purchase ? 'Buy' : 'Take'}`, 'Cancel')
                        : 1;
                if (count && count > 0) {
                    let purchaseDetails = '';
                    let changeDetails = '';
                    if (purchase) {

                        // console.log("item-browser.js _aquireItem", { count })

                        // const price = (item.system.cost.value * count);
                        const price = (item.retail * count);
                        const currency = item.system.cost.currency;
                        // const purse = parseInt(actor.system.currency[currency]);
                        // const [update, details] = utilitiesManager.exactChangePlease(actor.system.currency, price, currency);
                        const purchase = utilitiesManager.calculateCoins(actor.system.currency, price, currency);
                        // console.log("item-browser.js _aquireItem", { purchase })
                        if (!purchase) {
                            ui.notifications.error(`${actor.name} cannot afford ${price} ${currency} for ${count} ${item.name}`);
                            return;
                        } else {
                            // const newPurse = purse - price;
                            // await actor.update({ [`system.currency.${currency}`]: newPurse });
                            // purchaseDetails = details;
                            purchaseDetails = Object.entries(purchase.spent)
                                .filter(([, value]) => value > 0)
                                .map(([currency, value]) => `${value} ${currency.toUpperCase()}`)
                                .join(', ');

                            changeDetails = Object.entries(purchase.change)
                                .filter(([, value]) => value > 0)
                                .map(([currency, value]) => `${value} ${currency.toUpperCase()}`)
                                .join(', ');

                            let update = {};
                            Object.entries(purchase.available)
                                .map(([currency, value]) => update[`system.currency.${currency}`] = value);

                            console.log("item-browser.js _aquireItem", { update, purchaseDetails, changeDetails })

                            ui.notifications.notify(`${actor.name} purchased ${count} ${item.name} and spent ${purchaseDetails}` + (changeDetails ? ` and received ${changeDetails} in change` : ''));
                            console.log("item-browser.js _aquireItem", `${actor.name} purchased ${count} ${item.name} and ${purchaseDetails}` + (changeDetails ? ` and received ${changeDetails} in change` : ''))
                            await actor.update(update);
                        }
                    }
                    const itemData = item.toObject();
                    itemData.system.quantity = count;
                    const itemAquired = await actor.createEmbeddedDocuments("Item", [itemData]);
                    console.log("item-browser.js _aquireItem", { itemAquired })
                    utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: actor }), `Aquired Item`, `${purchase ? 'Bought' : 'Took'} ${count} ${itemData.name}` + (purchaseDetails ? ` and spent ${purchaseDetails}` : ``) + (changeDetails ? ` and received ${changeDetails} in change` : '') + '.', itemData.img, game.user.isGM ? 'gmroll' : '');
                    console.log("ITEM-BROWSER", `${actor.name} aquired ${count} ${itemData.name}.`);
                }

            } else {
                ui.notifications.error(`Must control an actor or select token to aquire items.`);
            }
        }
    }

}