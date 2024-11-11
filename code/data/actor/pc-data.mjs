import PCSheet from "../../applications/actor/pc-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import { getPluralRules, simplifyBonus, Trait } from "../../utils/_module.mjs";
import ActorDataModel from "../abstract/actor-data-model.mjs";
import CreatureTypeField from "../fields/creature-type-field.mjs";
import MappingField from "../fields/mapping-field.mjs";
import ProficiencyField from "../fields/proficiency-field.mjs";
import { AdvancementValueField, FormulaField, LocalDocumentField, RollField, TimeField } from "../fields/_module.mjs";
import ACTemplate from "./templates/ac-template.mjs";
import ConditionsTemplate from "./templates/conditions-template.mjs";
import EncumbranceTemplate from "./templates/encumbrance-template.mjs";
import InitiativeTemplate from "./templates/initiative-template.mjs";
import LanguagesTemplate from "./templates/languages-template.mjs";
import ModifiersTemplate from "./templates/modifiers-template.mjs";
import SpellcastingTemplate from "./templates/spellcasting-template.mjs";
import TraitsTemplate from "./templates/traits-template.mjs";

const { ArrayField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class PCData extends ActorDataModel.mixin(
	ACTemplate,
	ConditionsTemplate,
	EncumbranceTemplate,
	InitiativeTemplate,
	LanguagesTemplate,
	ModifiersTemplate,
	SpellcastingTemplate,
	TraitsTemplate
) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.PC"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static metadata = {
		type: "pc",
		category: "person",
		localization: "BF.Actor.Type.PC",
		img: "systems/black-flag/artwork/types/pc.svg",
		sheet: {
			application: PCSheet,
			label: "BF.Sheet.Default.PC"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			abilities: new MappingField(
				new SchemaField({
					base: new NumberField({ min: 0, integer: true, label: "BF.Ability.Score.Base" }),
					max: new NumberField({ min: 0, initial: 20, integer: true }),
					save: new SchemaField({
						proficiency: new ProficiencyField({ rounding: false })
					})
				}),
				{ initialKeys: CONFIG.BlackFlag.abilities, prepareKeys: true }
			),
			attributes: new SchemaField({
				attunement: new SchemaField({
					max: new NumberField({ initial: 3, min: 0, integer: true, label: "BF.Attunement.Max.Label" })
				}),
				death: new SchemaField({
					status: new StringField({ initial: "alive", blank: false }),
					success: new NumberField({
						nullable: false,
						initial: 0,
						min: 0,
						integer: true,
						label: "BF.Death.Success.Label"
					}),
					failure: new NumberField({
						nullable: false,
						initial: 0,
						min: 0,
						integer: true,
						label: "BF.Death.Failure.Label"
					}),
					overrides: new SchemaField({
						success: new NumberField({
							label: "BF.Death.Override.Success.Label",
							hint: "BF.Death.Override.Success.hint"
						}),
						failure: new NumberField({
							label: "BF.Death.Override.Failure.Label",
							hint: "BF.Death.Override.Failure.hint"
						}),
						target: new NumberField({
							label: "BF.Death.Override.Target.Label",
							hint: "BF.Death.Override.Target.hint"
						})
					})
				}),
				hd: new SchemaField({
					d: new MappingField(
						new SchemaField({
							spent: new NumberField({ min: 0, integer: true })
						})
					)
					// Recovery percentage
				}),
				hp: new SchemaField({
					bonuses: new SchemaField({
						level: new FormulaField({ deterministic: true }),
						overall: new FormulaField({ deterministic: true })
					}),
					override: new NumberField({ integer: true }),
					temp: new NumberField({ min: 0, integer: true }),
					tempMax: new NumberField({ integer: true }),
					value: new NumberField({ min: 0, integer: true })
					// Multiplier
				}),
				initiative: new SchemaField({
					ability: new StringField({ label: "BF.Initiative.Ability.Label" }),
					proficiency: new ProficiencyField()
				}),
				luck: new SchemaField({
					value: new NumberField({ min: 0, max: 5, integer: true }),
					formula: new FormulaField({ label: "BF.Luck.Formula" })
				})
			}),
			biography: new SchemaField({
				age: new StringField(),
				height: new StringField(),
				weight: new StringField(),
				eyes: new StringField(),
				skin: new StringField(),
				hair: new StringField(),
				backstory: new HTMLField(),
				motivation: new HTMLField(),
				allies: new HTMLField()
			}),
			proficiencies: new SchemaField({
				armor: new SchemaField({
					value: new SetField(new StringField()),
					custom: new ArrayField(new StringField())
				}),
				base: new SchemaField({
					checks: new ProficiencyField(),
					saves: new ProficiencyField(),
					skills: new ProficiencyField(),
					tools: new ProficiencyField(),
					vehicles: new ProficiencyField()
				}),
				skills: new MappingField(
					new SchemaField({
						proficiency: new ProficiencyField({ rounding: false })
					}),
					{
						initialKeys: CONFIG.BlackFlag.skills,
						prepareKeys: true,
						label: "BF.Skill.Label[other]"
					}
				),
				tools: new MappingField(
					new SchemaField({
						proficiency: new ProficiencyField({ rounding: false }, { initial: { multiplier: 1 } })
					}),
					{ label: "BF.Tool.Label[other]" }
				),
				vehicles: new MappingField(
					new SchemaField({
						proficiency: new ProficiencyField({ rounding: false }, { initial: { multiplier: 1 } })
					}),
					{ label: "BF.Vehicle.Label[other]" }
				),
				weapons: new SchemaField({
					value: new SetField(new StringField()),
					custom: new ArrayField(new StringField())
				})
			}),
			progression: new SchemaField({
				abilities: new SchemaField({
					method: new StringField(),
					rolls: new ArrayField(new RollField({ nullable: true })),
					assignments: new MappingField(new NumberField({ min: 0, integer: true })),
					bonuses: new MappingField(new NumberField({ integer: true }))
				}),
				advancement: new AdvancementValueField(),
				background: new LocalDocumentField(foundry.documents.BaseItem),
				heritage: new LocalDocumentField(foundry.documents.BaseItem),
				lineage: new LocalDocumentField(foundry.documents.BaseItem),
				levels: new MappingField(
					new SchemaField({
						class: new LocalDocumentField(foundry.documents.BaseItem),
						time: new TimeField()
					}),
					{ label: "BF.Level.Label[other]" }
				),
				xp: new SchemaField(
					{
						value: new NumberField({
							nullable: false,
							initial: 0,
							min: 0,
							integer: true,
							label: "BF.ExperiencePoints.Current.Label"
						}),
						log: new ArrayField(
							new SchemaField({
								amount: new NumberField({ nullable: false, initial: 0, min: 0, integer: true }),
								time: new TimeField(),
								source: new StringField()
							})
						)
					},
					{ label: "BF.ExperiencePoints.Label" }
				)
			}),
			traits: new SchemaField({
				type: new CreatureTypeField({ swarm: false })
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get embeddedDescriptionKeyPath() {
		return "biography.backstory";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();

		this.progression.abilities.assignmentComplete = true;
		for (const [key, ability] of Object.entries(this.abilities)) {
			ability._source = this._source.abilities?.[key] ?? {};
			ability.check ??= {};
			ability.value = ability.base;
			if (!ability.base) this.progression.abilities.assignmentComplete = false;
		}

		this.spellcasting.dc ??= 0;
		this.spellcasting.maxCircle ??= 0;
		this.spellcasting.totals ??= { value: 0, spent: 0, max: 0 };
		this.spellcasting.origins ??= {};
		this.spellcasting.spells ??= { total: 0, cantrips: 0, rituals: 0, damaging: 0 };
		this.spellcasting.spells.knowable ??= { cantrips: 0, rituals: 0, spells: 0 };

		this.prepareBaseArmorFormulas();
		this.prepareBaseEncumbrance();
		this.prepareBaseModifiers();
		this.prepareBaseTraits();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareEmbeddedData() {
		super.prepareEmbeddedData();

		// Classes & Progression
		this.progression.classes = {};
		const subclasses = this.parent.items
			.filter(i => i.type === "subclass")
			.reduce((obj, i) => {
				obj[i.system.identifier.class] = i;
				return obj;
			}, {});
		for (const [level, data] of Object.entries(this.progression.levels)) {
			const document = data.class;
			if (!document) continue;
			const classData = (this.progression.classes[data.class.identifier] ??= {
				document,
				subclass: subclasses[document.identifier],
				levels: 0,
				originalClass: Number(level) === 1
			});
			classData.levels += 1;
			data.levels = { character: Number(level), class: classData.levels, identifier: document.identifier };
		}
		for (const data of Object.values(this.progression.classes)) {
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
		this.attributes.proficiency = Proficiency.calculateMod(this.progression.level ?? 1);

		// Experience Points
		const xp = this.progression.xp;
		const getXP = level =>
			CONFIG.BlackFlag.experiencePoints[Math.clamp(level, 1, CONFIG.BlackFlag.experiencePoints.length)];
		xp.max = getXP(this.progression.level + 1);
		xp.min = getXP(this.progression.level);
		Object.defineProperty(xp, "percentage", {
			get() {
				const result = Math.clamp(Math.round(((this.value - this.min) * 100) / (this.max - this.min)), 0, 100);
				return Number.isNaN(result) ? 100 : result;
			},
			enumerable: false
		});

		// Hit Dice
		const hd = this.attributes.hd;
		hd.available ??= 0;
		hd.spent ??= 0;
		hd.max ??= 0;
		for (const data of Object.values(this.progression.levels)) {
			const cls = data.class;
			const hpAdvancement = cls.system.advancement.byType("hitPoints")[0];
			if (!hpAdvancement) continue;
			const denom = (hd.d[hpAdvancement.configuration.denomination] ??= { spent: 0 });
			denom.max ??= 0;
			denom.max += 1;
			hd.max += 1;
		}
		for (const [key, denom] of Object.entries(hd.d)) {
			if (denom.max) denom.available = denom.max - denom.spent;
			else delete hd.d[key];
			hd.available += hd.d[key]?.available ?? 0;
			hd.spent += hd.d[key]?.spent ?? 0;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		const rollData = this.parent.getRollData({ deterministic: true });

		this.prepareConditions();
		this.prepareDerivedArmorFormulas();
		this.prepareDerivedEncumbrance(rollData);
		this.prepareLanguages();
		this.prepareDerivedModifiers();
		this.prepareDerivedTraits(rollData);

		this.prepareDerivedAbilities(rollData);
		this.prepareComplexProficiencies(rollData);
		this.prepareDerivedHitPoints(rollData);
		this.prepareDerivedSpellcasting();
		this.prepareDerivedProficiencies();

		// Attunement
		this.attributes.attunement.value = this.parent.items.reduce((value, item) => {
			if (item.system.attuned) value += 1;
			return value;
		}, 0);
		if (this.attributes.attunement.value > this.attributes.attunement.max) {
			this.parent.notifications.set("too-much-attunement", {
				level: "warn",
				section: "inventory",
				message: game.i18n.localize("BF.Attunement.Warning")
			});
		}

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
			const config = CONFIG.BlackFlag.abilities[key];
			ability.valid = !!ability.value;
			ability.mod = ability.valid ? Math.floor((ability.value - 10) / 2) : 0;

			const base = this.proficiencies.base;
			ability.check.proficiency = new Proficiency(
				this.attributes.proficiency,
				base.checks.multiplier ?? 0,
				base.checks.rounding ?? "down"
			);
			ability.save.proficiency = new Proficiency(
				this.attributes.proficiency,
				Math.max(base.saves.multiplier, ability.save.proficiency.multiplier),
				base.saves.rounding ?? "down"
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

	/**
	 * Prepare tools & vehicles.
	 * @param {object} rollData
	 */
	prepareComplexProficiencies(rollData) {
		for (const trait of ["skills", "tools", "vehicles"]) {
			const shortTrait = trait.slice(0, -1);

			for (const [key, data] of Object.entries(this.proficiencies[trait])) {
				data._source = this._source.proficiencies?.[trait]?.[key] ?? {};
				const config = Trait.configForKey(key, { trait });

				data.ability = config?.ability;

				const base = this.proficiencies.base;
				data.proficiency = new Proficiency(
					this.attributes.proficiency,
					Math.max(base.checks.multiplier, base[trait].multiplier, data.proficiency.multiplier),
					[base.checks.rounding, base[trait].rounding].includes("up") ? "up" : "down"
				);

				const checkData = [
					{ type: "ability-check", ability: data.ability, proficiency: data.proficiency.multiplier },
					{ type: `${shortTrait}-check`, [shortTrait]: key, proficiency: data.proficiency.multiplier }
				];
				if (trait === "skills") checkData[1].ability = data.ability;
				data.modifiers = {
					_data: checkData,
					check: this.getModifiers(checkData),
					minimum: this.getModifiers(checkData, "min"),
					notes: this.getModifiers(checkData, "note")
				};
				data.bonus = this.buildBonus(data.modifiers.check, { deterministic: true, rollData });

				const ability = this.abilities[data.ability];
				data.valid = ability?.valid ?? false;
				data.mod = (ability?.mod ?? 0) + data.bonus + data.proficiency.flat;

				if (trait === "skills") {
					data.modifiers.passive = this.getModifiers({ type: "skill-passive", ability: data.ability, skill: key });
					data.passive = 10 + data.mod + this.buildBonus(data.modifiers.passive, { deterministic: true, rollData });
					data.labels = {
						name: config.label,
						ability: ability?.labels.abbreviation
					};
				} else {
					data.label = !config ? "" : config.label ?? `${config.localization}[other]`;
				}
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare final hit points values.
	 * @param {object} rollData
	 */
	prepareDerivedHitPoints(rollData) {
		const hp = this.attributes.hp;

		if (hp.override) hp.max = hp.override;
		else {
			const hpAdvancements = Object.values(this.progression.classes)
				.map(c => c.document?.system.advancement.byType("hitPoints")[0])
				.filter(a => a);
			const hpAdvancement = this.progression.levels[1]?.class?.system.advancement.byType("hitPoints")[0];
			if (!hpAdvancement) return;

			const ability = this.abilities[CONFIG.BlackFlag.defaultAbilities.hitPoints];

			const base = hpAdvancements.reduce((total, a) => total + a.getAdjustedTotal(ability?.mod ?? 0), 0);
			const levelBonus = simplifyBonus(hp.bonuses.level, rollData) * this.progression.level;
			const overallBonus = simplifyBonus(hp.bonuses.overall, rollData);

			hp.max = base + levelBonus + overallBonus;
		}
		if (this.attributes.exhaustion >= 4) hp.max = Math.floor(hp.max * 0.5);

		hp.baseMax = hp.max;
		hp.max += hp.tempMax ?? 0;
		hp.value = Math.clamp(hp.value, 0, hp.max);
		hp.damage = hp.max - hp.value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare final spellcasting.
	 */
	prepareDerivedSpellcasting() {
		Object.defineProperty(this.spellcasting, "circles", {
			get() {
				foundry.utils.logCompatibilityWarning("`spellcasting.circles` has been migrated to `spellcasting.slots`.", {
					since: "Black Flag 0.9.034",
					until: "Black Flag 0.9.038"
				});
				return this.slots;
			},
			enumerable: false
		});

		this.spellcasting.hasSpellcastingAdvancement = false;

		// Combine class spellcasting data to total progression
		const progression = { cantrips: false, leveled: 0, pact: { circle: null, slots: 0 } };
		const types = {};

		// TODO: Determine if more sophisticated merging of spellcasting configs is needed here
		const getSpellcasting = d => d.subclass?.system.spellcasting ?? d.document.system.spellcasting;

		// Grab any class with spellcasting and tally up different types
		const spellcastingClasses = Object.values(this.progression.classes).filter(classData => {
			const spellcasting = getSpellcasting(classData);
			if (!spellcasting?.type) return false;
			types[spellcasting.type] ??= 0;
			types[spellcasting.type] += 1;
			this.spellcasting.hasSpellcastingAdvancement = true;
			return true;
		});

		for (const cls of spellcastingClasses) {
			const doc = cls.document;
			const spellcasting = getSpellcasting(cls);
			this.constructor.computeClassProgression(progression, doc, {
				actor: this.parent,
				levels: cls.levels,
				count: types[spellcasting.type],
				spellcasting
			});
		}

		for (const type of Object.keys(CONFIG.BlackFlag.spellcastingTypes)) {
			this.constructor.prepareSpellcastingSlots(this.spellcasting.slots, type, progression, { actor: this });
		}

		for (const slot of Object.values(this.spellcasting.slots)) {
			slot.value = Math.clamp(slot.max - slot.spent, 0, slot.max);
			if (Number.isFinite(slot.max)) {
				this.spellcasting.totals.value += slot.value;
				this.spellcasting.totals.spent += slot.spent;
				this.spellcasting.totals.max += slot.max;
				if (slot.max > 0 && slot.circle > this.spellcasting.maxCircle) this.spellcasting.maxCircle = slot.circle;
			}
		}

		this.spellcasting.cantripScale = SpellcastingTemplate.calculateCantripScale(this.progression.level);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Final proficiencies information.
	 */
	prepareDerivedProficiencies() {
		// Determine which categories a player has a least one proficiency within
		for (const type of ["armor", "weapons", "tools"]) {
			Object.defineProperty(this.proficiencies[type], "categories", {
				value: new Set(),
				enumerable: false
			});

			let proficient;
			if (type === "tools") {
				proficient = new Set(
					Object.entries(this.proficiencies.tools)
						.filter(([k, v]) => v.proficiency.multiplier >= 1)
						.map(([k, v]) => k)
				);
			} else proficient = this.proficiencies[type].value;

			for (const [key, data] of Object.entries(CONFIG.BlackFlag[type])) {
				if (proficient.has(key)) {
					this.proficiencies[type].categories.add(key);
				} else if (data.children) {
					const childrenSet = new Set(Object.keys(data.children));
					if (childrenSet.intersection(proficient)?.size) {
						this.proficiencies[type].categories.add(key);
					}
				}
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareNotifications() {
		super.prepareNotifications();
		this.prepareCharacterCreationWarnings();

		// Advancement warnings
		const anyLevel = { levels: { character: 0, class: 0 } };
		for (const data of [anyLevel, ...Object.values(this.progression.levels)]) {
			for (const advancement of this.parent.advancementForLevel(data.levels.character)) {
				advancement.prepareWarnings(data.levels, this.parent.notifications);
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare warnings associated with incomplete character creation.
	 */
	prepareCharacterCreationWarnings() {
		let order = 0;

		// 1. Choose Class
		if (!Object.keys(this.progression.classes).length) {
			order++;
			this.parent.notifications.set("no-class", {
				level: "warn",
				category: "class",
				section: "progression",
				order,
				message: game.i18n.localize("BF.Progression.Notification.ChooseClass")
			});
		}

		// 2. Determine Ability Scores
		if (!this.progression.abilities.assignmentComplete) {
			order++;
			this.parent.notifications.set("no-abilities", {
				level: "warn",
				category: "abilities",
				section: "progression",
				order,
				message: game.i18n.localize("BF.Progression.Notification.DetermineAbilityScores")
			});
		}

		// 3. Choose a Lineage
		if (!this.progression.lineage) {
			order++;
			this.parent.notifications.set("no-lineage", {
				level: "warn",
				category: "lineage",
				section: "progression",
				order,
				message: game.i18n.localize("BF.Progression.Notification.ChooseLineage")
			});
		}

		// 4. Choose a Heritage
		if (!this.progression.heritage) {
			order++;
			this.parent.notifications.set("no-heritage", {
				level: "warn",
				category: "heritage",
				section: "progression",
				order,
				message: game.i18n.localize("BF.Progression.Notification.ChooseHeritage")
			});
		}

		// 5. Choose a Background
		if (!this.progression.background) {
			order++;
			this.parent.notifications.set("no-background", {
				level: "warn",
				category: "background",
				section: "progression",
				order,
				message: game.i18n.localize("BF.Progression.Notification.ChooseBackground")
			});
		}

		// 6. Choose a Subclass
		for (const [key, data] of Object.entries(this.progression.classes)) {
			if (!data.requiresSubclass) continue;
			order++;
			const message = game.i18n.format("BF.Progression.Notification.ChooseSubclass", { class: data.document.name });
			this.parent.notifications.set(`no-subclass-${key}`, {
				level: "warn",
				section: "progression",
				document: data.document.id,
				order,
				message
			});
			data.document.notifications.set("no-subclass", { level: "warn", category: "class", order, message });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set a condition to a level or remove it by setting level to 0.
	 * @param {string} condition - Identifier for the condition to modify.
	 * @param {number} [level] - New level to set, or nothing to remove the condition.
	 * @returns {Promise}
	 */
	async setConditionLevel(condition, level) {
		if (this.conditions[condition] === level) return;

		const effects = this.parent.effects.filter(e => e.statuses.has(condition));
		const toDelete = [];

		// No level, remove all associated effects
		if (!level) effects.forEach(e => toDelete.push(e.id));
		// Lower level, remove any unnecessary effects
		else if (level < this.conditions[condition])
			effects.forEach(e =>
				foundry.utils.getProperty(e, "flags.black-flag.condition.level") > level ? toDelete.push(e.id) : null
			);
		// Higher level, add any required effects
		else {
			const document = CONFIG.BlackFlag.registration.get("condition", condition)?.cached;
			if (!document) return;
			const toAdd = document.system.levels.slice(this.conditions[condition] ?? 0, level);
			await this.parent.createEmbeddedDocuments(
				"ActiveEffect",
				toAdd.map(add => add.effect.toObject())
			);
		}

		if (toDelete.length) await this.parent.deleteEmbeddedDocuments("ActiveEffect", toDelete);
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
		if (newValue > CONFIG.BlackFlag.luck.max) {
			const rollConfig = { rolls: [{ parts: [luck.formula || "1d4"] }] };
			const type = game.i18n.localize("BF.Luck.Label");
			const flavor = game.i18n.format("BF.Roll.Action.RerollSpecific", { type });
			const dialogConfig = { configure: false };
			const messageConfig = {
				data: {
					title: `${flavor}: ${this.name}`,
					flavor,
					speaker: ChatMessage.getSpeaker({ actor: this.parent }),
					"flags.black-flag.roll": {
						type: "luck"
					}
				}
			};

			/**
			 * A hook event that fires before luck is re-rolled.
			 * @function blackFlag.preRollLuck
			 * @memberof hookEvents
			 * @param {BlackFlagActor} actor - Actor for which the roll is being performed.
			 * @param {BasicRollProcessConfiguration} config - Configuration data for the pending roll.
			 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
			 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
			 * @returns {boolean} - Explicitly return `false` to prevent the roll.
			 */
			if (Hooks.call("blackFlag.preRollLuck", this.parent, rollConfig, dialogConfig, messageConfig) === false) return;

			const rolls = await CONFIG.Dice.BasicRoll.build(rollConfig, dialogConfig, messageConfig);

			/**
			 * A hook event that fires after luck has been re-rolled.
			 * @function blackFlag.rollLuck
			 * @memberof hookEvents
			 * @param {BlackFlagActor} actor - Actor for which the roll has been performed.
			 * @param {BasicRoll[]} rolls - The resulting rolls.
			 */
			if (rolls?.length) Hooks.callAll("blackFlag.rollLuck", this.parent, rolls);

			newValue = rolls[0].total;
		}

		return this.parent.update({ "system.attributes.luck.value": newValue });
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
		if (!["lineage", "heritage", "background"].includes(document.type))
			throw new Error(game.i18n.format("BF.ConceptSelection.Warning.InvalidType", { type: document.type }));
		if (this.progression[document.type])
			throw new Error(
				game.i18n.format("BF.ConceptSelection.Warning.Duplicate", { type: document.type, name: this.parent.name })
			);

		const newDocument = await this.parent.createEmbeddedDocuments("Item", [document.toObject()], { render: false });
		return this.parent.update({ [`system.progression.${document.type}`]: newDocument[0] });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Level up using the provided class.
	 * @param {BlackFlagItem} cls - Class in which to level up.
	 * @returns {Promise}
	 */
	async levelUp(cls) {
		if (!game.settings.get(game.system.id, "allowMulticlassing")) {
			const existingClass = Object.keys(this.progression.classes)[0];
			if (existingClass && existingClass !== cls.identifier) {
				throw new Error(game.i18n.localize("BF.Progression.Warning.NoMulticlassing"));
			}
		}

		const levels = {
			character: (this.progression.level ?? 0) + 1,
			class: (this.progression.classes[cls.identifier]?.levels ?? 0) + 1,
			identifier: cls.identifier
		};
		if (levels.character > CONFIG.BlackFlag.maxLevel)
			throw new Error(game.i18n.format("BF.Level.Warning.Max", { max: CONFIG.BlackFlag.maxLevel }));

		// Create class if it doesn't already exist on actor
		let existingClass = this.progression.classes[cls.identifier]?.document;
		if (!existingClass) {
			existingClass = (await this.parent.createEmbeddedDocuments("Item", [cls.toObject()], { render: false }))[0];
		}

		// Add new progression data
		await this.parent.update(
			{ [`system.progression.levels.${levels.character}.class`]: existingClass },
			{ blackFlag: { levelUp: true } }
		);

		// Apply advancements for the new level
		for (const advancement of this.parent.advancementForLevel(levels.character)) {
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
		for (const advancement of this.parent.advancementForLevel(levels.character)) {
			this.parent.enqueueAdvancementChange(advancement, "reverse", [levels, undefined, { render: false }]);
		}

		// Remove subclass if less than 3rd level
		const subclass = this.progression.classes[cls.identifier].subclass;
		if (levels.class <= CONFIG.BlackFlag.subclassLevel && subclass)
			this.parent.enqueueAdvancementChange(this.parent, "deleteEmbeddedDocuments", [
				"Item",
				[subclass.id],
				{ render: false }
			]);

		// Remove progression data for level
		this.parent.enqueueAdvancementChange(this.parent, "update", [
			{ [`system.progression.levels.-=${this.progression.level}`]: null },
			{ render: false, blackFlag: { levelDown: true } }
		]);

		// If class has no more levels, remove it from the actor
		if (levels.class <= 1)
			this.parent.enqueueAdvancementChange(this.parent, "deleteEmbeddedDocuments", [
				"Item",
				[cls.id],
				{ render: false }
			]);

		// TODO: Remove any spells that were learned at the previous level
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove any progression data from ability scores.
	 */
	async resetAbilities() {
		const updates = Object.keys(CONFIG.BlackFlag.abilities).reduce((obj, key) => {
			obj[`system.abilities.${key}.base`] = null;
			return obj;
		}, {});
		await this.parent.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _preCreateToken(data, options, user) {
		const prototypeToken = {};
		if (!foundry.utils.hasProperty(data, "prototypeToken.actorLink")) prototypeToken.actorLink = true;
		if (!foundry.utils.hasProperty(data, "prototypeToken.sight.enabled")) prototypeToken.sight = { enabled: true };
		if (!foundry.utils.hasProperty(data, "prototypeToken.disposition")) {
			prototypeToken.disposition = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
		}
		this.parent.updateSource({ prototypeToken });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _preUpdateHP(changed, options, user) {
		const changedHP = foundry.utils.getProperty(changed, "system.attributes.hp.value");
		if (changedHP !== undefined) {
			if (changedHP > 0 || this.attributes.hp.max === 0) {
				foundry.utils.setProperty(changed, "system.attributes.death.status", "alive");
				foundry.utils.setProperty(changed, "system.attributes.death.success", 0);
				foundry.utils.setProperty(changed, "system.attributes.death.failure", 0);
			} else if (this.attributes.death.status === "alive") {
				foundry.utils.setProperty(changed, "system.attributes.death.status", "dying");
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onUpdate(changed, options, userId) {
		await super._onUpdate(changed, options, userId);
		if (userId === game.userId) {
			await this.updateEncumbrance(options);
		}
	}
}
