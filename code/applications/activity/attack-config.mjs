import ActivityConfig from "./activity-config.mjs";

/**
 * Application for configuring Attack activities.
 */
export default class AttackConfig extends ActivityConfig {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/activities/attack-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		const defaultAbility = this.activity.isSpell
			? "BF.Spellcasting.Label"
			: CONFIG.BlackFlag.abilities[this.item.system.ability]?.labels.full;
		const defaultType = CONFIG.BlackFlag.weaponTypes[this.item.system.type?.value]?.label;
		const defaultClassification = CONFIG.BlackFlag.attackTypes[this.item.system.type?.classification];
		return foundry.utils.mergeObject(context, {
			labels: {
				defaultAbility: defaultAbility
					? game.i18n.format("BF.Default.Specific", {
							default: game.i18n.localize(defaultAbility).toLowerCase()
						})
					: null,
				defaultType: defaultType
					? game.i18n.format("BF.Default.Specific", {
							default: game.i18n.localize(defaultType).toLowerCase()
						})
					: null,
				defaultClassification: defaultClassification
					? game.i18n.format("BF.Default.Specific", {
							default: game.i18n.localize(defaultClassification).toLowerCase()
						})
					: null
			}
		});
	}
}
