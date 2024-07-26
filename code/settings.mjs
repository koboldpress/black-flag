import { systemVersion } from "./utils/localization.mjs";
import log from "./utils/logging.mjs";

/**
 * Register custom keybindings offered by Everyday Heroes.
 */
export function registerKeybindings() {
	log("Registering keybindings");

	game.keybindings.register(game.system.id, "challengeRollNormal", {
		name: "BF.Keybinding.ChallengeRoll.Normal.Label",
		editable: [{ key: "ShiftLeft" }, { key: "ShiftRight" }]
	});

	game.keybindings.register(game.system.id, "challengeRollAdvantage", {
		name: "BF.Keybinding.ChallengeRoll.Advantage.Label",
		editable: [{ key: "AltLeft" }, { key: "AltRight" }]
	});

	game.keybindings.register(game.system.id, "challengeRollDisadvantage", {
		name: "BF.Keybinding.ChallengeRoll.Disadvantage.Label",
		editable: [{ key: "CtrlLeft" }, { key: "CtrlRight" }, { key: "OSLeft" }, { key: "OSRight" }]
	});

	game.keybindings.register(game.system.id, "damageRollNormal", {
		name: "BF.Keybinding.DamageRoll.Normal.Label",
		editable: [
			{ key: "ShiftLeft" },
			{ key: "ShiftRight" },
			{ key: "CtrlLeft" },
			{ key: "CtrlRight" },
			{ key: "OSLeft" },
			{ key: "OSRight" }
		]
	});

	game.keybindings.register(game.system.id, "damageRollCritical", {
		name: "BF.Keybinding.DamageRoll.Critical.Label",
		editable: [{ key: "AltLeft" }, { key: "AltRight" }]
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register the system's settings.
 */
export function registerSettings() {
	log("Registering system settings");

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
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Add the Black Flag badge into the sidebar.
 * @param {HTMLElement} html - Rendered sidebar content.
 */
export function renderSettingsSidebar(html) {
	const details = html.querySelector("#game-details");
	const pip = details.querySelector(".system-info .update");
	details.querySelector(".system")?.remove();

	const heading = document.createElement("div");
	heading.classList.add("black-flag", "sidebar-heading");
	heading.innerHTML = `
		<h2>${game.i18n.localize("WORLD.GameSystem")}</h2>
		<ul class="links">
			<li>
				<a href="https://github.com/koboldpress/black-flag/releases/latest" target="_blank">
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
		</ul>
	`;
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
}
