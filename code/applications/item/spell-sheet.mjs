import { filteredKeys } from "../../utils/_module.mjs";
import BaseItemSheet from "./api/base-item-sheet.mjs";

/**
 * Item sheet responsible for displaying spell items.
 */
export default class SpellSheet extends BaseItemSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["spell"],
		position: {
			width: 600,
			height: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);

		if (foundry.utils.hasProperty(submitData, "system.components.required")) {
			submitData.system.components.required = filteredKeys(submitData.system.components.required);
		}

		if (foundry.utils.hasProperty(submitData, "system.tags")) {
			submitData.system.tags = filteredKeys(submitData.system.tags);
		}

		return submitData;
	}
}
