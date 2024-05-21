import { numberFormat } from "../../../utils/_module.mjs";
import ScaleTypeNumber from "./scale-type-number.mjs";

const { StringField } = foundry.data.fields;

/**
 * Scale value data type that stores distance values.
 */
export default class ScaleValueTypeDistance extends ScaleTypeNumber {
	/** @inheritDoc */
	static defineSchema() {
		return {
			...super.defineSchema(),
			units: new StringField({ initial: "foot", label: "BF.Distance.Unit.Label" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				label: "BF.Advancement.ScaleValue.Type.Distance.Label",
				hint: "BF.Advancement.ScaleValue.Type.Distance.Hint",
				input: "distance"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get display() {
		const unit = CONFIG.BlackFlag.distanceUnits[this.units ?? "foot"];
		return numberFormat(this.value, { unit });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get placeholder() {
		const placeholder = super.placeholder;
		placeholder.units = CONFIG.BlackFlag.distanceUnits.localized[placeholder.units] ?? "";
		return placeholder;
	}
}
