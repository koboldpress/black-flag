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
	/** @inheritDoc */
	static get _defaults() {
		return foundry.utils.mergeObject(super._defaults, {
			deterministic: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_validateType(value) {
		if (this.options.deterministic) {
			const roll = new Roll(value);
			if (!roll.isDeterministic) throw new Error("must not contain dice terms");
			Roll.safeEval(roll.formula);
		} else Roll.validate(value);
		super._validateType(value);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*  Form Field Integration             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	toFormGroup(groupConfig = {}, inputConfig = {}) {
		groupConfig.classes ||= [];
		groupConfig.classes.push("formula-input");
		return super.toFormGroup(groupConfig, inputConfig);
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	_toInput(config) {
		const input = super._toInput(config);
		if (input.tagName !== "INPUT") return input;
		config.value ??= this.getInitialValue({}) ?? "";
		return foundry.applications.elements.HTMLFormulaInputElement.create(config);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*      Active Effect Application      */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_castChangeDelta(delta) {
		return this._cast(delta).trim();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_applyChangeAdd(value, delta, model, change) {
		if (!value) return delta;
		const operator = delta.startsWith("-") ? "-" : "+";
		delta = delta.replace(/^[+-]/, "").trim();
		return `${value} ${operator} ${delta}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_applyChangeSubtract(value, delta, model, change) {
		if (!value) return `-(${delta})`;
		return `${value} - (${delta})`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_applyChangeMultiply(value, delta, model, change) {
		if (!value) return value;
		if (new Roll(value).terms.length > 1) value = `(${value})`;
		if (new Roll(delta).terms.length > 1) delta = `(${delta})`;
		return `${value} * ${delta}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_applyChangeUpgrade(value, delta, model, change) {
		if (!value) return delta;
		const terms = new Roll(value).terms;
		if (terms.length === 1 && terms[0].fn === "max") return value.replace(/\)$/, `, ${delta})`);
		return `max(${value}, ${delta})`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_applyChangeDowngrade(value, delta, model, change) {
		if (!value) return delta;
		const terms = new Roll(value).terms;
		if (terms.length === 1 && terms[0].fn === "min") return value.replace(/\)$/, `, ${delta})`);
		return `min(${value}, ${delta})`;
	}
}
