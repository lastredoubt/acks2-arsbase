import { ARS } from '../config.js';
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
import * as debug from "../debug.js"
import { SocketManager } from "../sockets.js";

export class TradeManager {
    static async showDialogTradeConfirmation(tradeUser) {

        const tokens = canvas.scene.tokens.filter(token => {
            return !game.users.find(user => { return tradeUser.character?.id === token?.actor?.id });
        });

        const content = await renderTemplate("systems/ars/templates/dialogs/dialog-trade-requested.hbs", {
            tradeUser,
            customerUser: game.user,
            tokens: tokens,
        });

        let gmSelectedTokenId = null;
        const confirmed = await new Promise((resolve, reject) => {
            new Dialog({
                title: "Trade Requested",
                content: content,
                buttons: {
                    accept: {
                        label: "Accept",
                        callback: html => {
                            if (game.user.isGM)
                                gmSelectedTokenId = html.find('#gm-selected-token')[0].value;
                            resolve(true);
                        }

                    },
                    cancel: {
                        label: "Cancel",
                        callback: () => resolve(false)
                    }
                }
            }).render(true);
        });

        if (confirmed && game.user.isGM) {
            const user = game.user;
            const tokenId = gmSelectedTokenId;
            await game.user.setFlag("ars", 'tradeAsTokenId', tokenId);
            console.log("game.user", game.user);
        }

        return (confirmed);
    }

    static async getActorFromPlayer(player) {
        let actor = player.character;
        if (player.isGM) {
            const tokenId = await player.getFlag("ars", 'tradeAsTokenId');
            const token = canvas.tokens.get(tokenId);
            actor = token.actor;
        }

        return actor;
    }

} // end TradeManager


async function _getTradeCustomer() {
    const possibleCustomers = game.users.filter(u => u.active && u !== game.user);
    // only list tokens that are not owned by connected game.users
    const tokens = canvas.scene.tokens.filter(token => {
        return !game.users.find(user => { return user.character?.id === token?.actor?.id });
    });

    const content = await renderTemplate("systems/ars/templates/dialogs/dialog-trade-make-request.hbs", {
        trader: game.user,
        tokens: tokens,
        customers: possibleCustomers,
    });

    let gmSelectedTokenId = null;
    const playerID = await new Promise((resolve, reject) => {
        new Dialog({
            title: "Select a Player",
            content: content,
            buttons: {
                ok: {
                    label: "Select",
                    callback: html => {
                        let selectedId = html.find('#trade-player-select')[0].value;
                        if (game.user.isGM)
                            gmSelectedTokenId = html.find('#gm-selected-token')[0].value;
                        console.log(`Selected player ID: ${selectedId}`);
                        resolve(selectedId);
                    }
                }
            }
        }).render(true);
    });

    if (game.user.isGM) {
        const tokenId = gmSelectedTokenId;
        await game.user.setFlag("ars", 'tradeAsTokenId', tokenId);
    }
    const player = game.users.find(u => u.active && u.id === playerID);
    return player;
}
//** get actor to place item on */
async function _getSourceOfTrade() {
    let actor = game.user.character;
    if (game.user.isGM) {
        actor = await TradeManager.getActorFromPlayer(game.user);
    }
    return actor;
}

export function addTradeButton() {
    // console.log("item-trade.js addTradeButton")

    const tradeButton = document.createElement('button');
    tradeButton.textContent = `Request Trade `;
    tradeButton.setAttribute('id', 'trade-request-button');
    tradeButton.setAttribute('class', 'playerlist-trade-button item-trade');

    const tradeButtonIcon = document.createElement('i');
    tradeButtonIcon.setAttribute('class', 'fas fa-retweet');
    tradeButton.appendChild(tradeButtonIcon);

    // const playerList = document.getElementById('players');
    const playerList = document.getElementById('player-list');
    const parentOfPlayerList = playerList.parentElement;
    parentOfPlayerList.appendChild(tradeButton);

    // tradeButton.click(async function (env) {
    tradeButton.addEventListener('click', async function (env) {
        const playerConnected = game.users.some(u => { return (u.active && u !== game.user) });
        if (playerConnected) {
            // console.log("item-trade.js tradeButton", { env })
            const player = await _getTradeCustomer();
            // this needs to go after finding trade customer..
            const trader = await _getSourceOfTrade();
            //

            if (!trader) {
                ui.notifications.error(`Must control an actor to trade items.`);
            }
            const itemtrade = new ARSItemTrade({ trader: trader, customer: player })
            if (itemtrade) {
                game.ars.ui.itemtrade = itemtrade;
                itemtrade._requestTradeWithPlayer();
                ui.notifications.notify(`Waiting on trade request approval from ${player.name}...`);
            } else {
                ui.notifications.error(`Cannot create Trade widow...`);
            }
        } else {
            ui.notifications.warn(`No one is connected you can trade with.`);
        }
    });
}
/**
 * Trader is an actor object
 * Customer is a player object (gm uses setFlag for actor, players use game.user.character)
 */
