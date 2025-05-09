import BaseItemSheet from "./api/base-item-sheet.mjs";

/**
 * Item sheet responsible for displaying features and talents.
 */
export default class FeatureSheet extends BaseItemSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["feature"],
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

		// Figure out where to save the value of Feature Type
		if (this.item.type === "feature" && foundry.utils.hasProperty(submitData, "system.type.category")) {
			const category = foundry.utils.getProperty(submitData, "system.type.category");
			const type = foundry.utils.getProperty(submitData, "system.type.value");
			let identifier = foundry.utils.getProperty(submitData, "system.identifier.associated");
			const categoryConfig = CONFIG.BlackFlag.featureCategories[category];
			const typeConfig = categoryConfig?.children?.[type];

			// If no type config, set type to blank
			if (!typeConfig) {
				identifier ??= type;
				foundry.utils.setProperty(submitData, "system.type.value", "");
			}

			const validSources = CONFIG.BlackFlag.registration.groupedOptions(
				new Set([...(categoryConfig?.sources ?? []), ...(typeConfig?.sources ?? [])])
			);
			foundry.utils.setProperty(
				submitData,
				"system.identifier.associated",
				validSources.set.has(identifier) ? identifier : ""
			);
		}

		return submitData;
	}
}
