/**
 * 
 * Dicer object to simplify data in attack/damage functions
 * 
 */
import * as utilitiesManager from "../utilities.js";
import * as debug from "../debug.js";
export class ARSDicer {
    constructor() {
        // super(...args);
    } // constructor

    /**
     * 
     * Data used during dice functions, rolling save/attack/damage/etc
     * 
     * @param {*} param0 
     * @param {*} param1 
     * @returns 
     */
    static create(
        {
            event = null,
            sourceActor = null,
            sourceToken = null,
            targetToken = null,
            sourceItem = null,
            sourceAction = null,

            dmgFormulas = [],
            rolled = [],
            dmgDone = [],
            roll = null,
        },
        {
            isDamage = true,
            isCastSpell = false,
            forceLarge = false,
            isWeapon = false,
            isAction = false,

            acLocation = 'normal',
            dmgAdjustment = 'normal',
            situational = undefined,

            flavor = '',

            slotIndex = -1,
            slotType = null,
            slotLevel = -1,

            label = '',
            formula = '',

            targetNumber = '',
            rollAscending = true,
            rollDecending = false,
        }
    ) {
        const dd = new ARSDicer();

        dd.options = {
            isDamage: isDamage,
            isWeapon: isWeapon,
            isAction: isAction,
            isCastSpell: isCastSpell,
            forceLarge: forceLarge,

            acLocation: acLocation,
            dmgAdjustment: dmgAdjustment,

            situational: situational,

            flavor: flavor,

            slotIndex: slotIndex,
            slotType: slotType,
            slotLevel: slotLevel,

            label: label,
            formula: formula,

            targetNumber: targetNumber,
            rollAscending: rollAscending,
            rollDecending: rollDecending,
        };

        dd.data = {
            event: event,

            sourceActor: sourceActor,
            sourceToken: sourceToken,
            // used for damage functions, not atk
            targetToken: targetToken,

            sourceItem: sourceItem,
            sourceAction: sourceAction,

            targets: game.user.targets || undefined,

            dmgFormulas: dmgFormulas,
            rolled: rolled,
            dmgDone: dmgDone,
            roll: roll,
        };

        return dd;
    } // create

    // options
    get slotIndex() {
        return this.options.slotIndex;
    }
    get slotType() {
        return this.options.slotType;
    }
    get slotLevel() {
        return this.options.slotLevel
    }
    get label() {
        return this.options.label;
    }
    get formula() {
        return this.options.formula;
    }
    get ac() {
        return this.options.acLocation;
    }
    get dmgAdj() {
        return this.options.dmgAdjustment;
    }
    get situational() {
        return this.options.situational;
    }
    get rollMode() {
        return this.options.situational?.rollMode;
    }
    get isDamage() {
        return this.options.isDamage;
    }
    get isCastSpell() {
        return this.options.isCastSpell;
    }
    get flavor() {
        return this.options.flavor;
    }


    //data
    get event() {
        return this.data.event;
    }
    get source() {
        return this.data.sourceActor;
    }

    get target() {
        return this.data.targetToken;
    }
    get targetActor() {
        if (this.data.targetToken) {
            return this.data.targetToken.actor;
        } else {
            return null;
        }
    }
    get item() {
        return this.data.sourceItem;
    }
    get action() {
        return this.data.sourceAction;
    }
    get targets() {
        return this.data.targets;
    }

    get dmgFormulas() {
        return this.data.dmgFormulas;
    }
    //other
    get hasTarget() {
        if (this.data.targetToken) {
            return true;
        } else {
            return false;
        }
    }
    get hasTargets() {
        return (this.data.targets.size > 0);
    }
    get isWeapon() {
        return this.data.sourceItem ? this.data.sourceItem.type === 'weapon' : false;
    }
}
//----------------------------------------------------------------------------

