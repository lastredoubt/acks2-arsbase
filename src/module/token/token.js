import * as debug from "../debug.js"
import * as utilitiesManager from "../utilities.js";
import * as effectManager from "../effect/effects.js";
import { ARS } from '../config.js';

/**
 * Token is a PlaceableObject and we need to manipulate certain views of things for it.
 */

export class ARSToken extends Token {

    // #drawNameplate() {
    //     console.log(`ARSToken: -----------------> we are trying this here.`)
    //     const style = this._getTextStyle();
    //     const name = new PreciseText(this.document.getName(), style);
    //     name.anchor.set(0.5, 0);
    //     name.position.set(this.w / 2, this.h + 2);
    //     return name;
    // }

    get hasAura() {
        if (this.document.actor) {
            const auraEffects =
                this.document.actor.getActiveEffects().filter(effect => {
                    return effect.changes.some(changes => {
                        return changes.key.toLowerCase() === 'special.aura';
                    })
                });
            return auraEffects;
        }
        return undefined;
    }

    get isFriendly() {
        return (this.document.disposition == game.ars.const.TOKEN_DISPOSITIONS.FRIENDLY)
    }
    get isNeutral() {
        return (this.document.disposition == game.ars.const.TOKEN_DISPOSITIONS.NEUTRAL)
    }
    get isHostile() {
        return (this.document.disposition == game.ars.const.TOKEN_DISPOSITIONS.HOSTILE)
    }

    /**@override */
    _onUpdate(data, options, userId) {
        // console.log("ARSToken TokenAura _onUpdate", { data, options, userId }, this)
        super._onUpdate(data, options, userId);

        this.updateAuras();
    }

    /**@override */
    async draw() {
        // console.log("ARSToken TokenAura draw", { arguments }, this)
        const d = await super.draw(this, arguments);
        this.auraContainer = this.addChildAt(new PIXI.Container(), 0);
        this.updateAuras()
        return d;
    }

    updateAuras() {
        // console.log("ARSToken TokenAura _updateAuras 1 ===>", this)
        if (this.document?.flags?.ars?.aura) {
            const auraConfig = this.document.flags.ars.aura;
            if (auraConfig) {
                // this._checkAuras();
                if (this.auraContainer?.removeChildren) {
                    this.auraContainer.removeChildren().forEach(a => a.destroy());
                }
                if (auraConfig.isEnabled) {
                    let hasPermission = false;
                    if (!auraConfig.permission || auraConfig.permission === 'all' ||
                        (auraConfig.permission === 'gm' && game.user.isGM)) {
                        hasPermission = true;
                    } else {
                        hasPermission = !!this.document?.actor?.testUserPermission(game.user, auraConfig.permission.toUpperCase());
                    }

                    // console.log("ARSToken TokenAura _updateAuras 2 ===>", { auraConfig, hasPermission })
                    if (hasPermission) {
                        const aura = new TokenAura(this, auraConfig.distance, auraConfig.color, auraConfig.isSquare, auraConfig.opacity);
                        this.auraContainer.addChild(aura);
                    }
                }
            } else {
                // console.log("ARSToken TokenAura _updateAuras NO AURACONFIG", this);
            }
        } else {
            // populate defaults some defaults to avoid recreation issues
            if (this.isOwner)
                this.document.setFlag("ars", "aura", { isEnabled: false, color: '#ffffff', opacity: 0.35, distance: 10, permission: 'gm', });
        }
        this.updateActiveEffectAura();
    }

