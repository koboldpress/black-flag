const { ObjectField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data model for the Scale Value advancement type.
 *
 * @property {string} type - Type of data represented by this scale value.
 * @property {object} scale - Sparse scale value data for each level.
 * @property {object} item
 * @property {string} [item.uuid] - UUID of an item associated with this scale value.
 */
export default class ScaleValueConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			type: new StringField({
				initial: "string", label: "BF.Advancement.ScaleValue.Type.Label"
			}),
			scale: new ObjectField(),
			item: new SchemaField({
				uuid: new StringField({
					label: "BF.Advancement.ScaleValue.Item.Label", hint: "BF.Advancement.ScaleValue.Item.Hint"
				}) // TODO: Replace with UUIDField when available
			})
		};
	}

	/* -------------------------------------------- */

	// static migrateData(source) {
	// 	super.migrateData(source);
	// 	Object.values(source.scale ?? {})
	// 		.forEach(v => CONFIG.Advancement.types.scaleValue.dataTypes[source.type].migrateData(v));
	// }
}
