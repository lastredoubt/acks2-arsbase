
/**
 * 
 * Log if in debug mode
 * 
 * @param  {...any} args 
 * 
 */
export function log(...args) {
    // console.log("debug.js log", game.ars.config.settings.debugMode);
    if (game.ars?.config.settings.debugMode) {
        const caller_line = (new Error).stack.split("\n");
        // const fromLine = caller_line[2].match(/([^\/]+)$/)
        // console.log(`DEBUG|${fromLine}`, ...args);
        console.log(`DEBUG|${caller_line[2]}`, ...args);
    }
}