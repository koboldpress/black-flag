import IdentifierField from "./identifier-field.mjs";

/**
 * Field that references a registered document via its identifier. When loaded the field will be replaced with
 * the cached version of the document.
 */
export default class RegisteredDocumentField extends IdentifierField {
	constructor(type, options={}) {
		super(options);
		this.type = type;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item type that is referenced by this field.
	 * @type {string}
	 */
	type;

	/* <><><><> <><><><> <><><><> <><><><> */

	_cast(value) {
		if ( typeof value === "string" ) return value;
		return value.identifier;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	initialize(value, model, options={}) {
		return () => CONFIG.BlackFlag.registration.get(this.type, value);
	}
}
