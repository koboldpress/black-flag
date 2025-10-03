import { isValidIdentifier } from "../../utils/validation.mjs";

/**
 * Special case StringField that includes automatic validation for identifiers.
 */
export default class IdentifierField extends foundry.data.fields.StringField {
	static get _defaults() {
		return foundry.utils.mergeObject(super._defaults, {
			allowType: false,
			// TODO: Remove these label & hint defaults so LOCALIZATION_PREFIXES can properly localize identifier fields
			label: "BF.Identifier.Label",
			hint: "BF.Identifier.Hint"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_validateType(value) {
		if (!isValidIdentifier(value, { allowType: this.allowType })) {
			throw new Error(game.i18n.format("BF.Identifier.Error.Invalid", { value }));
		}
	}
}
