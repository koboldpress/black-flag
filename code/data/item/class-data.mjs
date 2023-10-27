import ItemDataModel from "../abstract/item-data-model.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import ConceptTemplate from "./templates/concept-template.mjs";

const { ColorField } = foundry.data.fields;

/**
 * Data definition for Class items.
 */
export default class ClassData extends ItemDataModel.mixin(AdvancementTemplate, ConceptTemplate) {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "class",
			category: "concept",
			localization: "BF.Item.Type.Class",
			icon: "fa-solid fa-landmark-dome"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			color: new ColorField()
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	get traits() {
		const traits = [];
		if ( this.hitDie ) traits.push({
			label: "BF.HitDie.Label[one]",
			value: this.hitDie
		});
		if ( this.keyAbility ) traits.push({
			label: "BF.Advancement.KeyAbility.Title",
			value: this.keyAbility
		});
		// TODO: Proficiencies
		// TODO: Spellcasting
		return traits;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedDetails() {
		// Hit Die
		const hpAdvancement = this.advancement.byType("hitPoints")[0];
		this.hitDie = hpAdvancement ? `d${hpAdvancement.configuration.denomination}` : "";

		// Key Ability
		const keyAbilityAdvancement = this.advancement.byType("keyAbility")[0];
		if ( keyAbilityAdvancement ) {
			const keyAbilityOptions = keyAbilityAdvancement.configuration.options.map(o => {
				const label = CONFIG.BlackFlag.abilities[o]?.labels.full;
				return label ? game.i18n.localize(label) : o;
			});
			const listFormatter = new Intl.ListFormat(game.i18n.lang, { style: "short", type: "disjunction" });
			this.keyAbility = listFormatter.format(keyAbilityOptions);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	_preCreateAdvancement(data, options, user) {
		if ( data._id || foundry.utils.hasProperty(data, "system.advancement") ) return;
		this._createInitialAdvancement([
			{ type: "hitPoints" }, { type: "keyAbility" },
			{ type: "trait", configuration: { choices: [{ count: 2, pool: ["skills:*"] }] } }
		]);
	}
}
