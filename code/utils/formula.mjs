
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

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Reduce a formula to the minimum number of unique terms.
 * @param {string} formula - The original formula.
 * @param {object} [options={}]
 * @param {boolean} [options.preserveFlavor=false] - Preserve flavor text.
 * @returns {string}
 */
export function simplifyFormula(formula, { preserveFlavor=false }={}) {
	const RollTerm_ = game.release.generation < 12 ? RollTerm : foundry.dice.terms.RollTerm;

	// Create a new roll and verify that the formula is valid before attempting simplification.
	let roll;
	try { roll = new Roll(formula); }
	catch(err) { console.warn(`Unable to simplify formula '${formula}': ${err}`); }
	Roll.validate(roll.formula);

	// Optionally strip flavor annotations.
	if ( !preserveFlavor ) roll.terms = Roll.parse(roll.formula.replace(RollTerm_.FLAVOR_REGEXP, ""));

	// Perform arithmetic simplification on the existing roll terms.
	roll.terms = _simplifyOperatorTerms(roll.terms);

	// If the formula contains multiplication or division we cannot easily simplify
	if ( /[*/]/.test(roll.formula) ) {
		if ( roll.isDeterministic && !/d\(/.test(roll.formula) && (!/\[/.test(roll.formula) || !preserveFlavor) ) {
			return Roll.safeEval(roll.formula).toString();
		}
		else return roll.constructor.getFormula(roll.terms);
	}

	// Flatten the roll formula and eliminate string terms.
	roll.terms = _expandParentheticalTerms(roll.terms);
	roll.terms = Roll.simplifyTerms(roll.terms);

	// Group terms by type and perform simplifications on various types of roll term.
	let { poolTerms, diceTerms, mathTerms, numericTerms } = _groupTermsByType(roll.terms);
	numericTerms = _simplifyNumericTerms(numericTerms ?? []);
	diceTerms = _simplifyDiceTerms(diceTerms ?? []);

	// Recombine the terms into a single term array and remove an initial + operator if present.
	const simplifiedTerms = [diceTerms, poolTerms, mathTerms, numericTerms].flat().filter(Boolean);
	if ( simplifiedTerms[0]?.operator === "+" ) simplifiedTerms.shift();
	return roll.constructor.getFormula(simplifiedTerms);
}

/* -------------------------------------------- */

/**
 * A helper function to perform arithmetic simplification and remove redundant operator terms.
 * @param {RollTerm[]} terms - An array of roll terms.
 * @returns {RollTerm[]} - A new array of roll terms with redundant operators removed.
 */
function _simplifyOperatorTerms(terms) {
	const OperatorTerm_ = game.release.generation < 12 ? OperatorTerm : foundry.dice.terms.OperatorTerm;

	return terms.reduce((acc, term) => {
		const prior = acc[acc.length - 1];
		const ops = new Set([prior?.operator, term.operator]);

		// If one of the terms is not an operator, add the current term as is.
		if ( ops.has(undefined) ) acc.push(term);

		// Replace consecutive "+ -" operators with a "-" operator.
		else if ( (ops.has("+")) && (ops.has("-")) ) acc.splice(-1, 1, new OperatorTerm_({ operator: "-" }));

		// Replace double "-" operators with a "+" operator.
		else if ( (ops.has("-")) && (ops.size === 1) ) acc.splice(-1, 1, new OperatorTerm_({ operator: "+" }));

		// Don't include "+" operators that directly follow "+", "*", or "/". Otherwise, add the term as is.
		else if ( !ops.has("+") ) acc.push(term);

		return acc;
	}, []);
}

/* -------------------------------------------- */

/**
 * A helper function for combining unannotated numeric terms in an array into a single numeric term.
 * @param {object[]} terms - An array of roll terms.
 * @returns {object[]} - A new array of terms with unannotated numeric terms combined into one.
 */
function _simplifyNumericTerms(terms) {
	const NumericTerm_ = game.release.generation < 12 ? NumericTerm : foundry.dice.terms.NumericTerm;
	const OperatorTerm_ = game.release.generation < 12 ? OperatorTerm : foundry.dice.terms.OperatorTerm;

	const simplified = [];
	const { annotated, unannotated } = _separateAnnotatedTerms(terms);

	// Combine the unannotated numerical bonuses into a single new NumericTerm.
	if ( unannotated.length ) {
		const staticBonus = Roll.safeEval(Roll.getFormula(unannotated));
		if ( staticBonus === 0 ) return [...annotated];

		// If the staticBonus is greater than 0, add a "+" operator so the formula remains valid.
		if ( staticBonus > 0 ) simplified.push(new OperatorTerm_({ operator: "+"}));
		simplified.push(new NumericTerm_({ number: staticBonus} ));
	}
	return [...simplified, ...annotated];
}

/* -------------------------------------------- */

/**
 * A helper function to group dice of the same size and sign into single dice terms.
 * @param {object[]} terms - An array of DiceTerms and associated OperatorTerms.
 * @returns {object[]} - A new array of simplified dice terms.
 */
function _simplifyDiceTerms(terms) {
	const Coin_ = game.release.generation < 12 ? Coin : foundry.dice.terms.Coin;
	const Die_ = game.release.generation < 12 ? Die : foundry.dice.terms.Die;
	const OperatorTerm_ = game.release.generation < 12 ? OperatorTerm : foundry.dice.terms.OperatorTerm;

	const { annotated, unannotated } = _separateAnnotatedTerms(terms);

	// Split the unannotated terms into different die sizes and signs
	const diceQuantities = unannotated.reduce((obj, curr, i) => {
		if ( curr instanceof OperatorTerm_ ) return obj;
		const face = curr.constructor?.name === "Coin" ? "c" : curr.faces;
		const key = `${unannotated[i - 1].operator}${face}`;
		obj[key] = (obj[key] ?? 0) + curr.number;
		return obj;
	}, {});

	// Add new die and operator terms to simplified for each die size and sign
	const simplified = Object.entries(diceQuantities).flatMap(([key, number]) => ([
		new OperatorTerm_({ operator: key.charAt(0) }),
		key.slice(1) === "c"
			? new Coin_({ number: number })
			: new Die_({ number, faces: parseInt(key.slice(1)) })
	]));
	return [...simplified, ...annotated];
}

/* -------------------------------------------- */

/**
 * A helper function to extract the contents of parenthetical terms into their own terms.
 * @param {object[]} terms - An array of roll terms.
 * @returns {object[]} - A new array of terms with no parenthetical terms.
 */
function _expandParentheticalTerms(terms) {
	const NumericTerm_ = game.release.generation < 12 ? NumericTerm : foundry.dice.terms.NumericTerm;
	const ParentheticalTerm_ = game.release.generation < 12 ? ParentheticalTerm : foundry.dice.terms.ParentheticalTerm;

	terms = terms.reduce((acc, term) => {
		if ( term instanceof ParentheticalTerm_ ) {
			if ( term.isDeterministic ) term = new NumericTerm_({ number: Roll.safeEval(term.term) });
			else {
				const subterms = new Roll(term.term).terms;
				term = _expandParentheticalTerms(subterms);
			}
		}
		acc.push(term);
		return acc;
	}, []);
	return _simplifyOperatorTerms(terms.flat());
}

/* -------------------------------------------- */

/**
 * A helper function to group terms into PoolTerms, DiceTerms, MathTerms, and NumericTerms.
 * MathTerms are included as NumericTerms if they are deterministic.
 * @param {RollTerm[]} terms - An array of roll terms.
 * @returns {object} - An object mapping term types to arrays containing roll terms of that type.
 */
function _groupTermsByType(terms) {
	const DiceTerm_ = game.release.generation < 12 ? DiceTerm : foundry.dice.terms.DiceTerm;
	const FunctionTerm_ = game.release.generation < 12 ? MathTerm : foundry.dice.terms.FunctionTerm;
	const NumericTerm_ = game.release.generation < 12 ? NumericTerm : foundry.dice.terms.NumericTerm;
	const OperatorTerm_ = game.release.generation < 12 ? OperatorTerm : foundry.dice.terms.OperatorTerm;

	// Add an initial operator so that terms can be rearranged arbitrarily.
	if ( !(terms[0] instanceof OperatorTerm_) ) terms.unshift(new OperatorTerm_({ operator: "+" }));

	return terms.reduce((obj, term, i) => {
		let type;
		if ( term instanceof DiceTerm_ ) type = DiceTerm_;
		else if ( (term instanceof FunctionTerm_) && (term.isDeterministic) ) type = NumericTerm_;
		else type = term.constructor;
		const key = `${type.name.charAt(0).toLowerCase()}${type.name.substring(1)}s`;

		// Push the term and the preceding OperatorTerm.
		(obj[key] = obj[key] ?? []).push(terms[i - 1], term);
		return obj;
	}, {});
}

/* -------------------------------------------- */

/**
 * A helper function to separate annotated terms from unannotated terms.
 * @param {object[]} terms - An array of DiceTerms and associated OperatorTerms.
 * @returns {Array | Array[]} - A pair of term arrays, one containing annotated terms.
 */
function _separateAnnotatedTerms(terms) {
	const OperatorTerm_ = game.release.generation < 12 ? OperatorTerm : foundry.dice.terms.OperatorTerm;

	return terms.reduce((obj, curr, i) => {
		if ( curr instanceof OperatorTerm_ ) return obj;
		obj[curr.flavor ? "annotated" : "unannotated"].push(terms[i - 1], curr);
		return obj;
	}, { annotated: [], unannotated: [] });
}
