import ScaleValueConfigurationData from "./scale-value/scale-value-data.mjs";

const { ObjectField } = foundry.data.fields;

/**
 * Data model for the Scale Value advancement type.
 *
 * @property {object} scale - Sparse scale value data for each level.
 */
export class SpellcastingValueConfigurationData extends ScaleValueConfigurationData {
	/** @inheritDoc */
	static defineSchema() {
		return {
			scale: new ObjectField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Type of data represented by this scale value.
	 * @type {string}
	 */
	get type() {
		return "number";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Migrations           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		Object.values(source.scale ?? {}).forEach(v => CONFIG.Advancement.types.scaleValue.dataTypes.number.migrateData(v));
	}
}
