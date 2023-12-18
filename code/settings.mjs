import log from "./utils/logging.mjs";

/**
 * Register custom keybindings offered by Everyday Heroes.
 */
export function registerKeybindings() {
	log("Registering keybindings");

	game.keybindings.register(game.system.id, "challengeRollNormal", {
		name: "BF.Keybinding.ChallengeRoll.Normal.Label",
		editable: [
			{ key: "ShiftLeft" },
			{ key: "ShiftRight" }
		]
	});

	game.keybindings.register(game.system.id, "challengeRollAdvantage", {
		name: "BF.Keybinding.ChallengeRoll.Advantage.Label",
		editable: [
			{ key: "AltLeft" },
			{ key: "AltRight" }
		]
	});

	game.keybindings.register(game.system.id, "challengeRollDisadvantage", {
		name: "BF.Keybinding.ChallengeRoll.Disadvantage.Label",
		editable: [
			{ key: "CtrlLeft" },
			{ key: "CtrlRight" },
			{ key: "OSLeft" },
			{ key: "OSRight" }
		]
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
		editable: [
			{ key: "AltLeft" },
			{ key: "AltRight" }
		]
	});
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Register the system's settings.
 */
export function registerSettings() {
	log("Registering system settings");

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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Hidden Settings           */
	/* <><><><> <><><><> <><><><> <><><><> */

	game.settings.register(game.system.id, "lastCreatedTypes", {
		scope: "client",
		config: false,
		default: {},
		type: Object
	});
}
