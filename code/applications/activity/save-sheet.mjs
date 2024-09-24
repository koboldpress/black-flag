import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Save activities.
 */
export default class SaveSheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["save-activity"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		effect: {
			template: "systems/black-flag/templates/activity/save-effect.hbs",
			templates: [
				"systems/black-flag/templates/activity/parts/activity-effects.hbs",
				"systems/black-flag/templates/activity/parts/damage-part.hbs",
				"systems/black-flag/templates/activity/parts/damage-parts.hbs",
				"systems/black-flag/templates/activity/parts/save-damage.hbs",
				"systems/black-flag/templates/activity/parts/save-details.hbs"
			]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareEffectContext(context) {
		context = await super._prepareEffectContext(context);
		const defaultAbility = this.activity.system.defaultAbility;
		context.defaultAbility = defaultAbility
			? game.i18n.format("BF.Default.Specific", { default: game.i18n.localize(defaultAbility).toLowerCase() })
			: null;
		return context;
	}
}
