/**
 * Log a console message with the "Black Flag" prefix and styling.
 * @param {string} message - Message to display.
 * @param {object} [options={}]
 * @param {string} [options.color="#1874B3"] - Color to use for the log.
 * @param {string} [options.level="log"] - Console logging method to call.
 */
export default function log(message, {color="#1874B3", level="log"}={}) {
	console[level](`%cBlack Flag | %c${message}`, `color: ${color}; font-variant: small-caps`, `color: ${color}`);
}
