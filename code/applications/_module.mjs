import log from "../utils/logging.mjs";

/**
 * Automatically register Document sheets using category information from config or metadata in SystemDataModels.
 * @param {typeof Document} documentType - Type of document to register (e.g. Actor or Item).
 * @param {{[key: string]: CategoryConfiguration}} [categories] - Categories to register.
 */
export function registerSheets(documentType, categories) {
	log(`Registering ${documentType.name} sheets`, {level: "groupCollapsed"});
	const models = CONFIG[documentType.name].dataModels;
	categories = CONFIG[documentType.name].categories ?? {};
	const registered = new Set();
	for ( const [key, category] of Object.entries(categories) ) {
		if ( !category.sheet ) continue;
		const filtered = category.types.filter(t => !t.metadata?.sheet).map(f => f.fullType);
		filtered.forEach(f => registered.add(f));
		DocumentSheetConfig.registerSheet(documentType, game.system.id, category.sheet.application, {
			types: Array.from(filtered), makeDefault: true, label: category.sheet.label
		});
		log(`Registered ${key} sheet for: ${filtered.join(", ")}`);
	}
	for ( const type of new Set(Object.keys(models)).difference(registered) ) {
		const metadata = models[type]?.metadata?.sheet;
		if ( !metadata ) continue;
		registered.add(type);
		DocumentSheetConfig.registerSheet(documentType, game.system.id, metadata.application, {
			types: [type], makeDefault: true, label: metadata.label
		});
		log(`Registered ${type} sheet`);
	}
	DocumentSheetConfig.unregisterSheet(
		documentType, "core", {name: `${documentType.name}Sheet`}, {types: Array.from(registered)}
	);
	console.groupEnd();
}

export * as actor from "./actor/_module.mjs";
export * as advancement from "./advancement/_module.mjs";
export {default as BlackFlagCombatTracker} from "./combat-tracker.mjs";
export {default as BlackFlagDialog} from "./dialog.mjs";
export * as dice from "./dice/_module.mjs";
export * as item from "./item/_module.mjs";
export * as journal from "./journal/_module.mjs";
export {default as NotificationTooltip} from "./notification-tooltip.mjs";
