import { simplifyBonus } from "../../utils/_module.mjs";
import AdvancementDataModel from "../abstract/advancement-data-model.mjs";
import LocalDocumentField from "../fields/local-document-field.mjs";
import MappingField from "../fields/mapping-field.mjs";

const { ArrayField, BooleanField, DocumentIdField, NumberField, SchemaField, SetField, StringField } =
	foundry.data.fields;

/**
 * Configuration data for the Spellcasting advancement.
 *
 * @property {string} ability - Spellcasting ability if not class's key ability.
 * @property {object} cantrips
 * @property {string} cantrips.scale - ID of scale value that represents number of cantrips known.
 * @property {string} progression - Specific progression within selected type (e.g. "full", "half", "third").
 * @property {object} rituals
 * @property {string} rituals.scale - ID of scale value that represents number of rituals known.
 * @property {boolean} rituals.restricted - Should ritual selection be restricted to a single source?
 * @property {object} slots
 * @property {string} slots.scale - ID of the scale value that represents the number of spell slots.
 * @property {string} source - Source of magic used by spellcasting (e.g. "arcane", "divine").
 * @property {object} spells
 * @property {string} spells.scale - ID of scale value that represents number of spells known.
 * @property {string} spells.mode - Method of learning spells (e.g. "all", "limited", "spellbook").
 * @property {boolean} spells.replacement - Can caster replace spell choice from previous level when leveling up?
 * @property {Set<string} spells.schools - Schools from which chosen spells must be selected.
 * @property {boolean} spells.special - Does one of the first level learned spells ignore normal restrictions?
 * @property {object} spells.spellbook
 * @property {number} spells.spellbook.firstLevel - Number of free spells written in spellbook at level one.
 * @property {number} spells.spellbook.otherLevels - Number of free spells for spellbook at subsequent levels.
 * @property {string} type - General spellcasting type (e.g. "leveled", "pact").
 */
export class SpellcastingConfigurationData extends AdvancementDataModel {
	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Spellcasting"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new StringField({ blank: false, initial: "intelligence" }),
			cantrips: new SchemaField({
				scale: new DocumentIdField()
			}),
			progression: new StringField(),
			rituals: new SchemaField({
				scale: new DocumentIdField(),
				restricted: new BooleanField({ initial: true })
			}),
			slots: new SchemaField({
				scale: new DocumentIdField()
			}),
			source: new StringField(),
			spells: new SchemaField({
				scale: new DocumentIdField(),
				mode: new StringField(),
				replacement: new BooleanField(),
				schools: new SetField(new StringField()),
				special: new BooleanField(),
				spellbook: new SchemaField({
					firstLevel: new NumberField({ integer: true, min: 0 }),
					otherLevels: new NumberField({ integer: true, min: 0 })
				})
			}),
			type: new StringField({ initial: "leveled" })
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
	/*            Data Migration           */
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
			Object.defineProperty(obj, identifier === "spell-slots" ? "max" : "known", {
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
		prepareScale(this.slots, "spell-slots");
		prepareScale(this.spells, "spells-known");
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * @typedef {GrantedFeatureData} LearnedSpellData
 * @property {string} slot - Type of slot this fills (e.g. "normal", "cantrip", "ritual", "special", "free").
 */

/**
 * @typedef {ReplacedFeatureData} ReplacedSpellData
 * @property {string} slot - Type of slot replaced.
 */

/**
 * Value data for the Spellcasting advancement.
 *
 * @property {Record<string, LearnedSpellData[]>} added - Spells added at a given level.
 * @property {Record<string, ReplacedFeatureData>} replaced - Spells replaced at a given level.
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
				new SchemaField({
					level: new NumberField({ integer: true, min: 0 }),
					original: new DocumentIdField(),
					replacement: new DocumentIdField(),
					slot: new StringField()
				})
			)
		};
	}
}
