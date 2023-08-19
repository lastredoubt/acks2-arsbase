import { TradeManager, ARSItemTrade } from "./apps/item-trade.js"

export class SocketManager {

    /**
     * 
     * Handle socketed communications
     * 
     * type: String name of type of socketNotify
     * 
     * sendUserId: game.user.id of sender
     * targetUserId: game.user.id target
     * 
     * @param {*} context 
     */
    static async socketedCommunication(context) {
        switch (context.type) {

            // request received to target a token
            case "TargetToken": {
                const targetToken = canvas.tokens.get(context.tokenId);
                if (game.user.id === context.targetUserId) {
                    const shiftKey = context.shiftKey;
                    // console.log("sockets.js socketedCommunication", { context, shiftKey, targetToken })
                    targetToken.setTarget(true, { user: game.user, releaseOthers: !shiftKey, groupSelection: true });
                    if (ui?.combat?.rendered)
                        ui.combat.render();
                }
                // targetToken._refreshTarget();

            }
                break;

            // ----------User to User trades

            case 'tradeOfferUpdated':
                console.log("hooks.js game.socket.on tradeOfferUpdated", game.user.id, context.targetUserId);
                if (game.user.id === context.targetUserId && game.ars.ui.itemtrade) {
                    await game.ars.ui.itemtrade.trader.actor.update({ 'system.tradeInfo.accepted': false });
                    game.ars.ui.itemtrade._notifyTradeUpdate({});
                    game.ars.ui.itemtrade.render(true);
                }
                break;

            // tell other trade user trade accept status changed to refresh screen
            case 'tradeAcceptUpdated':
                console.log("hooks.js game.socket.on tradeAcceptUpdated", game.user.id, context.targetUserId);
                if (game.user.id === context.targetUserId && game.ars.ui.itemtrade)
                    game.ars.ui.itemtrade.render(true);
                break;

            // tell other trade user to initiate item trade
            case 'tradeAccepted':
                console.log("hooks.js game.socket.on tradeAccepted", game.user.id, context.targetUserId);
                if (game.user.id === context.targetUserId && game.ars.ui.itemtrade)
                    game.ars.ui.itemtrade.initiateTrade();
                break;

            // tell trader we've collected items and they can remove from their inventory
            case 'tradeCompletedReceiving':
                if (game.user.id === context.targetUserId && game.ars.ui.itemtrade)
                    game.ars.ui.itemtrade.resolveTraderBarteredItems();
                break;

            case 'tradeAskedToTrade':
                console.log("hooks.js game.socket.on tradeAskedToTrade", game.user.id, context.targetUserId);
                if (game.user.id === context.targetUserId) {
                    // if (await dialogManager.confirm(`${requestedByUser} wants to trade with you, accept?`)) {
                    if (await TradeManager.showDialogTradeConfirmation(game.users.get(context.senderUserId))) {
                        let trader = null;
                        if (game.user.isGM) {
                            trader = await TradeManager.getActorFromPlayer(game.user);
                        } else {
                            trader = game.user.character;
                        }
                        await trader.update({
                            'system.tradeInfo.offer': [],
                            'system.tradeInfo.currency': [],
                            'system.tradeInfo.accepted': false,
                        });
                        // const customer = game.actors.get(context.fromActorId);
                        const customerPlayer = game.users.get(context.senderUserId);
                        const itemtrade = new ARSItemTrade({ trader: trader, customer: customerPlayer })
                        if (itemtrade) {
                            itemtrade.setCustomerActor(await TradeManager.getActorFromPlayer(customerPlayer));
                            game.ars.ui.itemtrade = itemtrade;
                            itemtrade.render(true);
                            itemtrade._customerAcceptedTradeRequest();
                        }
                    } else {
                        SocketManager.notify(game.user.id, context.senderUserId, 'tradeCancelled', {});
                    }
                }
                break

            case 'tradeCustomerAcceptedRequest':
                console.log("hooks.js game.socket.on tradeCustomerAcceptedRequest", game.user.id, context.targetUserId);
                if (game.user.id === context.targetUserId && game.ars.ui.itemtrade) {
                    const customerPlayer = game.users.get(context.senderUserId);
                    if (customerPlayer.isGM) {
                        const tokenId = customerPlayer.getFlag("ars", 'tradeAsTokenId');
                        const token = canvas.tokens.get(tokenId);
                        const actor = token?.actor;
                        game.ars.ui.itemtrade.setCustomerActor(actor)
                    }
                    await game.ars.ui.itemtrade.trader.actor.update({
                        'system.tradeInfo.offer': [],
                        'system.tradeInfo.currency': [],
                        'system.tradeInfo.accepted': false,
                    });
                    game.ars.ui.itemtrade.render(true);
                }
                break;

            case 'tradeCancelled':
                console.log("hooks.js game.socket.on tradeCancelled", game.user.id, context.targetUserId);
                if (game.user.id === context.targetUserId && game.ars.ui.itemtrade)
                    game.ars.ui.itemtrade.tradeCancelled();
                break;
            // ----------END User to User trades

            default:
                console.log("sockets.js socketedCommunication Unknown context.type", { context });
                break;
        }
    }

    /**
     * 
     * Send notification to sockets for target.user.id and process an action
     * 
     * @param {String} senderUserId game.user.id
     * @param {String} targetUserId target.user.id
     * @param {String} type 'TargetToken'
     * @param {Object} context {shiftKey: event.shiftKey, tokenId: targetToken.id}
     * @returns 
     */
    static notify(senderUserId, targetUserId, type = '', context = {}) {
        console.log("sockets.js socketNotify", { senderUserId, targetUserId, type, context });

        if (!senderUserId || !targetUserId || !type) return;

        const dataPacket = {
            requestId: randomID(16),
            type: type,

            senderUserId: senderUserId,
            targetUserId: targetUserId,

            ...context
        }
        // Emit a socket event
        game.socket.emit('system.ars', dataPacket);
    }

} // end SocketManager