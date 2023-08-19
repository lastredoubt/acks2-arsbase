/**
 * 
 * Handlebars helpers
 * 
 */
export default function () {
    /**
     * Example use if handlebars #if
     * 
     * {{#if (or (eq data.type "potion") (eq data.type "decoction"))}} 
     * 
     */



    // If you need to add Handlebars helpers, here are a few useful examples:
    Handlebars.registerHelper('or', (a, b) => {
        return a || b;
    }
    );

    Handlebars.registerHelper('getDmgIcon', (dmgType) => {
        let idx = Object.keys(CONFIG.ARS.dmgTypeIcons).find(k => (k === dmgType));
        return CONFIG.ARS.dmgTypeIcons[idx];
    }
    );

    Handlebars.registerHelper('concat', function () {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper('checklength', function (v1, v2, options) {
        'use strict';

        if (typeof v1 === 'object') {
            const vTest = Object.values(v1);
            if (vTest.length > v2) {
                return options.fn(this);
            }
        } else {
            if (v1.length > v2) {
                return options.fn(this);
            }

        }

        return options.inverse(this);
    });

    /**
     * Does the object contain any of these items.
     */
    Handlebars.registerHelper('includes', function (data, content, options) {
        let contents = undefined

        if (content.match("(\|\|)")) {
            contents = content.split("\|\|");
        } else {
            contents = [content];
        }
        for (let word of contents) {
            if (data === word) {
                // console.log("includes", "FOUND IN CONTENTS", contents);
                return options.fn(this);
            }
        }
        // console.log("includes", "NOT FOUND IN CONTENTS", contents);
        return options.inverse(this);
    });

    Handlebars.registerHelper('math', function (lvalue, operator, rvalue) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);

        switch (operator) {
            case "+": return lvalue + rvalue;
            case "-": return lvalue - rvalue;
            case "*": return lvalue * rvalue;
            case "/": return lvalue / rvalue;
            default: return null;
        }
    });

    Handlebars.registerHelper('sum', function () {
        return Array.prototype.slice.call(arguments, 0, -1).reduce((acc, num) => acc += num);
    });

    Handlebars.registerHelper('localizekey', function (data, content, options) {
        // console.log("localizekey", { data, content, options });
        const result = data[content] || "";
        return (game.i18n.localize(result));
    });

    Handlebars.registerHelper('for', function (from, to, incr, block) {
        var accum = '';
        for (var i = from; i < to; i += incr) {
            block.data.forindex = i;
            accum += block.fn(i);
        }
        return accum;
    });

    // Handlebars.registerHelper('length', function (aList) {
    //     return (aList.length || 0);
    // });

    /**
     * Does the object contains ALL of these list of objects
     * 
     */
    Handlebars.registerHelper('contains', function (data, content, options) {
        let bFound = false;
        let contents = undefined

        if (content.match("(\&\&)")) {
            contents = content.split("\&\&");
        } else {
            contents = [content];
        }
        for (let word of contents) {
            if (data === word) {
                bFound = true;
            } else {
                // missing a word, end and false
                bFound = false;
                break;
            }
        }

        if (bFound) {
            // console.log("includes", "FOUND ALL CONTENTS", contents);
            return options.fn(this);
        } else {
            // console.log("includes", "NOT FOUND IN CONTENTS", contents);
            return options.inverse(this);
        }
    });

    /**
     * Capitalize the first letter handlebars helper
     */
    Handlebars.registerHelper('capfirst', function (str) {
        if (typeof str !== "string") return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    });

    Handlebars.registerHelper('allcaps', function (str) {
        if (typeof str !== "string") return str;
        return str.toUpperCase();
    });

    /** used to cleanup vars used in class="" entries */
    Handlebars.registerHelper('removedots', function (str) {
        if (typeof str !== "string") return str;

        try {
            const result = str.replace(/\./g, '_');
            return result;
        } catch (err) {
            return `handlebars.js removedots error: ${err}`;
        }

    });
    /**
     * Concat handlebars helper
     * 
     * {{#each system.abilities as |ability key|}}
     * <label>{{localize (concat "systemName.abilities." key)}}</label>
     * {{/each}}
     * 
     */
    Handlebars.registerHelper('concat', function () {
        var arg = Array.prototype.slice.call(arguments, 0);
        arg.pop();
        return arg.join('');
    });

    // if equals (ignore case if string)
    Handlebars.registerHelper('ifeq', function (a, b, options) {
        if (typeof a === 'string' && typeof b === 'string') {
            if (a.toLowerCase() == b.toLowerCase()) { return options.fn(this); }
        } else
            if (a == b) { return options.fn(this); }
        return options.inverse(this);
    });

    // if not equals (ignore case if string)
    Handlebars.registerHelper('ifnoteq', function (a, b, options) {
        if (typeof a === 'string' && typeof b === 'string') {
            if (a.toLowerCase() != b.toLowerCase()) { return options.fn(this); }
        } else if (a != b) { return options.fn(this); }
        return options.inverse(this);
    });

    /** (getproperty item.system. 'protection.ac') */
    Handlebars.registerHelper('getproperty', function (data, varpath) {
        if (data && varpath) {
            try {
                const value = getProperty(data, varpath);
                return value;
            } catch (err) {
                return `handlebars.js getproperty error: ${err}`;
            }
        }
        return `handlebars.js getproperty error: data or varpath missing`;
    });

    //example: #if (and @root.actor.needsInitiative @root.game.ars.config.settings.initiativeUseSpeed)}}
    Handlebars.registerHelper('and', function (a, b) {
        return a && b;
    });
}