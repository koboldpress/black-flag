import { simplifyBonus } from "../../utils/_module.mjs";
import LocalDocumentField from "../fields/local-document-field.mjs";
import MappingField from "../fields/mapping-field.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Spellcasting advancement.
 *
 * @property {string} type - General spellcasting type (e.g. "leveled", "pact").
 * @property {string} progression - Specific progression within selected type (e.g. "full", "half", "third").
 * @property {string} ability - Spellcasting ability if not class's key ability.
 * @property {string} source - Source of magic used by spellcasting (e.g. "arcane", "divine").
 * @property {object} cantrips
 * @property {string} cantrips.scale - ID of scale value that represents number of cantrips known.
 * @property {object} rituals
 * @property {string} rituals.scale - ID of scale value that represents number of rituals known.
 * @property {object} spells
 * @property {string} spells.scale - ID of scale value that represents number of spells known.
 * @property {string} spells.mode - Method of learning spells (e.g. "all", "limited", "spellbook").
 * @property {boolean} spells.replacement - Can caster replace spell choice from previous level when leveling up?
 * @property {Set<string} spells.schools - Schools from which chosen spells must be selected.
 * @property {boolean} spells.special - Does one of the first level learned spells ignore normal restrictions?
 * @property {object} spells.spellbook
 * @property {number} spells.spellbook.firstLevel - Number of free spells written in spellbook at level one.
 * @property {number} spells.spellbook.otherLevels - Number of free spells for spellbook at subsequent levels.
 */
export class SpellcastingConfigurationData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			type: new StringField({ initial: "leveled", label: "BF.Spellcasting.Type.Label" }),
			progression: new StringField({
				label: "BF.Spellcasting.Progression.Label",
				hint: "BF.Spellcasting.Progression.Hint"
			}),
			ability: new StringField({ label: "BF.Spellcasting.Ability.Label" }),
			source: new StringField({ label: "BF.Spell.Source.Label" }),
			cantrips: new SchemaField(
				{
					scale: new StringField()
				},
				{ label: "BF.Spellcasting.CantripsKnown.Label", hint: "BF.Spellcasting.CantripsKnown.Hint" }
			),
			rituals: new SchemaField(
				{
					scale: new StringField()
				},
				{ label: "BF.Spellcasting.RitualsKnown.Label", hint: "BF.Spellcasting.RitualsKnown.Hint" }
			),
			spells: new SchemaField(
				{
					scale: new StringField(),
					mode: new StringField({
						label: "BF.Spellcasting.Learning.Mode.Label",
						hint: "BF.Spellcasting.Learning.Mode.Hint"
					}),
					replacement: new BooleanField({
						initial: true,
						label: "BF.Spellcasting.Learning.Replacement.Label",
						hint: "BF.Spellcasting.Learning.Replacement.Hint"
					}),
					schools: new SetField(new StringField(), {
						label: "BF.Spellcasting.Learning.Schools.Label",
						hint: "BF.Spellcasting.Learning.Schools.Hint"
					}),
					special: new BooleanField({
						label: "BF.Spellcasting.Learning.Special.Label",
						hint: "BF.Spellcasting.Learning.Special.Hint"
					}),
					spellbook: new SchemaField(
						{
							firstLevel: new NumberField({ integer: true, min: 0, label: "BF.Spellbook.FreeSpell.FirstLevel" }),
							otherLevels: new NumberField({ integer: true, min: 0, label: "BF.Spellbook.FreeSpell.OtherLevels" })
						},
						{ label: "BF.Spellbook.FreeSpell.Label[other]", hint: "BF.Spellbook.FreeSpell.Hint" }
					)
				},
				{ label: "BF.Spellcasting.SpellsKnown.Label", hint: "BF.Spellcasting.SpellsKnown.Hint" }
			)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Summary label for this spellcasting configuration.
	 * @type {string}
	 */
	get label() {
		const source = CONFIG.BlackFlag.spellSources[this.source]?.label;
		const prepared = this.preparation ? "BF.Spellcasting.Preparation.Trait" : null;
		const typeConfig = CONFIG.BlackFlag.spellcastingTypes[this.type];
		const progression = typeConfig?.progression?.[this.progression]?.trait ?? typeConfig?.trait;
		return game.i18n
			.format("BF.Spellcasting.Trait.Display", {
				source: source ? game.i18n.localize(source) : "",
				prepared: prepared ? game.i18n.localize(prepared) : "",
				progression: progression ? game.i18n.localize(progression) : ""
			})
			.trim();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The max circle available for this advancement in this class or subclass.
	 * @type {number|null}
	 */
	get maxCircle() {
		const item = this.parent.item;
		if (!item.actor?.system.progression?.classes) return null;
		const identifier = item.type === "class" ? item.identifier : item.system.identifier.class;
		return this.parent.computeMaxCircle(item.actor.system.progression.classes[identifier].levels);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The ability used for spellcasting.
	 * @type {string|null}
	 */
	get spellcastingAbility() {
		if (this.ability) return this.ability;

		let parent = this.parent.item;
		if (parent?.type === "subclass" && parent.isEmbedded) {
			parent = parent.actor.system.progression?.classes[parent.system.identifier.class]?.document;
		}

		const keyAbility = parent?.system.advancement.byType("keyAbility")[0];
		return keyAbility?.value?.selected ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Migrations           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		if ("circle" in source) source.source = source.circle;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		const item = this.parent.item;
		const scaleValues = item.system?.advancement.byType("scaleValue") ?? [];
		const spellcastingValues = item.system?.advancement.byType("spellcastingValue") ?? [];

		const prepareScale = (obj, identifier) => {
			Object.defineProperty(obj, "scaleValue", {
				get() {
					return (
						item.system?.advancement.get(obj.scale) ??
						scaleValues?.find(s => s.identifier === identifier) ??
						spellcastingValues?.find(s => s.identifier === identifier)
					);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(obj, "known", {
				get() {
					const scaleValue = obj.scaleValue;
					if (!scaleValue) return 0;
					return simplifyBonus(
						`@scale.${scaleValue.parentIdentifier}.${scaleValue.identifier}`,
						item.getRollData({ deterministic: true })
					);
				},
				configurable: true,
				enumerable: false
			});
		};

		prepareScale(this.cantrips, "cantrips-known");
		prepareScale(this.rituals, "rituals-known");
		prepareScale(this.spells, "spells-known");
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * @typedef {GrantedFeatureData} LearnedSpellData
 * @property {string} slot - Type of slot this fills (e.g. "normal", "cantrip", "ritual", "special", "free").
 */

/**
 * Value data for the Spellcasting advancement.
 *
 * @property {Record<string, LearnedSpellData[]>} added - Spells added at a given level.
 * @property {Record<string, ReplacedFeatureData[]>} replaced - Spells replaced at a given level.
 */
export class SpellcastingValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			added: new MappingField(
				new ArrayField(
					new SchemaField({
						document: new LocalDocumentField(foundry.documents.BaseItem),
						slot: new StringField(),
						uuid: new StringField() // TODO: Replace with UUIDField when available
					})
				),
				{ required: false, initial: undefined }
			),
			replaced: new MappingField(
				new ArrayField(
					new SchemaField({
						level: new NumberField({ integer: true, min: 0 }),
						original: new LocalDocumentField(foundry.documents.BaseItem),
						replacement: new LocalDocumentField(foundry.documents.BaseItem)
					})
				)
			)
		};
	}
}
