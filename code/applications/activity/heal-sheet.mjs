import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Healing activities.
 */
export default class HealSheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["heal-activity"]
	};

	/* -------------------------------------------- */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		effect: {
			template: "systems/black-flag/templates/activity/heal-effect.hbs",
			templates: [
				"systems/black-flag/templates/activity/parts/activity-effects.hbs",
				"systems/black-flag/templates/activity/parts/damage-part.hbs",
				"systems/black-flag/templates/activity/parts/heal-healing.hbs"
			]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareEffectContext(context) {
		context = await super._prepareEffectContext(context);
		context.scalingOptions = [
			{ value: "", label: game.i18n.localize("BF.DAMAGE.Scaling.Mode.None") },
			...Object.entries(CONFIG.BlackFlag.damageScalingModes).map(([value, config]) => ({
				value,
				label: game.i18n.localize(config.label)
			}))
		];
		return context;
	}
}
