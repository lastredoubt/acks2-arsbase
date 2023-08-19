import { ARSItem } from "./item/item.js";
import * as chatManager from "./chat.js";
import * as utilitiesManager from "./utilities.js";
import * as debug from "./debug.js";

/**
 * 
 * This scans compendiums and world spells and places them into game.ars.library.packs.items.*
 * for use in various spell lists
 * 
 */
export async function buildPackItemList() {
    console.log("Building pack items list for game.ars.library.packs.items", { game });
    const packItems = await utilitiesManager.getPackItems('Item', game.user.isGM);
    game.ars.library['packs'] = { items: packItems };
    console.log("Pack items list built as game.ars.library.packs.items", { packItems });
}

export default async function () {
    game.ars.library = {
        const: {
            location: {
                CARRIED: 'carried',
                EQUIPPED: 'equipped',
                NOCARRIED: 'nocarried',
            }
        }
    }

    buildPackItemList();
}

