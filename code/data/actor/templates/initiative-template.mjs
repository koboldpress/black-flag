import Proficiency from "../../../documents/proficiency.mjs";
import ProficiencyField from "../../fields/proficiency-field.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition template for initiative.
 */
export default class InitiativeTemplate extends foundry.abstract.DataModel {

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
}
