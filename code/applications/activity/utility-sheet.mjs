import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Utility activities.
 */
export default class UtilitySheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["utility-activity"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		effect: {
			template: "systems/black-flag/templates/activity/utility-effect.hbs",
			templates: super.PARTS.effect.templates
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareIdentityContext(context) {
		context = await super._prepareIdentityContext(context);
		context.behaviorFields.push({
			field: context.systemFields.roll.fields.visible,
			value: context.source.system.roll.visible
		});
		return context;
	}
}
