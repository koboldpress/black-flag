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
			template: "systems/black-flag/templates/actor/config/ability-config.hbs",
			width: 400,
			height: "auto"
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
		const checkBonusLabel = game.i18n.format("BF.Bonus.LabelSpecific", {
			type: game.i18n.localize("BF.Check.Label[one]"), bonus: game.i18n.localize("BF.Bonus.Label[other]")
		});
		const checkMinLabel = game.i18n.format("BF.Roll.Minimum.LabelSpecific", {
			type: game.i18n.localize("BF.Check.Label[one]")
		});
		const saveBonusLabel = game.i18n.format("BF.Bonus.LabelSpecific", {
			type: game.i18n.localize("BF.SavingThrow.LabelShort[one]"), bonus: game.i18n.localize("BF.Bonus.Label[other]")
		});
		const saveMinLabel = game.i18n.format("BF.Roll.Minimum.LabelSpecific", {
			type: game.i18n.localize("BF.SavingThrow.LabelShort[one]")
		});
		const addBonus = game.i18n.localize("BF.Bonus.Label[one]");
		const addMin = game.i18n.localize("BF.Roll.Minimum.Label[one]");
		if ( this.abilityId ) {
			const ability = this.document.system.abilities[this.abilityId];
			const filter = modifier => modifier.filter.some(f => f.k === "ability" && f.v === this.abilityId);
			return {
				"check-bonus": {
					label: checkBonusLabel, addType: addBonus,
					modifiers: ability.check.modifiers.bonus.filter(filter)
				},
				"check-min": {
					label: checkMinLabel, addType: addMin,
					modifiers: ability.check.modifiers.minimum.filter(filter)
				},
				"save-bonus": {
					label: saveBonusLabel, addType: addBonus,
					modifiers: ability.save.modifiers.bonus.filter(filter)
				},
				"save-min": {
					label: saveMinLabel, addType: addMin,
					modifiers: ability.save.modifiers.minimum.filter(filter)
				}
			};
		}
		const filter = modifier => !modifier.filter.some(f => f.k === "ability");
		return {
			"check-bonus": {
				label: game.i18n.format("BF.Bonus.LabelGlobal", { type: checkBonusLabel }), addType: addBonus,
				modifiers: this.document.system.getModifiers({ type: "ability-check" }).filter(filter)
			},
			"check-min": {
				label: game.i18n.format("BF.Bonus.LabelGlobal", { type: checkMinLabel }), addType: addMin,
				modifiers: this.document.system.getModifiers({ type: "ability-check" }, "min").filter(filter)
			},
			"save-bonus": {
				label: game.i18n.format("BF.Bonus.LabelGlobal", { type: saveBonusLabel }), addType: addBonus,
				modifiers: this.document.system.getModifiers({ type: "ability-save" }).filter(filter)
			},
			"save-min": {
				label: game.i18n.format("BF.Bonus.LabelGlobal", { type: saveMinLabel }), addType: addMin,
				modifiers: this.document.system.getModifiers({ type: "ability-save" }, "min").filter(filter)
			}
		};
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

	_getModifierData(section) {
		const [sec, type] = section.split("-");
		const data = { type, formula: "", filter: [{ k: "type", v: `ability-${sec}` }] };
		if ( this.abilityId ) data.filter.push({ k: "ability", v: this.abilityId });
		return data;
	}
}
