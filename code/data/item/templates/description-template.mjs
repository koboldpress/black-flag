import SourceField from "../../fields/source-field.mjs";

const { HTMLField, SchemaField } = foundry.data.fields;

/**
 * Data definition template for Items with descriptions.
 *
 * @property {object} description
 * @property {string} description.value - Main description for the item.
 * @property {SourceField} description.source - The item's source.
 */
export default class DescriptionTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new SourceField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate source data to an object.
	 * @param {object} source - The candidate source data from which the model will be constructed.
	 */
	static migrateSource(source) {
		if ( foundry.utils.getType(source.description?.source) === "string" ) {
			source.description.source = { fallback: source.description.source };
		}
	}
}