    updateActiveEffectAura() {
        if (this.document.actor) {
            // get all the aura effects that are active
            const auraEffects =
                this.document.actor?.getActiveEffects().filter(effect => {
                    return effect.changes.some(changes => {
                        return changes.key.toLowerCase() === 'special.aura';
                    })
                });

            // console.log("token.js updateActiveEffectAura", { auraEffects });

            for (const effect of auraEffects) {
                const auraInfo = effectManager.getAuraInfo(effect, this.document);

                let hasPermission = false;
                const permissionLowerCase = auraInfo?.permission?.toLowerCase();
                switch (permissionLowerCase) {
                    case 'all': {
                        hasPermission = true;
                    } break;

                    // case 'gm': {
                    //     hasPermission = game.user.isGM;
                    // } break;

                    case 'owner': {
                        hasPermission = this.actor?.isOwner;
                    } break;

                    default:
                        hasPermission = game.user.isGM; // default is only GM can see
                        break;
                }
                // hasPermission = !!this.document?.actor?.testUserPermission(game.user, auraInfo.permission.toUpperCase());

                // console.log("token.js updateActiveEffectAura", { distance, color, faction, isSquare, opacity })
                // if (auraInfo && (auraInfo.visibleAura || game.user.isGM)) {
                if (auraInfo && hasPermission) {
                    const aura = new TokenAura(this, auraInfo.distance, auraInfo.color, auraInfo.isSquare, auraInfo.opacity);
                    this.auraContainer.addChild(aura);
                }
            }
        } else {
            ui.notifications.error(`Token: ${this.name} does not have an associated actor.`);
        }
    }

    /**
      * DISABLED using Smart-Target mod for now
      * 
      * @override so we can make the "targeted by" DOT larger. 
      * Going it leave this disabled for now, Smart-Target does the same and GMs can use
      * it or not...
      * 
      * Refresh the target indicators for the Token.
      * Draw both target arrows for the primary User and indicator pips for other Users targeting the same Token.
      * @param {ReticuleOptions} [reticule]  Additional parameters to configure how the targeting reticule is drawn.
      * @protected
      */
    // _refreshTarget(reticule) {
    //     this.target.clear();
    //     this.target.removeChildren().forEach(a => a.destroy());

    //     // We don't show the target arrows for a secret token disposition and non-GM users
    //     const isSecret = (this.document.disposition === CONST.TOKEN_DISPOSITIONS.SECRET) && !this.isOwner;
    //     if (!this.targeted.size || isSecret) return;

    //     // Determine whether the current user has target and any other users
    //     const [others, user] = Array.from(this.targeted).partition(u => u === game.user);

    //     // For the current user, draw the target arrows
    //     if (user.length) this._drawTarget(reticule);

    //     // For other users, draw offset pips
    //     const hw = (this.w / 2) + (others.length % 2 === 0 ? 8 : 0);
    //      for (let [i, u] of others.entries()) {
    //         const offset = Math.floor((i + 1) / 2) * 16;
    //         const sign = i % 2 === 0 ? 1 : -1;
    //         const x = hw + (sign * offset);
    //         const tokenImg = u?.character?.img;
    //         this.target.beginFill(Color.from(u.color), 1.0).lineStyle(2, 0x0000000).drawCircle(x, 0, 20);
    //         if (tokenImg) {
    //             const texture = PIXI.Texture.from(tokenImg); // replace 'image_url' with your image's URL

    //             // Create a sprite from the texture
    //             let sprite = new PIXI.Sprite(texture);

    //             // Adjust sprite size if needed
    //             sprite.width = 36; // double the radius
    //             sprite.height = 36; // double the radius

    //             // Set the position
    //             sprite.x = x - sprite.width / 2;  // subtract half the width
    //             sprite.y = 0 - sprite.height / 2; // subtract half the height

    //             // Create a mask
    //             let mask = new PIXI.Graphics();
    //             mask.beginFill(0xffffff);
    //             mask.drawCircle(x, 0, 18);
    //             mask.endFill();

    //             // Assign the mask to the sprite
    //             sprite.mask = mask;

    //             // Then add the sprite and the mask to the stage or any other container
    //             this.target.addChild(sprite);
    //             this.target.addChild(mask);
    //         }
    //     }


    // }


}// end Token

/**
 * Skeleton test for token auras
 */
