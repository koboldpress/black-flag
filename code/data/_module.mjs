export * as actor from "./actor/_module.mjs";
export * as item from "./item/_module.mjs";
export * as fields from "./fields/_module.mjs";

/**
 * Register the provided data models with Foundry using metadata.
 * @param {typeof Document} documentType - Document type to which these models will be registered.
 * @param {[key: string]: SystemDataModel} models - Models to register grouped by type name.
 */
export function registerDataModels(documentType, models) {
	const config = CONFIG[documentType.name];
	config.typeLabelsPlural ??= {};
	for ( let [type, model] of Object.entries(models) ) {
		if ( model.metadata.module ) type = `${model.metadata.module}.${type}`;
		config.dataModels[type] = model;
		config.typeLabels[type] = `${model.metadata.localization}[one]`;
		config.typeLabelsPlural[type] = `${model.metadata.localization}[other]`;
		if ( model.metadata.icon ) config.typeIcons[type] = model.metadata.icon;
	}
}
