import AdvancementDataModel from "../../abstract/advancement-data-model.mjs";

const { ObjectField, StringField } = foundry.data.fields;

/**
 * Data model for the Scale Value advancement type.
 *
 * @property {object} scale - Sparse scale value data for each level.
 * @property {string} type - Type of data represented by this scale value.
 */
export default class ScaleValueConfigurationData extends AdvancementDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Advancement.ScaleValue"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static defineSchema() {
		return {
			scale: new ObjectField(),
			type: new StringField({ required: true, blank: false, initial: "string" })
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		Object.values(source.scale ?? {}).forEach(v =>
			CONFIG.Advancement.types.scaleValue.dataTypes[source.type]?.migrateData(v)
		);
		return source;
	}
}
