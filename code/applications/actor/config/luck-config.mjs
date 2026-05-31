import BaseConfigSheet from "../api/base-config-sheet.mjs";

/**
 * Configuration application for a PC's luck.
 */
export default class LuckConfig extends BaseConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["luck", "form-list"],
		position: {
			width: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/actor/config/luck-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return _loc("BF.Action.Configure.Specific", { type: _loc("BF.Luck.Label") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		context.formulaDisabled =
			!!foundry.utils.getProperty(this.document.overrides, "system.attributes.luck.formula") ||
			!!foundry.utils.getProperty(this.document.advancementOverrides, "system.attributes.luck.formula");
		return context;
	}
}
