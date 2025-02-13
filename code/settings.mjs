import RulesSettingConfig from "./applications/settings/rules-settings-config.mjs";
import WelcomeDialog from "./applications/welcome-dialog.mjs";
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

	// Optional rules
	game.settings.registerMenu(game.system.id, "rulesConfiguration", {
		name: "BF.Settings.Rules.Name",
		label: "BF.Settings.Rules.Label",
		hint: "BF.Settings.Rules.Hint",
		icon: "fas fa-chess-rook",
		type: RulesSettingConfig,
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

	game.settings.register(game.system.id, "attackVisibility", {
		name: "BF.Settings.AttackVisibility.Label",
		hint: "BF.Settings.AttackVisibility.Hint",
		scope: "world",
		config: true,
		default: "hideAC",
		type: String,
		choices: {
			all: "BF.Settings.AttackVisibility.All",
			hideAC: "BF.Settings.AttackVisibility.HideAC",
			none: "BF.Settings.AttackVisibility.None"
		}
	});

	game.settings.register(game.system.id, "challengeVisibility", {
		name: "BF.Settings.ChallengeVisibility.Label",
		hint: "BF.Settings.ChallengeVisibility.Hint",
		scope: "world",
		config: true,
		default: "player",
		type: String,
		choices: {
			all: "BF.Settings.ChallengeVisibility.All",
			player: "BF.Settings.ChallengeVisibility.Player",
			none: "BF.Settings.ChallengeVisibility.None"
		}
	});

	game.settings.register(game.system.id, "collapseChatTrays", {
		name: "BF.Settings.CollapseTrays.Label",
		hint: "BF.Settings.CollapseTrays.Hint",
		scope: "client",
		config: true,
		default: "older",
		type: String,
		choices: {
			never: "BF.Settings.CollapseTrays.Never",
			older: "BF.Settings.CollapseTrays.Older",
			always: "BF.Settings.CollapseTrays.Always"
		}
	});

	game.settings.register(game.system.id, "encumbrance", {
		name: "BF.Settings.Encumbrance.Label",
		hint: "BF.Settings.Encumbrance.Hint",
		scope: "world",
		config: true,
		default: "none",
		type: String,
		choices: {
			none: "BF.Settings.Encumbrance.None",
			normal: "BF.Settings.Encumbrance.Normal",
			variant: "BF.Settings.Encumbrance.Variant"
		}
	});

	game.settings.register(game.system.id, "levelingMode", {
		name: "BF.Settings.LevelingMode.Label",
		hint: "BF.Settings.LevelingMode.Hint",
		scope: "world",
		config: true,
		default: "xp",
		type: String,
		choices: {
			xp: "BF.Settings.LevelingMode.XP",
			milestone: "BF.Settings.LevelingMode.Milestone"
		}
	});

	game.settings.register(game.system.id, "proficiencyMode", {
		name: "BF.Settings.ProficiencyMode.Label",
		hint: "BF.Settings.ProficiencyMode.Hint",
		scope: "world",
		config: false,
		default: "bonus",
		type: String,
		choices: {
			bonus: "BF.Settings.ProficiencyMode.Bonus",
			dice: "BF.Settings.ProficiencyMode.Dice"
		}
	});

	game.settings.register(game.system.id, "initiativeTiebreaker", {
		name: "BF.Settings.InitiativeTiebreaker.Label",
		hint: "BF.Settings.InitiativeTiebreaker.Hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "abilitySelectionManual", {
		name: "BF.Settings.AbilitySelectionManual.Label",
		hint: "BF.Settings.AbilitySelectionManual.Hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "abilitySelectionReroll", {
		name: "BF.Settings.AbilitySelectionReroll.Label",
		hint: "BF.Settings.AbilitySelectionReroll.Hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "allowMulticlassing", {
		name: "BF.Settings.Multiclassing.Label",
		hint: "BF.Settings.Multiclassing.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});

	game.settings.register(game.system.id, "allowSummoning", {
		name: "BF.Settings.Summoning.Label",
		hint: "BF.Settings.Summoning.Hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});

	game.settings.register(game.system.id, "criticalMaximizeDamage", {
		name: "BF.Settings.CriticalMaximizeDamage.Label",
		hint: "BF.Settings.CriticalMaximizeDamage.Hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "criticalMultiplyDice", {
		name: "BF.Settings.CriticalMultiplyDice.Label",
		hint: "BF.Settings.CriticalMultiplyDice.Hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "criticalMultiplyNumeric", {
		name: "BF.Settings.CriticalMultiplyNumeric.Label",
		hint: "BF.Settings.CriticalMultiplyNumeric.Hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});

	game.settings.register(game.system.id, "_firstRun", {
		scope: "world",
		config: false,
		default: true,
		type: Boolean
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Add the Black Flag badge into the sidebar.
 * @param {HTMLElement} html - Rendered sidebar content.
 * @returns {void}
 */
export function renderSettingsSidebar(html) {
	if (game.release.generation < 13) return _renderLegacy(html[0]);

	const details = html.querySelector(".info .system");
	const pip = details.querySelector(".notification-pip");
	details.remove();

	const section = document.createElement("section");
	section.classList.add("black-flag", "sidebar-info", "flexcol");
	section.innerHTML = `
		<h4 class="divider">${game.i18n.localize("WORLD.GameSystem")}</h4>
		<figure class="black-flag sidebar-badge">
			<img src="systems/black-flag/artwork/branding/badge.webp" height="64" width="154"
			     data-tooltip="${game.system.title}" alt="${game.system.title}">
			<span class="system-info">${systemVersion()}</span>
		</figure>
	`;
	section.querySelector(".divider").after(_settingsLinks());

	const welcomeLink = document.createElement("button");
	welcomeLink.dataset.action = "welcome";
	welcomeLink.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> ${game.i18n.localize("BF.WELCOME.Button")}`;
	welcomeLink.addEventListener("click", () => new WelcomeDialog().render({ force: true }));
	section.append(welcomeLink);

	if (pip) section.querySelector(".system-info").append(pip);
	html.querySelector(".info").after(section);
}

/**
 * Add the Black Flag badge into the sidebar.
 * @param {HTMLElement} html - Rendered sidebar content.
 */
function _renderLegacy(html) {
	const details = html.querySelector("#game-details");
	const pip = details.querySelector(".system-info .update");
	details.querySelector(".system")?.remove();

	const heading = document.createElement("div");
	heading.classList.add("black-flag", "sidebar-heading");
	heading.innerHTML = `<h2>${game.i18n.localize("WORLD.GameSystem")}</h2>`;
	heading.append(_settingsLinks());
	details.insertAdjacentElement("afterend", heading);

	const badge = document.createElement("figure");
	badge.classList.add("black-flag", "sidebar-badge");
	badge.innerHTML = `
		<img src="systems/black-flag/artwork/branding/badge.webp" height="64" width="154"
		     data-tooltip="${game.system.title}" alt="${game.system.title}">
		<span class="system-info">${systemVersion()}</span>
	`;
	if (pip) badge.querySelector(".system-info").insertAdjacentElement("beforeend", pip);
	heading.insertAdjacentElement("afterend", badge);

	const welcomeLink = document.createElement("button");
	welcomeLink.dataset.action = "welcome";
	welcomeLink.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> ${game.i18n.localize("BF.WELCOME.Button")}`;
	welcomeLink.addEventListener("click", () => new WelcomeDialog().render({ force: true }));
	const div = document.createElement("div");
	div.append(welcomeLink);
	badge.insertAdjacentElement("afterend", div);
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
				${game.i18n.localize("BF.Link.Notes")}
			</a>
		</li>
		<li>
			<a href="https://github.com/koboldpress/black-flag/issues" target="_blank">
				${game.i18n.localize("BF.Link.Issues")}
			</a>
		</li>
		<li>
			<a href="https://discord.com/channels/170995199584108546/1083522450148577290" target="_blank">
				${game.i18n.localize("BF.Link.Discord")}
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
