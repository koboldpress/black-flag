import RulesSetting from "./data/settings/rules-setting.mjs";
import { log } from "./utils/_module.mjs";

/**
 * Scan module manifests for any data that should be integrated into the system configuration.
 */
export default function registerModuleData() {
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
