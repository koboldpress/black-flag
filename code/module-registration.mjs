import BlackFlagItemCompendium from "./applications/item/item-compendium.mjs";
import TableOfContentsCompendium from "./applications/journal/table-of-contents.mjs";
import RulesSetting from "./data/settings/rules-setting.mjs";
import { log } from "./utils/_module.mjs";

/**
 * Scan module manifests for any data that should be integrated into the system configuration.
 */
export function registerModuleData() {
	log("Registering Module Data", { level: "groupCollapsed" });
	for (const manifest of [game.system, ...game.modules.filter(m => m.active), game.world]) {
		try {
			const complete = methods.map(m => m(manifest)).filter(r => r);
			if (complete.length) {
				log(`Registered ${manifest.title} data: ${complete.join(", ")}`);
			}
		} catch (err) {
			console.error(
				`%cBlack Flag | %cError registering ${manifest.title}\n`,
				"color: #1874B3; font-variant: small-caps",
				"color: #1874B3",
				err.message
			);
		}
	}
	console.groupEnd();
}

const methods = [registerSourceBooks, registerRequiredRules];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register package source books from `flags.black-flag.sourceBooks`.
 * @param {Module|System|World} manifest - Manifest from which to register data.
 * @returns {string|void} - Description of the data registered.
 */
function registerSourceBooks(manifest) {
	if (!manifest.flags[game.system.id]?.sourceBooks) return;
	Object.assign(CONFIG.BlackFlag.sourceBooks, manifest.flags[game.system.id].sourceBooks);
	return "source books";
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register optional rules required by a module from `flags.black-flag.requireRules`.
 * @param {Module|System|World} manifest - Manifest from which to register data.
 * @returns {string|void} - Description of the data registered.
 */
function registerRequiredRules(manifest) {
	if (!manifest.flags[game.system.id]?.requiredRules?.length) return;
	for (const rule of manifest.flags[game.system.id].requiredRules) {
		RulesSetting.addRequiredRule(rule, manifest);
	}
	return "required rules";
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */
/*                    Compendium Packs                   */
/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Apply any changes to compendium packs during the setup hook.
 */
export function setupModulePacks() {
	log("Setting Up Compendium Packs", { level: "groupCollapsed" });
	for (const pack of game.packs) {
		if (pack.metadata.type === "Item") pack.applicationClass = BlackFlagItemCompendium;
		try {
			const complete = setupMethods.map(m => m(pack)).filter(r => r);
			if (complete.length) log(`Finished setting up ${pack.metadata.label}: ${complete.join(", ")}`);
		} catch (err) {
			log(`Error setting up ${pack.metadata.label}\n`, { extras: [err.message], level: "error" });
		}
	}
	console.groupEnd();
}

const setupMethods = [setupPackDisplay, setupPackSorting];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Set application based on `flags.black-flag.display`.
 * @param {Compendium} pack - Pack to set up.
 * @returns {string|void} - Description of the step.
 */
function setupPackDisplay(pack) {
	const display = pack.metadata.flags[game.system.id]?.display ?? pack.metadata.flags.display;
	if (display !== "table-of-contents") return;
	pack.applicationClass = TableOfContentsCompendium;
	return "table of contents";
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

let sortingChanges;
const debouncedUpdateSorting = foundry.utils.debounce(
	() => game.settings.set("core", "collectionSortingModes", sortingChanges),
	250
);

/**
 * Set default sorting order based on `flags.black-flag.sorting`.
 * @param {Compendium} pack - Pack to set up.
 * @returns {string|void} - Description of the step.
 */
function setupPackSorting(pack) {
	sortingChanges ??= game.settings.get("core", "collectionSortingModes") ?? {};
	if (!pack.metadata.flags[game.system.id]?.sorting || sortingChanges[pack.metadata.id]) return;
	sortingChanges[pack.metadata.id] = pack.metadata.flags[game.system.id].sorting;
	debouncedUpdateSorting();
	return "default sorting";
}
