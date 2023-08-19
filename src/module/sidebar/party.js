/**
 * 
 * Not used currently, need to figure out how to intiate in "ready" instead
 * of renderSidebar hook
 * 
 */
import * as debug from "../debug.js";
import * as effectManager from "../effect/effects.js";
import * as utilitiesManager from "../utilities.js";
import * as dialogManager from "../dialog.js";
/**
 * 
 * Party Tracker 
 * 
 */

/**
 * 
 * Add party TAB to sidebar
 * 
 * @param {*} app 
 * @param {*} html 
 */
export function addPartyTab(app, html) {
    if (!game.user.isGM) return;
    // Create tab Party
    // Calculate new tab width

    // this doesnt work in firefox, it doesnt support CSS.px
    // html[0]
    //     .querySelector("#sidebar-tabs")
    //     .style.setProperty(
    //         "--sidebar-tab-width",
    //         CSS.px(
    //             Math.floor(
    //                 parseInt(getComputedStyle(html[0]).getPropertyValue("--sidebar-width")) /
    //                 (document.querySelector("#sidebar-tabs").childElementCount + 1)
    //             )
    //         )
    //     );
    html[0]
        .querySelector("#sidebar-tabs")
        .style.setProperty("--sidebar-tab-width", "23px");
    const tab = document.createElement("a");
    tab.classList.add("item");
    tab.dataset.tab = "party";
    tab.dataset.tooltip = "Party tracker";
    if (!("tooltip" in game)) tab.title = "Party tracker";

    // Add icon for tab
    const icon = document.createElement("i");
    icon.setAttribute("class", `fas fa-users`);
    tab.append(icon);

    // Add Party tab to sidebar before compendiums if it's not already there
    if (!document.querySelector("#sidebar-tabs > [data-tab='party']"))
        document.querySelector("#sidebar-tabs > [data-tab='combat']").after(tab);

    // this template determines where the <section> for PartySidebar is placed
    document.querySelector("template#combat").insertAdjacentHTML('afterend', `<template class="tab" id="party" data-tab="party"></template>`);
    // end party tab
}

/**
 * 
 * PartySidebar class
 * 
 */
export class PartySidebar extends SidebarTab {
    constructor(options = {}) {
        super(options);
        this.initialized = false;
        if (ui.sidebar) ui.sidebar.tabs.party = this;
        // if (!this.popOut) game.party.apps.push(this);

        if (!game.party) {
            game['party'] = this;
        }
    }

    async initializePartyTracker() {
        this.initialized = true;
        let firstTimeInitialization = false;
        let partyMembers = await game.settings.get("ars", "partyMembers");
        if (!partyMembers) {
            game.settings.set("ars", "partyMembers", []);
            game.settings.set("ars", "partAwards", []);
            game.settings.set("ars", "partyLogs", []);
            firstTimeInitialization = true;
        }
        game['party'] = this;
        // game['party']['partyMembers'] = partyMembers;
        if (firstTimeInitialization) {
            await this.addLogEntry(`
               <p>Look here for logs generated from the Party-Tracker.</p>\n
               <p>***</p>\n
               `);
        }
        //TODO: Testing
        const membersMap = new Map();
        partyMembers.forEach(member => {
            membersMap.set(member.id, game.actors.get(member.id));
        });
        this.members = membersMap;

        this._reRender(true);
    }

