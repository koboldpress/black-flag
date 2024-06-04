import Proficiency from "../../../documents/proficiency.mjs";
import { buildRoll } from "../../../utils/_module.mjs";
import ProficiencyField from "../../fields/proficiency-field.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition template for initiative.
 *
 * @property {object} attributes
 * @property {object} attributes.initiative
 * @property {string} attributes.initiative.ability - Ability to add to the initiative roll.
 * @property {Proficiency} attributes.initiative.proficiency - Proficiency in initiative.
 */
export default class InitiativeTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			attributes: new SchemaField({
				initiative: new SchemaField({
					ability: new StringField({label: "BF.Initiative.Ability.Label"}),
					proficiency: new ProficiencyField()
				}, {label: "BF.Initiative.Label"})
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate the derived data on initiative.
	 */
	computeInitiative() {
		const init = this.attributes.initiative ??= {};
		init.ability ||= CONFIG.BlackFlag.defaultAbilities.initiative;
		const ability = this.abilities[init.ability];

		init.proficiency = new Proficiency(
			this.attributes.proficiency,
			init.proficiency.multiplier,
			init.proficiency.rounding
		);

		const initiativeData = [
			{ type: "ability-check", ability: init.ability, proficiency: init.proficiency.multiplier },
			{ type: "initiative", proficiency: init.proficiency.multiplier }
		];
		init.modifiers = {
			_data: initiativeData,
			bonus: this.getModifiers(initiativeData),
			min: this.getModifiers(initiativeData, "min"),
			note: this.getModifiers(initiativeData, "note")
		};
		init.bonus = this.buildBonus(init.modifiers.bonus, {
			deterministic: true, rollData: this.parent.getRollData({deterministic: true})
		});

		init.mod = (ability?.mod ?? 0) + init.proficiency.flat + init.bonus;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	getInitiativeRollConfig(options = {}) {
		const init = this.attributes?.initiative ?? {};
		const abilityKey = init.ability ?? CONFIG.BlackFlag.defaultAbilities.initiative;
		const ability = this.abilities?.[abilityKey] ?? {};

		const rollConfig = {
			rolls: [
				{
					...buildRoll(
						{
							mod: ability.mod,
							prof: init.proficiency?.hasProficiency ? init.proficiency.term : null,
							bonus: this.buildBonus?.(this.getModifiers?.(init.modifiers?._data)),
							tiebreaker:
								game.settings.get(game.system.id, "initiativeTiebreaker") && ability ? ability.value / 100 : null
						},
						this.getRollData()
					),
					options: foundry.utils.mergeObject(
						{
							minimum: this.buildMinimum?.(this.getModifiers?.(init.modifiers?._data, "min"))
						},
						options
					)
				}
			]
		};

		return rollConfig;
	}
}
