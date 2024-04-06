/**
 * @typedef {StringFieldOptions} FormulaFieldOptions
 * @property {boolean} [deterministic=false] - Is this formula not allowed to have dice values?
 */

/**
 * Special case StringField which represents a formula.
 *
 * @param {FormulaFieldOptions} [options={}] - Options which configure the behavior of the field.
 * @property {boolean} deterministic=false - Is this formula not allowed to have dice values?
 */
export default class FormulaField extends foundry.data.fields.StringField {
	static get _defaults() {
		return foundry.utils.mergeObject(super._defaults, {
			deterministic: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_validateType(value) {
		if (this.options.deterministic) {
			const roll = new Roll(value);
			if (!roll.isDeterministic) throw new Error("must not contain dice terms");
			Roll.safeEval(roll.formula);
		} else Roll.validate(value);
		super._validateType(value);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*      Active Effect Application      */
	/* <><><><> <><><><> <><><><> <><><><> */

	_bfCastDelta(value) {
		return this._cast(value).trim();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_bfApplyAdd(actor, change, current, delta, changes) {
		if (!current) {
			changes[change.key] = delta;
			return;
		}
		let operator = "+";
		if (delta.startsWith("+")) {
			delta = delta.replace("+", "").trim();
		} else if (delta.startsWith("-")) {
			delta = delta.replace("-", "").trim();
			operator = "-";
		}
		changes[change.key] = `${current} ${operator} ${delta}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_bfApplyMultiply(actor, change, current, delta, changes) {
		if (!current) {
			changes[change.key] = delta;
			return;
		}
		const terms = new Roll(current).terms;
		if (terms.length > 1) changes[change.key] = `(${current}) * ${delta}`;
		else changes[change.key] = `${current} * ${delta}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_bfApplyUpgrade(actor, change, current, delta, changes) {
		if (!current) {
			changes[change.key] = delta;
			return;
		}
		const terms = new Roll(current).terms;
		if (terms.length === 1 && terms[0].fn === "max") {
			changes[change.key] = current.replace(/\)$/, `, ${delta})`);
		} else changes[change.key] = `max(${current}, ${delta})`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_bfApplyDowngrade(actor, change, current, delta, changes) {
		if (!current) {
			changes[change.key] = delta;
			return;
		}
		const terms = new Roll(current).terms;
		if (terms.length === 1 && terms[0].fn === "min") {
			changes[change.key] = current.replace(/\)$/, `, ${delta})`);
		} else changes[change.key] = `min(${current}, ${delta})`;
	}
}
