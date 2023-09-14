import log from "./utils/logging.mjs";

/**
 * Register the system's settings.
 */
export function registerSettings() {
	log("Registering system settings");

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
}
