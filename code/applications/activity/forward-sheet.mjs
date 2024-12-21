import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Forward activities.
 */
export default class ForwardSheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["forward-activity"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		identity: {
			template: "systems/black-flag/templates/activity/forward-identity.hbs",
			templates: super.PARTS.identity.templates
		},
		activation: {
			template: "systems/black-flag/templates/activity/forward-activation.hbs",
			templates: [
				"systems/black-flag/templates/activity/parts/activity-consumption.hbs",
				"systems/black-flag/templates/activity/parts/activity-consumption-part.hbs",
				"systems/black-flag/templates/shared/uses-config.hbs"
			]
		},
		effect: {
			template: "systems/black-flag/templates/activity/forward-effect.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActivationContext(context) {
		context = await super._prepareActivationContext(context);
		context.showPrimaryActivation = false;
		return context;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _prepareEffectContext(context) {
		context = await super._prepareEffectContext(context);
		context.activityOptions = [
			{ value: "", label: "" },
			...this.item.system.activities.contents
				.filter(a => a.type !== "forward")
				.map(activity => ({ value: activity.id, label: activity.name }))
		];
		return context;
	}

	/* -------------------------------------------- */

	/**
	 * Prepare the tab information for the sheet.
	 * @returns {Record<string, Partial<ApplicationTab>>}
	 * @protected
	 */
	_getTabs() {
		return this._markTabs({
			identity: {
				id: "identity",
				group: "sheet",
				icon: "fa-solid fa-tag",
				label: "BF.ACTIVITY.SECTION.Identity"
			},
			activation: {
				id: "activation",
				group: "sheet",
				icon: "fa-solid fa-boxes-stacked",
				label: "BF.ACTIVITY.SECTION.Consumption"
			},
			effect: {
				id: "effect",
				group: "sheet",
				icon: "fa-solid fa-sun",
				label: "BF.ACTIVITY.SECTION.Effect"
			}
		});
	}
}
