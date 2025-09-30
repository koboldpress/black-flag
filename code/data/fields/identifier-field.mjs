import { isValidIdentifier } from "../../utils/validation.mjs";

/**
 * Special case StringField that includes automatic validation for identifiers.
 */
export default class IdentifierField extends foundry.data.fields.StringField {
	static get _defaults() {
		// TODO: Remove these defaults so LOCALIZATION_PREFIXES can properly localize identifier fields
		return foundry.utils.mergeObject(super._defaults, {
			label: "BF.Identifier.Label",
			hint: "BF.Identifier.Hint"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_validateType(value) {
		if (!isValidIdentifier(value)) {
			throw new Error(game.i18n.format("BF.Identifier.Error.Invalid", { value }));
		}
	}
}
