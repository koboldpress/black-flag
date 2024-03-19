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
		const spellcasting = this.spellcasting;
		if ( !this.parent.actor || !spellcasting ) return;
		const spellcastingSources = parent.actor.system.spellcasting.sources ??= {};
		const source = spellcastingSources[parent.identifier] ??= {};

		Object.defineProperty(source, "document", {
			get() { return parent; },
			configurable: true,
			enumerable: false
		});
		Object.defineProperty(source, "spellcasting", {
			get() { return spellcasting; },
			configurable: true,
			enumerable: false
		});

		// Spellcasting Ability
		source.ability = spellcasting.spellcastingAbility;
		const abilityMod = parent.actor.system.abilities[source.ability]?.mod ?? 0;
		const proficiency = parent.actor.system.attributes.proficiency ?? 0;

		// Spell Attack Modifier
		source.attack = proficiency + abilityMod;
		// TODO: Add global/spell attack bonuses
		// TODO: Split into melee & ranged spell attack modifiers?

		// Spell Save DC
		source.dc = 8 + proficiency + abilityMod;
		// TODO: Add global/spell DC bonuses

		// Knowable cantrips/rituals/spells
		parent.actor.system.spellcasting.spells ??= {};
		const stats = parent.actor.system.spellcasting.spells.knowable ??= {};
		for ( const type of ["cantrips", "rituals", "spells"] ) {
			source[type] ??= { value: 0 };
			source[type].max = spellcasting[type].known;
			stats[type] += spellcasting[type].known;
		}
		if ( spellcasting.spells.mode === "spellbook" ) {
			const identifier = parent.type === "subclass" ? parent.system.identifier.class : parent.identifier;
			const levels = parent.actor.system.progression.classes[identifier]?.levels ?? 0;
			source.spellbook ??= { value: 0, max: 0 };
			source.spellbook.max = spellcasting.spells.spellbook.firstLevel ?? 0;
			source.spellbook.max += (spellcasting.spells.spellbook.otherLevels ?? 0) * (levels - 1);
		}
		const canPrepare = CONFIG.BlackFlag.spellLearningModes[spellcasting.spells.mode]?.prepared;
		if ( canPrepare ) {
			source.prepared ??= { value: 0 };
			const abilityMod = parent.actor?.system.abilities[spellcasting.spellcastingAbility]?.mod;
			source.prepared.max = (this.levels ?? 0) + (abilityMod ?? 0);
		}
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
