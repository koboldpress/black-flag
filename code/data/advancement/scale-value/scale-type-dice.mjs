import ScaleTypeString from "./scale-type-string.mjs";

const { NumberField } = foundry.data.fields;

/**
 * Scale value data type that stores dice values.
 */
export default class ScaleTypeDice extends ScaleTypeString {
	/** @inheritDoc */
	static defineSchema() {
		return {
			number: new NumberField({ nullable: true, initial: null, integer: true, positive: true }),
			denomination: new NumberField({ required: true, initial: 6, integer: true, positive: true })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				label: "BF.Advancement.ScaleValue.Type.Dice.Label",
				hint: "BF.Advancement.ScaleValue.Type.Dice.Hint",
				input: "dice"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static convertFrom(original, options) {
		const [number, denomination] = (original.formula ?? "").split("d");
		if (!denomination || !Number.isNumeric(number) || !Number.isNumeric(denomination)) return null;
		return new this({ number: Number(number) || null, denomination: Number(denomination) }, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The die value to be rolled with the leading "d" (e.g. "d4").
	 * @type {string}
	 */
	get die() {
		if (!this.denomination) return "";
		return `d${this.denomination}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get formula() {
		if (!this.denomination) return null;
		return `${this.number ?? ""}${this.die}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get placeholder() {
		const placeholder = super.placeholder;
		placeholder.number ??= "";
		placeholder.denomination = placeholder.denomination ? `d${placeholder.denomination}` : "";
		return placeholder;
	}
}