    /** @override */
    static documentName = "Party";

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "party",
            template: "systems/ars/templates/sidebar/party-tracker.hbs",
            title: "Party",
            scrollY: [".directory-list"],
            height: 500,
            resizable: false,
        });
    }

    /** @override */
    createPopout() {
        const pop = super.createPopout();
        pop.initialize({ party: this.viewed, render: true });
        pop.options.resizable = true;
        pop.members = this.members;
        return pop;
    }

    /** @override */
    initialize({ party = null, render = true } = {}) {
        // Also initialize the popout
        if (this._popout) this._popout.initialize({ party, render: false });

        // Render the tracker
        if (render) this.render();
    }

    /** @override */
    async getData(options) {

        // console.log("party.js getData", { options }, this.initialized);
        // Prepare rendering data
        let data;
        if (this.initialized || options.popOut) {
            data = {
                options: options,
                user: game.user,
                sidebar: this,
                // party: this.getMembers(),
                members: this.getMemberArray(),
                awards: this.getAwards(),
                logs: this.getLogs(),
                game: game,
            };
            this.data = data;
        }

        return data;
    }

    /** @override */
    async _render(force, options) {
        // console.log("party.js _render", force, options);
        if (!game.user.isGM) return;
        return super._render(force, options);
    }

    /** @override */
    _handleDroppedDocument(target, data) {
        console.log("party.js _handleDroppedDocument", [target, data]);
    }

    get party() {
        return this.getMembers();
    }
    getMembers() {
        return game.settings.get("ars", "partyMembers");
    }
    async setMembers() {
        await game.settings.set("ars", "partyMembers", this.getMembersBundle());
    }
    getMembersBundle() {
        return Array.from(this.members, ([key, value]) => { return { id: key, uuid: value.uuid, name: value.name }; })
    }
    getMemberArray() {
        // clean up missing actors
        // they got deleted but not removed from party
        if (this.members) {
            for (const [key, actor] of this.members) {
                if (!actor || !game.actors.get(key))
                    this.members.delete(key);
            }
            return Array.from(this.members, ([key, value]) => { return value; });
        }
        return [];
    }
    getAwards() {
        return game.settings.get("ars", "partyAwards") || [];
    }
    async setAwards(awardsList) {
        await game.settings.set("ars", "partyAwards", awardsList);
    }

    getLogs() {
        return game.settings.get("ars", "partyLogs") || [];
    }
    async setLogs(logsList) {
        await game.settings.set("ars", "partyLogs", logsList);
    }



    /**
     * 
     * When detecting a dropped item on party-tracker window
     * 
     * @param {*} event 
     * @returns 
     */
    async _onDrop(event) {
        // console.log("party.js _onDrop", {event});
        event.preventDefault();
        const data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));
        // console.log("party.js _onDrop", { data }, data.type, data.id);
        if (!data.type) return;
        switch (data.type) {
            case 'Actor':
                const actor = await fromUuid(data.uuid);
                if (!game.party.members.has(actor.id)) {
                    await this._addMember(actor);
                } else {
                    console.log("party.js _onDrop duplicate", { actor });
                }
                break;
            default:
                break;
        }
    }

    // one shot function to render in popout and original sidebar
    _reRender(ref) {
        if (this._original?.render) {
            this._original.render(ref);
        } else {
            this.render(ref)
        }
        if (this._popout) this._popout.render(ref);
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // allow drag member to map from party-tracker
        let _dragHandler = ev => this._onDragStart(ev);
        html.find('.entry.actor').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", _dragHandler, false);
        });

        // listen for actors dropped on the party-tracker
        html.find('.party-tracker').on("drop", this._onDrop.bind(this));
        html.find('.party-longrest').click(ev => this.partyLongRest(ev));

        html.find('.member-configure').click(ev => this._onConfigureMember(ev));
        html.find('.member-remove').click(ev => this._onRemoveMember(ev));
        html.find('.member-longrest').click(ev => {
            ev.preventDefault()
            const element = ev.currentTarget;
            const li = element.closest("li");
            const actorId = li.dataset.id;
            this.longRest(game.party.members.get(actorId));
        });
        html.find('.member, .token-image').click(ev => {
            ev.preventDefault()
            const element = ev.currentTarget;
            const li = element.closest("li");
            const actorId = li.dataset.id;
            const actor = game.party.members.get(actorId);
            actor.sheet.render(true);
        });

        html.find('.award-create').click(ev => this._onAwardCreate(ev));
        html.find('.award-xp').change(this._awardXPChange.bind(this));
        html.find('.award-text').change(this._awardTextChange.bind(this));
        html.find('.award-destination').change(this._awardDestinationChange.bind(this));
        html.find('.award-delete').click(ev => this._onRemoveAward(ev));
        html.find('.award-apply').click(ev => this._onApplyAwards(ev));

        html.find('.logs-purge').click(ev => this._onPurgeLogs(ev));

        html.find('.time-round1').click(ev => this._onTimeAdvance('round', 1));
        html.find('.time-turn1').click(ev => this._onTimeAdvance('turn', 1));
        html.find('.time-hour1').click(ev => this._onTimeAdvance('hour', 1));
        html.find('.time-day1').click(ev => this._onTimeAdvance('day', 1));
        html.find('.time-custom').click(ev => this._onTimeAdvanceCustom(ev));

        html.find('.member-add').click(ev => this._addPartyMember(ev));

    }

    /** @override */
    _onDragStart(event) {
        // console.log("party.js _onDragStart", { event })
        const li = event.currentTarget.closest(".entry");
        let actor = null;
        if (li.dataset.id) {
            actor = game.actors.get(li.dataset.id);
            if (!actor || !actor.visible) return false;
        }

        // Parent directory drag start handling
        super._onDragStart(event);

        event.stopPropagation(); // Dragging from image doesn't work without this for some reason.

        // dragData of actor
        const dragData = { type: actor.documentName, id: actor.id, uuid: actor.uuid };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));


        // Create the drag preview for the Token
        if (actor && canvas.ready) {
            const img = li.querySelector("img");
            // console.log("party.js _onDragStart", { actor, img })
            const td = actor.prototypeToken;
            const w = td.width * canvas.dimensions.size * td.scale * canvas.stage.scale.x;
            const h = td.height * canvas.dimensions.size * td.scale * canvas.stage.scale.y;
            const preview = DragDrop.createDragImage(img, w, h);
            event.dataTransfer.setDragImage(preview, w / 2, h / 2);
        }
    }

    /**
     * 
     * Purge all log entries
     * 
     * @param {*} event 
     */
    async _onPurgeLogs(event) {
        event.preventDefault();
        if (await dialogManager.confirm(`Purge all party logs?`)) {
            await this.setLogs([]);
            this._reRender(true);
        }
    }

    /**
     * Apply all awards in queue to current party members
     * 
     * @param {*} event 
     */
    async _onApplyAwards(event) {
        event.preventDefault();
        if (await dialogManager.confirm(`Grant all experience awards to party members?`)) {
            // const memberCount = this.getMembers().length;
            const memberListArray = this.getMemberArray();
            const memberCount = memberListArray.length;
            const partyAwards = this.getAwards().filter((awd) => { return !awd.targetId });
            const individualAwards = this.getAwards().filter((awd) => { return awd.targetId });
            console.log("party.js _onApplyAwards", { memberCount, partyAwards, individualAwards });
            if (memberCount > 0 && (partyAwards.length > 0 || individualAwards.length > 0)) {
                console.log("party.js _onApplyAwards", { partyAwards, individualAwards });
                let xpTotal = 0;
                let xpPerMember = 0;
                for (const awd of partyAwards) {
                    xpTotal += awd.xp;
                }
                xpPerMember = Math.round(xpTotal / memberCount);
                // for (const member of this.getMembers()) {
                for (const actor of memberListArray) {
                    // const actor = game.actors.get(member.id);
                    console.log("party.js _onApplyAwards processing :", actor.name);
                    // if (actor) {
                    if (xpPerMember > 0) {
                        const xpEarned = actor.getFlag("ars", "henchman") ? Math.round(xpPerMember * 0.5) : xpPerMember;
                        await this.awardExperienceToActor(actor, xpEarned);
                        await this.addLogEntry(`Granted group experience award of ${xpEarned} to ${actor.name}.`)
                    }
                    const personalAwards = individualAwards.filter((awd) => { return awd.targetId == actor.id });
                    console.log("party.js _onApplyAwards", actor.name, { personalAwards });
                    if (personalAwards.length) {
                        await this._awardIndividualAward(actor, personalAwards);
                    }
                    // }
                }
                // flush all awards, we just applied them
                await this.setAwards([]);
                await this.addLogEntry(`Group experience dispersed, awards of ${xpPerMember} per member from ${xpTotal}.`)
            }

        }
    }

    /**
     * 
     * Award individual experience to actor
     * 
     * @param {*} actor 
     * @param {*} awards 
     */
    async _awardIndividualAward(actor, awards) {
        let xpTotal = 0;
        for (const awd of awards) {
            xpTotal += awd.xp;
        }
        await this.awardExperienceToActor(actor, xpTotal);
        await this.addLogEntry(`Granted personal experience award to ${actor.name} for a total of ${xpTotal}.`);
    }
    /**
     * 
     * Apply experience to single actor
     * 
     * @param {*} actor 
     * @param {*} xpPerMember 
     */
    async awardExperienceToActor(actor, xpPerMember) {
        // xp is running total of xp ever received
        // applyXP is newly received XP that is due to be applied to class(s)
        const applyXP = (actor.system.applyxp || 0) + xpPerMember;
        const xp = (actor.system.xp || 0) + xpPerMember;
        // console.log("party.js _onApplyAwards", actor.name, { applyXP, xp });
        await actor.update({
            'system.applyxp': applyXP,
            'system.xp': xp
        });
        let chatData = {
            content: `
                   <div><h2>Experience Awarded!</h2></div>    
                   <div>${actor.name} earned ${xpPerMember} experience</div>
               `,
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            type: game.ars.const.CHAT_MESSAGE_TYPES.OTHER,
        };
        //use user current setting? game.settings.get("core", "rollMode") 
        // ChatMessage.applyRollMode(chatData, 'selfroll')
        ChatMessage.create(chatData);
    }
    /**
     * 
     * Delete a select award
     * 
     * @param {*} event 
     */
    async _onRemoveAward(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const li = element.closest("li");
        const index = li.dataset.index;
        const bundle = foundry.utils.deepClone(Object.values(this.getAwards()));
        bundle.splice(index, 1);
        await this.setAwards(bundle);
        this._reRender(true);
    }

    /**
     * 
     * Edit XP field on a award
     * 
     * @param {*} event 
     */
    async _awardXPChange(event) {
        event.preventDefault();
        const index = $(event.currentTarget).closest('li').data("index");
        const value = event.target.value;
        const bundle = foundry.utils.deepClone(this.getAwards() || []);
        bundle[index].xp = parseInt(value) || 0;
        await this.setAwards(bundle);
        this._reRender(true);
    }

    /**
     * 
     * Edit text field on award
     * 
     * @param {*} event 
     */
    async _awardTextChange(event) {
        event.preventDefault();
        const index = $(event.currentTarget).closest('li').data("index");
        const value = event.target.value;
        const bundle = foundry.utils.deepClone(this.getAwards() || []);
        bundle[index].text = value;
        await this.setAwards(bundle);
        this._reRender(true);
    }

    /**
     * Edit the destination of xp award 
     * 
     * @param {*} event 
     */
    async _awardDestinationChange(event) {
        event.preventDefault()
        const element = event.currentTarget;
        const actorId = element.value;
        const li = element.closest("li");
        const index = li.dataset.index;

        const bundle = foundry.utils.deepClone(this.getAwards() || []);
        bundle[index].targetId = actorId;
        await this.setAwards(bundle);
        this._reRender(true);
    }

    /**
     * 
     * Create an XP award entry
     * 
     * @param {*} env 
     */
    async _onAwardCreate(env) {
        env.preventDefault();
        // console.log("party.js _onAwardCreate", { env }, this);
        this.addAward('New award', 1);
    }

    /**
     * 
     * Add member
     * 
     * @param {*} actor 
     */
    async _addMember(actor) {
        console.log("party.js _addMember", { actor });
        game.party.members.set(actor.id, actor);
        await this.setMembers();
        await this.addLogEntry(`Added ${actor.name} to Party-Tracker`);
    }

    /**
     * 
     * Toggle the flag "henchman" (get 50% less XP)
     * 
     * @param {*} event 
     */
    async _onConfigureMember(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const li = element.closest("li");
        const actorId = li.dataset.id;
        const index = li.dataset.index;
        const actor = game.party.members.get(actorId);
        if (actor) {
            const isHenchman = actor.getFlag("ars", "henchman");
            const toggleHenchman = await dialogManager.confirm(`${isHenchman ? 'Deactivate' : 'Activate'} henchman status?`, 'Configure Party Member');
            if (toggleHenchman) {
                actor.setFlag("ars", "henchman", !isHenchman)
            }
        }
    }

    /**
     * 
     * Remove a party member
     * 
     * @param {*} event 
     */
    async _onRemoveMember(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const li = element.closest("li");
        const actorId = li.dataset.id;
        const index = li.dataset.index;
        // const actor = game.actors.get(actorId);

        const actor = game.party.members.get(actorId);
        game.party.members.delete(actorId);
        // const membersBundle = foundry.utils.deepClone(Object.values(this.getMembers()));
        // membersBundle.splice(index, 1);
        await this.setMembers();

        if (actor && actor.name)
            this.addLogEntry(`Removed ${actor.name} from Party-Tracker`);
        else
            this.addLogEntry(`Removed stale actor from Party-Tracker`);
    }

    /**
     * 
     * General function to add defeated npc award ... used by system when npc is defeated
     * 
     * @param {*} token 
     */
    async addDefeatedAward(token) {
        if (game.user.isGM) {
            console.log("party.js addDefeatedAward", { token });
            if (token.actor.type === 'npc') {
                const dupe = (this.getAwards().filter((awrd) => { return awrd.sourceId === token.id }).length > 0);
                if (!dupe) {
                    const xp = parseInt(token.actor.system.xp.value) || 0;
                    this.addAward(`${token.name} defeated`, xp, token.id);
                } else {
                    console.log("party.js addDefeatedAward same defeated token already exists for ", { token });
                }
            }
        }
    }

    /**
     * 
     * Add an award
     * 
     * @param {*} description 
     * @param {*} xp 
     * @param {*} sourceId (optional)
     */
    async addAward(description, xp, sourceId = null, targetId = null) {
        // console.log("party.js addAward", { description, xp, sourceId });
        const awardsBundle = foundry.utils.deepClone(Object.values(this.getAwards())) || [];
        awardsBundle.push({ date: new Date().toString(), text: description, xp: xp, sourceId: sourceId, targetId: targetId });
        await this.setAwards(awardsBundle);
        this.addLogEntry(`Added ${description}`);
    }

    /**
     * 
     * Write a log of what happened. 
     * 
     * Sometimes you want to await if you're doing a lot 
     * of log entries because it's just an array object and 
     * things get tricky otherwise.
     * 
     * We use it for the central locale for reRender()
     * 
     * @param {*} text 
     */
    async addLogEntry(text) {
        let logBundle = foundry.utils.deepClone(this.getLogs()) || [];
        logBundle.push({ date: new Date().toLocaleString(), text: text });
        await this.setLogs(logBundle);
        this._reRender(true);
    }

    /**
     * 
     * Process a long rest for entire party member list
     * 
     * @param {*} event 
     */
    async partyLongRest(event) {
        event.preventDefault();
        if (await dialogManager.confirm('Longrest for all party members?')) {
            // for (const member of this.getMembers()) {
            for (const actor of this.getMemberArray()) {
                // const actor = game.actors.get(member.id);
                if (actor) await this.longRest(actor);
            }
            const hours_8 = 28800;
            game.time.advance(hours_8);
        }
    }

    /**
     * 
     * Process a long rest for an actor
     * 
     * @param {*} actor 
     */
    async longRest(actor) {
        console.log("party.js longRest:", actor.name)
        actor.longRest();
        await this.addLogEntry(`${actor.name} took a long rest.`);
    }

    /**
     * 
     * Update member entry from actorId
     * 
     * this is called in deriveddata from actor.js as backend way to keep this updated
     * 
     * @param {*} actorId 
     */
    async updateMember(actorId) {
        // if (!game.party?.getMembers().length) return;
        if (!game.party?.members?.size) return;

        this._reRender(true);
    }

    /**
     * 
     * Take all coins from lootedToken to memberSplit()
     * 
     * @param {*} lootedToken 
     */
    async shareLootedCoins(lootedToken) {
        const lootedActor = lootedToken.actor;
        const memberCount = this.getMemberArray().length;
        if (memberCount) {
            let coinDetails = []
            for (const coin in lootedActor.system.currency) {
                const count = parseInt(lootedActor.system.currency[coin]);
                const coinPer = Math.floor(count / memberCount);
                const coinRemainder = (count % memberCount);
                if (count > 0 && coinPer > 0) {
                    await this.memberSplit(coinPer, coin);
                    lootedActor.update({ [`system.currency.${coin}`]: coinRemainder });
                    coinDetails.push(`${coinPer} ${coin}`)
                }
            }
            if (coinDetails.length) {
                const coinText = coinDetails.join(', ');
                // for (const member of this.getMembers()) {
                // for (const [key, actor] of game.party.members) {
                for (const actor of this.getMemberArray()) {
                    // const actor = game.actors.get(member.id);
                    // if (actor) {
                    utilitiesManager.chatMessage(ChatMessage.getSpeaker({ actor: actor }), `Aquired Split Coin`, `${actor.name} received ${coinText} from ${lootedActor.name}.`)
                    await this.addLogEntry(`${actor.name} received ${coinText} from party split from ${lootedActor.name}.`, 'icons/commodities/currency/coins-plain-stack-gold-yellow.webp');
                    // }
                }
            }
        }
    }

    /**
     * 
     * Split count coinType among party members
     * 
     * @param {*} count 
     * @param {*} coinType 
     */
    async memberSplit(coinPer, coinType) {
        // const memberCount = this.getMembers().length;
        // const coinPer = Math.round(count / memberCount);
        // for (const member of this.getMembers()) {
        // for (const [key, actor] of game.party.members) {
        for (const actor of this.getMemberArray()) {
            // const actor = game.actors.get(member.id);
            // if (actor) {
            const current = parseInt(actor.system.currency[coinType]) || 0;
            actor.update({ [`system.currency.${coinType}`]: current + coinPer })
            console.log("party.js memberSplit", { actor, coinPer, current })
            // }
        }
    }

    /**
     * 
     * Advance time of type amount 
     * 
     * @param {*} type 
     * @param {*} amount 
     */
    async _onTimeAdvance(type, amount, skipDialog = false) {
        amount = Math.round(amount);
        const finalAmount = skipDialog ? amount : await dialogManager.getQuantity(-100000, 100000, 1, `How many ${type}s`, `Advance ${type}`, 'Accept', 'Cancel');
        if (finalAmount) {
            let advance = finalAmount;
            switch (type) {
                case 'round':
                    advance = (60 * finalAmount);
                    break;
                case 'turn':
                    advance = (60 * 10) * finalAmount;
                    break;
                case 'hour':
                    advance = (60 * 60) * finalAmount;
                    break;
                case 'day':
                    advance = (60 * 60 * 24) * finalAmount;
                    break;
            }
            console.log("party.js _onTimeAdvance", { type, advance })
            game.time.advance(advance);
        }
    }

    async _onTimeAdvanceCustom(event) {
        // console.log("party.js _onTimeAdvanceCustom", { event });
        const timePassage = await this.getTimePassage(`Passage of TIme`);
        if (timePassage) {
            for (const key in timePassage) {
                // console.log("party.js _onTimeAdvanceCustom", { key }, timePassage[key])
                this._onTimeAdvance(key, timePassage[key], true);
            }
        }
    }

    /**
     * 
     * Dialog to ask for custom time passage values
     * 
     * @param {*} title 
     * @param {*} options 
     * @returns 
     */
    async getTimePassage(title, options = {}) {

        const content = await renderTemplate("systems/ars/templates/dialogs/dialog-getTimePassage.hbs", {
            CONFIG,
        });

        const _onDialogSubmit = (html) => {
            const form = html[0].querySelector("form");
            let round = 0;
            let turn = 0;
            let hour = 0;
            let day = 0;
            round = parseInt(form.round.value);
            turn = parseInt(form.turn.value);
            hour = parseInt(form.hour.value);
            day = parseInt(form.day.value);
            if (isNaN(round)) round = 0;
            if (isNaN(turn)) turn = 0;
            if (isNaN(hour)) hour = 0;
            if (isNaN(day)) day = 0;

            return { round: round, turn: turn, hour: hour, day: day };
        }

        return new Promise(resolve => {
            new Dialog({
                title,
                content,
                buttons: {
                    submit: {
                        label: 'Apply',
                        callback: html => resolve(_onDialogSubmit(html))
                    },
                    cancel: {
                        label: 'None',
                        callback: html => resolve(undefined)
                    }
                },
                close: () => resolve(undefined)
            }, options).render(true);
        });
    }

    /**
     * 
     * Dialog to get all character actors list for selection
     * 
     * @param {*} event 
     * @param {*} text 
     * @param {*} title 
     * @param {*} options 
     * @returns 
     */
    async _getCharacter(text = 'Select Character Actor', title = 'Character Select', options = {}) {
        const _onDialogSubmit = (html) => {
            const form = html[0].querySelector("form");
            const memberId = form.memberAddSelect.value || undefined;
            return memberId;
        }

        const currentMembers = this.getMembers().map(p => p.id)
        // const currentMembers = game.party.members.map(p => p.id);
        console.log("party.js _getCharacter", { currentMembers })
        const characterList = game.actors.filter(act => act.type === 'character' && !currentMembers.includes(act.id));
        console.log("party.js _getCharacter", { characterList })

        const content = await renderTemplate("systems/ars/templates/sidebar/party-dialog-addmember.hbs", {
            text,
            title,
            characterList,
            CONFIG
        });

        return new Promise(resolve => {
            new Dialog({
                title,
                content,
                buttons: {
                    submit: {
                        label: game.i18n.localize("ARS.party.addcharacter"),
                        callback: html => resolve(characterList.length ? _onDialogSubmit(html) : undefined)
                    },
                    cancel: {
                        label: game.i18n.localize("ARS.party.cancel"),
                        callback: html => resolve(undefined)
                    }

                },
                close: () => resolve(undefined)
            }, options).render(true);
        });
    }

    /**
     * 
     * Prompt dialog to add member from dialog list of actors not in party
     * 
     * @param {*} event 
     */
    async _addPartyMember(event) {
        event.preventDefault()
        const newMemberId = await this._getCharacter();
        if (newMemberId)
            this._addMember(game.actors.get(newMemberId));
    }
} // end Sidebar