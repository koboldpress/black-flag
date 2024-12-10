const { SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition template for actors with size & auto-sizing tokens.
 *
 * @property {object} traits
 * @property {object} traits.size - Creature size.
 */
export default class SizeTemplate extends foundry.abstract.DataModel {

	/** @override */
	static defineSchema() {
		return {
			traits: new SchemaField({
				size: new StringField({ label: "BF.Size.Label" })
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _preCreateSize(data, options, user) {
		if ( !foundry.utils.hasProperty(data, "prototypeToken.width")
			&& !foundry.utils.hasProperty(data, "prototypeToken.height")) {
			const size = CONFIG.BlackFlag.sizes[this.traits.size]?.scale;
			this.parent.updateSource({ "prototypeToken.width": size, "prototypeToken.height": size });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _preUpdateSize(changed, options, user) {
		const newSize = foundry.utils.getProperty(changed, "system.traits.size");
		if ( !newSize || (newSize === this.traits.size) ) return;

		if ( !foundry.utils.hasProperty(changed, "prototypeToken.width")
			&& !foundry.utils.hasProperty(changed, "prototypeToken.height") ) {
			const size = CONFIG.BlackFlag.sizes[newSize]?.scale;
			foundry.utils.setProperty(changed, "prototypeToken.width", size);
			foundry.utils.setProperty(changed, "prototypeToken.height", size);
		}
	}
}
