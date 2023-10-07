import BaseConfig from "./base-config.mjs";

/**
 * Dialog for configuring an individual ability.
 * @param {string} abilityId - The ability being modified by this app.
 * @param {BlackFlagActor} actor - The actor to whom the ability belongs.
 * @param {object} options - Additional application rendering options.
 */
export default class AbilityConfig extends BaseConfig {
	constructor(abilityId, actor, options) {
		super(actor, options);
		this.abilityId = abilityId ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "ability"],
			template: "systems/black-flag/templates/actor/config/ability-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The ability being modified by this app.
	 * @type {string|null}
	 */
	abilityId;

	/* <><><><> <><><><> <><><><> <><><><> */

	get type() {
		return game.i18n.localize(CONFIG.BlackFlag.abilities[this.abilityId]?.labels.full ?? "BF.Ability.Label[one]");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.abilities = Object.entries(CONFIG.BlackFlag.abilities).reduce((obj, [k, v]) => {
			obj[k] = game.i18n.localize(v.labels.full);
			return obj;
		}, {});
		context.abilityId = this.abilityId;
		context.ability = this.abilityId ? context.source.abilities[this.abilityId]
			?? this.document.system.abilities[this.abilityId] ?? {} : null;
		context.proficiencyLevels = {
			0: game.i18n.localize("BF.Proficiency.Level.None"),
			1: game.i18n.localize("BF.Proficiency.Level.Proficient")
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareModifiers() {
		let checkModifiers;
		let saveModifiers;
		let global;
		if ( this.abilityId ) {
			checkModifiers = this.getModifiers([{k: "type", v: "ability-check"}, {k: "ability", v: this.abilityId}]);
			saveModifiers = this.getModifiers([{k: "type", v: "ability-save"}, {k: "ability", v: this.abilityId}]);
			global = false;
		} else {
			const filter = modifier => !modifier.filter.some(f => f.k === "ability");
			checkModifiers = this.getModifiers([{k: "type", v: "ability-check"}], [], filter);
			saveModifiers = this.getModifiers([{k: "type", v: "ability-save"}], [], filter);
			global = true;
		}
		return [
			{
				category: "check", type: "bonus", label: "BF.Check.Label[one]", global, showProficiency: true,
				modifiers: checkModifiers.filter(m => m.type === "bonus")
			},
			{
				category: "check", type: "min", label: "BF.Check.Label[one]", showProficiency: true,
				modifiers: checkModifiers.filter(m => m.type === "min")
			},
			{
				category: "check", type: "note", label: "BF.Check.Label[one]",
				modifiers: checkModifiers.filter(m => m.type === "note")
			},
			{
				category: "save", type: "bonus", label: "BF.SavingThrow.LabelShort[one]", showProficiency: true,
				modifiers: saveModifiers.filter(m => m.type === "bonus")
			},
			{
				category: "save", type: "min", label: "BF.SavingThrow.LabelShort[one]", showProficiency: true,
				modifiers: saveModifiers.filter(m => m.type === "min")
			},
			{
				category: "save", type: "note", label: "BF.SavingThrow.LabelShort[one]",
				modifiers: saveModifiers.filter(m => m.type === "note")
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	_onChangeInput(event) {
		super._onChangeInput(event);
		if ( event.target.name === "abilityId" ) {
			this.abilityId = event.target.value;
			this.render();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_getModifierData(category, type) {
		const data = { type, filter: [{ k: "type", v: `ability-${category}` }] };
		if ( this.abilityId ) data.filter.push({ k: "ability", v: this.abilityId });
		return data;
	}
}
