const { ObjectField, StringField } = foundry.data.fields;

/**
 * Data model for the Scale Value advancement type.
 *
 * @property {string} type - Type of data represented by this scale value.
 * @property {object} scale - Sparse scale value data for each level.
 */
export default class ScaleValueConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			type: new StringField({
				initial: "string", label: "BF.Advancement.ScaleValue.Type.Label"
			}),
			scale: new ObjectField()
		};
	}

	/* -------------------------------------------- */

	// static migrateData(source) {
	// 	super.migrateData(source);
	// 	Object.values(source.scale ?? {})
	// 		.forEach(v => CONFIG.Advancement.types.scaleValue.dataTypes[source.type].migrateData(v));
	// }
}
