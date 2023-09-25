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
