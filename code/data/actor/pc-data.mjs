import PCSheet from "../../applications/actor/pc-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import { filter, getPluralRules, simplifyBonus, Trait } from "../../utils/_module.mjs";
import ActorDataModel from "../abstract/actor-data-model.mjs";
import {
	AdvancementValueField, FormulaField, LocalDocumentField, MappingField,
	ModifierField, ProficiencyField, RollField, TimeField
} from "../fields/_module.mjs";
import SpellcastingTemplate from "./templates/spellcasting-template.mjs";

const { ArrayField, BooleanField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class PCData extends ActorDataModel.mixin(SpellcastingTemplate) {

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
		return this.mergeSchema(super.defineSchema(), {
			abilities: new MappingField(new SchemaField({
				base: new NumberField({min: 0, integer: true}),
				max: new NumberField({min: 0, initial: 20, integer: true}),
				save: new SchemaField({
					proficiency: new ProficiencyField({ rounding: false })
				})
			}), {
				initialKeys: CONFIG.BlackFlag.abilities, prepareKeys: true, label: "BF.Ability.Label[other]"
			}),
			attributes: new SchemaField({
				ac: new SchemaField({
					baseFormulas: new SetField(new StringField(), {
						initial: ["unarmored", "armored"]
					}, { label: "BF.ArmorClass.Formula.DefaultLabel[other]" }),
					formulas: new ArrayField(new SchemaField({
						label: new StringField(),
						formula: new FormulaField({deterministic: true}),
						armored: new BooleanField({nullable: true, initial: null}),
						shielded: new BooleanField({nullable: true, initial: null})
					}), { label: "BF.ArmorClass.Formula.Label[other]" }),
					flat: new NumberField({
						min: 0, integer: true, label: "BF.ArmorClass.Flat.Label", hint: "BF.ArmorClass.Flat.Hint"
					}),
					override: new NumberField({
						min: 0, integer: true, label: "BF.ArmorClass.Override.Label", hint: "BF.ArmorClass.Override.Hint"
					})
				}, {label: "BF.ArmorClass.Label"}),
				death: new SchemaField({
					status: new StringField({initial: "alive", blank: false}),
					success: new NumberField({
						nullable: false, initial: 0, min: 0, integer: true, label: "BF.Death.Success.Label"
					}),
					failure: new NumberField({
						nullable: false, initial: 0, min: 0, integer: true, label: "BF.Death.Failure.Label"
					}),
					overrides: new SchemaField({
						success: new NumberField({
							label: "BF.Death.Override.Success.Label", hint: "BF.Death.Override.Success.hint"
						}),
						failure: new NumberField({
							label: "BF.Death.Override.Failure.Label", hint: "BF.Death.Override.Failure.hint"
						}),
						target: new NumberField({
							label: "BF.Death.Override.Target.Label", hint: "BF.Death.Override.Target.hint"
						})
					})
				}),
				hd: new SchemaField({
					d: new MappingField(new SchemaField({
						spent: new NumberField({min: 0, integer: true})
					}))
					// Recovery percentage
				}, {label: "BF.HitDie.Label[other]"}),
				hp: new SchemaField({
					value: new NumberField({min: 0, integer: true, label: "BF.HitPoint.Current.LabelLong"}),
					temp: new NumberField({min: 0, integer: true, label: "BF.HitPoint.Temp.LabelLong"}),
					// Temp max
					bonuses: new SchemaField({
						level: new FormulaField({deterministic: true}),
						overall: new FormulaField({deterministic: true})
					})
					// Multiplier
				}, {label: "BF.HitPoint.Label[other]"}),
				initiative: new SchemaField({
					ability: new StringField({label: "BF.Initiative.Ability.Label"}),
					proficiency: new ProficiencyField()
				}, {label: "BF.Initiative.Label"}),
				luck: new SchemaField({
					value: new NumberField({min: 0, max: 5, integer: true})
				}, {label: "BF.Luck.Label"})
			}),
			biography: new SchemaField({
				value: new HTMLField(),
				age: new StringField(),
				height: new StringField(),
				weight: new StringField(),
				eyes: new StringField(),
				skin: new StringField(),
				hair: new StringField()
				// Motivation?
				// Backstory?
				// Allies & Organizations?
			}),
			modifiers: new ModifierField(),
			proficiencies: new SchemaField({
				armor: new SchemaField({
					value: new SetField(new StringField()),
					custom: new ArrayField(new StringField())
				}),
				languages: new SchemaField({
					value: new SetField(new StringField()),
					tags: new SetField(new StringField())
				}),
				skills: new MappingField(new SchemaField({
					proficiency: new ProficiencyField({ rounding: false })
				}), {
					initialKeys: CONFIG.BlackFlag.skills, prepareKeys: true, label: "BF.Skill.Label[other]"
				}),
				tools: new MappingField(new SchemaField({
					proficiency: new ProficiencyField({ rounding: false })
					// Default ability
				}), {label: "BF.Tool.Label[other]"}),
				weapons: new SchemaField({
					value: new SetField(new StringField()),
					custom: new ArrayField(new StringField())
				})
			}),
			progression: new SchemaField({
				abilities: new SchemaField({
					method: new StringField(),
					rolls: new ArrayField(new RollField({ nullable: true })),
					assignments: new MappingField(new NumberField({min: 0, integer: true})),
					bonuses: new MappingField(new NumberField({integer: true}))
				}),
				// TODO: Currently falls back to being a plain object. This logic will need to be improved to ensure
				// advancement value type data is properly loaded once advancements can be loaded.
				advancement: new AdvancementValueField(),
				background: new LocalDocumentField(foundry.documents.BaseItem),
				heritage: new LocalDocumentField(foundry.documents.BaseItem),
				lineage: new LocalDocumentField(foundry.documents.BaseItem),
				levels: new MappingField(new SchemaField({
					class: new LocalDocumentField(foundry.documents.BaseItem),
					time: new TimeField()
				}), {label: "BF.Level.Label[other]"}),
				xp: new SchemaField({
					value: new NumberField({min: 0, integer: true}),
					log: new ArrayField(new SchemaField({
						amount: new NumberField({nullable: false, initial: 0, min: 0, integer: true}),
						time: new TimeField(),
						source: new StringField()
					}))
				})
			}, {label: "BF.Progression.Label"}),
			traits: new SchemaField({
				movement: new SchemaField({
					base: new NumberField({nullable: false, initial: 30, min: 0, step: 0.1}),
					types: new MappingField(new FormulaField({deterministic: true}), {
						initial: { walk: "@base" }
					}),
					tags: new SetField(new StringField())
					// Units?
					// Multiplier
				}, {label: "BF.Speed.Label"}),
				senses: new SchemaField({
					types: new MappingField(new FormulaField({deterministic: true})),
					tags: new SetField(new StringField())
				}),
				size: new StringField({label: "BF.Size.Label"}),
				type: new SchemaField({
					value: new StringField(),
					tags: new ArrayField(new StringField())
				}),
				condition: new SchemaField({
					immunities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField())
					})
				}),
				damage: new SchemaField({
					resistances: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField()),
						bypasses: new SetField(new StringField())
					}),
					immunities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField()),
						bypasses: new SetField(new StringField())
					}),
					vulnerabilities: new SchemaField({
						value: new SetField(new StringField()),
						custom: new ArrayField(new StringField())
					})
				})
			}, {label: "BF.Trait.Label[other]"})
		});
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

	prepareBaseSpellcasting() {
		this.spellcasting.slots ??= { value: 0, spent: 0, max: 0 };
		this.spellcasting.spells ??= { total: 0, damaging: 0 };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareEmbeddedClasses() {
		this.progression.classes = {};
		const subclasses = this.parent.items.filter(i => i.type === "subclass").reduce((obj, i) => {
			obj[i.system.identifier.class] = i;
			return obj;
		}, {});
		for ( const [level, data] of Object.entries(this.progression.levels) ) {
			const document = data.class;
			if ( !document ) continue;
			const classData = this.progression.classes[data.class.identifier] ??= {
				document, subclass: subclasses[document.identifier], levels: 0, originalClass: Number(level) === 1
			};
			classData.levels += 1;
			data.levels = { character: Number(level), class: classData.levels, identifier: document.identifier };
		}
		for ( const data of Object.values(this.progression.classes) ) {
			Object.defineProperty(data, "levelsLabel", {
				get() {
					return game.i18n.format(`BF.Level.Count[${getPluralRules().select(this.levels)}]`, { number: this.levels });
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(data, "requiresSubclass", {
				value: !data.subclass && data.levels >= CONFIG.BlackFlag.subclassLevel,
				enumerable: false,
				writable: false
			});
		}
		this.progression.level = Object.keys(this.progression.levels).length;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareEmbeddedConditions() {
		this.conditions = {};
		for ( const effect of this.parent.effects ) {
			const identifier = effect.statuses.first();
			const level = foundry.utils.getProperty(effect, "flags.black-flag.condition.level");
			if ( !identifier ) continue;
			this.conditions[identifier] = Math.max(this.conditions[identifier] ?? 0, level ?? 1);
		}
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
		for ( const [key, denom] of Object.entries(hd.d) ) {
			if ( denom.max ) denom.available = denom.max - denom.spent;
			else delete hd.d[key];
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedAbilities() {
		const rollData = this.parent.getRollData({ deterministic: true });
		for ( const [key, ability] of Object.entries(this.abilities) ) {
			const config = CONFIG.BlackFlag.abilities[key];
			ability.valid = !!ability.value;
			ability.mod = ability.valid ? Math.floor((ability.value - 10) / 2) : 0;

			ability.check.proficiency = new Proficiency(
				this.attributes.proficiency, 0, "down"
			);
			ability.save.proficiency = new Proficiency(
				this.attributes.proficiency, ability.save.proficiency.multiplier, "down"
			);

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
		ac.flat ??= 10;

		const rollData = this.parent.getRollData({deterministic: true});
		rollData.attributes.ac = ac;
		const acData = { type: "armor-class", armored: !!ac.equippedArmor, shielded: !!ac.equippedShield };

		// Filter formulas to only ones that match current armor settings
		const validFormulas = ac.formulas.filter(formula => {
			if ( (formula.armored !== null) && (formula.armored !== !!acData.armored) ) return false;
			if ( (formula.shielded !== null) && (formula.shielded !== !!acData.shielded) ) return false;
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
				this.parent.notifications.set(`ac-formula-error-${index}`, {
					level: "error", category: "armor-class", section: "main",
					message: game.i18n.format("BF.ArmorClass.Formula.Error", {formula: config.formula, error: error.message})
				});
			}
		}
		if ( !Number.isFinite(ac.base) ) {
			ac.base = ac.flat;
			ac.currentFormula = null;
		}

		ac.shield = ac.equippedShield?.system.armor.value ?? 0;

		ac.modifiers = this.getModifiers(acData);
		ac.bonus = this.buildBonus(ac.modifiers, { deterministic: true, rollData });

		if ( ac.override ) ac.value = ac.override;
		else ac.value = ac.base + ac.shield + ac.bonus + ac.cover;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedHitPoints() {
		const hpAdvancements = Object.values(this.progression.classes)
			.map(c => c.document?.system.advancement.byType("hitPoints")[0]).filter(a => a);
		const hpAdvancement = this.progression.levels[1]?.class?.system.advancement.byType("hitPoints")[0];
		if ( !hpAdvancement ) return;

		const rollData = this.parent.getRollData({ deterministic: true });
		const hp = this.attributes.hp;
		const ability = this.abilities[CONFIG.BlackFlag.defaultAbilities.hitPoints];

		const base = hpAdvancements.reduce((total, a) => total + a.getAdjustedTotal(ability?.mod ?? 0), 0);
		const levelBonus = simplifyBonus(hp.bonuses.level, rollData) * this.progression.level;
		const overallBonus = simplifyBonus(hp.bonuses.overall, rollData);

		hp.max = base + levelBonus + overallBonus;
		hp.value = Math.clamped(hp.value, 0, hp.max);
		hp.damage = hp.max - hp.value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedInitiative() {
		const init = this.attributes.initiative ??= {};
		init.ability ||= CONFIG.BlackFlag.defaultAbilities.initiative;
		const ability = this.abilities[init.ability];

		init.proficiency = new Proficiency(
			this.attributes.proficiency,
			init.proficiency.multiplier,
			init.proficiency.rounding
		);

		const initiativeData = [
			{ type: "ability-check", ability: init.ability, proficiency: init.proficiency.multiplier },
			{ type: "initiative", proficiency: init.proficiency.multiplier }
		];
		init.modifiers = {
			_data: initiativeData,
			bonus: this.getModifiers(initiativeData),
			min: this.getModifiers(initiativeData, "min"),
			note: this.getModifiers(initiativeData, "note")
		};
		init.bonus = this.buildBonus(init.modifiers.bonus, {
			deterministic: true, rollData: this.parent.getRollData({deterministic: true})
		});

		init.mod = (ability?.mod ?? 0) + init.proficiency.flat + init.bonus;
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
			skill.valid = ability?.valid;
			skill.mod = (ability?.mod ?? 0) + skill.bonus + skill.proficiency.flat;
			skill.passive = 10 + skill.mod + this.buildBonus(skill.modifiers.passive, { deterministic: true, rollData });

			skill.labels = {
				name: config.label,
				ability: ability?.labels.abbreviation
			};
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedSpellcasting() {
		// TODO: Calculate spellcasting DC per-class

		// Combine class spellcasting data to total progression
		const progression = { leveled: 0 };
		const types = {};

		// TODO: Determine if more sophisticated merging of spellcasting configs is needed here
		const getSpellcasting = d => d.subclass?.system.spellcasting ?? d.document.system.spellcasting;

		// Grab any class with spellcasting and tally up different types
		const spellcastingClasses = Object.values(this.progression.classes).filter(classData => {
			const spellcasting = getSpellcasting(classData);
			if ( !spellcasting?.type ) return false;
			types[spellcasting.type] ??= 0;
			types[spellcasting.type] += 1;
			return true;
		});

		for ( const cls of spellcastingClasses ) {
			const doc = cls.document;
			const spellcasting = getSpellcasting(cls);
			this.constructor.computeClassProgression(
				progression, doc, { actor: this.parent, levels: cls.levels, count: types[spellcasting.type], spellcasting }
			);
		}

		for ( const type of Object.keys(CONFIG.BlackFlag.spellcastingTypes) ) this.constructor.prepareSpellcastingSlots(
			this.spellcasting.rings, type, progression, { actor: this }
		);

		for ( const ring of Object.values(this.spellcasting.rings) ) {
			ring.value = Math.clamped(ring.max - ring.spent, 0, ring.max);
			if ( Number.isFinite(ring.max) ) {
				this.spellcasting.slots.value += ring.value;
				this.spellcasting.slots.spent += ring.spent;
				this.spellcasting.slots.max += ring.max;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedTools() {
		const rollData = this.parent.getRollData({ deterministic: true });
		for ( const [key, tool] of Object.entries(this.proficiencies.tools) ) {
			tool._source = this._source.tools?.[key] ?? {};
			const config = Trait.configForKey(key, { trait: "tools" });

			tool.ability = config?.ability;

			tool.proficiency = new Proficiency(
				this.attributes.proficiency, tool.proficiency.multiplier, "down"
			);

			const checkData = [
				{ type: "ability-check", ability: tool.ability, proficiency: tool.proficiency.multiplier },
				{ type: "tool-check", tool: key, proficiency: tool.proficiency.multiplier }
			];
			tool.modifiers = {
				_data: checkData,
				check: this.getModifiers(checkData),
				minimum: this.getModifiers(checkData, "min"),
				notes: this.getModifiers(checkData, "note")
			};
			tool.bonus = this.buildBonus(tool.modifiers.check, { deterministic: true, rollData });

			const ability = this.abilities[tool.ability];
			tool.valid = ability?.valid ?? false;
			tool.mod = (ability?.mod ?? 0) + tool.bonus + tool.proficiency.flat;

			Object.defineProperty(tool, "label", {
				get() {
					if ( !config ) return "";
					return config.label ?? `${config.localization}[other]`;
				},
				enumerable: false
			});
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

		// 6. Choose a Subclass
		for ( const [key, data] of Object.entries(this.progression.classes) ) {
			if ( !data.requiresSubclass ) continue;
			order++;
			this.parent.notifications.set(`no-subclass-${key}`, {
				level: "warn", category: "class", section: "progression", document: data.document.id, order,
				message: game.i18n.format("BF.Progression.Notification.ChooseSubclass", { class: data.document.name })
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

	/**
	 * Set a condition to a level or remove it by setting level to 0.
	 * @param {string} condition - Identifier for the condition to modify.
	 * @param {number} [level] - New level to set, or nothing to remove the condition.
	 * @returns {Promise}
	 */
	async setConditionLevel(condition, level) {
		if ( this.conditions[condition] === level ) return;

		const effects = this.parent.effects.filter(e => e.statuses.has(condition));
		const toDelete = [];

		// No level, remove all associated effects
		if ( !level ) effects.forEach(e => toDelete.push(e.id));

		// Lower level, remove any unnecessary effects
		else if ( level < this.conditions[condition] ) effects.forEach(e =>
			foundry.utils.getProperty(e, "flags.black-flag.condition.level") > level ? toDelete.push(e.id) : null
		);

		// Higher level, add any required effects
		else {
			const document = CONFIG.BlackFlag.registration.get("condition", condition)?.cached;
			if ( !document ) return;
			const toAdd = document.system.levels.slice(this.conditions[condition] ?? 0, level);
			await this.parent.createEmbeddedDocuments("ActiveEffect", toAdd.map(add => add.effect.toObject()));
		}

		if ( toDelete.length ) await this.parent.deleteEmbeddedDocuments("ActiveEffect", toDelete);
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
	 * @param {DocumentModificationContext} options
	 */
	async updateModifier(index, updates, options) {
		const modifierCollection = this.toObject().modifiers;
		foundry.utils.mergeObject(modifierCollection[index], updates);
		await this.parent.update({"system.modifiers": modifierCollection}, options);
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
		if ( !game.settings.get(game.system.id, "allowMulticlassing") ) {
			const existingClass = Object.keys(this.progression.classes)[0];
			if ( existingClass && existingClass !== cls.identifier ) {
				throw new Error(game.i18n.localize("BF.Progression.Warning.NoMulticlassing"));
			}
		}

		const levels = {
			character: (this.progression.level ?? 0) + 1,
			class: (this.progression.classes[cls.identifier]?.levels ?? 0) + 1,
			identifier: cls.identifier
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
		await this.parent.update(
			{[`system.progression.levels.${levels.character}.class`]: existingClass}
		);

		// Apply advancements for the new level
		for ( const advancement of this.parent.advancementForLevel(levels.character) ) {
			this.parent.enqueueAdvancementChange(advancement, "apply", [levels, undefined, { initial: true, render: false }]);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Level down the character one level.
	 * @returns {Promise}
	 */
	async levelDown() {
		const cls = this.progression.levels[this.progression.level].class;
		const levels = {
			character: this.progression.level,
			class: this.progression.classes[cls.identifier].levels,
			identifier: cls.identifier
		};

		// Remove advancements for the old level
		for ( const advancement of this.parent.advancementForLevel(levels.character) ) {
			this.parent.enqueueAdvancementChange(advancement, "reverse", [levels, undefined, { render: false }]);
		}

		// Remove subclass if less than 3rd level
		const subclass = this.progression.classes[cls.identifier].subclass;
		if ( (levels.class <= CONFIG.BlackFlag.subclassLevel) && subclass ) this.parent.enqueueAdvancementChange(
			this.parent, "deleteEmbeddedDocuments", ["Item", [subclass.id], { render: false }]
		);

		// Remove progression data for level
		this.parent.enqueueAdvancementChange(this.parent, "update", [
			{[`system.progression.levels.-=${this.progression.level}`]: null}, { render: false }
		]);

		// If class has no more levels, remove it from the actor
		if ( levels.class <= 1 ) this.parent.enqueueAdvancementChange(
			this.parent, "deleteEmbeddedDocuments", ["Item", [cls.id], { render: false }]
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _preUpdateHP(changed, options, user) {
		const changedHP = foundry.utils.getProperty(changed, "system.attributes.hp.value");
		if ( changedHP !== undefined ) {
			if ( (changedHP > 0) || (this.attributes.hp.max === 0) ) {
				foundry.utils.setProperty(changed, "system.attributes.death.status", "alive");
				foundry.utils.setProperty(changed, "system.attributes.death.success", 0);
				foundry.utils.setProperty(changed, "system.attributes.death.failure", 0);
			} else if ( this.attributes.death.status === "alive" ) {
				foundry.utils.setProperty(changed, "system.attributes.death.status", "dying");
			}
		}
	}
}
