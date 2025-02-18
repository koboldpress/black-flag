import { insertBetween } from "../utils/array.mjs";
import log from "../utils/logging.mjs";

/**
 * Register the provided data models with Foundry using metadata.
 * @param {typeof Document} documentType - Document type to which these models will be registered.
 * @param {Record<string, SystemDataModel>} [models] - Models to register grouped by type name.
 * @returns {void}
 */
export function registerDataModels(documentType, models) {
	log(`Registering ${documentType.name.toLowerCase()} data models`);

	const config = CONFIG[documentType.name];
	config.categories = CONFIG.BlackFlag._documentCategories[documentType.name];
	config.typeLabelsPlural ??= {};

	if (!models) {
		if (!config.categories) return log(`No models provided to register for ${documentType.name}`, { level: "error" });
		models = Object.fromEntries(
			Object.values(config.categories)
				.flatMap(v => v.types ?? [])
				.map(m => [m.fullType, m])
		);
	}

	for (let [type, model] of Object.entries(models)) {
		if (model.metadata.module) type = model.fullType;
		config.dataModels[type] = model;
		config.typeLabels[type] = `${model.metadata.localization}[one]`;
		config.typeLabelsPlural[type] = `${model.metadata.localization}[other]`;
		if (model.metadata.icon) config.typeIcons[type] = model.metadata.icon;
		if (config.categories?.[model.metadata.category]) {
			const types = config.categories[model.metadata.category].types;
			if (!types.includes(model)) insertBetween(types, model, model.metadata.categoryPosition);
		}
	}
}

export * as abstract from "./abstract/_module.mjs";
export * as activeEffect from "./active-effect/_module.mjs";
export * as activity from "./activity/_module.mjs";
export * as actor from "./actor/_module.mjs";
export * as advancement from "./advancement/_module.mjs";
export * as chatMessage from "./chat-message/_module.mjs";
export * as collection from "./collection/_module.mjs";
export * as fields from "./fields/_module.mjs";
export * as item from "./item/_module.mjs";
export * as journal from "./journal/_module.mjs";
export * as settings from "./settings/_module.mjs";
