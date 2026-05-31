import { Trait } from "../../../utils/_module.mjs";

const { BooleanField, HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition template for items that can be identified.
 *
 * @property {object} unidentified
 * @property {string} unidentified.description - Alternate description to use for item when unidentified.
 * @property {string} unidentified.name - Alternate name to use for item when unidentified.
 * @property {boolean} unidentified.value - Current unidentified status for this item.
 */
export default class IdentifiableTemplate extends foundry.abstract.DataModel {
	/** @override */
	static defineSchema() {
		return {
			unidentified: new SchemaField({
				description: new HTMLField(),
				name: new StringField(),
				value: new BooleanField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can this item be identified?
	 * @type {boolean}
	 */
	get identifiable() {
		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this item currently identified?
	 * @type {boolean}
	 */
	get identified() {
		return !this.identifiable || !this.unidentified.value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the unidentified name for the item.
	 */
	prepareIdentifiable() {
		if ( !this.identified && this.unidentified.name ) {
			this.parent.name = this.unidentified.name;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * If no unidentified name or description are set when the item is marked as unidentified,
	 * then fetch values from base item if possible.
	 * @param {object} changes - The candidate changes to the Document.
	 * @param {object} options - Additional options which modify the update request.
	 * @param {BaseUser} user - The User requesting the document update.
	 */
	async _preUpdateIdentifiable(changes, options, user) {
		if ( !foundry.utils.hasProperty(changes, "system.unidentified.value") || !changes.system.unidentified?.value ) {
			return;
		}

		const fetchName = !foundry.utils.getProperty(changes, "system.unidentified.name") && !this.unidentified.name;
		const fetchDesc = !foundry.utils.getProperty(changes, "system.unidentified.description")
			&& !this.unidentified.description;
		if ( !fetchName && !fetchDesc ) return;

		let baseItem;
		const trait = this.constructor.proficiencyCategory;
		if ( trait ) baseItem = await Trait.getLinkedItem(this.type?.base, { fullItem: fetchDesc, trait });

		// If a base item is set, fetch that and use its name/description
		if ( baseItem ) {
			if ( fetchName ) {
				foundry.utils.setProperty(changes, "system.unidentified.name", _loc(
					"BF.IDENTIFIABLE.DefaultName", { type: baseItem.name }
				));
			}
			if ( fetchDesc ) {
				foundry.utils.setProperty(changes, "system.unidentified.description", baseItem.system.description.value);
			}
			return;
		}

		// Otherwise, set the name to match the item type
		if ( fetchName ) foundry.utils.setProperty(changes, "system.unidentified.name", _loc(
			"BF.IDENTIFIABLE.DefaultName", { type: _loc(CONFIG.Item.typeLabels[this.parent.type]) }
		));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Toggle the identified status of this item.
	 */
	async toggleIdentification() {
		await this.parent.update({ "system.unidentified.value": this.identified });
	}
}
