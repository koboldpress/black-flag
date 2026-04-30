import { defaultUnit, formatDistance } from "../../../utils/_module.mjs";
import BaseDataModel from "../../abstract/base-data-model.mjs";
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
			unit: new StringField({ initial: () => defaultUnit("distance"), label: "BF.UNITS.DISTANCE.Label" })
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
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get display() {
		return formatDistance(this.value, this.unit ?? defaultUnit("distance"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get placeholder() {
		const placeholder = super.placeholder;
		placeholder.unit = CONFIG.BlackFlag.distanceUnits.localized[placeholder.unit] ?? "";
		return placeholder;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		BaseDataModel._migrateObjectUnits(source);
		return source;
	}
}