class TokenAura extends PIXI.Graphics {
    constructor(token, distance, color, isSquare = false, opacity = 0.25) {
        super();

        // console.log("TokenAura constructor", { token, distance, color, isSquare, opacity }, this)

        const squareGrid = canvas.scene.grid.type === 1;
        const dim = canvas.dimensions;
        const unit = dim.size / dim.distance;
        const [cx, cy] = [token.w / 2, token.h / 2];
        const { width, height } = token.document;

        if (distance <= 0) distance = 10;

        // console.log("TokenAura constructor", { squareGrid, dim, unit, cx, cy, width, height })
        let w, h;
        if (isSquare) {
            w = distance * 2 + (width * dim.distance);
            h = distance * 2 + (height * dim.distance);
        } else {
            [w, h] = [distance, distance];

            if (squareGrid) {
                w += width * dim.distance / 2;
                h += height * dim.distance / 2;
            } else {
                w += (width - 1) * dim.distance / 2;
                h += (height - 1) * dim.distance / 2;
            }
        }
        // set w/h
        w *= unit;
        h *= unit;

        this.filters = [this.#createReverseMaskFilter()];

        this.distance = distance;
        this.color = Color.from(color);
        // this.color = color;
        this.isSquare = isSquare;
        // this.source = 'aura';

        this.lineStyle(3, Color.from(color));
        this.beginFill(Color.from(color), opacity);
        if (isSquare) {
            const [x, y] = [cx - w / 2, cy - h / 2];
            this.drawRect(x, y, w, h);
        } else {
            this.drawEllipse(cx, cy, w, h);
        }
        this.endFill();
    }

    // updatePosition(x, y) {
    //     console.log("TokenAura updatePosition", { x, y }, this)
    //     this.position.set(x, y);
    // }

    /**
    * Create the reverse mask filter.
    * @returns {ReverseMaskFilter}  The reference to the reverse mask.
     */
    #createReverseMaskFilter() {
        if (!this.reverseMaskfilter) {
            this.reverseMaskfilter = ReverseMaskFilter.create({
                uMaskSampler: canvas.primary.tokensRenderTexture,
                channel: "a"
            });
            this.reverseMaskfilter.blendMode = PIXI.BLEND_MODES.NORMAL;
        }
        return this.reverseMaskfilter;
    }
}

/**
 * 
 * Extending tokenDocument so that we can filter the TokenConfig
 * dropdown list and block recursion issues
 * 
 * and also override name to hide npc names everywhere
 * 
 */
export class ARSTokenDocument extends TokenDocument {

    get nameRaw() {
        return this.name;
    }

    /**
     * 
     * @returns name processed with some tests
     */
    getName() {
        // console.log("token.js getName() ARSTokenDocument", this)
        if (['npc', 'lootable'].includes(this?.actor?.type)) {
            if (!game.user.isGM && !this.actor.isIdentified) {
                return this.actor?.alias ? this.actor.alias : game.i18n.localize("ARS.unknownActor");
            }
        }
        return this.name;
    }

    prepareDerivedData() {
        super.prepareDerivedData();
        this.name = this.getName();
    }

    /**@override */
    static getTrackedAttributes(data, _path = []) {
        // console.log("getTrackedAttributes START", { data, _path });

        if (!data) {
            data = {};
            for (let model of Object.values(game.system.model.Actor)) {
                foundry.utils.mergeObject(data, model);
            }
        }

        /**
         * we need to filter the data of getTrackedAttributes()
         * otherwise it gets in a recursion loop and have stack error
         * 
         * we NEED to ignore "contains" and "containedIn" but the others are simply
         * to reduce the spam in the resources drop down for Token config
         * 
         */
        // const checkThese = ['attributes', 'abilities', 'details', 'power'];
        const ignoreThese = ['contains', 'containedIn', 'config', 'matrix', 'classes', 'inventory', 'memorizations', 'spellInfo', 'actionInventory', 'gear', 'containers', 'skills', 'weapons', 'spells', 'races', 'rank', 'proficiencies', 'activeClasses', 'armorClass', 'abilityList', 'actionList', 'actions', 'itemActionCount', 'mods', 'actionCount'];

        let reducedData = duplicate(data);
        // delete entries we ignore
        ignoreThese.forEach(entry => { delete reducedData[entry] })
        // console.log("getTrackedAttributes", { reducedData });        
        // cleaned up data, now send to the super.
        return super.getTrackedAttributes(reducedData, _path);
    }

