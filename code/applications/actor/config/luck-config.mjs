import BaseConfig from "./base-config.mjs";

export default class LuckConfig extends BaseConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "luck"],
			template: "systems/black-flag/templates/actor/config/luck-config.hbs",
			width: 400
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get type() {
		return game.i18n.localize("BF.Luck.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		context.formulaDisabled =
			!!foundry.utils.getProperty(this.document.overrides, "system.attributes.luck.formula") ||
			!!foundry.utils.getProperty(this.document.advancementOverrides, "system.attributes.luck.formula");
		return context;
	}
}
