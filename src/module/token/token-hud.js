import * as debug from "../debug.js";

/**
 * 
 * On select bring up action hud
 * 
 * @param {Token} token 
 * @param {Boolean} selected 
 * @returns 
 */
export async function actionsHUD(token, selected) {
    // console.log("hooks.js actionsHUD START", { token, selected }, canvas.tokens.controlled.length)

    // const tokenElement = document.querySelector(`[data-token-uuid="${token.document.uuid}"]`);

    // clean up any/all action buttons
    const _cleanPrevious = () => {
        const allfloatingwindow = document.querySelectorAll("#floatingHudWindow");
        for (const floatingHud of allfloatingwindow) {
            floatingHud.remove();
        }
    };

    // not selected token, see if the action hud is for them and if so remove it
    if (canvas.tokens.controlled.length > 1 || !selected) {
        const ele = document.querySelector('.action-buttons-menu');
        const uuid = ele?.dataset?.tokenUuid || null;
        if (token.document.uuid == uuid) {
            _cleanPrevious();
        }
        if (!canvas.tokens.controlled.length || canvas.tokens.controlled.length > 1) {
            _cleanPrevious();
        }
        return;
    }

    const actor = token?.actor;

    if (!actor || (!actor.isOwner && !game.user.isGM)) return;


    // see if previous actions exist and if so remove them
    _cleanPrevious();

    const hudButtonDisplay = await renderTemplate("systems/ars/templates/actor/hud/hud-mini.hbs",
        {
            actor: actor,
            system: actor.system,
            actions: actor.system.actions,
            actionList: actor.system.actionList,
            actionCount: Object.keys(actor.system.actionList).length
        });

    // Create the floating window element
    // const interfaceSection = document.getElementById('interface');
    const floatingHudWindow = document.createElement('div');
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    const hudWidth = 600;
    const hudHeight = 50;
    let hudBottomPosition, hudLeftPostiion;
    //position the floating hud above the macro bar
    if (game.settings.get("ars", "floatingHudStaticPosition")) {
        const hudBottomOffset = 100;
        const element = document.getElementById('ui-bottom');
        const position = element.getBoundingClientRect();

        hudBottomPosition = position.top - hudBottomOffset;
        hudLeftPostiion = position.left;
        const [hudBottom, hudLeft] = game.user?.getFlag("ars", "floatingHud") || [undefined, undefined];
        if (hudBottom || hudLeft) {
            // if previous setting is good, we use it, otherwise we use default
            if (hudLeft > 0 && hudLeft + 100 < viewportWidth &&
                hudBottom + 100 < viewportHeight) {
                hudBottomPosition = hudBottom;
                hudLeftPostiion = hudLeft;
            }
        }
    } else {
        // position the hud below the selected token
        const tokenWidth = Math.round(token.w * canvas.stage.scale.x),
            tokenHeight = Math.round(token.h * canvas.stage.scale.y),
            left = Math.round(token.worldTransform.tx),
            top = Math.round(token.worldTransform.ty),
            right = left + tokenWidth,
            bottom = top + tokenHeight;

        const tokenHudOffset = 35;
        hudBottomPosition = bottom + tokenHudOffset;
        hudLeftPostiion = left;

        //to far down
        if ((bottom + tokenHudOffset) > viewportHeight) {
            hudBottomPosition = top + tokenHudOffset;
        }
        //to far left
        if (left < 0) {
            hudLeftPostiion = right;
        }
        //to far right
        if (left + 100 > viewportWidth) {
            hudLeftPostiion = Math.round(viewportWidth / 2);
        }
        //
    }

    // console.log("token-hud.js", { left, right, top, bottom, viewportHeight, viewportWidth })
    floatingHudWindow.id = 'floatingHudWindow';
    floatingHudWindow.classList.add('action-buttons-menu');
    floatingHudWindow.setAttribute('data-token-uuid', token.document.uuid);
    // floatingHudWindow.style.display = 'flex';
    // floatingHudWindow.style.position = 'absolute';
    floatingHudWindow.style.width = `${hudWidth}px`;
    floatingHudWindow.style.height = `${hudHeight}px`;
    floatingHudWindow.style.zIndex = '100';
    floatingHudWindow.style.setProperty('left', `${hudLeftPostiion}px`);
    floatingHudWindow.style.setProperty('top', `${hudBottomPosition}px`);

    // Add the floating window to the document
    document.body.appendChild(floatingHudWindow);
    // interfaceSection.appendChild(floatingHudWindow);
    // add dragbutton
    const dragHandle = document.createElement('div');
    dragHandle.classList.add('floating-hud-drag-handle');
    const dragicon = document.createElement('i')
    dragicon.classList.add('fas');
    dragicon.classList.add('fa-grip-horizontal');
    dragHandle.appendChild(dragicon);
    floatingHudWindow.appendChild(dragHandle);

    // add button windows
    const allButtons = document.createElement('div');
    allButtons.classList.add('flexrow');
    allButtons.style.setProperty('flex-grow', `0`);
    allButtons.style.setProperty('flex-wrap', `wrap`);
    allButtons.style.setProperty('justify-content', `center`);
    allButtons.style.setProperty('align-items', `flex-start`);
    allButtons.style.setProperty('align-content', `center`);
    allButtons.innerHTML = hudButtonDisplay;
    //
    floatingHudWindow.appendChild(allButtons);

    // manage dragging window around
    let isDragging = false;
    let mouseX = 0;
    let mouseY = 0;
    let windowX = 0;
    let windowY = 0;
    dragHandle.addEventListener('mousedown', function (event) {
        isDragging = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
        windowX = parseFloat(getComputedStyle(floatingHudWindow).left);
        windowY = parseFloat(getComputedStyle(floatingHudWindow).top);
    });
    document.addEventListener('mousemove', function (event) {
        if (isDragging) {
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            floatingHudWindow.style.left = `${windowX + deltaX}px`;
            floatingHudWindow.style.top = `${windowY + deltaY}px`;
            game.user.setFlag("ars", "floatingHud", [windowY + deltaY, windowX + deltaX]);
        }
    });
    document.addEventListener('mouseup', function (event) {
        isDragging = false;
    });
    ///

    //listeners for button clicks
    // weapon/skills
    const chatCardRoll = floatingHudWindow.querySelectorAll(".chatCard-roll");
    chatCardRoll.forEach(chatCard => {
        chatCard.addEventListener("click", event => {
            actor.sheet._itemChatRoll.bind(actor.sheet)(event);
        });
        // chatCard.addEventListener("contextmenu", function (event) { actor.sheet.combatItemContext });
    });

    // memslots
    const spellCardRoll = floatingHudWindow.querySelectorAll(".spellCard-roll");
    spellCardRoll.forEach(spellCard => {
        spellCard.addEventListener("click", event => {
            actor.sheet._itemChatRoll.bind(actor.sheet)(event)
        });
    });

    // actions
    const actionCardRoll = floatingHudWindow.querySelectorAll(".actionCard-roll");
    actionCardRoll.forEach(actionCard => {
        actionCard.addEventListener("click", event => {
            actor.sheet._actionChatRoll.bind(actor.sheet)(event)
        });
    });
}