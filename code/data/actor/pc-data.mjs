import PCSheet from "../../applications/actor/pc-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import ActorDataModel from "../abstract/actor-data-model.mjs";
import * as fields from "../fields/_module.mjs";

export default class PCData extends ActorDataModel {

	static metadata = {
		type: "pc",
		category: "person",
		localization: "BF.Actor.Type.PC",
		sheet: {
			application: PCSheet,
			label: "BF.Sheet.PC"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return {
			abilities: new fields.MappingField(new foundry.data.fields.SchemaField({
				base: new foundry.data.fields.NumberField({min: 0, integer: true}),
				max: new foundry.data.fields.NumberField({min: 0, initial: 20, integer: true}),
				save: new foundry.data.fields.SchemaField({
					proficiency: new foundry.data.fields.SchemaField({
						multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 1, step: 0.5})
					})
				})
				// Bonuses?
				// Minimums?
			}), {
				initialKeys: CONFIG.BlackFlag.abilities, prepareKeys: true
			}),
			attributes: new foundry.data.fields.SchemaField({
				ac: new foundry.data.fields.SchemaField({
					// Formulas
					// Override
				}),
				death: new foundry.data.fields.SchemaField({
					// Successes
					// Failures
					// Successes required override
					// Failures required override
					// Target threshold override
				}),
				hd: new foundry.data.fields.SchemaField({
					// Spent per denomination
					// Minimum roll
					// Recovery percentage
				}),
				hp: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.NumberField({min: 0, integer: true}),
					temp: new foundry.data.fields.NumberField({min: 0, integer: true})
					// Temp max
					// Bonuses
					// Multiplier
				}),
				// Initiative?
				luck: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.NumberField({min: 0, max: 5, integer: true})
				})
			}),
			biography: new foundry.data.fields.SchemaField({
				value: new foundry.data.fields.HTMLField(),
				age: new foundry.data.fields.StringField(),
				height: new foundry.data.fields.StringField(),
				weight: new foundry.data.fields.StringField(),
				eyes: new foundry.data.fields.StringField(),
				skin: new foundry.data.fields.StringField(),
				hair: new foundry.data.fields.StringField()
				// Motivation?
				// Backstory?
				// Allies & Organizations?
			}),
			proficiencies: new foundry.data.fields.SchemaField({
				armor: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				}),
				languages: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField()),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				skills: new fields.MappingField(new foundry.data.fields.SchemaField({
					proficiency: new foundry.data.fields.SchemaField({
						multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 0, step: 0.5})
					})
					// Bonuses?
					// Minimum?
				}), {
					initialKeys: CONFIG.BlackFlag.skills, prepareKeys: true
				}),
				tools: new fields.MappingField(new foundry.data.fields.SchemaField({
					proficiency: new foundry.data.fields.SchemaField({
						multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 1, step: 0.5})
					})
					// Default ability
					// Bonuses?
					// Minimum?
				})),
				weapons: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				})
			}),
			progression: new foundry.data.fields.SchemaField({
				abilities: new foundry.data.fields.SchemaField({
					method: new foundry.data.fields.StringField(),
					rolls: new foundry.data.fields.ArrayField(new fields.RollField({ nullable: true })),
					assignments: new fields.MappingField(new foundry.data.fields.NumberField({min: 0, integer: true})),
					bonuses: new fields.MappingField(new foundry.data.fields.NumberField({integer: true}))
				}),
				// TODO: Currently falls back to being a plain object. This logic will need to be improved to ensure
				// advancement value type data is properly loaded once advancements can be loaded.
				advancement: new fields.AdvancementValueField(),
				background: new fields.LocalDocumentField(foundry.documents.BaseItem),
				heritage: new fields.LocalDocumentField(foundry.documents.BaseItem),
				lineage: new fields.LocalDocumentField(foundry.documents.BaseItem),
				levels: new fields.MappingField(new foundry.data.fields.SchemaField({
					class: new fields.LocalDocumentField(foundry.documents.BaseItem),
					time: new fields.TimeField()
				})),
				xp: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.NumberField({min: 0, integer: true}),
					log: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
						amount: new foundry.data.fields.NumberField({nullable: false, initial: 0, min: 0, integer: true}),
						time: new fields.TimeField(),
						source: new foundry.data.fields.StringField()
					}))
				})
			}),
			// Rolls (contains bonuses, minimums, ability overrides, etc.)?
			// Spellcasting
			traits: new foundry.data.fields.SchemaField({
				movement: new foundry.data.fields.SchemaField({
					base: new foundry.data.fields.NumberField({nullable: false, initial: 30, min: 0, step: 0.1}),
					types: new fields.MappingField(new fields.FormulaField({deterministic: true})),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
					// Units?
					// Multiplier
				}),
				senses: new foundry.data.fields.SchemaField({
					types: new fields.MappingField(new fields.FormulaField({deterministic: true})),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				size: new foundry.data.fields.StringField(),
				type: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.StringField(),
					tags: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				}),
				resistances: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField()),
					bypasses: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				immunities: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField()),
					bypasses: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				vulnerabilities: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				}),
				conditionImmunities: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				})
				// TODO: Perhaps condition immunities could just be stored with damage immunities
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseRegistration() {
		if ( !CONFIG.BlackFlag.registration.ready ) {
			CONFIG.BlackFlag.registration.reinitiatlizeOnReady.add(this.parent);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseAbilities() {
		this.progression.abilities.assignmentComplete = true;
		for ( const [key, ability] of Object.entries(this.abilities) ) {
			ability._source = this._source.abilities?.[key] ?? {};
			ability.check ??= {};
			ability.value = ability.base;
			if ( !ability.base ) this.progression.abilities.assignmentComplete = false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseProficiency() {
		this.attributes.proficiency = Proficiency.calculateMod(this.progression.level ?? 1);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedAbilities() {
		for ( const [key, ability] of Object.entries(this.abilities) ) {
			const config = CONFIG.BlackFlag.abilities[key];
			ability.mod = ability.value ? Math.floor((ability.value - 10) / 2) : null;

			ability.check.proficiency = new Proficiency(
				this.attributes.proficiency, 0, "down"
			);
			ability.save.proficiency = new Proficiency(
				this.attributes.proficiency, ability.save.proficiency.multiplier, "down"
			);

			ability.check.mod = ability.mod + ability.check.proficiency.flat;
			ability.save.mod = ability.mod + ability.save.proficiency.flat;
			ability.dc = 8 + ability.mod + this.attributes.proficiency;

			ability.labels = config.labels;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedClasses() {
		this.progression.classes = {};
		for ( const [level, data] of Object.entries(this.progression.levels) ) {
			const document = data.class;
			if ( !document ) continue;
			const classData = this.progression.classes[data.class.identifier] ??= { document, levels: 0 };
			classData.levels += 1;
			data.levels = { character: Number(level), class: classData.levels };
		}
		const pluralRules = new Intl.PluralRules(game.i18n.lang);
		for ( const data of Object.values(this.progression.classes) ) {
			data.levelsLabel = game.i18n.format(`BF.Level.Count[${pluralRules.select(data.levels)}]`, {
				number: data.levels
			});
		}
		this.progression.level = Object.keys(this.progression.levels).length;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedHitPoints() {
		// TODO: This will need to be updated to handle multiple classes later, but will work for level 1
		const hpAdvancement = this.progression.levels[1]?.class?.system.advancement.byType("hitPoints")[0];
		if ( !hpAdvancement ) return;
		const hp = this.attributes.hp;
		const ability = this.abilities[CONFIG.BlackFlag.defaultAbilities.hitPoints];
		const base = hpAdvancement.getAdjustedTotal(ability?.mod ?? 0);
		hp.max = base;
		hp.value = Math.clamped(hp.value, 0, hp.max);
		hp.damage = hp.max - hp.value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedInitiative() {
		const init = this.attributes.initiative ??= {};
		init.ability = CONFIG.BlackFlag.defaultAbilities.initiative;
		const ability = this.abilities[init.ability];

		init.proficiency = new Proficiency(this.attributes.prof, 0);
		init.mod = (ability?.mod ?? 0) + init.proficiency.flat;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedSkills() {
		for ( const [key, skill] of Object.entries(this.proficiencies.skills) ) {
			skill._source = this._source.skills?.[key] ?? {};
			const config = CONFIG.BlackFlag.skills[key];

			skill.ability = config.ability;

			skill.proficiency = new Proficiency(
				this.attributes.proficiency, skill.proficiency.multiplier, "down"
			);

			const ability = this.abilities[skill.ability];
			skill.mod = (ability?.mod ?? 0) + skill.proficiency.flat;
			skill.passive = 10 + skill.mod;

			skill.labels = {
				name: config.label,
				ability: ability?.labels.abbreviation
			};
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Progression             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set a lineage, heritage, or background item on the actor.
	 * @param {BlackFlagItem} document - Document to set.
	 * @returns {Promise}
	 */
	async setConcept(document) {
		if ( !["lineage", "heritage", "background"].includes(document.type) ) throw new Error(
			`Documents of the type ${document.type} cannot be set using the setConcept method.`
		);
		if ( this.progression[document.type] ) throw new Error(
			`A ${document.type} already exists on the actor ${this.parent.name}.`
		);

		const newDocument = await this.parent.createEmbeddedDocuments("Item", [document.toObject()], {render: false});
		return this.parent.update({[`system.progression.${document.type}`]: newDocument[0]});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Level up using the provided class.
	 * @param {BlackFlagItem} cls - Class in which to level up.
	 * @returns {Promise}
	 */
	async levelUp(cls) {
		const levels = {
			character: (this.progression.level ?? 0) + 1,
			class: (this.progression.classes[cls.identifier]?.levels ?? 0) + 1
		};
		if ( levels.character > CONFIG.BlackFlag.maxLevel ) throw new Error(
			`Character cannot be leveled up past ${CONFIG.BlackFlag.maxLevel}.`
		);

		// Create class if it doesn't already exist on actor
		let existingClass = this.progression.classes[cls.identifier]?.document;
		if ( !existingClass ) {
			existingClass = (await this.parent.createEmbeddedDocuments("Item", [cls.toObject()], {render: false}))[0];
		}

		// Add new progression data
		await this.parent.update({[`system.progression.levels.${levels.character}.class`]: existingClass});

		// Apply advancements for the new level
		for ( const advancement of this.parent.advancementForLevel(levels.character) ) {
			await advancement.apply(levels, undefined, { initial: true });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Level down the character one level.
	 * @returns {Promise}
	 */
	async levelDown() {
		const cls = this.progression.levels[this.progression.level].class;
		const levels = { character: this.progression.level, class: this.progression.classes[cls.identifier].levels };

		// Remove advancements for the old level
		for ( const advancement of this.parent.advancementForLevel(levels.character) ) {
			await advancement.reverse(levels);
		}

		// Remove progression data for level
		await this.parent.update({[`system.progression.levels.-=${this.progression.level}`]: null});

		// If class has no more levels, remove it from the actor
		if ( levels.class <= 1 ) await this.parent.deleteEmbeddedDocuments("Item", [cls.id]);
	}
}
