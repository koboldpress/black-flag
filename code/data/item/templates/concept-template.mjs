import { IdentifierField } from "../../fields/_module.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition template for Concept items (class, background, lineage, heritage).
 */
export default class ConceptTemplate extends foundry.abstract.DataModel {

	static get metadata() {
		return {
			register: true
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.FullLabel", hint: "BF.Item.Description.FullHint"}),
				short: new StringField({label: "BF.Item.Description.ShortLabel", hint: "BF.Item.Description.ShortHint"}),
				journal: new StringField({label: "BF.Item.Journal.Label", hint: "BF.Item.Journal.Hint"}),
				source: new StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			identifier: new SchemaField({
				value: new IdentifierField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Spellcasting configuration data if defined for this class or subclass.
	 * @type {SpellcastingConfigurationData|null}
	 */
	get spellcasting() {
		return this.advancement.byType("spellcasting")[0]?.configuration ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of the traits to display on the item sheet.
	 * @type {object[]}
	 * @abstract
	 */
	get traits() {
		return [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contribute details on a spellcasting advancement to parent actor if embedded.
	 */
	prepareFinalSpellcastingSource() {
		const parent = this.parent;
		const spellcastingStats = parent.actor?.system.spellcasting?.sources;
		const spellcasting = this.spellcasting;
		if ( !spellcastingStats || !spellcasting ) return;
		const stats = spellcastingStats[parent.identifier] ??= {};
		Object.defineProperty(stats, "document", {
			get() { return parent; },
			configurable: true,
			enumerable: false
		});

		// Spellcasting Ability
		stats.ability = spellcasting.spellcastingAbility;
		const abilityMod = parent.actor.system.abilities[stats.ability]?.mod ?? 0;
		const proficiency = parent.actor.system.attributes.proficiency ?? 0;

		// Spell Attack Modifier
		stats.attack = proficiency + abilityMod;
		// TODO: Add global/spell attack bonuses
		// TODO: Split into melee & ranged spell attack modifiers?

		// Spell Save DC
		stats.dc = 8 + proficiency + abilityMod;
		// TODO: Add global/spell DC bonuses
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create one or more advancement documents when this item is created.
	 * @param {object[]} data - Initial data for advancement documents. Must include "type".
	 * @internal
	 */
	_createInitialAdvancement(data) {
		const advancement = {};
		for ( const initialData of data ) {
			const AdvancementClass = CONFIG.Advancement.types[initialData.type].documentClass;
			if ( !initialData._id ) initialData._id = foundry.utils.randomID();
			const createData = foundry.utils.deepClone(initialData);
			const newAdvancement = new AdvancementClass(initialData, { parent: this.parent });
			newAdvancement._preCreate(createData);
			advancement[initialData._id] = newAdvancement.toObject();
		}
		this.parent.updateSource({"system.advancement": advancement});
	}
}
