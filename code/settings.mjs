import CombatSettingsConfig from "./applications/settings/combat-settings-config.mjs";
import LocalizationSettingsConfig from "./applications/settings/localization-settings-config.mjs";
import RulesSettingsConfig from "./applications/settings/rules-settings-config.mjs";
import WelcomeDialog from "./applications/welcome-dialog.mjs";
import LocalizationSetting from "./data/settings/localization-setting.mjs";
import RulesSetting from "./data/settings/rules-setting.mjs";
import { systemVersion } from "./utils/localization.mjs";
import log from "./utils/logging.mjs";

/**
 * Register custom keybindings offered by Everyday Heroes.
 */
export function registerKeybindings() {
	log("Registering keybindings");

	game.keybindings.register(game.system.id, "skipDialogNormal", {
		name: "BF.Keybinding.SkipDialog.Normal",
		editable: [{ key: "ShiftLeft" }, { key: "ShiftRight" }]
	});

	game.keybindings.register(game.system.id, "skipDialogAdvantage", {
		name: "BF.Keybinding.SkipDialog.Advantage",
		editable: [{ key: "AltLeft" }, { key: "AltRight" }]
	});

	game.keybindings.register(game.system.id, "skipDialogDisadvantage", {
		name: "BF.Keybinding.SkipDialog.Disadvantage",
		editable: [{ key: "CtrlLeft" }, { key: "CtrlRight" }, { key: "OsLeft" }, { key: "OsRight" }]
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register the system's settings.
 */
export function registerSettings() {
	log("Registering system settings");

	// Combat
	game.settings.registerMenu(game.system.id, "combatConfiguration", {
		name: "BF.SETTINGS.COMBAT.Name",
		label: "BF.SETTINGS.COMBAT.Label",
		hint: "BF.SETTINGS.COMBAT.Hint",
		icon: "fa-solid fa-explosion",
		type: CombatSettingsConfig,
		restricted: true
	});

	game.settings.register(game.system.id, "initiativeTiebreaker", {
		name: "BF.SETTINGS.COMBAT.InitiativeTiebreaker.Label",
		hint: "BF.SETTINGS.COMBAT.InitiativeTiebreaker.Hint",
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "criticalMaximizeDamage", {
		name: "BF.SETTINGS.CRITICAL.MaximizeDamage.Label",
		hint: "BF.SETTINGS.CRITICAL.MaximizeDamage.Hint",
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "criticalMultiplyDice", {
		name: "BF.SETTINGS.CRITICAL.MultiplyDice.Label",
		hint: "BF.SETTINGS.CRITICAL.MultiplyDice.Hint",
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "criticalMultiplyNumeric", {
		name: "BF.SETTINGS.CRITICAL.MultiplyNumeric.Label",
		hint: "BF.SETTINGS.CRITICAL.MultiplyNumeric.Hint",
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

	// Localization
	game.settings.registerMenu(game.system.id, "localizationConfiguration", {
		name: "BF.SETTINGS.LOCALIZATION.Name",
		label: "BF.SETTINGS.LOCALIZATION.Label",
		hint: "BF.SETTINGS.LOCALIZATION.Hint",
		icon: "fa-solid fa-globe",
		type: LocalizationSettingsConfig,
		restricted: true
	});

	game.settings.register(game.system.id, "localization", {
		scope: "world",
		config: false,
		type: LocalizationSetting,
		requiresReload: true
	});

	// Optional rules
	game.settings.registerMenu(game.system.id, "rulesConfiguration", {
		name: "BF.SETTINGS.RULES.Name",
		label: "BF.SETTINGS.RULES.Label",
		hint: "BF.SETTINGS.RULES.Hint",
		icon: "fa-solid fa-chess-rook",
		type: RulesSettingsConfig,
		restricted: true
	});

	game.settings.register(game.system.id, "rulesConfiguration", {
		scope: "world",
		config: false,
		type: RulesSetting,
		default: {
			firearms: false
		},
		requiresReload: true
	});

	game.settings.register(game.system.id, "criticalChecksAndThrows", {
		name: "BF.SETTINGS.CRITICAL.ChecksAndThrows.Label",
		hint: "BF.SETTINGS.CRITICAL.ChecksAndThrows.Hint",
		scope: "world",
		config: false,
		default: false,
		type: Boolean
	});

	// Others
	game.settings.register(game.system.id, "attackVisibility", {
		name: "BF.SETTINGS.AttackVisibility.Label",
		hint: "BF.SETTINGS.AttackVisibility.Hint",
		scope: "world",
		config: true,
		default: "hideAC",
		type: String,
		choices: {
			all: "BF.SETTINGS.AttackVisibility.All",
			hideAC: "BF.SETTINGS.AttackVisibility.HideAC",
			none: "BF.SETTINGS.AttackVisibility.None"
		}
	});

	game.settings.register(game.system.id, "challengeVisibility", {
		name: "BF.SETTINGS.ChallengeVisibility.Label",
		hint: "BF.SETTINGS.ChallengeVisibility.Hint",
		scope: "world",
		config: true,
		default: "player",
		type: String,
		choices: {
			all: "BF.SETTINGS.ChallengeVisibility.All",
			player: "BF.SETTINGS.ChallengeVisibility.Player",
			none: "BF.SETTINGS.ChallengeVisibility.None"
		}
	});

	game.settings.register(game.system.id, "collapseChatTrays", {
		name: "BF.SETTINGS.CollapseTrays.Label",
		hint: "BF.SETTINGS.CollapseTrays.Hint",
		scope: "client",
		config: true,
		default: "older",
		type: String,
		choices: {
			never: "BF.SETTINGS.CollapseTrays.Never",
			older: "BF.SETTINGS.CollapseTrays.Older",
			always: "BF.SETTINGS.CollapseTrays.Always"
		}
	});

	game.settings.register(game.system.id, "encumbrance", {
		name: "BF.SETTINGS.Encumbrance.Label",
		hint: "BF.SETTINGS.Encumbrance.Hint",
		scope: "world",
		config: true,
		default: "none",
		type: String,
		choices: {
			none: "BF.SETTINGS.Encumbrance.None",
			normal: "BF.SETTINGS.Encumbrance.Normal",
			variant: "BF.SETTINGS.Encumbrance.Variant"
		}
	});

	game.settings.register(game.system.id, "levelingMode", {
		name: "BF.SETTINGS.LevelingMode.Label",
		hint: "BF.SETTINGS.LevelingMode.Hint",
		scope: "world",
		config: true,
		default: "xp",
		type: String,
		choices: {
			xp: "BF.SETTINGS.LevelingMode.XP",
			milestone: "BF.SETTINGS.LevelingMode.Milestone"
		}
	});

	game.settings.register(game.system.id, "proficiencyMode", {
		name: "BF.SETTINGS.ProficiencyMode.Label",
		hint: "BF.SETTINGS.ProficiencyMode.Hint",
		scope: "world",
		config: false,
		default: "bonus",
		type: String,
		choices: {
			bonus: "BF.SETTINGS.ProficiencyMode.Bonus",
			dice: "BF.SETTINGS.ProficiencyMode.Dice"
		}
	});

	game.settings.register(game.system.id, "abilitySelectionManual", {
		name: "BF.SETTINGS.AbilitySelectionManual.Label",
		hint: "BF.SETTINGS.AbilitySelectionManual.Hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "abilitySelectionReroll", {
		name: "BF.SETTINGS.AbilitySelectionReroll.Label",
		hint: "BF.SETTINGS.AbilitySelectionReroll.Hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "allowMulticlassing", {
		name: "BF.SETTINGS.Multiclassing.Label",
		hint: "BF.SETTINGS.Multiclassing.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});

	game.settings.register(game.system.id, "allowSummoning", {
		name: "BF.SETTINGS.Summoning.Label",
		hint: "BF.SETTINGS.Summoning.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});

	game.settings.register(game.system.id, "tokenMeasurementAutomation", {
		name: "BF.SETTINGS.AUTOMATION.tokenMeasurementAutomation.Label",
		hint: "BF.SETTINGS.AUTOMATION.tokenMeasurementAutomation.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});

	// Hidden
	game.settings.register(game.system.id, "_firstRun", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});
	game.settings.register(game.system.id, "_lastMigratedVersion", {
		name: "Last System Version Migrated",
		scope: "world",
		config: false,
		type: String,
		default: ""
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Add the Black Flag badge into the sidebar.
 * @param {HTMLElement} html - Rendered sidebar content.
 * @returns {void}
 */
export function renderSettingsSidebar(html) {
	const details = html.querySelector(".info .system");
	const pip = details.querySelector(".notification-pip");
	details.remove();

	const section = document.createElement("section");
	section.classList.add("black-flag", "sidebar-info", "flexcol");
	section.innerHTML = `
		<h4 class="divider">${_loc("BF.GameSystem")}</h4>
		<figure class="black-flag sidebar-badge">
			<img src="systems/black-flag/artwork/branding/badge.webp" height="64" width="154"
			     data-tooltip="${game.system.title}" alt="${game.system.title}">
			<span class="system-info">${systemVersion()}</span>
		</figure>
	`;
	section.querySelector(".divider").after(_settingsLinks());

	const welcomeLink = document.createElement("button");
	welcomeLink.dataset.action = "welcome";
	welcomeLink.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> ${_loc("BF.WELCOME.Button")}`;
	welcomeLink.addEventListener("click", () => new WelcomeDialog().render({ force: true }));
	section.append(welcomeLink);

	if (pip) section.querySelector(".system-info").append(pip);
	html.querySelector(".info").after(section);
}

/**
 * Create the links for the sidebar.
 * @returns {HTMLULElement}
 */
function _settingsLinks() {
	const links = document.createElement("ul");
	links.classList.add("links");
	links.innerHTML = `
		<li>
			<a href="https://koboldpress.github.io/black-flag-docs/" target="_blank">
				${_loc("BF.Link.Notes")}
			</a>
		</li>
		<li>
			<a href="https://github.com/koboldpress/black-flag/issues" target="_blank">
				${_loc("BF.Link.Issues")}
			</a>
		</li>
		<li>
			<a href="https://discord.com/channels/170995199584108546/1083522450148577290" target="_blank">
				${_loc("BF.Link.Discord")}
			</a>
		</li>
	`;
	return links;
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Make adjustments to configuration data based on selected optional rules.
 */
export function _configureOptionalRules() {
	const rules = game.settings.get(game.system.id, "rulesConfiguration");
	const adjustNested = obj => {
		for (const [key, value] of Object.entries(obj)) {
			if ("rules" in value && rules[value.rules] !== true && !rules.required[value.rules]) delete obj[key];
			else if ("children" in value) adjustNested(value.children);
		}
	};
	["ammunition", "itemProperties", "weaponOptions", "weapons"].forEach(c => adjustNested(CONFIG.BlackFlag[c]));
}