    /**
     * Returns the light settings for a token checking effects
     * 
     * @returns {Object} Light data
     */
    getLightSettings() {
        // Check if the current user is a game master and if the lighting automation is enabled
        const token = this;

        const light = {
            dim: token.actor.prototypeToken.light.dim || 0,
            bright: token.actor.prototypeToken.light.bright || 0,
            angle: token.actor.prototypeToken.light.angle || 0,
            alpha: token.actor.prototypeToken.light.alpha || 0.5,
            color: token.actor.prototypeToken.light.color || '#FFFFFF',
            luminosity: token.actor.prototypeToken.light.luminosity,
            animation: {
                type: token.actor.prototypeToken.light.animation.type || 0,
            }
        };

        // Loop through each active effect on the token's actor
        for (const effect of token.actor.getActiveEffects()) {
            // Loop through each change in the effect
            for (const change of effect.changes) {
                // If the change key is special.light and has a value
                if (change.key === "special.light" && change.value.length) {
                    try {
                        const details = JSON.parse(change.value.toLowerCase());
                        const color = ARS.htmlBasicColors[details.color] ?
                            ARS.htmlBasicColors[details.color] : details.color;
                        const dim = parseInt(details.dim) || 0;
                        const bright = parseInt(details.bright) || dim;
                        const angle = parseInt(details.angle) || 360;
                        const animationType = details.animation || null;
                        const alpha = parseFloat(details.alpha) || null;
                        const luminosity = parseFloat(details.luminosity) || 0;

                        // Update light object properties if the conditions are met
                        // if (light.dim < dim || (light.dim === 0 && dim)) {
                        if (dim) {
                            light.dim = dim;
                            light.bright = bright;
                            light.angle = angle;
                            light.color = color;
                            light.luminosity = isNaN(luminosity) ? token.light.luminosity : luminosity;
                            light.animation.type = animationType ?? '';
                            light.alpha = alpha;
                        }
                    } catch (err) {
                        // Show an error notification if the light data field is formatted incorrectly
                        ui.notifications.error(`[${err}] LIGHT data field "${change.value}" is formatted incorrectly. It must be at least "{color: #htmlcolor, dim: lightrange}".`);
                    }
                }
            }
        }
        return light;
    }
    /**
     * Prepare token with light effects or default for NPC/PC
     * Sets light
     */
    async updateLight() {
        // Check if the current user is a game master and if the lighting automation is enabled
        if (game.user.isGM && game.ars.config.settings.automateLighting) {
            const light = this.getLightSettings();
            // Try to update the token's light properties
            try {
                await this.update({ light });
            } catch (err) {
                // Log a warning if the token update for light fails
                console.warn(`${this.name}'s token update for light failed.`);
            }
        }
    }


