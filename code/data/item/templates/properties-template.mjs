const { SetField, StringField } = foundry.data.fields;

/**
 * Data definition template for Items with properties.
 *
 * @property {Set<string>} properties  List of applied properties.
 */
export default class PropertiesTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			properties: new SetField(new StringField(), {label: "BF.Property.Label[other]"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Properties that can be applied to this object.
	 * @type {object}
	 */
	get validProperties() {
		const validProperties = CONFIG.BlackFlag[`${this.parent.type}Properties`];
		if ( !validProperties ) return {};
		return Object.entries(CONFIG.BlackFlag.itemProperties.localized).reduce((obj, [k, l]) => {
			if ( validProperties.includes(k) ) obj[k] = l;
			return obj;
		}, {});
	}
}
