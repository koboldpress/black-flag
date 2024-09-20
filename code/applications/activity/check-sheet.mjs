import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Check activities.
 */
export default class CheckSheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["check-activity"]
	};

	/* -------------------------------------------- */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		effect: {
			template: "systems/black-flag/templates/activity/check-effect.hbs",
			templates: [
				"systems/black-flag/templates/activity/parts/activity-effects.hbs",
				"systems/black-flag/templates/activity/parts/check-details.hbs"
			]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareEffectContext(context) {
		context = await super._prepareEffectContext(context);

		const group = game.i18n.localize("BF.Ability.Label[other]");
		context.abilityOptions = [
			{ value: "", label: "" },
			{ rule: true },
			{ value: "spellcasting", label: game.i18n.localize("BF.Spellcasting.Label") },
			...CONFIG.BlackFlag.abilities.localizedOptions.map(o => ({ ...o, group }))
		];

		context.associatedOptions = [
			...CONFIG.BlackFlag.skills.localizedOptions.map(o => ({
				...o,
				group: game.i18n.localize("BF.Skill.Label[other]")
			})),
			...CONFIG.BlackFlag.tools.localizedOptions.map(o => ({
				...o,
				group: game.i18n.localize("BF.Tool.Label[other]")
			})),
			...CONFIG.BlackFlag.vehicles.localizedOptions.map(o => ({
				...o,
				group: game.i18n.localize("BF.Vehicle.Label[other]")
			}))
		];

		context.calculationOptions = [
			{ value: "", label: game.i18n.localize("BF.Formula.Custom.Label") },
			{ rule: true },
			{ value: "spellcasting", label: game.i18n.localize("BF.Spellcasting.Label") },
			...CONFIG.BlackFlag.abilities.localizedOptions.map(o => ({ ...o, group }))
		];

		return context;
	}
}
