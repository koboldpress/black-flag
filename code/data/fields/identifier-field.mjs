import { isValidIdentifier } from "../../utils/validation.mjs";

/**
 * Special case StringField that includes automatic validation for identifiers.
 */
export default class IdentifierField extends foundry.data.fields.StringField {
	static get _defaults() {
		return foundry.utils.mergeObject(super._defaults, {
			label: "BF.Identifier.Label",
			hint: "BF.Identiifer.Hint"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_validateType(value) {
		if (!isValidIdentifier(value)) {
			throw new Error(game.i18n.localize("BF.Identifier.Error.Invalid"));
		}
	}
}
