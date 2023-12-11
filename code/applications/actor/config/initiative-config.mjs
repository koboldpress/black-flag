import BaseConfig from "./base-config.mjs";

export default class InitiativeConfig extends BaseConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "initiative"],
			template: "systems/black-flag/templates/actor/config/initiative-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	get type() {
		return game.i18n.localize("BF.Initiative.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.proficiencyLevels = {
			0: "BF.Proficiency.Level.None",
			0.5: "BF.Proficiency.Level.Half",
			1: "BF.Proficiency.Level.Proficient",
			2: "BF.Proficiency.Level.Expertise"
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareModifiers() {
		const modifiers = this.getModifiers([{k: "type", v: "initiative"}]);
		return [
			{
				category: "initiative", type: "bonus", label: "BF.Initiative.Label",
				modifiers: modifiers.filter(m => m.type === "bonus")
			},
			{
				category: "initiative", type: "min", label: "BF.Initiative.Label",
				modifiers: modifiers.filter(m => m.type === "min")
			},
			{
				category: "initiative", type: "note", label: "BF.Initiative.Label",
				modifiers: modifiers.filter(m => m.type === "note")
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	_getModifierData(category, type) {
		const data = { type, filter: [{ k: "type", v: "initiative" }] };
		return data;
	}
}