export class ARSItemTrade extends Application {
    constructor(params) {
        super(params)
        console.log("item-trade.js ARSItemTrade constructor", { params });
        this.tradeLock = false;

        this.trader = {
            actor: params.trader,
            userId: game.user.id,
        };

        if (params.customer) {
            this.customer = {
                actor: params.customer.character,
                userId: params.customer.id,
            };
        }

        this.trader.actor.system.tradeInfo = {
            offer: [],
            currency: [],
            accepted: false,
        };
        this.trader.actor.update({ 'system.tradeInfo': {} })

        console.log("item-trade.js ARSItemTrade this", this);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            resizable: true,
            minimizable: true,
            id: "item-trade-sheet",
            classes: ["ars", "item-trade"],
            title: "Trade",
            template: "systems/ars/templates/apps/item-trade.hbs",
            width: 700,
            height: 830,
            scrollY: [".list"],
        });
    }

    /** set customer actor because they are GM  */
    setCustomerActor(actor) {
        console.log("setCustomerActor", { actor })
        this.customer.actor = actor;
        console.log("setCustomerActor", this.customer)
    }

    /** @override */
    async getData() {
        // console.log("item-trade.js getData this", this);

        const context = await super.getData();
        context.this = this;
        context.game = game;
        context.config = ARS;
        context.trader = {
            actor: this.trader.actor,
            currency: this._buildCurrencyList(this.trader.actor),
            offer: await this._buildOffers(this.trader.actor.system.tradeInfo.offer),
            currencyOffer: this._buildCurrencyOffer(this.trader.actor),
            inventory: this._filterTradeableInventoryTypes(this.trader.actor.items, this.trader.actor.system.tradeInfo.offer),
            accepted: this.trader.actor.system.tradeInfo.accepted,
        };
        context.customer = {
            actor: this.customer.actor,
            offer: await this._buildOffers(this.customer.actor.system.tradeInfo?.offer),
            currencyOffer: this._buildCurrencyOffer(this.customer.actor),
            accepted: this.customer.actor.system.tradeInfo?.accepted,
        };

        // console.log("item-trade.js getData", { context })
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.trade-panel #trader-currency .trader-offer-coin').click((event) => this._selectCoin(event, 'trader'));
        html.find('.trade-panel #trader-currencyOffer .trader-offer-coin').click((event) => this._selectCoin(event, 'trader'));

        html.find('.trade-panel #trader-inventory .trader-inventory-item').click((event) => this._selectInventory(event, 'trader'));
        // html.find('.trade-panel #customer-inventory .customer-inventory-item').click((event) => this._selectInventory(event, 'customer'));

        html.find('.trade-panel .trader-accept-button').click((event) => this._toggleAccepted(event, 'trader'));
        // html.find('.trade-panel .customer-accept-button').click((event) => this._toggleAccepted(event, 'customer'));

        html.find('.trade-panel #trader-trade .trader-trade-item').click((event) => this._selectInventory(event, 'trader'));
        // html.find('.trade-panel #customer-trade .customer-trade-item').click((event) => this._selectInventory(event, 'customer'));

        html.find('.trade-panel .trade-cancel-button').click((event) => this._cancelTrade(event));
    }

    /** filter tradeable inventory for html template view */
    _filterTradeableInventoryTypes(inventory, offer) {
        return inventory
            .filter(function (item) {
                return !offer.some(function (offerItem) {
                    return offerItem.uuid === item.uuid;
                }) && ARS.tradeableInventoryTypes.includes(item.type);
            })
            .sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
    }

    // build a list of coins that are not in trade offer
    _buildCurrencyList(actor) {
        const currency = Object.keys(duplicate(actor.system.currency))
            .filter(key => !actor.system.tradeInfo?.currency[key])
            .reverse()
            .reduce((obj, key) => {
                obj[key] = actor.system.currency[key];
                return obj;
            }, {});
        return currency;
    }

    /** build currency object to display in html template */
    _buildCurrencyOffer(actor) {
        const currencyOffer = Object.keys(actor.system.tradeInfo.currency);
        const currency = {};
        if (currencyOffer && currencyOffer.length) {
            for (let i = currencyOffer.length - 1; i >= 0; i--) {
                if (actor.system.tradeInfo.currency[currencyOffer[i]] > 0)
                    currency[currencyOffer[i]] = actor.system.tradeInfo.currency[currencyOffer[i]];
            }
        }
        return currency;
    }
    //When player clicks on coin to offer
    async _selectCoin(event, type) {
        if (!this.tradeLock) {

            event.preventDefault();
            const element = event.currentTarget;
            const dataset = element.dataset;
            const coinType = dataset.type;
            const coinMax = parseInt(this[type].actor.system.currency[coinType]);
            const coinName = game.i18n.localize(`ARS.currency.${coinType}`);
            console.log("item-trade.js _selectCoin", { coinType, coinMax, coinName })
            if (this[type].actor.system.tradeInfo.currency[coinType]) {
                await this[type].actor.update({ [`system.tradeInfo.currency.${coinType}`]: 0 })
            } else {
                const coins = await dialogManager.getQuantity(0, coinMax, coinMax, `How many ${coinName} (0-${coinMax})?`, `Trade ${coinName} Coins`, 'Offer');
                if (coins > 0) {
                    await this[type].actor.update({ [`system.tradeInfo.currency.${coinType}`]: coins })
                }
            }
            this._notifyOfferUpdate();
            this.render();
        }
    }

    /** toggle the accepted in trade for trader */
    async _toggleAccepted(event, type) {
        if (!this.tradeLock) {
            event.preventDefault();
            await this[type].actor.update({ 'system.tradeInfo.accepted': !this[type].actor.system.tradeInfo.accepted })

            //update DB entry that both sides see
            this._notifyTradeUpdate({});
            this.render();
        }
    }
    /**
     * toggles the item in trade offer
     * 
     * @param {*} event 
     * @param {*} type 
     */
    async _selectInventory(event, type) {
        if (!this.tradeLock) {

            event.preventDefault();
            const element = event.currentTarget;
            const dataset = element.dataset;
            const itemUuid = dataset.uuid;

            console.log("item-trade.js _selectInventory", { event, type, element, dataset, itemUuid });

            async function toggleTradeItem(item, array) {
                let itemExists = false;

                for (let i = 0; i < array.length; i++) {
                    if (array[i].uuid === item.uuid) {
                        itemExists = true;
                        array.splice(i, 1);
                        break;
                    }
                }
                if (!itemExists) {
                    const maxcount = item.system.quantity;
                    if (maxcount > 0) {
                        let count = 1;
                        if (maxcount > 1) {
                            count = await dialogManager.getQuantity(1, maxcount, maxcount, `Trade how many?`, `Trading ${item.name}`, `Offer`, 'Cancel');
                        }
                        if (count)
                            array.push({ uuid: item.uuid, quantity: count });
                    } else {
                        ui.notifications.error(`${item.name} none left, cannot be traded.`)
                    }
                }
            }

            const tradeItem = await fromUuid(itemUuid);
            const offerBundle = Object.values(this[type].actor.system.tradeInfo.offer)
            await toggleTradeItem(tradeItem, offerBundle);
            await this[type].actor.update({
                'system.tradeInfo.offer': offerBundle,
                'system.tradeInfo.accepted': false,
            });

            // await this['customer'].actor.update({ 'tradeInfo.accepted': false })

            //update DB entry that both sides see???
            this._notifyOfferUpdate();
            this._notifyTradeUpdate();

            this.render();
        }
    }


    /**
     * 
     * Clicked cancel trade button
     * 
     * @param {*} event 
     */
    async _cancelTrade(event) {
        if (!this.tradeLock) {

            event.preventDefault();
            if (await dialogManager.confirm(`Are you sure you want to cancel your trade?`)) {

                SocketManager.notify(game.user.id, this.customer.userId, 'tradeCancelled', {});
                this.tradeCancelled(true);
            }
        }
    }

    /**
     * Take array of uuids and create array of actual items
     * 
     * 
     * @param {*} itemsArray 
     * @returns 
     */
    async _buildOffers(itemsArray) {
        const items = [];
        if (!itemsArray)
            return items;

        for (let i = 0; i < itemsArray.length; i++) {
            const item = await fromUuid(itemsArray[i].uuid);
            // items.push(item);
            items.push({ uuid: item.uuid, name: item.name, img: item.img, quantity: itemsArray[i].quantity });
        }
        return items.sort((a, b) => { return a.name.localeCompare(b.name) });
    }

    //notify over sockets that the accept trade was changed and force reload
    async _notifyTradeUpdate(context = {}) {
        console.log("item-trade.js _notifyTradeUpdate", { context });

        SocketManager.notify(game.user.id, this.customer.userId, 'tradeAcceptUpdated', {
            fromActorId: this.trader.actor.id,
            targetActorId: this.customer.actor.id,
            ...context
        });
    }
    //notify over sockets that the accept trade was changed
    async _notifyOfferUpdate(context = {}) {
        console.log("item-trade.js tradeOfferUpdated", { context });
        SocketManager.notify(game.user.id, this.customer.userId, 'tradeOfferUpdated', {
            fromActorId: this.trader.actor.id,
            targetActorId: this.customer.actor.id,
            ...context
        });
    }

    // tradeOfferUpdated

    async _requestTradeWithPlayer() {
        SocketManager.notify(game.user.id, this.customer.userId, 'tradeAskedToTrade', {
            fromActorId: this.trader.actor.id,
            targetActorId: this.customer?.actor?.id,
        });
    }

    _customerAcceptedTradeRequest() {
        SocketManager.notify(game.user.id, this.customer.userId, 'tradeCustomerAcceptedRequest', {});
    }

    /** 
     * 
     * We cannot clean up items on trader end till other side has collected them first.
     * 
     * notify that we've received the trade items and they can process removals of items they gave 
     * */
    async _notifyCompletedReceivingItems() {
        SocketManager.notify(game.user.id, this.customer.userId, 'tradeCompletedReceiving', {
            fromActorId: this.trader.actor.id,
            targetActorId: this.customer.actor.id,
        });
    }

    /**
     * Cancel trade and close windows.
     * 
     * @param {*} bySelf Boolean Was this cancelled by trader?
     */
    tradeCancelled(bySelf = false) {
        if (!this.tradeLock) {

            ui.notifications.error(`Trade cancelled` + (bySelf ? '' : ' by trading partner') + `.`);
            this._cleanUpData();
        }
    }


    //trade the items now
    async initiateTrade() {
        this.tradeLock = true;

        // add items received from trade
        const itemsListGet = this.customer.actor.system.tradeInfo.offer;
        const coinsToGet = this.customer.actor.system.tradeInfo.currency;
        let sendMessage = false;
        let content = `<div><b>Received From ${this.customer.actor.name}</b></div><div class="traded-list flex">`;

        if (itemsListGet.length) {
            const itemsGet = [];
            for (const itemData of itemsListGet) {
                const item = await fromUuid(itemData.uuid);
                const itemObject = item.toObject();
                itemObject.system.quantity = itemData.quantity;

                // trade spell, remove learned flag.
                if (itemObject.type === 'spell') {
                    itemObject.system.learned = false;
                }

                itemsGet.push(itemObject);
            }
            // get clean copy before its modified in createEmbeddedDocuments
            const itemsTraderReceived = duplicate(itemsGet);
            await this.trader.actor.createEmbeddedDocuments("Item", itemsGet);
            if (itemsTraderReceived.length) {
                sendMessage = true;
                itemsTraderReceived.forEach(item => {
                    // chatMessage(ChatMessage.getSpeaker({ actor: this.trader.actor }), `Traded ${this.customer.actor.name} for `, `${item.system.quantity} ${item.name}.`, item.img);

                    content += `<div class="tradeChat-list flexrow">` +
                        `<a class="action-icon" data-tooltip="${item.system.attributes.identified ? item.name : item.alias}"><img src="${item.img}"/></a>` +
                        `<a> ${item.system.quantity} ${item.system.attributes.identified ? item.name : item.alias}</a>` +
                        `</div>`;

                    console.log("ITEM-TRADE:", `${this.trader.actor.name} traded ${this.customer.actor.name} for ${item.system.quantity} ${item.name}.`);
                });
                content += '</div>';

            } else {
                utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: this.trader.actor }), `${this.customer.actor.name} Trade`, `Completed.`);
            }
        } else if (coinsToGet && Object.keys(coinsToGet).length) {
            sendMessage = true;
            const coinType = Object.keys(coinsToGet);
            const updates = {};
            for (let i = 0; i < coinType.length; i++) {
                if (coinsToGet[coinType[i]] > 0) {
                    const coins = parseInt(this.trader.actor.system.currency[coinType[i]]) + parseInt(coinsToGet[coinType[i]]);
                    updates[`system.currency.${coinType[i]}`] = coins;

                    content += `<div class="tradeChat-list flexrow">` +
                        `<a class="action-icon" data-tooltip="${ARS.currency[coinType[i]]}"><img src="${ARS.icons.general.currency[coinType[i]]}"/></a>` +
                        `<a>${coinsToGet[coinType[i]]} ${coinType[i]}</a>` +
                        `</div>`;

                    console.log("ITEM-TRADE:", `${this.trader.actor.name} received ${coinsToGet[coinType[i]]} ${coinType[i]}.`);
                }
            }
            if (Object.keys(updates).length) {
                await this.trader.actor.update(updates);
            }
        } else {
            utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: this.trader.actor }), `${this.customer.actor.name} Trade`, `Completed.`);
        }

        if (sendMessage) {
            let chatData = {
                content: content,
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: this.trader.actor }),
                type: game.ars.const.CHAT_MESSAGE_TYPES.OTHER,
            };
            //use user current setting? game.settings.get("core", "rollMode") 
            const rollMode = game.settings.get("core", "rollMode")
            if (rollMode) ChatMessage.applyRollMode(chatData, rollMode);
            ChatMessage.create(chatData);
        }

        this._notifyCompletedReceivingItems();
    }


    /**
     * We cannot clean up items on our end till other side has collected them first.
     */
    async resolveTraderBarteredItems() {
        // update/delete items from your side of trade
        const itemsListGive = this.trader.actor.system.tradeInfo.offer;
        const currencySpent = this.trader.actor.system.tradeInfo.currency;

        if (currencySpent && Object.keys(currencySpent).length) {
            const coinType = Object.keys(currencySpent);
            const updates = {};
            for (let i = 0; i < coinType.length; i++) {
                if (currencySpent[coinType[i]] > 0) {
                    let spent = parseInt(this.trader.actor.system.currency[coinType[i]]) - parseInt(currencySpent[coinType[i]]);
                    if (spent < 0)
                        spent = 0;
                    updates[`system.currency.${coinType[i]}`] = spent;
                }
            }
            if (Object.keys(updates).length) {
                await this.trader.actor.update(updates);
            }
        }

        const deleteItemIds = [];
        for (const itemData of itemsListGive) {
            const item = await fromUuid(itemData.uuid);
            console.log("item-trade.js initiateTrade itemsListGive", { itemData, item })
            const count = (item.system.quantity - itemData.quantity);
            if (count > 0) {
                await item.update({ 'system.quantity': count });
            } else {
                deleteItemIds.push(item.id)
            }
        }
        await this.trader.actor.deleteEmbeddedDocuments("Item", deleteItemIds);
        ui.notifications.notify(`Trade completed.`);
        this._cleanUpData();
    }

    /**
     * things to do once a trade is ended
     */
    async _cleanUpData() {
        this.tradeLock = false;
        await this.trader.actor.update({
            'system.tradeInfo.offer': [],
            'system.tradeInfo.accepted': false,
        })
        this.close();
        delete this;

    }
    /** @override to automate both sides accepted so trade */
    async render(force, options) {
        super.render(force, options);
        // if both have accepted initiate trade
        if (this.trader.actor.system.tradeInfo.accepted &&
            this.customer.actor.system.tradeInfo.accepted) {
            this.initiateTrade();
        }
    }
}