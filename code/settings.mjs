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
		config: true,
		default: "bonus",
		type: String,
		choices: {
			bonus: "BF.Settings.ProficiencyMode.Bonus",
			dice: "BF.Settings.ProficiencyMode.Dice"
		}
	});
}
