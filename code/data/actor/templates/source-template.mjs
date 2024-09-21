import SourceField from "../../fields/source-field.mjs";

const { SchemaField } = foundry.data.fields;

/**
 * Data definition template for armor class.
 *
 * @property {SourceData} source - Source of the creature's stat block.
 * @mixin
 */
export default class SourceTemplate extends foundry.abstract.DataModel {

	/** @override */
	static defineSchema() {
		return {
			description: new SchemaField({
				source: new SourceField()
			})
		};
	}
	
	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare description data during derived data stage.
	 */
	prepareSource() {
		const uuid = this.parent._stats?.compendiumSource ?? this.parent.uuid;
		SourceField.prepareData.call(this.description.source, uuid);
	}
}
