import ScaleTypeString from "./scale-type-string.mjs";

const { NumberField } = foundry.data.fields;

/**
 * Scale value data type that stores numeric values.
 */
export default class ScaleTypeNumber extends ScaleTypeString {
	static defineSchema() {
		return {
			value: new NumberField({ required: true })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				label: "BF.Advancement.ScaleValue.Type.Number.Label",
				hint: "BF.Advancement.ScaleValue.Type.Number.Hint",
				input: "number"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	static convertFrom(original, options) {
		const value = Number(original.formula);
		if (Number.isNaN(value)) return null;
		return new this({ value }, options);
	}
}
