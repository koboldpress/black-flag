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
import InitiativeTemplate from "./templates/initiative-template.mjs";
import LanguagesTemplate from "./templates/languages-template.mjs";
import ModifiersTemplate from "./templates/modifiers-template.mjs";
import SpellcastingTemplate from "./templates/spellcasting-template.mjs";
import TraitsTemplate from "./templates/traits-template.mjs";

const { ArrayField, HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class PCData extends ActorDataModel.mixin(
	ACTemplate,
	ConditionsTemplate,
	InitiativeTemplate,
	LanguagesTemplate,
	ModifiersTemplate,
	SpellcastingTemplate,
	TraitsTemplate
) {
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

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			abilities: new MappingField(
				new SchemaField({
					base: new NumberField({ min: 0, integer: true, label: "BF.Ability.Base.Label" }),
					max: new NumberField({ min: 0, initial: 20, integer: true }),
					save: new SchemaField({
						proficiency: new ProficiencyField({ rounding: false })
					})
				}),
				{
					initialKeys: CONFIG.BlackFlag.abilities,
					prepareKeys: true,
					label: "BF.Ability.Label[other]"
				}
			),
			attributes: new SchemaField({
				attunement: new SchemaField(
					{
						max: new NumberField({ initial: 3, min: 0, integer: true, label: "BF.Attunement.Max.Label" })
					},
					{ label: "BF.Attunement.Label" }
				),
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
				hd: new SchemaField(
					{
						d: new MappingField(
							new SchemaField({
								spent: new NumberField({ min: 0, integer: true })
							})
						)
						// Recovery percentage
					},
					{ label: "BF.HitDie.Label[other]" }
				),
				hp: new SchemaField(
					{
						value: new NumberField({ min: 0, integer: true, label: "BF.HitPoint.Current.LabelLong" }),
						temp: new NumberField({ min: 0, integer: true, label: "BF.HitPoint.Temp.LabelLong" }),
						// Temp max
						bonuses: new SchemaField({
							level: new FormulaField({ deterministic: true }),
							overall: new FormulaField({ deterministic: true })
						})
						// Multiplier
					},
					{ label: "BF.HitPoint.Label[other]" }
				),
				initiative: new SchemaField(
					{
						ability: new StringField({ label: "BF.Initiative.Ability.Label" }),
						proficiency: new ProficiencyField()
					},
					{ label: "BF.Initiative.Label" }
				),
				luck: new SchemaField(
					{
						value: new NumberField({ min: 0, max: 5, integer: true })
					},
					{ label: "BF.Luck.Label" }
				)
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
						// Default ability
					}),
					{ label: "BF.Tool.Label[other]" }
				),
				weapons: new SchemaField({
					value: new SetField(new StringField()),
					custom: new ArrayField(new StringField())
				})
			}),
			progression: new SchemaField(
				{
					abilities: new SchemaField({
						method: new StringField(),
						rolls: new ArrayField(new RollField({ nullable: true })),
						assignments: new MappingField(new NumberField({ min: 0, integer: true })),
						bonuses: new MappingField(new NumberField({ integer: true }))
					}),
					// TODO: Currently falls back to being a plain object. This logic will need to be improved to ensure
					// advancement value type data is properly loaded once advancements can be loaded.
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
				},
				{ label: "BF.Progression.Label" }
			),
			traits: new SchemaField({
				type: new CreatureTypeField({ swarm: false })
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseAbilities() {
		this.progression.abilities.assignmentComplete = true;
		for (const [key, ability] of Object.entries(this.abilities)) {
			ability._source = this._source.abilities?.[key] ?? {};
			ability.check ??= {};
			ability.value = ability.base;
			if (!ability.base) this.progression.abilities.assignmentComplete = false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseProficiency() {
		this.attributes.proficiency = Proficiency.calculateMod(this.progression.level ?? 1);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseSpellcasting() {
		this.spellcasting.maxRing ??= 0;
		this.spellcasting.slots ??= { value: 0, spent: 0, max: 0 };
		this.spellcasting.sources ??= {};
		this.spellcasting.spells ??= { total: 0, cantrips: 0, rituals: 0, damaging: 0 };
		this.spellcasting.spells.knowable ??= { cantrips: 0, rituals: 0, spells: 0 };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareEmbeddedClasses() {
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
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareEmbeddedExperiencePoints() {
		const xp = this.progression.xp;
		const getXP = level =>
			CONFIG.BlackFlag.experiencePoints[Math.clamped(level, 1, CONFIG.BlackFlag.experiencePoints.length)];
		xp.max = getXP(this.progression.level + 1);
		xp.min = getXP(this.progression.level);
		Object.defineProperty(xp, "percentage", {
			get() {
				const result = Math.clamped(Math.round(((this.value - this.min) * 100) / (this.max - this.min)), 0, 100);
				return Number.isNaN(result) ? 100 : result;
			},
			enumerable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareEmbeddedHitDice() {
		const hd = this.attributes.hd;
		for (const data of Object.values(this.progression.levels)) {
			const cls = data.class;
			const hpAdvancement = cls.system.advancement.byType("hitPoints")[0];
			if (!hpAdvancement) continue;
			const denom = (hd.d[hpAdvancement.configuration.denomination] ??= { spent: 0 });
			denom.max ??= 0;
			denom.max += 1;
		}
		for (const [key, denom] of Object.entries(hd.d)) {
			if (denom.max) denom.available = denom.max - denom.spent;
			else delete hd.d[key];
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedAbilities() {
		const rollData = this.parent.getRollData({ deterministic: true });
		for (const [key, ability] of Object.entries(this.abilities)) {
			const config = CONFIG.BlackFlag.abilities[key];
			ability.valid = !!ability.value;
			ability.mod = ability.valid ? Math.floor((ability.value - 10) / 2) : 0;

			ability.check.proficiency = new Proficiency(this.attributes.proficiency, 0, "down");
			ability.save.proficiency = new Proficiency(
				this.attributes.proficiency,
				ability.save.proficiency.multiplier,
				"down"
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
		this.computeArmorClass();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedAttunement() {
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
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedHitPoints() {
		const hpAdvancements = Object.values(this.progression.classes)
			.map(c => c.document?.system.advancement.byType("hitPoints")[0])
			.filter(a => a);
		const hpAdvancement = this.progression.levels[1]?.class?.system.advancement.byType("hitPoints")[0];
		if (!hpAdvancement) return;

		const rollData = this.parent.getRollData({ deterministic: true });
		const hp = this.attributes.hp;
		const ability = this.abilities[CONFIG.BlackFlag.defaultAbilities.hitPoints];

		const base = hpAdvancements.reduce((total, a) => total + a.getAdjustedTotal(ability?.mod ?? 0), 0);
		const levelBonus = simplifyBonus(hp.bonuses.level, rollData) * this.progression.level;
		const overallBonus = simplifyBonus(hp.bonuses.overall, rollData);

		hp.max = base + levelBonus + overallBonus;
		if (this.attributes.exhaustion >= 4) hp.max = Math.floor(hp.max * 0.5);
		hp.value = Math.clamped(hp.value, 0, hp.max);
		hp.damage = hp.max - hp.value;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedInitiative() {
		this.computeInitiative();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedSkills() {
		const rollData = this.parent.getRollData({ deterministic: true });
		for (const [key, skill] of Object.entries(this.proficiencies.skills)) {
			skill._source = this._source.skills?.[key] ?? {};
			const config = CONFIG.BlackFlag.skills[key];

			skill.ability = config.ability;

			skill.proficiency = new Proficiency(this.attributes.proficiency, skill.proficiency.multiplier, "down");

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
			if (!spellcasting?.type) return false;
			types[spellcasting.type] ??= 0;
			types[spellcasting.type] += 1;
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

		for (const type of Object.keys(CONFIG.BlackFlag.spellcastingTypes))
			this.constructor.prepareSpellcastingSlots(this.spellcasting.rings, type, progression, { actor: this });

		for (const ring of Object.values(this.spellcasting.rings)) {
			ring.value = Math.clamped(ring.max - ring.spent, 0, ring.max);
			if (Number.isFinite(ring.max)) {
				this.spellcasting.slots.value += ring.value;
				this.spellcasting.slots.spent += ring.spent;
				this.spellcasting.slots.max += ring.max;
				if (ring.max > 0 && ring.level > this.spellcasting.maxRing) this.spellcasting.maxRing = ring.level;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedTools() {
		const rollData = this.parent.getRollData({ deterministic: true });
		for (const [key, tool] of Object.entries(this.proficiencies.tools)) {
			tool._source = this._source.tools?.[key] ?? {};
			const config = Trait.configForKey(key, { trait: "tools" });

			tool.ability = config?.ability;

			tool.proficiency = new Proficiency(this.attributes.proficiency, tool.proficiency.multiplier, "down");

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
					if (!config) return "";
					return config.label ?? `${config.localization}[other]`;
				},
				enumerable: false
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareNotifications() {
		this.prepareCharacterCreationWarnings();

		// Advancement warnings
		const anyLevel = { levels: { character: 0, class: 0 } };
		for (const data of [anyLevel, ...Object.values(this.progression.levels)]) {
			for (const advancement of this.parent.advancementForLevel(data.levels.character)) {
				advancement.prepareWarnings(data.levels, this.parent.notifications);
			}
		}

		// Notification for spells to learn
		const learnedFlag = this.parent.getFlag("black-flag", "spellsLearned");
		if (!learnedFlag?.learned) {
			let needsToLearn = false;
			top: for (const source of Object.values(this.spellcasting.sources)) {
				if (source.spellcasting?.spells.mode === "all" && learnedFlag?.maxRing < this.spellcasting.maxRing) {
					needsToLearn = true;
					break;
				}
				for (const type of ["cantrips", "rituals", "spells"]) {
					if (source[type]?.max && source[type].value < source[type].max) {
						needsToLearn = true;
						break top;
					}
				}
			}
			if (needsToLearn)
				this.parent.notifications.set("spells-to-learn", {
					level: "info",
					section: "spellcasting",
					message: game.i18n.localize("BF.Spellbook.Notification.LearningAvailable")
				});
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
			const rollConfig = { rolls: [{ parts: ["1d4"] }] };
			const type = game.i18n.localize("BF.Luck.Label");
			const flavor = game.i18n.format("BF.Roll.Action.RerollSpecific", { type });
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
			const dialogConfig = { configure: false };

			/**
			 * A hook event that fires before luck is re-rolled.
			 * @function blackFlag.preRollLuck
			 * @memberof hookEvents
			 * @param {BlackFlagActor} actor - Actor for which the roll is being performed.
			 * @param {BasicRollProcessConfiguration} config - Configuration data for the pending roll.
			 * @param {BasicRollMessageConfiguration} message - Configuration data for the roll's message.
			 * @param {BasicRollDialogConfiguration} dialog - Presentation data for the roll configuration dialog.
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

	async _onUpdateSpellsLearned(changed, options, userId) {
		if (!options.blackFlag?.levelUp || game.user.id !== userId) return;
		this.parent.setFlag("black-flag", "spellsLearned.learned", false);
	}
}