    getSightSettings() {
        // Get the token object from the current context
        const token = this;
        // Initialize default vision settings
        const sight = {
            enabled: false,
            range: 0,
            sightAngle: 360,
            visionMode: 'basic',
        };
        let detectionModes = token.actor.prototypeToken.detectionModes;

        // Iterate through active effects on the token's actor
        for (const effect of token.actor.getActiveEffects()) {
            // Iterate through effect changes
            for (const change of effect.changes) {
                // Check if the change affects vision and has a value
                if (change.key === "special.vision" && change.value.length) {
                    const details = JSON.parse(change.value.toLowerCase());

                    try {
                        // Parse change value as JSON
                        const range = parseInt(details.range);
                        const sightAngle = parseInt(details.angle) || 360;
                        const visionMode = details.mode || 'basic';


                        // Update vision settings if the new range is greater
                        if (sight.range < range) {
                            sight.enabled = true;
                            sight.range = range;
                            sight.sightAngle = sightAngle;
                            sight.visionMode = visionMode;
                        }
                    } catch (err) {
                        // Show error notification if the change value is not formatted correctly
                        ui.notifications.error(`VISION data field "${change.value}" is formatted incorrectly. It must be at least "sightRange#"`);
                    }

                    const effectDetectionModes = details.detectionmodes || undefined;
                    if (effectDetectionModes) {
                        detectionModes = effectDetectionModes;
                    }
                }
            }
        }

        // If no vision changes were found in the active effects
        if (!sight.enabled) {
            // Helper function to set vision settings from the actor's prototype token
            function setSight(actor) {
                sight.enabled = actor.prototypeToken.sight.enabled;
                sight.range = actor.prototypeToken.sight.range;
                sight.sightAngle = actor.prototypeToken.sight.angle;
                sight.visionMode = actor.prototypeToken.sight.visionMode;
            }

            let visionRange = 0;

            // Handle NPC vision settings
            if (token.actor.type === 'npc') {
                const visionCheck = `${token.actor.system?.specialDefenses} ${token.actor.system?.specialAttacks}`;
                const [match, ...remain] = visionCheck.match(/vision (\d+)/i) || [];
                visionRange = match ? parseInt(remain[0]) : 0;

                if (visionRange) {
                    sight.enabled = true;
                    sight.range = visionRange;
                } else {
                    setSight(token.actor);
                }
                // Handle character vision settings
            } else if (token.actor.type === 'character') {
                setSight(token.actor);
            }
        }
        return [sight, detectionModes];
    }
    /**
    * Update token vision based on effects applied
    */
    async updateSight() {
        // If the user is not the game master, exit early
        if (game.user.isGM && game.ars.config.settings.automateVision) {
            const [sight, detectionModes] = this.getSightSettings();
            // Check if the actor has the 'blind' status effect
            const blind = this.actor.hasStatusEffect('blind');

            // If the actor is not blind, update the token's vision settings
            if (!blind) {
                try {
                    await this.update({ sight, detectionModes });
                    // await this.update({ detectionModes });
                } catch (err) {
                    console.warn(`${this.name}'s token update for vision failed. ${err}`);
                }
            }

        }
    }


    /**
     * //BUG:
     * This doesn't work perfectly with tokens that are not scale/size 1:1. Anything above/below and it skews
     * some distances but I'm not sure why.
     * 
     * Get the distance to a token
     * 
     * @param {TokenDocument} tokenDocument 
     * @returns {Number} The distance between the tokens
     * 
     */
    getDistance(tokenDocument = undefined, positions = undefined) {
        const sourceDocument = this;
        // console.log("token.js getDistance", { sourceDocument, tokenDocument })
        if (!tokenDocument) {
            ui.notifications.error(`token.js getDistance() requires tokenDocument target [${tokenDocument}]`)
            return {}
        }

        const sourceToken = sourceDocument.object;
        const targetToken = tokenDocument.object;

        // gridsize (5/10/etc)
        const gridDistance = canvas.scene.grid.distance;
        // pixels per grid (50/100/200/etc)
        const gridSize = canvas.scene.grid.size;
        // types of grid unit, (ft/mile/yard/etc)
        const gridUnits = canvas.scene.grid.units;

        // // figure out the size of the tokens so we can account for it's space
        const sourceDisplacement = (Math.max(sourceDocument.height, sourceDocument.width) / 2);
        const targetDisplacement = (Math.max(tokenDocument.height, tokenDocument.width) / 2);

        const tokenDisplacement = sourceDisplacement + targetDisplacement;
        let tokenSpace = tokenDisplacement * gridSize;

        const sourceCenter = positions ? positions.source.center : sourceToken.center
        const targetCenter = positions ? positions.target.center : targetToken.center
        const ray = new Ray(sourceCenter, targetCenter);

        // console.log({ sourceToken, targetToken, positions }, `token.js Center ${sourceToken.name}: X:${sourceCenter.x} Y:${sourceCenter.y} and ${targetToken.name}: X:${targetCenter.x} Y:${targetCenter.y}`);

        // const ray = new Ray(sourceCenter, targetCenter);

        let nx = Math.abs(ray.dx);
        let ny = Math.abs(ray.dy);

        // Determine the number of straight and diagonal moves
        let nd = Math.min(nx, ny);
        let ns = Math.abs(ny - nx);
        // let lineDistance = (nd + ns);
        let rayDistance = Math.abs(ray.dx);
        // let rayDistance = (nd + ns);
        let range = rayDistance > 0 ? rayDistance - tokenSpace : 0;
        let tokenReduction = tokenSpace;
        // angles are slightly different, so if nx is < than ny, we adjust
        if (nd < ny) {
            ns = Math.abs(ny - nd);
            tokenReduction = tokenSpace - nx;
            range = ns - tokenReduction;
        }

        // const rayDistance = Math.abs(ray.dx);
        const between = range > 0 ? Math.floor((range / gridSize) * gridDistance) : 0;
        if (game.ars?.config?.settings?.debugMode)
            console.log(`Distance between ${sourceToken.name} and ${targetToken.name} is ${between} ${gridUnits}`);
        return between;
    }

