import ScaleTypeNumber from "./scale-type-number.mjs";

const { NumberField, StringField } = foundry.data.fields;

/**
 * Scale value data that stores a feature's usage number.
 */
export default class ScaleTypeUsage extends ScaleTypeNumber {
	/** @inheritDoc */
	static defineSchema() {
		return {
			value: new NumberField({ nullable: true, integer: true, min: 0 }),
			per: new StringField({ blank: false, initial: "sr" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				label: "BF.Advancement.ScaleValue.Type.Usage.Label",
				hint: "BF.Advancement.ScaleValue.Type.Usage.Hint",
				input: "usage"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static convertFrom(original, options) {
		let value = parseInt(original.formula);
		if (Number.isNaN(value)) return null;
		if (value < 1) value = 1;
		return new this({ value }, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get display() {
		return `${this.value}/${CONFIG.BlackFlag.recoveryPeriods.localizedAbbreviations[this.per] ?? ""}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get placeholder() {
		const placeholder = super.placeholder;
		placeholder.per = CONFIG.BlackFlag.recoveryPeriods.localized[placeholder.per ?? "sr"] ?? "";
		return placeholder;
	}
}
