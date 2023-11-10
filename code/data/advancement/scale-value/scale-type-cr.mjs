import ScaleTypeNumber from "./scale-type-number.mjs";

const { NumberField } = foundry.data.fields;

/**
 * Scale value data type that stores challenge ratings.
 */
export default class ScaleTypeCR extends ScaleTypeNumber {
	static defineSchema() {
		return {
			value: new NumberField({required: true, min: 0})
			// TODO: Add CR validator
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		label: "BF.Advancement.ScaleValue.Type.CR.Label",
		hint: "BF.Advancement.ScaleValue.Type.CR.Hint"
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */

	get display() {
		let value = super.display;
		switch ( this.value ) {
			case 0.125: value = "&frac18;";
			case 0.25: value = "&frac14;";
			case 0.5: value = "&frac12;";
		}
		return game.i18n.format("BF.ChallengeRating.Specific", { value });
	}
}