    /**
     * Check for aura on token and then any token around it if it needs to apply
     * any changes.* entries on an effect that starts with aura.* will be applied
     * to relevant faction it affects.
     */
    async checkForAuras(hookData = undefined) {
        if (['character', 'npc'].includes(this?.actor?.type)) {
            if (game.ars?.config?.settings?.debugMode)
                console.log("token.js checkForAuras START->", { hookData }, this.name, this)
            for (const tokenObj of canvas.tokens?.placeables) {
                const token = tokenObj.document;
                const allEffects = token.actor?.getActiveEffects();
                const auraEffects =
                    allEffects.filter(effect => {
                        return effect.changes.some(changes => {
                            return changes.key.toLowerCase() === 'special.aura';
                        })
                    });

                // console.log("token.js checkForAuras", { token, actor, allEffects, auraEffects });
                for (const t of canvas.tokens?.placeables) {
                    for (const effect of auraEffects) {
                        // this doesnt really help, positions need to also be dealt with in checkForDanglingAuraEffects()
                        await this.auraManagement(token, t, effect);
                    }

                }; // canvas
                // now check to clean any effects left over from deletion/modifications to aura effect
                await tokenObj.document.checkForDanglingAuraEffects();
            }
        }
    }

    async auraManagement(token, t, effect, positions = undefined) {
        if (!token || !t) return;

        const sourceAuraUUID = effect.uuid;
        const auraInfo = effectManager.getAuraInfo(effect);
        // console.log("token.js auraManagement", { effect, auraInfo })
        if (auraInfo) {
            // if token.object.center doesn't exist, the token is probably being/deleted or loaded in another scene
            const tokenDistance = token?.object?.center ? token.getDistance(t.document, positions) : Infinity;
            // console.log("token.js auraManagement", { tokenDistance })

            // check that token disposition matches what aura is suppose to effect and they are in the aura 
            if ((auraInfo.faction === 'all' || t.document.disposition === auraInfo.disposition) && tokenDistance < auraInfo.distance) {
                if (game.ars?.config?.settings?.debugMode)
                    console.log(`token.js auraManagement) ${t.document.name} is within ${token.name}'s aura ${tokenDistance}<=${auraInfo.distance} for effect ${effect.name}`, { token, t, effect, auraInfo })
                //Check that effect isnt applied already
                if (!t.document.actor.effects.some(e => { return (e.getFlag("ars", "sourceAuraUUID") === sourceAuraUUID) })) {

                    // get any effect that starts with ^aura.* so we can apply them for this aura
                    // strip out ^aura. and leave the rest
                    const auraChanges = effect.changes
                        .filter(c => c.key.toLowerCase().startsWith("aura."))
                        .map(oC => {
                            const aC = duplicate(oC);
                            aC.key = aC.key.toLowerCase()?.replace(/^aura\./, "");
                            return aC;
                        });

                    // create effect with relevant "changes" entries.
                    const auraEffects = await t.document.actor.createEmbeddedDocuments("ActiveEffect", [{
                        flags: {
                            core: {},
                            ars: {
                                sourceAuraUUID: sourceAuraUUID,
                            }
                        },
                        label: `AURA:${effect.name}`,
                        icon: effect.icon,
                        origin: `${token.actor.uuid}`,
                        "duration.startTime": game.time.worldTime,
                        transfer: false,
                        "changes": auraChanges,
                    }], { parent: t.document.actor });
                } else {
                    // token already had the effect
                }

            } else {
                // token out of aura, remove effects that were applied
                const matchingIds = t.document.actor?.effects.filter(e => { return e.getFlag("ars", "sourceAuraUUID") === sourceAuraUUID }).map(e => e.id);
                // console.log(`token.js checkForAuras matchingIds for ${t.document.name}`, { matchingIds })
                if (matchingIds.length) {
                    console.log("token.js auraManagement out of AURA REMOVE", { matchingIds })
                    await t.document.actor.deleteEmbeddedDocuments("ActiveEffect", matchingIds);
                }
            }
        }
    }

