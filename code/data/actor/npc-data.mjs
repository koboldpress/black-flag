import NPCSheet from "../../applications/actor/npc-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import ActorDataModel from "../abstract/actor-data-model.mjs";
import CreatureTypeField from "../fields/creature-type-field.mjs";
import MappingField from "../fields/mapping-field.mjs";
import SourceField from "../fields/source-field.mjs";
import ACTemplate from "./templates/ac-template.mjs";
import ConditionsTemplate from "./templates/conditions-template.mjs";
import InitiativeTemplate from "./templates/initiative-template.mjs";
import LanguagesTemplate from "./templates/languages-template.mjs";
import ModifiersTemplate from "./templates/modifiers-template.mjs";
import SpellcastingTemplate from "./templates/spellcasting-template.mjs";
import TraitsTemplate from "./templates/traits-template.mjs";

const { BooleanField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data for NPC abilities.
 *
 * @typedef {object} NPCAbilityData
 * @property {number} mod - Ability modifier with proficiency included.
 * @property {boolean} proficient - Is the NPC proficient in this ability?
 */

/**
 * Data model for NPC actors.
 * @mixes {ACTemplate}
 * @mixes {ConditionsTemplate}
 * @mixes {InitiativeTemplate}
 * @mixes {LanguagesTemplate}
 * @mixes {ModifiersTemplate}
 * @mixes {TraitsTemplate}
 *
 * @property {Record<string, NPCAbilityData} abilities - NPC's ability modifiers.
 * @property {object} attributes
 * @property {number} attributes.cr - Challenge rating.
 * @property {object} attributes.hp
 * @property {number} attributes.hp.value - Current hit points.
 * @property {number} attributes.hp.max - Maximum hit points.
 * @property {number} attributes.hp.temp - Temporary hit points.
 * @property {number} attributes.legendary.spent - Number of spent legendary actions this round.
 * @property {number} attributes.legendary.max - Number of available legendary actions per round.
 * @property {number} attributes.perception - Creature's perception score.
 * @property {number} attributes.stealth - Creature's stealth score.
 * @property {object} biography
 * @property {string} biography.value - Biography on the creature.
 * @property {string} biography.legendary - Override of the legendary actions description.
 * @property {SourceField} biography.source - Source of the creature's stat block.
 * @property {object} spellcasting
 * @property {string} spellcasting.ability - Ability used for spellcasting.
 * @property {number} spellcasting.dc - Spell save DC if not auto-calculated.
 * @property {object} traits
 * @property {CreatureTypeField} traits.type - Creature type information.
 */
export default class NPCData extends ActorDataModel.mixin(
	ACTemplate,
	ConditionsTemplate,
	InitiativeTemplate,
	LanguagesTemplate,
	ModifiersTemplate,
	TraitsTemplate
) {
	/** @inheritDoc */
	static metadata = {
		type: "npc",
		category: "person",
		localization: "BF.Actor.Type.NPC",
		img: "systems/black-flag/artwork/types/npc.svg",
		sheet: {
			application: NPCSheet,
			label: "BF.Sheet.Default.NPC"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			abilities: new MappingField(
				new SchemaField({
					mod: new NumberField({ integer: true }),
					proficient: new BooleanField()
				}),
				{
					initialKeys: CONFIG.BlackFlag.abilities,
					prepareKeys: true,
					label: "BF.Ability.Label[other]"
				}
			),
			attributes: new SchemaField({
				ac: new SchemaField({
					baseFormulas: new SetField(new StringField(), {
						initial: ["unarmored", "armored", "natural"]
					})
				}),
				cr: new NumberField({ nullable: false, min: 0, initial: 0, label: "BF.ChallengeRating.Label" }),
				hp: new SchemaField(
					{
						value: new NumberField({ min: 0, integer: true, label: "BF.HitPoint.Current.LabelLong" }),
						max: new NumberField({ min: 0, integer: true, label: "BF.HitPoint.Max.LabelLong" }),
						temp: new NumberField({ min: 0, integer: true, label: "BF.HitPoint.Temp.LabelLong" })
					},
					{ label: "BF.HitPoint.Label[other]" }
				),
				legendary: new SchemaField({
					spent: new NumberField({ min: 0, initial: 0, integer: true }),
					max: new NumberField({ min: 1, initial: null, integer: true })
				}),
				perception: new NumberField({ min: 0, integer: true, label: "BF.Skill.Perception.Label" }),
				stealth: new NumberField({ min: 0, integer: true, label: "BF.Skill.Stealth.Label" })
			}),
			biography: new SchemaField({
				value: new HTMLField(),
				legendary: new HTMLField(),
				source: new SourceField()
			}),
			spellcasting: new SchemaField({
				ability: new StringField({ initial: "intelligence" }),
				dc: new NumberField({ integer: true, min: 0 })
			}),
			traits: new SchemaField({
				type: new CreatureTypeField(),
				size: new StringField({ initial: "medium" })
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * XP value for this NPC based on its CR.
	 * @type {number}
	 */
	get xpValue() {
		const index =
			this.attributes.cr >= 1 ? this.attributes.cr + 3 : { 0: 0, 0.125: 1, 0.25: 2, 0.5: 3 }[this.attributes.cr];
		return CONFIG.BlackFlag.xpForCR[index] ?? 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate source data to an object.
	 * Added in 0.9.031
	 * @param {object} source - The candidate source data from which the model will be constructed.
	 */
	static migrateSource(source) {
		if (foundry.utils.getType(source.biography?.source) === "string") {
			source.biography.source = { fallback: source.biography.source };
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();

		for (const [key, ability] of Object.entries(this.abilities)) {
			ability._source = this._source.abilities?.[key] ?? {};
			ability.check ??= {};
			ability.save ??= {};
		}

		this.attributes.proficiency = Proficiency.calculateMod(Math.max(this.attributes.cr ?? 1, 1));

		this.prepareBaseArmorFormulas();
		this.prepareBaseModifiers();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareEmbeddedData() {
		super.prepareEmbeddedData();

		// Conditions
		// TODO: Refactor this out into mixin
		this.conditions = {};
		for (const effect of this.parent.effects) {
			const identifier = effect.statuses.first();
			const level = foundry.utils.getProperty(effect, "flags.black-flag.condition.level");
			if (!identifier) continue;
			this.conditions[identifier] = Math.max(this.conditions[identifier] ?? 0, level ?? 1);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		const rollData = this.parent.getRollData({ deterministic: true });

		this.prepareConditions();
		this.prepareLanguages();
		this.prepareDerivedModifiers();
		this.prepareDerivedTraits(rollData);

		this.prepareDerivedAbilities(rollData);

		// Hit Points
		const hp = this.attributes.hp;
		hp.max ??= 0;
		if (this.attributes.exhaustion >= 4) hp.max = Math.floor(hp.max * 0.5);
		hp.value = Math.clamp(hp.value, 0, hp.max);
		hp.damage = hp.max - hp.value;

		// Initiative
		this.computeInitiative();

		// Languages
		Object.defineProperty(this.proficiencies.languages, "list", {
			get() {
				return Array.from(this.value).join(" ");
			},
			configurable: true,
			enumerable: false
		});

		// Legendary Actions
		this.attributes.legendary.max ??= 0;
		this.attributes.legendary.value = Math.clamp(
			this.attributes.legendary.max - this.attributes.legendary.spent,
			0,
			this.attributes.legendary.max
		);

		// Perception & Stealth
		this.attributes.perception ??= 10 + (this.abilities.wisdom?.mod ?? 0);
		this.attributes.stealth ??= 10 + (this.abilities.dexterity?.mod ?? 0);
		if (this.attributes.ac.equippedArmor?.system.properties.has("noisy")) {
			this.attributes.baseStealth = this.attributes.stealth;
			this.attributes.stealth -= 5;
		}

		// Spellcasting
		const ability = this.abilities[this.spellcasting.ability];
		this.spellcasting.autoDC = 8 + (ability?.mod ?? 0) + this.attributes.proficiency;
		this.spellcasting.cantripScale = SpellcastingTemplate.calculateCantripScale(Math.max(this.attributes.cr ?? 1, 1));
		this.spellcasting.dc ??= this.spellcasting.autoDC;

		this.computeArmorClass();
		this.computeInitiative();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare abilities.
	 * @param {object} rollData
	 */
	prepareDerivedAbilities(rollData) {
		for (const [key, ability] of Object.entries(this.abilities)) {
			ability.valid = ability.mod !== null;
			ability.mod ??= 0;
			ability.adjustedMod = ability.mod - (ability.proficient ? this.attributes.proficiency : 0);

			ability.check.proficiency = new Proficiency(this.attributes.proficiency, 0, "down");
			ability.save.proficiency = new Proficiency(this.attributes.proficiency, 0, "down");

			const checkData = { type: "ability-check", ability: key, proficiency: ability.check.proficiency.multiplier };
			ability.check.modifiers = {
				_data: checkData,
				bonus: this.getModifiers(checkData),
				minimum: this.getModifiers(checkData, "min"),
				notes: this.getModifiers(checkData, "note")
			};
			ability.check.bonus = this.buildBonus(ability.check.modifiers.bonus, { deterministic: true, rollData });
			const saveData = { type: "ability-save", ability: key, proficiency: ability.save.proficiency.multiplier };
			ability.save.modifiers = {
				_data: saveData,
				bonus: this.getModifiers(saveData),
				minimum: this.getModifiers(saveData, "min"),
				notes: this.getModifiers(saveData, "note")
			};
			ability.save.bonus = this.buildBonus(ability.save.modifiers.bonus, { deterministic: true, rollData });

			ability.check.mod = ability.mod + ability.check.proficiency.flat + ability.check.bonus;
			ability.save.mod = ability.mod + ability.save.proficiency.flat + ability.save.bonus;
			ability.dc = 8 + ability.mod + this.attributes.proficiency;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _preUpdateHP(changed, options, user) {
		const changedMaxHP = foundry.utils.getProperty(changed, "system.attributes.hp.max");
		if (changedMaxHP !== undefined) {
			const maxHPDelta = changedMaxHP - this.attributes.hp.max;
			foundry.utils.setProperty(changed, "system.attributes.hp.value", this.attributes.hp.value + maxHPDelta);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Reset combat-related uses.
	 * @param {string[]} periods - Which recovery periods should be considered.
	 * @returns {Promise<Combatant>}
	 */
	async recoverCombatUses(periods) {
		// Recover legendary actions
		if (this.attributes.legendary.max && periods.includes("roundEnd")) {
			await this.parent.update({ "system.attributes.legendary.spent": 0 });
		}
	}
}
