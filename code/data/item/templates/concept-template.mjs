import { IdentifierField } from "../../fields/_module.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition template for Concept items (class, background, lineage, heritage).
 */
export default class ConceptTemplate extends foundry.abstract.DataModel {

	static get metadata() {
		return {
			register: true
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.FullLabel", hint: "BF.Item.Description.FullHint"}),
				short: new StringField({label: "BF.Item.Description.ShortLabel", hint: "BF.Item.Description.ShortHint"}),
				journal: new StringField({label: "BF.Item.Journal.Label", hint: "BF.Item.Journal.Hint"}),
				source: new StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			identifier: new SchemaField({
				value: new IdentifierField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of the traits to display on the item sheet.
	 * @type {object[]}
	 * @abstract
	 */
	get traits() {
		return [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create one or more advancement documents when this item is created.
	 * @param {object[]} data - Initial data for advancement documents. Must include "type".
	 * @internal
	 */
	_createInitialAdvancement(data) {
		const advancement = {};
		for ( const initialData of data ) {
			const AdvancementClass = CONFIG.Advancement.types[initialData.type].documentClass;
			if ( !initialData._id ) initialData._id = foundry.utils.randomID();
			advancement[initialData._id] = new AdvancementClass(initialData, { parent: this.parent }).toObject();
		}
		this.parent.updateSource({"system.advancement": advancement});
	}
}
