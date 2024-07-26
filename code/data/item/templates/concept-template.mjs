import IdentifierField from "../../fields/identifier-field.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition template for Concept items (class, background, lineage, heritage).
 *
 * @property {object} description
 * @property {string} description.short - Brief description that appears in the selection dialog.
 * @property {string} description.journal - UUID of a journal page describing this item in further detail.
 * @property {object} identifier
 * @property {string} identifier.value - This item's unique identifier.
 */
export default class ConceptTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			description: new SchemaField({
				short: new StringField({label: "BF.Item.Description.ShortLabel", hint: "BF.Item.Description.ShortHint"}),
				journal: new StringField({label: "BF.Item.Journal.Label", hint: "BF.Item.Journal.Hint"})
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
	 * Should be called during the `prepareFinalData` stage.
	 */
	prepareSpellcastingSource() {
		const parent = this.parent;
		const spellcasting = this.spellcasting;
		if ( !this.parent.actor || !spellcasting ) return;
		const spellcastingOrigins = parent.actor.system.spellcasting.origins ??= {};
		const origin = spellcastingOrigins[parent.identifier] ??= {};

		Object.defineProperty(origin, "document", {
			get() { return parent; },
			configurable: true,
			enumerable: false
		});
		Object.defineProperty(origin, "spellcasting", {
			get() { return spellcasting; },
			configurable: true,
			enumerable: false
		});

		// Spellcasting Ability
		origin.ability = spellcasting.spellcastingAbility;
		const abilityMod = parent.actor.system.abilities[origin.ability]?.mod ?? 0;
		const proficiency = parent.actor.system.attributes.proficiency ?? 0;

		// Spell Attack Modifier
		origin.attack = proficiency + abilityMod;
		// TODO: Add global/spell attack bonuses
		// TODO: Split into melee & ranged spell attack modifiers?

		// Spell Save DC
		origin.dc = 8 + proficiency + abilityMod;
		// TODO: Add global/spell DC bonuses

		// Knowable cantrips/rituals/spells
		parent.actor.system.spellcasting.spells ??= {};
		const stats = parent.actor.system.spellcasting.spells.knowable ??= {};
		for ( const type of ["cantrips", "rituals", "spells"] ) {
			origin[type] ??= { value: 0 };
			origin[type].max = spellcasting[type].known;
			stats[type] += spellcasting[type].known;
		}
		if ( spellcasting.spells.mode === "spellbook" ) {
			const identifier = parent.type === "subclass" ? parent.system.identifier.class : parent.identifier;
			const levels = parent.actor.system.progression.classes[identifier]?.levels ?? 0;
			origin.spellbook ??= { value: 0, max: 0 };
			origin.spellbook.max = spellcasting.spells.spellbook.firstLevel ?? 0;
			origin.spellbook.max += (spellcasting.spells.spellbook.otherLevels ?? 0) * (levels - 1);
		}
		const canPrepare = CONFIG.BlackFlag.spellLearningModes[spellcasting.spells.mode]?.prepared;
		if ( canPrepare ) {
			origin.prepared ??= { value: 0 };
			const abilityMod = parent.actor?.system.abilities[spellcasting.spellcastingAbility]?.mod;
			origin.prepared.max = (this.levels ?? 0) + (abilityMod ?? 0);
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
