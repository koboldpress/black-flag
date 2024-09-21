import SourceField from "../../fields/source-field.mjs";

const { HTMLField, SchemaField } = foundry.data.fields;

/**
 * Data definition template for Items with descriptions.
 *
 * @property {object} description
 * @property {SourceData} description.source - The item's source.
 * @property {string} description.value - Main description for the item.
 */
export default class DescriptionTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			description: new SchemaField({
				source: new SourceField(),
				value: new HTMLField({ label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint" })
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
		// Added 0.9.031
		if ( foundry.utils.getType(source.description?.source) === "string" ) {
			source.description.source = { fallback: source.description.source };
		}
	}
	
	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare description data during derived data stage.
	 */
	prepareDescription() {
		const uuid = this.parent.flags[game.system.id]?.sourceId ??
			this.parent._stats?.compendiumSource ?? this.parent.uuid;
		SourceField.prepareData.call(this.description.source, uuid);
	}
}
