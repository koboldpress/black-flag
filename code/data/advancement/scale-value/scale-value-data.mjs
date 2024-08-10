const { ObjectField, StringField } = foundry.data.fields;

/**
 * Data model for the Scale Value advancement type.
 *
 * @property {object} scale - Sparse scale value data for each level.
 * @property {string} type - Type of data represented by this scale value.
 */
export default class ScaleValueConfigurationData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			scale: new ObjectField(),
			type: new StringField({
				initial: "string",
				label: "BF.Advancement.ScaleValue.Type.Label"
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Migrations           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		Object.values(source.scale ?? {}).forEach(v =>
			CONFIG.Advancement.types.scaleValue.dataTypes[source.type]?.migrateData(v)
		);
	}
}
