/**
 * Replace referenced data attributes in the roll formula with values from the provided data.
 * If the attribute is not found in the provided data, adds a warning to the provided messages array.
 * @param {string} formula - The original formula within which to replace.
 * @param {object} data - The data object which provides replacements.
 * @param {object} [error={}]
 * @param {NotificationsCollection} [error.notifications] - Collection to which any errors will be logged.
 * @param {string} [error.key] - Key under which an error will be filed.
 * @param {string} [error.message] - Localization key for the message to display in case of missing errors.
 * @param {object} [error.messageData={}] - Additional data passed to message generation.
 * @returns {string} - Formula with replaced data.
 */
export function replaceFormulaData(formula, data, {
	notifications, key, message="BF.Formula.Warning.MissingReference", messageData={}, ...notificationData
}={}) {
	const dataRgx = new RegExp(/@([a-z.0-9_-]+)/gi);
	const missingReferences = new Set();

	formula = formula.replace(dataRgx, (match, term) => {
		const value = foundry.utils.getProperty(data, term);
		if ( value == null ) {
			missingReferences.add(match);
			return "0";
		}
		return String(value).trim();
	});

	if ( (missingReferences.size > 0) && notifications ) notifications.set(key, {
		level: "error", ...notificationData, message: game.i18n.format(message, {
			...messageData, references: game.i18n.getListFormatter({ style: "long", type: "conjunction" })
				.format(missingReferences)
		})
	});

	return formula;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Convert a bonus value to a simple integer for displaying on the sheet.
 * @param {number|string|null} bonus - Bonus formula.
 * @param {object} [data={}] - Data to use for replacing @ strings.
 * @returns {number} - Simplified bonus as an integer.
 */
export function simplifyBonus(bonus, data={}) {
	if ( !bonus ) return 0;
	if ( Number.isNumeric(bonus) ) return Number(bonus);
	try {
		const roll = new Roll(bonus, data);
		return roll.isDeterministic ? Roll.safeEval(roll.formula) : 0;
	} catch(error) {
		console.error(error);
		// TODO: Report errors using the document notifications system
		return 0;
	}
}