    /**
     * Check for any effects applied from a Aura that are no longer active (happens on delete effect/actor/token)
     * @param {*} t 
     */
    async checkForDanglingAuraEffects() {
        const auraAppliedEffects = this.actor.effects.filter(e => { return e.getFlag("ars", "sourceAuraUUID") });
        // console.log(`token.js checkForDanglingAuraEffects`, this.name, { auraAppliedEffects })
        if (auraAppliedEffects.length) {
            // console.log("token.js checkForDanglingAuraEffects", { auraAppliedEffects })
            for (const ae of auraAppliedEffects) {
                // console.log("token.js checkForDanglingAuraEffects", { ae }, ae.flags.ars.sourceAuraUUID)
                // if (ae.flags.ars.sourceAuraUUID) {
                const effectFromUUID = await fromUuid(ae.flags.ars.sourceAuraUUID)
                // console.log("token.js checkForDanglingAuraEffects", this.name, { effectFromUUID })
                if (!effectFromUUID || (effectFromUUID.disabled || effectFromUUID.isSuppressed)) {
                    // console.log(`token.js checkForDanglingAuraEffects removing AE`, this.name, { ae }, ae.uuid)
                    await this.actor.deleteEmbeddedDocuments("ActiveEffect", [ae.id]).catch(err => console.log(`Cleanup of ${ae.id}: ${err}`));
                } else if (effectFromUUID) {
                    const object = effectFromUUID.parent;
                    if (['npc', 'character'].includes(object.type)) {
                        const token = object.getToken();
                        if (token != this)
                            await this.auraManagement(token, this.object, effectFromUUID);
                    }
                }
                // }
            }
        }
    }


    /**
     * The function `updateEncumbranceStatus` is responsible for controlling encumbrance status on an actor.
     * It can either apply a new status effect if necessary, or remove any existing encumbrance effects.
     *
     * @param {boolean} disable - A boolean parameter to decide whether to disable the update or not. Default is `false`.
     */
    updateEncumbranceStatus(disable = false) {
        const shouldUpdate = disable || game.ars.config.settings.automateEncumbrance;
        if (!shouldUpdate) return;

        // `encumbranceState` holds the current encumbrance state of the actor
        const encumbranceState = this.actor.encumbrance;

        // `tokenObj` is the object that we are operating on
        const tokenObj = this.object;

        const hasValidTokenAndState = !disable && tokenObj && encumbranceState && encumbranceState !== 'unencumbered';

        if (hasValidTokenAndState) {
            const encumbranceName = `encumbrance-${encumbranceState}`;
            this.applyStatusEffect(encumbranceName, tokenObj);
            this.removeOtherEffects(encumbranceName, tokenObj);
        } else if (disable || tokenObj) {
            // If actor doesn't have any encumbrance state, remove all encumbrance effects
            this.removeAllEffects(tokenObj);
        }
    }

    /**
     * Helper function to apply status effect if it's not already active on the actor.
     *
     * @param {string} statusId - Name of the encumbrance.
     * @param {object} tokenObj - The object to apply the status on.
     */
    applyStatusEffect(statusId, tokenObj) {
        if (!this.actor.hasStatusEffect(statusId)) {
            const status = CONFIG.statusEffects.find(effect => effect.id === statusId);
            if (status) {
                tokenObj.toggleEffect(status, { overlay: false, active: true });
            }
        }
    }

