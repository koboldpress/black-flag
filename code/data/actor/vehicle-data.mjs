import VehicleSheet from "../../applications/actor/vehicle-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import { formatNumber, formatPace, formatTaggedList, simplifyBonus } from "../../utils/_module.mjs";
import ActorDataModel from "../abstract/actor-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import MappingField from "../fields/mapping-field.mjs";
import HPTemplate from "./templates/hp-template.mjs";
import ModifiersTemplate from "./templates/modifiers-template.mjs";
import ResistancesTemplate from "./templates/resistances-template.mjs";
import SourceTemplate from "./templates/source-template.mjs";

const { ArrayField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data for Vehicle abilities.
 *
 * @typedef {object} VehicleAbilityData
 * @property {number} mod - Ability modifier with proficiency included.
 */

/**
 * Data model for Vehicle actors.
 * @mixes {HPTemplate}
 * @mixes {ModifiersTemplate}
 * @mixes {ResistancesTemplate}
 * @mixes {SourceTemplate}
 *
 * @property {Record<string, VehicleAbilityData} abilities - Vehicle's ability modifiers.
 * @property {object} attributes
 * @property {object} attributes.ac
 * @property {number} attributes.ac.threshold - Damage threshold.
 * @property {number} attributes.ac.value - Armor class.
 * @property {object} attributes.cargo
 * @property {number} attributes.cargo.max - Maximum cargo carrying capacity.
 * @property {string} attributes.cargo.units - Units used to measure cargo capacity.
 * @property {object} attributes.crew
 * @property {number} attributes.crew.required - Crew required for a full complement.
 * @property {object} attributes.passengers
 * @property {number} attributes.passengers.max - Maximum number of passengers that can be carried.
 * @property {object} description
 * @property {string} description.actions - Brief description for the actions section.
 * @property {string} description.bonusActions - Brief description for the bonus actions section.
 * @property {string} description.reactions - Brief description for the reactions section.
 * @property {string} description.value - Biography on the vehicle.
 * @property {number} initiative - Initiative score for the vehicle.
 * @property {object} traits
 * @property {object} traits.dimensions
 * @property {string} traits.dimensions.length - Length of the vehicle.
 * @property {string} traits.dimensions.units - Units used to measure the dimensions.
 * @property {string} traits.dimensions.width - Width of the vehicle.
 * @property {string} traits.size - Vehicle's size category.
 * @property {string} traits.type - Type of vehicle.
 */
export default class VehicleData extends ActorDataModel.mixin(
	HPTemplate,
	ModifiersTemplate,
	ResistancesTemplate,
	SourceTemplate
) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.VEHICLE", "BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = {
		type: "vehicle",
		category: "thing",
		localization: "BF.Actor.Type.Vehicle",
		img: "systems/black-flag/artwork/types/vehicle.svg",
		sheet: {
			application: VehicleSheet,
			label: "BF.Sheet.Default.Vehicle"
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
				}),
				cargo: new SchemaField({
					max: new NumberField(),
					units: new StringField({ initial: "ton" })
				}),
				crew: new SchemaField({
					required: new NumberField()
				}),
				passengers: new SchemaField({
					max: new NumberField()
				})
			}),
			description: new SchemaField({
				actions: new StringField(),
				bonusActions: new StringField(),
				reactions: new StringField(),
				value: new HTMLField()
			}),
			initiative: new NumberField({ initial: 0 }),
			traits: new SchemaField({
				dimensions: new SchemaField({
					length: new NumberField(),
					units: new StringField(),
					width: new NumberField()
				}),
				size: new StringField({ initial: "huge" }),
				movement: new SchemaField({
					custom: new ArrayField(new StringField()),
					tags: new SetField(new StringField()),
					types: new MappingField(new FormulaField({ deterministic: true })),
					units: new StringField({ initial: "foot", label: "BF.MOVEMENT.FIELDS.traits.movement.units.label" })
				}),
				pace: new SchemaField({
					types: new MappingField(new FormulaField({ deterministic: true })),
					units: new StringField({ initial: "mph", label: "BF.MOVEMENT.FIELDS.traits.pace.units.label" })
				}),
				type: new SchemaField({
					value: new StringField({ initial: "land" })
				})
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
		this.traits.movement.multiplier ??= "1";

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
		this.prepareDerivedMovement(rollData);

		// Cargo capacity
		this.attributes.cargo.label = formatNumber(this.attributes.cargo.max ?? 0, {
			unit: this.attributes.cargo.units
		});
		// TODO: Fix this once weight units are fully localized
		if (this.attributes.cargo.units === "ton") {
			this.attributes.cargo.label += ` ${game.i18n.localize("BF.UNITS.WEIGHT.Ton.Label").toLowerCase()}`;
		}
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

	/**
	 * Resolve derived movement data.
	 * @param {object} rollData
	 */
	prepareDerivedMovement(rollData) {
		const movement = this.traits.movement;
		const noMovement = this.hasConditionEffect("noMovement");
		const halfMovement = this.hasConditionEffect("halfMovement");
		const crawl = this.hasConditionEffect("crawl");
		const multiplier = simplifyBonus(movement.multiplier, rollData);
		const modifierData = { type: "movement", actor: this };

		// Calculate each special movement type using base speed
		let types = Object.keys(CONFIG.BlackFlag.movementTypes);
		if (types.includes("walk")) {
			types.findSplice(k => k === "walk");
			types.unshift("walk");
		}

		const entries = new Map();
		for (const type of types) {
			const movementFormula = this.traits.movement.types[type] ?? "";
			const paceFormula = this.traits.pace.types[type] ?? "";

			let speed = simplifyBonus(movementFormula, rollData);
			let pace = simplifyBonus(paceFormula, rollData);
			if (noMovement || (crawl && type !== "walk")) speed = pace = 0;

			if (speed > 0)
				speed += this.buildBonus(this.getModifiers({ ...modifierData, movementType: type }), {
					deterministic: true,
					rollData
				});
			this.traits.movement.types[type] = speed * multiplier * (halfMovement ? 0.5 : 1);
			this.traits.pace.types[type] = pace * multiplier * (halfMovement ? 0.5 : 1);

			const label = CONFIG.BlackFlag.movementTypes.localized[type];
			if (speed && label) {
				let generatedLabel;
				if (type === "walk") generatedLabel = formatNumber(speed, { unit: movement.units });
				else generatedLabel = `${label.toLowerCase()} ${formatNumber(speed, { unit: movement.units })}`;
				if (pace) {
					generatedLabel = game.i18n.format("BF.VEHICLE.FormattedPace", {
						speed: generatedLabel,
						perHour: formatPace(pace, this.traits.pace.units, { unitDisplay: "short" }),
						perDay: formatPace(pace * 24, this.traits.pace.units, { period: "day" })
					});
				}
				entries.set(type, generatedLabel);
			}

			rollData = { ...rollData, [type]: speed };
		}

		// Prepare movement labels
		movement.labels = Object.entries(movement.types)
			.filter(([type, speed]) => speed > 0)
			.sort((lhs, rhs) => rhs[1] - lhs[1])
			.map(([type, speed]) => {
				const config = CONFIG.BlackFlag.movementTypes[type];
				const label = config ? game.i18n.localize(config.label) : type;
				return `${label} ${formatNumber(speed, { unit: movement.units })}`;
			});
		movement.labels.push(...movement.custom);
		movement.label = formatTaggedList({
			entries,
			extras: movement.custom,
			tags: movement.tags,
			tagDefinitions: CONFIG.BlackFlag.movementTags
		});
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
		section.innerHTML = await foundry.applications.handlebars.renderTemplate(
			"systems/black-flag/templates/actor/embeds/vehicle-embed.hbs",
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
		if (
			!foundry.utils.hasProperty(data, "prototypeToken.width") &&
			!foundry.utils.hasProperty(data, "prototypeToken.height")
		) {
			const size = this.scaledTokenSize(foundry.utils.getProperty(data, "system.traits.dimensions") ?? {});
			this.parent.updateSource({ "prototypeToken.width": size.width, "prototypeToken.height": size.height });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		super._onCreate(data, options, userId);
		if (userId === game.user.id && options[game.system.id]?.createResilience) {
			const resilience = await fromUuid("Compendium.black-flag.npcfeatures.Item.4mrsMh1wkqybueGe");
			if (resilience) await this.parent.createEmbeddedDocuments("Item", [game.items.fromCompendium(resilience)]);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preUpdate(changed, options, user) {
		if ((await super._preUpdate(changed, options, user)) === false) return false;

		const changedMaxHP = foundry.utils.getProperty(changed, "system.attributes.hp.max");
		if (changedMaxHP !== undefined) {
			const maxHPDelta = changedMaxHP - this.attributes.hp.baseMax;
			foundry.utils.setProperty(changed, "system.attributes.hp.value", this.attributes.hp.value + maxHPDelta);
		}

		let changedDimensions = foundry.utils.getProperty(changed, "system.traits.dimensions");
		if (
			changedDimensions &&
			(changedDimensions.length !== this.traits.dimensions.length ||
				changedDimensions.width !== this.traits.dimensions.width) &&
			!foundry.utils.hasProperty(changed, "prototypeToken.width") &&
			!foundry.utils.hasProperty(changed, "prototypeToken.height")
		) {
			const size = this.scaledTokenSize(
				foundry.utils.mergeObject(this.traits.dimensions, changedDimensions, { inplace: false })
			);
			foundry.utils.setProperty(changed, "prototypeToken.width", size.width);
			foundry.utils.setProperty(changed, "prototypeToken.height", size.height);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	getInitiativeRollConfig(options = {}) {
		return { fixed: this.initiative };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate adjusted token size based on the provided dimensions.
	 * @param {{ length: number, width: number, units: string }} dimensions
	 * @returns {{ height: number, width: number }}
	 */
	scaledTokenSize(dimensions) {
		const resize = d => Math.max(1, Math.floor((d ?? 0) / 5));
		return { height: resize(dimensions.width), width: resize(dimensions.length) };
	}
}
