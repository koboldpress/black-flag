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
		foundry.applications.apps.DocumentSheetConfig.registerSheet(
			documentType,
			game.system.id,
			category.sheet.application,
			{
				types: Array.from(filtered),
				makeDefault: true,
				label: category.sheet.label
			}
		);
		log(`Registered ${key} sheet for: ${filtered.join(", ")}`);
	}
	for (const type of new Set(Object.keys(models)).difference(registered)) {
		const metadata = models[type]?.metadata?.sheet;
		if (!metadata) continue;
		registered.add(type);
		foundry.applications.apps.DocumentSheetConfig.registerSheet(documentType, game.system.id, metadata.application, {
			types: [type],
			makeDefault: true,
			label: metadata.label
		});
		log(`Registered ${type} sheet`);
	}
	foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
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
	const registerElement = element => window.customElements.define(element.tagName, element);
	registerElement(components.ActionsElement);
	registerElement(components.ActivitiesElement);
	registerElement(components.AdvancementElement);
	registerElement(components.AttackResultElement);
	registerElement(components.ChatTrayElement);
	registerElement(components.ConsumptionElement);
	registerElement(components.CopyableElement);
	registerElement(components.CurrencyElement);
	registerElement(components.DamageApplicationElement);
	registerElement(components.DamageListElement);
	registerElement(components.DeathSavesElement);
	registerElement(components.EnchantmentApplicationElement);
	registerElement(components.EffectApplicationElement);
	registerElement(components.EffectsElement);
	registerElement(components.FilterElement);
	registerElement(components.FiltersElement);
	registerElement(components.IconElement);
	registerElement(components.InventoryElement);
	registerElement(components.MessageLuckElement);
	registerElement(components.MultiSelectElement);
	registerElement(components.SortingElement);
	registerElement(components.UsesElement);
	registerElement(components.XPBarElement);
}

export { actor, components };
export * as activity from "./activity/_module.mjs";
export * as advancement from "./advancement/_module.mjs";
export * as api from "./api/_module.mjs";
export { default as BlackFlagChatLog } from "./chat-log.mjs";
export { default as BlackFlagCombatTracker } from "./combat-tracker.mjs";
export { default as BlackFlagContextMenu } from "./context-menu.mjs";
export * as dice from "./dice/_module.mjs";
export { default as BlackFlagDragDrop } from "./drag-drop.mjs";
export * as fields from "./fields.mjs";
export { default as IdentityConfig } from "./identity-config.mjs";
export * as item from "./item/_module.mjs";
export * as journal from "./journal/_module.mjs";
export * as regionBehavior from "./region-behavior/_module.mjs";
export { default as NotificationTooltip } from "./notification-tooltip.mjs";
export * as settings from "./settings/_module.mjs";
export { default as WelcomeDialog } from "./welcome-dialog.mjs";