    /**
     * Helper function to remove other status effects apart from the one we are applying.
     *
     * @param {string} statusId - Name of the encumbrance to skip.
     * @param {object} tokenObj - The object to remove the statuses from.
     */
    removeOtherEffects(statusId, tokenObj) {
        ARS.statusEffects.forEach(effect => {
            if (effect.id !== statusId && this.actor.hasStatusEffect(effect.id)) {
                this.removeEffect(effect.id, tokenObj);
            }
        });
    }

    /**
     * Helper function to remove a specific effect from a token object.
     *
     * @param {string} statusId - Id of the effect to remove.
     * @param {object} tokenObj - The object to remove the status from.
     */
    removeEffect(statusId, tokenObj) {
        const statusToRemove = CONFIG.statusEffects.find(effect => effect.id === statusId);
        if (statusToRemove) {
            tokenObj.toggleEffect(statusToRemove, { overlay: false, active: false });
        }
    }

    /**
     * Helper function to remove all status effects from a token object.
     *
     * @param {object} tokenObj - The object to remove the statuses from.
     */
    removeAllEffects(tokenObj) {
        ARS.statusEffects.forEach(effect => {
            if (this.actor.hasStatusEffect(effect.id)) {
                this.removeEffect(effect.id, tokenObj);
            }
        });
    }


}// end TokenDocument

export class ARSTokenLayer extends TokenLayer {
    /**
     * 
     * This override is to push pack versions be dropped into folder called "Map Drops"
     * and to prevent it from making multiple copies there of the same creature (use local if id exists)
     * -cel
     * 
     * The bulk of this is copy/paste from foundry.js otherwise
     * 
     * @param {*} event 
     * @param {*} data 
     * @returns 
     */
    async _onDropActorData(event, data) {
        // console.log("overrides.js _onDropActorData", { event, data });

        // Ensure the user has permission to drop the actor and create a Token
        if (!game.user.can("TOKEN_CREATE")) {
            return ui.notifications.warn(`You do not have permission to create new Tokens!`);
        }

        //** new code -cel
        let actor = await game.actors.get(data.id);
        //** end new code -cel

        // Acquire dropped data and import the actor
        if (!actor) actor = await Actor.implementation.fromDropData(data);
        if (!actor.isOwner) {
            return ui.notifications.warn(`You do not have permission to create a new Token for the ${actor.name} Actor.`);
        }
        if (actor.compendium) {
            const actorData = game.actors.fromCompendium(actor);
            // actor = await Actor.implementation.create(actorData);
            //** new piece -cel
            actor = await Actor.implementation.create({ ...actorData, id: data.id, _id: data.id }, { keepId: true });
            const dumpfolder = await utilitiesManager.getFolder("Map Drops", "Actor");
            // console.log("overrides.js _onDropActorData", { dumpfolder });
            // actor.update({ 'folder': dumpfolder.id });
            // without the delay see .hud errors
            const _timeout = setTimeout(() => actor.update({ 'folder': dumpfolder.id }), 300);
            //** end new piece -cel
        }

        // Prepare the Token data
        const td = await actor.getTokenDocument({ x: data.x, y: data.y, hidden: event.altKey });

        // Bypass snapping
        if (event.shiftKey) td.updateSource({
            x: td.x - (td.width * canvas.grid.w / 2),
            y: td.y - (td.height * canvas.grid.h / 2)
        });

        // Otherwise, snap to the nearest vertex, adjusting for large tokens
        else {
            const hw = canvas.grid.w / 2;
            const hh = canvas.grid.h / 2;
            td.updateSource(canvas.grid.getSnappedPosition(td.x - (td.width * hw), td.y - (td.height * hh)));
        }
        // Validate the final position
        if (!canvas.dimensions.rect.contains(td.x, td.y)) return false;

        // Submit the Token creation request and activate the Tokens layer (if not already active)
        this.activate();
        // const cls = getDocumentClass("Token");
        // return cls.create(td, { parent: canvas.scene });
        return td.constructor.create(td, { parent: canvas.scene });
    }
}

