import log from "../utils/logging.mjs";
import * as actor from "./actor/_module.mjs";
import * as components from "./components/_module.mjs";

/**
 * Automatically register Document sheets using category information from config or metadata in SystemDataModels.
 * @param {typeof Document} documentType - Type of document to register (e.g. Actor or Item).
 * @param {{[key: string]: CategoryConfiguration}} [categories] - Categories to register.
 */
export function registerSheets(documentType, categories) {
	log(`Registering ${documentType.name} sheets`, { level: "groupCollapsed" });
	const models = CONFIG[documentType.name].dataModels;
	categories = CONFIG[documentType.name].categories ?? {};
	const registered = new Set();
	for (const [key, category] of Object.entries(categories)) {
		if (!category.sheet) continue;
		const filtered = category.types.filter(t => !t.metadata?.sheet).map(f => f.fullType);
		filtered.forEach(f => registered.add(f));
		DocumentSheetConfig.registerSheet(documentType, game.system.id, category.sheet.application, {
			types: Array.from(filtered),
			makeDefault: true,
			label: category.sheet.label
		});
		log(`Registered ${key} sheet for: ${filtered.join(", ")}`);
	}
	for (const type of new Set(Object.keys(models)).difference(registered)) {
		const metadata = models[type]?.metadata?.sheet;
		if (!metadata) continue;
		registered.add(type);
		DocumentSheetConfig.registerSheet(documentType, game.system.id, metadata.application, {
			types: [type],
			makeDefault: true,
			label: metadata.label
		});
		log(`Registered ${type} sheet`);
	}
	DocumentSheetConfig.unregisterSheet(
		documentType,
		"core",
		{ name: `${documentType.name}Sheet` },
		{ types: Array.from(registered) }
	);
	console.groupEnd();
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register any custom elements on the page.
 */
export function registerCustomElements() {
	log("Registering custom elements");
	window.customElements.define("blackflag-actions", components.ActionsElement);
	window.customElements.define("blackflag-activities", components.ActivitiesElement);
	window.customElements.define("blackflag-advancement", components.AdvancementElement);
	window.customElements.define("blackflag-consumption", components.ConsumptionElement);
	window.customElements.define("blackflag-copyable", components.CopyableElement);
	window.customElements.define("blackflag-currency", components.CurrencyElement);
	window.customElements.define("blackflag-damageapplication", components.DamageApplicationElement);
	window.customElements.define("blackflag-damagelist", components.DamageListElement);
	window.customElements.define("blackflag-deathsaves", components.DeathSavesElement);
	window.customElements.define("blackflag-effects", components.EffectsElement);
	window.customElements.define("blackflag-filter", components.FilterElement);
	window.customElements.define("blackflag-filters", components.FiltersElement);
	window.customElements.define("blackflag-icon", components.IconElement);
	window.customElements.define("blackflag-inventory", components.InventoryElement);
	window.customElements.define("blackflag-messageluck", components.MessageLuckElement);
	window.customElements.define("blackflag-multiselect", components.MultiSelectElement);
	window.customElements.define("blackflag-sorting", components.SortingElement);
	window.customElements.define("blackflag-tray", components.ChatTrayElement);
	window.customElements.define("blackflag-uses", components.UsesElement);
	window.customElements.define("blackflag-xpbar", components.XPBarElement);
}

export { actor, components };
export * as activity from "./activity/_module.mjs";
export * as advancement from "./advancement/_module.mjs";
export * as api from "./api/_module.mjs";
export { default as BlackFlagCombatTracker } from "./combat-tracker.mjs";
export { default as BlackFlagContextMenu } from "./context-menu.mjs";
export { default as BlackFlagDialog } from "./dialog.mjs";
export * as dice from "./dice/_module.mjs";
export * as item from "./item/_module.mjs";
export * as journal from "./journal/_module.mjs";
export { default as NotificationTooltip } from "./notification-tooltip.mjs";
