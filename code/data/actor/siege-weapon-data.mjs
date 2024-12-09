import SiegeWeaponSheet from "../../applications/actor/siege-weapon-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import ActorDataModel from "../abstract/actor-data-model.mjs";
import MappingField from "../fields/mapping-field.mjs";
import HPTemplate from "./templates/hp-template.mjs";
import ModifiersTemplate from "./templates/modifiers-template.mjs";
import ResistancesTemplate from "./templates/resistances-template.mjs";
import SourceTemplate from "./templates/source-template.mjs";

const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data for Siege Weapon abilities.
 *
 * @typedef {object} SiegeWeaponAbilityData
 * @property {number} mod - Ability modifier with proficiency included.
 */

/**
 * Data model for Siege Weapon actors.
 * @mixes {HPTemplate}
 * @mixes {ModifiersTemplate}
 * @mixes {SourceTemplate}
 * @mixes {TraitsTemplate}
 *
 * @property {Record<string, SiegeWeaponAbilityData} abilities - Siege weapon's ability modifiers.
 * @property {object} attributes
 * @property {object} attributes.ac
 * @property {number} attributes.ac.threshold - Damage threshold.
 * @property {number} attributes.ac.value - Armor class.
 * @property {object} description
 * @property {string} description.value - Description of the siege weapon.
 * @property {object} traits
 * @property {string} traits.size - Vehicle's size category.
 */
export default class SiegeWeaponData extends ActorDataModel.mixin(
	HPTemplate,
	ModifiersTemplate,
	ResistancesTemplate,
	SourceTemplate
) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.SIEGEWEAPON", "BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = {
		type: "siege",
		category: "thing",
		localization: "BF.Actor.Type.SiegeWeapon",
		img: "systems/black-flag/artwork/types/siege-weapon.svg",
		sheet: {
			application: SiegeWeaponSheet,
			label: "BF.Sheet.Default.SiegeWeapon"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			abilities: new MappingField(new SchemaField({ mod: new NumberField({ integer: true }) }), {
				initialKeys: CONFIG.BlackFlag.abilities,
				prepareKeys: true
			}),
			attributes: new SchemaField({
				ac: new SchemaField({
					threshold: new NumberField(),
					value: new NumberField()
				})
			}),
			description: new SchemaField({
				value: new HTMLField()
			}),
			traits: new SchemaField({
				size: new StringField({ initial: "large" })
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get embeddedDescriptionKeyPath() {
		return "description.value";
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

		this.attributes.proficiency = 0;

		this.prepareBaseModifiers();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		const rollData = this.parent.getRollData({ deterministic: true });

		this.prepareSource();
		this.prepareDerivedHitPoints();
		this.prepareDerivedModifiers();
		this.prepareDerivedResistances();

		this.prepareDerivedAbilities(rollData);
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
	/*          Embeds & Tooltips          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbed(config, options = {}) {
		for (const value of config.values) {
			if (value === "statblock") config.statblock = true;
		}
		if (!config.statblock) return super.toEmbed(config, options);

		const context = await this.parent.sheet.getData();
		context.name = config.label || this.parent.name;
		if (config.cite === true) {
			context.anchor = this.parent.toAnchor({ name: context.name }).outerHTML;
			config.cite = false;
		}
		const section = document.createElement("section");
		section.innerHTML = await renderTemplate(
			"systems/black-flag/templates/actor/embeds/siege-weapon-embed.hbs",
			context
		);
		return section.children;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		if ((await super._preCreate(data, options, user)) === false) return false;
		if (!data._id && !data.items?.length) {
			foundry.utils.setProperty(options, `${game.system.id}.createResilience`, true);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		super._onCreate(data, options, userId);
		if (userId === game.user.id && options[game.system.id]?.createResilience) {
			const resilience = await fromUuid("Compendium.black-flag.npcfeatures.Item.rViKTBoqaXbonMPo");
			if (resilience) await this.parent.createEmbeddedDocuments("Item", [game.items.fromCompendium(resilience)]);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	getInitiativeRollConfig(options = {}) {
		return { fixed: 0 };
	}
}
