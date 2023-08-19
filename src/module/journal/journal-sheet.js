import * as utilitiesManager from "../utilities.js";
import * as debug from "../debug.js"

/**
 * 
 * DISABLED for now, v10 issues, rumor has it they are adding drag/drop from header :)
 * 
 * We extend this so we can manipulate the template and add the drag-link
 * 
 */
export class ARSJournalSheet extends JournalSheet {

    /** @inheritdoc */
    get template() {
        if (this._sheetMode === "image") return ImagePopout.defaultOptions.template;
        return "systems/ars/templates/journal/journal-sheet.hbs";
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        let _dragLinkHandler = event => {
            event.dataTransfer.setData("text/plain", JSON.stringify({
                type: this.object.documentName,
                pack: this.object.pack,
                id: this.object.id,
                uuid: this.object.uuid,
            }));
        };
        html.find('#drag-link').each((i, draglink) => {
            draglink.setAttribute("draggable", true);
            draglink.addEventListener("dragstart", _dragLinkHandler, false);
        });

    }

}
