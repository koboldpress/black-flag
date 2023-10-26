import PCSheet from "../../applications/actor/pc-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import { filter, simplifyBonus } from "../../utils/_module.mjs";
import ActorDataModel from "../abstract/actor-data-model.mjs";
import * as fields from "../fields/_module.mjs";

export default class PCData extends ActorDataModel {

	static metadata = {
		type: "pc",
		category: "person",
		localization: "BF.Actor.Type.PC",
		sheet: {
			application: PCSheet,
			label: "BF.Sheet.Default.PC"
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
						multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 0, step: 0.5})
					})
				})
			}), {
				initialKeys: CONFIG.BlackFlag.abilities, prepareKeys: true, label: "BF.Ability.Label[other]"
			}),
			attributes: new foundry.data.fields.SchemaField({
				ac: new foundry.data.fields.SchemaField({
					baseFormulas: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
						initial: ["unarmored", "armored"]
					}),
					formulas: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
						label: new foundry.data.fields.StringField(),
						formula: new fields.FormulaField({deterministic: true}),
						armored: new foundry.data.fields.BooleanField({nullable: true, initial: null}),
						shielded: new foundry.data.fields.BooleanField({nullable: true, initial: null})
					})),
					flat: new foundry.data.fields.NumberField({min: 0, integer: true}),
					override: new foundry.data.fields.NumberField({min: 0, integer: true})
				}, {label: "BF.ArmorClass.Label"}),
				death: new foundry.data.fields.SchemaField({
					// Successes
					// Failures
					// Successes required override
					// Failures required override
					// Target threshold override
				}),
				hd: new foundry.data.fields.SchemaField({
					d: new fields.MappingField(new foundry.data.fields.SchemaField({
						spent: new foundry.data.fields.NumberField({min: 0, integer: true})
					}))
					// Recovery percentage
				}, {label: "BF.HitDie.Label[other]"}),
				hp: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.NumberField({min: 0, integer: true, label: "BF.HitPoint.Current.LabelLong"}),
					temp: new foundry.data.fields.NumberField({min: 0, integer: true, label: "BF.HitPoint.Temp.LabelLong"}),
					// Temp max
					bonuses: new foundry.data.fields.SchemaField({
						level: new fields.FormulaField({deterministic: true}),
						overall: new fields.FormulaField({deterministic: true})
					})
					// Multiplier
				}, {label: "BF.HitPoint.Label[other]"}),
				// Initiative?
				luck: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.NumberField({min: 0, max: 5, integer: true})
				}, {label: "BF.Luck.Label"})
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
			modifiers: new fields.ModifierField(),
			proficiencies: new foundry.data.fields.SchemaField({
				armor: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				}),
				languages: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				skills: new fields.MappingField(new foundry.data.fields.SchemaField({
					proficiency: new foundry.data.fields.SchemaField({
						multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 0, step: 0.5})
					})
				}), {
					initialKeys: CONFIG.BlackFlag.skills, prepareKeys: true, label: "BF.Skill.Label[other]"
				}),
				tools: new fields.MappingField(new foundry.data.fields.SchemaField({
					proficiency: new foundry.data.fields.SchemaField({
						multiplier: new foundry.data.fields.NumberField({min: 0, max: 2, initial: 1, step: 0.5})
					})
					// Default ability
				}), {label: "BF.Tool.Label[other]"}),
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
				}), {label: "BF.Level.Label[other]"}),
				xp: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.NumberField({min: 0, integer: true}),
					log: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
						amount: new foundry.data.fields.NumberField({nullable: false, initial: 0, min: 0, integer: true}),
						time: new fields.TimeField(),
						source: new foundry.data.fields.StringField()
					}))
				})
			}, {label: "BF.Progression.Label"}),
			// Rolls (contains bonuses, minimums, ability overrides, etc.)?
			// Spellcasting
			traits: new foundry.data.fields.SchemaField({
				movement: new foundry.data.fields.SchemaField({
					base: new foundry.data.fields.NumberField({nullable: false, initial: 30, min: 0, step: 0.1}),
					types: new fields.MappingField(new fields.FormulaField({deterministic: true}), {
						initial: { walk: "@base" }
					}),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
					// Units?
					// Multiplier
				}, {label: "BF.Speed.Label"}),
				senses: new foundry.data.fields.SchemaField({
					types: new fields.MappingField(new fields.FormulaField({deterministic: true})),
					tags: new foundry.data.fields.SetField(new foundry.data.fields.StringField())
				}),
				size: new foundry.data.fields.StringField({label: "BF.Size.Label"}),
				type: new foundry.data.fields.SchemaField({
					value: new foundry.data.fields.StringField(),
					tags: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
				}),
				condition: new foundry.data.fields.SchemaField({
					immunities: new foundry.data.fields.SchemaField({
						value: new foundry.data.fields.SetField(new foundry.data.fields.StringField()),
						custom: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField())
					})
				}),
				damage: new foundry.data.fields.SchemaField({
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
					})
				})
			}, {label: "BF.Trait.Label[other]"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
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

	prepareBaseArmorFormulas() {
		const ac = this.attributes.ac;
		for ( const baseFormula of ac.baseFormulas ) {
			const data = CONFIG.BlackFlag.armorFormulas[baseFormula];
			if ( data ) ac.formulas.push(foundry.utils.mergeObject(data, {
				id: baseFormula
			}, {inplace: false}));
		}
		ac.bonus = 0;
		ac.cover = 0;
		Object.defineProperty(ac, "label", {
			get() {
				const label = [];
				if ( this.currentFormula?.id === "armored" ) label.push(this.equippedArmor.name);
				else if ( this.currentFormula?.label ) label.push(game.i18n.localize(this.currentFormula.label));
				if ( this.equippedShield ) label.push(this.equippedShield.name);
				return game.i18n.getListFormatter({ style: "short", type: "unit" }).format(label);
			},
			configurable: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseModifiers() {
		this.modifiers.forEach(modifier => Object.defineProperty(modifier, "source", {
			value: "manual",
			enumerable: true,
			writable: false
		}));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseProficiency() {
		this.attributes.proficiency = Proficiency.calculateMod(this.progression.level ?? 1);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareEmbeddedClasses() {
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

	prepareEmbeddedHitDice() {
		const hd = this.attributes.hd;
		for ( const data of Object.values(this.progression.levels) ) {
			const cls = data.class;
			const hpAdvancement = cls.system.advancement.byType("hitPoints")[0];
			if ( !hpAdvancement ) continue;
			const denom = hd.d[hpAdvancement.configuration.denomination] ??= { spent: 0 };
			denom.max ??= 0;
			denom.max += 1;
		}
		for ( const denom of Object.values(hd.d) ) {
			denom.available = denom.max - denom.spent;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedAbilities() {
		const rollData = this.parent.getRollData({ deterministic: true });
		for ( const [key, ability] of Object.entries(this.abilities) ) {
			const config = CONFIG.BlackFlag.abilities[key];
			ability.mod = ability.value ? Math.floor((ability.value - 10) / 2) : null;

			ability.check.proficiency = new Proficiency(
				this.attributes.proficiency, 0, "down"
			);
			ability.save.proficiency = new Proficiency(
				this.attributes.proficiency, ability.save.proficiency.multiplier, "down"
			);

			const checkData = { type: "ability-check", ability: key, proficiency: ability.check.proficiency.multiplier };
			ability.check.modifiers = {
				bonus: this.getModifiers(checkData),
				minimum: this.getModifiers(checkData, "min"),
				notes: this.getModifiers(checkData, "note")
			};
			ability.check.bonus = this.buildBonus(ability.check.modifiers.bonus, { deterministic: true, rollData });
			const saveData = { type: "ability-save", ability: key, proficiency: ability.save.proficiency.multiplier };
			ability.save.modifiers = {
				bonus: this.getModifiers(saveData),
				minimum: this.getModifiers(saveData, "min"),
				notes: this.getModifiers(saveData, "note")
			};
			ability.save.bonus = this.buildBonus(ability.save.modifiers.bonus, { deterministic: true, rollData });

			ability.check.mod = ability.mod + ability.check.proficiency.flat + ability.check.bonus;
			ability.save.mod = ability.mod + ability.save.proficiency.flat + ability.save.bonus;
			ability.dc = 8 + ability.mod + this.attributes.proficiency;

			ability.labels = config.labels;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedArmorClass() {
		const ac = this.attributes.ac;

		// If armor is equipped, prepare clamped abilities
		ac.clamped = Object.entries(this.abilities).reduce((obj, [k, v]) => {
			obj[k] = Math.clamped(
				v.mod,
				ac.equippedArmor?.system.modifier.min ?? -Infinity,
				ac.equippedArmor?.system.modifier.max ?? Infinity
			);
			return obj;
		}, {});

		ac.armor = ac.equippedArmor?.system.armor.value ?? 0;

		const rollData = this.parent.getRollData({deterministic: true});
		rollData.attributes.ac = ac;

		// Filter formulas to only ones that match current armor settings
		const validFormulas = ac.formulas.filter(formula => {
			if ( (formula.armored !== null) && (formula.armored !== !!ac.equippedArmor) ) return false;
			if ( (formula.shielded !== null) && (formula.shielded !== !!ac.equippedShield) ) return false;
			return true;
		});

		// Iterate of all armor class formulas, calculating their final values
		ac.base = -Infinity;
		for ( const [index, config] of validFormulas.entries() ) {
			try {
				const replaced = Roll.replaceFormulaData(config.formula, rollData);
				const result = Roll.safeEval(replaced);
				if ( result > ac.base ) {
					ac.base = result;
					ac.currentFormula = config;
				}
			} catch(error) {
				console.warn(error.message);
				this.parent.notifications.set(`ac-formula-error-${index}`, {
					level: "error", category: "armor-class", section: "main",
					message: game.i18n.format("BF.Armor.Formula.Error", {formula: config.formula, error: error.message})
				});
			}
		}
		if ( !Number.isFinite(ac.base) ) {
			ac.base = 10;
			ac.currentFormula = null;
		}

		ac.shield = ac.equippedShield?.system.armor.value ?? 0;

		if ( ac.override ) ac.value = ac.override;
		else ac.value = ac.base + ac.shield + ac.bonus + ac.cover;
		// TODO: Handle bonuses using modifiers
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedHitPoints() {
		// TODO: This will need to be updated to handle multiple classes later, but will work for a single class
		const hpAdvancement = this.progression.levels[1]?.class?.system.advancement.byType("hitPoints")[0];
		if ( !hpAdvancement ) return;

		const rollData = this.parent.getRollData({ deterministic: true });
		const hp = this.attributes.hp;
		const ability = this.abilities[CONFIG.BlackFlag.defaultAbilities.hitPoints];

		const base = hpAdvancement.getAdjustedTotal(ability?.mod ?? 0);
		const levelBonus = simplifyBonus(hp.bonuses.level, rollData) * this.progression.level;
		const overallBonus = simplifyBonus(hp.bonuses.overall, rollData);

		hp.max = base + levelBonus + overallBonus;
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

	prepareDerivedModifiers() {
		this.modifiers.forEach((modifier, index) => Object.defineProperty(modifier, "index", {
			value: index,
			enumerable: false,
			writable: false
		}));
		// TODO: Attribute each non-manual modifier to a source (e.g. effect or advancement)
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedMovement() {
		const movement = this.traits.movement;
		const rollData = this.parent.getRollData({ deterministic: true });
		rollData.base = movement.base;

		// Calculate each special movement type using base speed
		for ( const [type, formula] of Object.entries(movement.types) ) {
			const speed = simplifyBonus(formula, rollData);
			movement.types[type] = speed;
		}

		// Prepare movement label to display on sheet
		const numberFormatter = new Intl.NumberFormat(game.i18n.lang, { style: "unit", unit: "foot" });
		const labels = Object.entries(movement.types)
			.filter(([type, speed]) => speed > 0)
			.sort((lhs, rhs) => rhs[1] - lhs[1])
			.map(([type, speed]) => {
				const config = CONFIG.BlackFlag.movementTypes[type];
				const label = config ? game.i18n.localize(config.label) : type;
				return `${label} ${numberFormatter.format(speed)}`;
			});
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit" });
		movement.labels ??= {
			primary: labels.shift(),
			secondary: listFormatter.format(labels)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedSkills() {
		const rollData = this.parent.getRollData({ deterministic: true });
		for ( const [key, skill] of Object.entries(this.proficiencies.skills) ) {
			skill._source = this._source.skills?.[key] ?? {};
			const config = CONFIG.BlackFlag.skills[key];

			skill.ability = config.ability;

			skill.proficiency = new Proficiency(
				this.attributes.proficiency, skill.proficiency.multiplier, "down"
			);

			const checkData = [
				{ type: "ability-check", ability: skill.ability, proficiency: skill.proficiency.multiplier },
				{ type: "skill-check", ability: skill.ability, skill: key, proficiency: skill.proficiency.multiplier }
			];
			skill.modifiers = {
				check: this.getModifiers(checkData),
				passive: this.getModifiers({ type: "skill-passive", ability: skill.ability, skill: key }),
				minimum: this.getModifiers(checkData, "min"),
				notes: this.getModifiers(checkData, "note")
			};
			skill.bonus = this.buildBonus(skill.modifiers.check, { deterministic: true, rollData });

			const ability = this.abilities[skill.ability];
			skill.mod = (ability?.mod ?? 0) + skill.bonus + skill.proficiency.flat;
			skill.passive = 10 + skill.mod + this.buildBonus(skill.modifiers.passive, { deterministic: true, rollData });

			skill.labels = {
				name: config.label,
				ability: ability?.labels.abbreviation
			};
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedCharacterCreationWarnings() {
		let order = 0;

		// 1. Choose Class
		if ( !Object.keys(this.progression.classes).length ) {
			order++;
			this.parent.notifications.set("no-class", {
				level: "warn", category: "class", section: "progression", order,
				message: game.i18n.localize("BF.Progression.Notification.ChooseClass")
			});
		}

		// 2. Determine Ability Scores
		if ( !this.progression.abilities.assignmentComplete ) {
			order++;
			this.parent.notifications.set("no-abilities", {
				level: "warn", category: "abilities", section: "progression", order,
				message: game.i18n.localize("BF.Progression.Notification.DetermineAbilityScores")
			});
		}

		// 3. Choose a Lineage
		if ( !this.progression.lineage ) {
			order++;
			this.parent.notifications.set("no-lineage", {
				level: "warn", category: "lineage", section: "progression", order,
				message: game.i18n.localize("BF.Progression.Notification.ChooseLineage")
			});
		}

		// 4. Choose a Heritage
		if ( !this.progression.heritage ) {
			order++;
			this.parent.notifications.set("no-heritage", {
				level: "warn", category: "heritage", section: "progression", order,
				message: game.i18n.localize("BF.Progression.Notification.ChooseHeritage")
			});
		}

		// 5. Choose a Background
		if ( !this.progression.background ) {
			order++;
			this.parent.notifications.set("no-background", {
				level: "warn", category: "background", section: "progression", order,
				message: game.i18n.localize("BF.Progression.Notification.ChooseBackground")
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedAdvancementWarnings() {
		const anyLevel = { levels: { character: 0, class: 0 } };
		for ( const data of [anyLevel, ...Object.values(this.progression.levels)] ) {
			for ( const advancement of this.parent.advancementForLevel(data.levels.character) ) {
				advancement.prepareWarnings(data.levels, this.parent.notifications);
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a bonus formula or value from the provided modifiers.
	 * @param {object[]} modifiers - Modifiers from which to build the bonus.
	 * @param {object} [options={}]
	 * @param {boolean} [options.deterministic=false] - Should only deterministic modifiers be included?
	 * @param {object} [options.rollData={}] - Roll data to use when simplifying.
	 * @returns {string|number}
	 */
	buildBonus(modifiers, { deterministic=false, rollData={} }={}) {
		if ( deterministic ) return modifiers.reduce((t, m) => t + simplifyBonus(m.formula, rollData), 0);
		return modifiers.filter(m => m.formula).map(m => m.formula).join(" + ");
		// TODO: Should formula data be replaced?
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a minimum roll value from the provided modifiers.
	 * @param {object[]} modifiers - Modifiers from which to build the minimum.
	 * @param {object} [options={}]
	 * @param {object} [options.rollData={}] - Roll data to use when simplifying.
	 * @returns {number|null}
	 */
	buildMinimum(modifiers, { rollData={} }={}) {
		const minimum = modifiers.reduce((min, mod) => {
			const value = simplifyBonus(mod.formula, rollData);
			return value > min ? value : min;
		}, -Infinity);
		return Number.isFinite(minimum) ? minimum : null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*                Luck                 */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add a luck point, resetting the luck value if the character already has the max.
	 * @returns {Promise}
	 */
	async addLuck() {
		const luck = this.attributes.luck;
		let newValue = luck.value + 1;
		if ( newValue > CONFIG.BlackFlag.luck.max ) {
			const rollConfig = { parts: ["1d4"] };
			const type = game.i18n.localize("BF.Luck.Label");
			const flavor = game.i18n.format("BF.Roll.Action.RerollSpecific", { type });
			const messageConfig = { data: {
				title: `${flavor}: ${this.name}`,
				flavor,
				speaker: ChatMessage.getSpeaker({ actor: this.parent }),
				"flags.black-flag.roll": {
					type: "luck"
				}
			}};
			const dialogConfig = { configure: false };

			/**
			 * A hook event that fires before luck is re-rolled.
			 * @function blackFlag.preRollLuck
			 * @memberof hookEvents
			 * @param {BlackFlagActor} actor - Actor for which the roll is being performed.
			 * @param {BaseRollConfiguration} config - Configuration data for the pending roll.
			 * @param {BaseMessageConfiguration} message - Configuration data for the roll's message.
			 * @param {BaseDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
			 * @returns {boolean} - Explicitly return `false` to prevent the roll.
			 */
			if ( Hooks.call("blackFlag.preRollLuck", this.parent, rollConfig, messageConfig, dialogConfig) === false ) return;

			const rolls = await CONFIG.Dice.BaseRoll.build(rollConfig, messageConfig, dialogConfig);

			/**
			 * A hook event that fires after luck has been re-rolled.
			 * @function blackFlag.rollLuck
			 * @memberof hookEvents
			 * @param {BlackFlagActor} actor - Actor for which the roll has been performed.
			 * @param {BaseRoll[]} rolls - The resulting rolls.
			 */
			if ( rolls?.length ) Hooks.callAll("blackFlag.rollLuck", this.parent, rolls);

			newValue = rolls[0].total;
		}

		return this.parent.update({"system.attributes.luck.value": newValue});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Modifiers              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add a new modifier.
	 * @param {object} data
	 */
	async addModifier(data) {
		const modifierCollection = this.toObject().modifiers;
		modifierCollection.push(data);
		await this.parent.update({"system.modifiers": modifierCollection});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Delete a modifier.
	 * @param {number} index
	 */
	async deleteModifier(index) {
		const modifierCollection = this.toObject().modifiers;
		modifierCollection.splice(index, 1);
		await this.parent.update({"system.modifiers": modifierCollection});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get a list of modifiers that match the provided data.
	 * @param {object|object[]} data - Description of modifiers to find.
	 * @param {string} [type="bonus"] - Modifier type to find.
	 * @returns {object[]}
	 */
	getModifiers(data, type="bonus") {
		if ( foundry.utils.getType(data) !== "Array" ) data = [data];
		return this.modifiers.filter(modifier => {
			if ( modifier.type !== type ) return false;
			return data.some(d => filter.performCheck(d, modifier.filter));
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update a modifier.
	 * @param {number} index
	 * @param {object} updates
	 */
	async updateModifier(index, updates) {
		const modifierCollection = this.toObject().modifiers;
		foundry.utils.mergeObject(modifierCollection[index], updates);
		await this.parent.update({"system.modifiers": modifierCollection});
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
			game.i18n.format("BF.ConceptSelection.Warning.InvalidType", {type: document.type})
		);
		if ( this.progression[document.type] ) throw new Error(
			game.i18n.format("BF.ConceptSelection.Warning.Duplicate", {type: document.type, name: this.parent.name})
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
			game.i18n.format("BF.Level.Warning.Max", {max: CONFIG.BlackFlag.maxLevel})
		);

		// Create class if it doesn't already exist on actor
		let existingClass = this.progression.classes[cls.identifier]?.document;
		if ( !existingClass ) {
			existingClass = (await this.parent.createEmbeddedDocuments("Item", [cls.toObject()], { render: false }))[0];
		}

		// Add new progression data
		await this.parent.update({[`system.progression.levels.${levels.character}.class`]: existingClass}, { render: false });

		// Apply advancements for the new level
		for ( const advancement of this.parent.advancementForLevel(levels.character) ) {
			await advancement.apply(levels, undefined, { initial: true, render: false });
		}

		// TODO: Need to find a way to re-render on all clients
		this.parent.render();
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
			await advancement.reverse(levels, undefined, { render: false });
		}

		// Remove progression data for level
		await this.parent.update({[`system.progression.levels.-=${this.progression.level}`]: null}, { render: false });

		// If class has no more levels, remove it from the actor
		if ( levels.class <= 1 ) await this.parent.deleteEmbeddedDocuments("Item", [cls.id], { render: false });

		// TODO: Need to find a way to re-render on all clients
		this.parent.render();
	}
}
