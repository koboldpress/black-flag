import ScaleTypeNumber from "./scale-type-number.mjs";

const { NumberField, StringField } = foundry.data.fields;

/**
 * Scale value data that stores a feature's usage number.
 */
export default class ScaleTypeUsage extends ScaleTypeNumber {
	static defineSchema() {
		return {
			value: new NumberField({required: true, initial: 1, integer: true, positive: true}),
			per: new StringField({required: true, blank: false, initial: "sr"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		label: "BF.Advancement.ScaleValue.Type.Usage.Label",
		hint: "BF.Advancement.ScaleValue.Type.Usage.Hint"
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */

	static convertFrom(original, options) {
		let value = parseInt(original.formula);
		if ( Number.isNaN(value) ) return null;
		if ( value < 1 ) value = 1;
		return new this({value}, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get display() {
		return `${this.value}/${CONFIG.BlackFlag.recoveryPeriods[this.per]}`;
	}
}
