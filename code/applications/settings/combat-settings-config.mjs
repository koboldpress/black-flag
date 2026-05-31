import BaseSettingsConfig from "./base-settings-config.mjs";

/**
 * An application for configuring combat settings.
 */
export default class CombatSettingsConfig extends BaseSettingsConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		window: {
			title: "BF.SETTINGS.COMBAT.Label"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		initiative: {
			template: "systems/black-flag/templates/setting/base-config.hbs"
		},
		criticals: {
			template: "systems/black-flag/templates/setting/base-config.hbs"
		},
		// npcs: {
		// 	template: "systems/black-flag/templates/setting/base-config.hbs"
		// },
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "initiative":
				context.fields = [this.createSettingField("initiativeTiebreaker")];
				context.legend = _loc("BF.Initiative.Label");
				break;
			case "criticals":
				context.fields = [
					this.createSettingField("criticalMaximizeDamage"),
					this.createSettingField("criticalMultiplyDice"),
					this.createSettingField("criticalMultiplyNumeric")
				];
				context.legend = _loc("BF.SETTINGS.CRITICAL.Label");
				break;
			// case "npcs":
			// 	context.fields = [
			// 		this.createSettingField("autoRecharge"),
			// 		this.createSettingField("autoRollNPCHP")
			// 	];
			// 	context.legend = _loc("SETTINGS.DND5E.NPCS.Name");
			// 	break;
		}
		return context;
	}
}
