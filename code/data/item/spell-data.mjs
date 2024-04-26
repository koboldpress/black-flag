import SpellSheet from "../../applications/item/spell-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import { getPluralRules, numberFormat } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";

const { BooleanField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Spell items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
 */
export default class SpellData extends ItemDataModel.mixin(ActivitiesTemplate, DescriptionTemplate) {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "spell",
			category: "meta",
			localization: "BF.Item.Type.Spell",
			icon: "fa-solid fa-wand-sparkles",
			img: "systems/black-flag/artwork/types/spell.svg",
			sheet: {
				application: SpellSheet,
				label: "BF.Sheet.Default.Spell"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			type: new SchemaField({
				value: new StringField({ initial: "standard", label: "BF.Spell.Preparation.Label" })
			}),
			source: new SetField(new StringField(), { label: "BF.Spell.Source.Label" }),
			school: new StringField({ label: "BF.Spell.School.Label" }),
			circle: new SchemaField(
				{
					value: new NumberField({ label: "BF.Spell.Circle.Effective.Label" }),
					base: new NumberField({ label: "BF.Spell.Circle.Base.Label" })
				},
				{ label: "BF.Spell.Circle.Label" }
			),
			casting: new SchemaField(
				{
					value: new NumberField({ min: 0, integer: true, label: "BF.Activation.Cost.Label" }),
					type: new StringField({ initial: "action", label: "BF.Activation.Type.Label" }),
					condition: new StringField({ label: "BF.Activation.Condition.Label" })
				},
				{ label: "BF.Spell.CastingTime.Label" }
			),
			components: new SchemaField(
				{
					required: new SetField(new StringField()),
					material: new SchemaField(
						{
							description: new StringField({ label: "BF.Spell.Component.Material.Description.Label" }),
							consumed: new BooleanField({ label: "BF.Spell.Component.Material.Consumed.Label" }),
							cost: new NumberField({ min: 0, integer: true, label: "BF.Spell.Component.Material.Cost.Label" }),
							denomination: new StringField({ initial: "gp", label: "BF.Currency.Denomination.Label" })
						},
						{ label: "BF.Spell.Component.Material.Label" }
					)
				},
				{ label: "BF.Spell.Component.Label" }
			),
			duration: new SchemaField(
				{
					value: new FormulaField({ deterministic: true, label: "BF.Duration.Value.Label" }),
					units: new StringField({ initial: "instantaneous", label: "BF.Duration.Type.Label" }),
					special: new StringField({ label: "BF.Duration.Special" })
				},
				{ label: "BF.Time.Duration.Label" }
			),
			tags: new SetField(new StringField(), { label: "BF.Spell.Tag.Label" }),
			target: new SchemaField(
				{
					// TODO: Consider allowing multiple templates to be defined for things like "Wall of Ice",
					// though that might also be part of separate activities
					template: new SchemaField(
						{
							count: new NumberField({ initial: 1, positive: true, integer: true }),
							size: new FormulaField({ deterministic: true, label: "BF.AreaOfEffect.Size.Label" }),
							type: new StringField({ label: "BF.AreaOfEffect.Type.Label" }),
							width: new FormulaField({ deterministic: true, label: "BF.AreaOfEffect.Size.Width.Label" }),
							height: new FormulaField({ deterministic: true, label: "BF.AreaOfEffect.Size.Height.Label" }),
							units: new StringField({ initial: "foot", label: "BF.AreaOfEffect.Units.Label" })
							// TODO: Consider adding support for template artwork
						},
						{ label: "BF.AreaOfEffect.Label" }
					),
					affects: new SchemaField(
						{
							count: new FormulaField({ deterministic: true, label: "BF.Target.Count.Label" }),
							type: new StringField({ label: "BF.Target.Type.Label" }),
							choice: new BooleanField(),
							special: new StringField({ label: "BF.Target.Special.Label" })
						},
						{ label: "BF.Target.Label[one]" }
					)
				},
				{ label: "BF.Targeting.Label" }
			),
			range: new SchemaField(
				{
					value: new FormulaField({ deterministic: true, label: "BF.Range.Value.Label" }),
					units: new StringField({ label: "BF.Range.Unit.Label" }),
					special: new StringField({ label: "BF.Range.Special.Label" })
				},
				{ label: "BF.Range.Label" }
			)
			// TODO: Determine how spell scaling can happen
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ability used for attacks, save DCs, and damage with this spell.
	 * @type {string|null}
	 */
	get ability() {
		// TODO: Return specific ability based on character's spellcasting
		return "intelligence";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get displayActions() {
		return this.prepared;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can this spell be prepared?
	 * @type {boolean}
	 */
	get preparable() {
		return this.type.value === "standard" && this.circle.base !== 0 && !this.tags.has("ritual");
	}

	/**
	 * Would this spell be considered to be prepared?
	 * @type {boolean}
	 */
	get prepared() {
		if (!this.preparable || this.parent.actor?.type !== "pc") return true;
		return this.parent.getFlag("black-flag", "relationship.prepared") === true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Proficiency description.
	 * @type {Proficiency}
	 */
	get proficiency() {
		return new Proficiency(this.parent.actor?.system.attributes?.proficiency ?? 0, 1);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Does activating this spell require a spell slot?
	 * @type {boolean}
	 */
	get requiresSpellSlot() {
		// Cantrips & rituals never consume slots
		if (this.circle.base === 0 || this.tags.has("ritual")) return false;

		// TODO: At-Will & Innate Casting

		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get traits() {
		const traits = [
			// TODO: Source?
			// TODO: School?
			// TODO: Duration
			// TODO: Components
			// TODO: Range
			// TODO: Area of effect
			// TODO: Targets
		];
		const listFormatter = new Intl.ListFormat(game.i18n.lang, { type: "unit" });
		return listFormatter.format(traits.filter(t => t).map(t => game.i18n.localize(t)));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Migrations           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate spell circle to source, ring to circle, and migrate single spell source to set of sources.
	 * Added in 0.9.023
	 * @param {object} source - Candidate source data to migrate.
	 */
	static migrateSourceCircle(source) {
		if ("circle" in source && !("source" in source)) source.source = source.circle;
		if ("ring" in source) source.circle = source.ring;
		if (foundry.utils.getType(source.source) !== "string") return;
		source.source = [source.source];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseDuration() {
		Object.defineProperty(this.casting, "scalar", {
			get() {
				return this.type ? CONFIG.BlackFlag.activationOptions().get(this.type).scalar : false;
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(this.duration, "scalar", {
			get() {
				return this.units ? CONFIG.BlackFlag.durationOptions().get(this.units).scalar : false;
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(this.range, "scalar", {
			get() {
				return this.units in CONFIG.BlackFlag.distanceUnits;
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(this.target.affects, "scalar", {
			get() {
				return this.type && this.type !== "special";
			},
			configurable: true,
			enumerable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseLabels() {
		Object.defineProperty(this.casting, "label", {
			get() {
				const type = CONFIG.BlackFlag.activationOptions({
					pluralRule: getPluralRules().select(this.value)
				}).get(this.type);
				let label = game.i18n.format("BF.Activation.Scalar.Label", {
					number: numberFormat(this.value ?? 1),
					type: type.label
				});
				if (this.condition) label = `<span data-tooltip="${this.condition.capitalize()}">${label}*</span>`;
				return label;
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(this.source, "label", {
			get() {
				const sources = Array.from(this)
					.map(c => CONFIG.BlackFlag.spellSources.localized[c])
					.filter(c => c);
				return game.i18n.getListFormatter({ type: "unit" }).format(sources);
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(this.components, "label", {
			get() {
				const components = [];
				for (const key of this.required) {
					const config = CONFIG.BlackFlag.spellComponents[key];
					const data = {
						type: "component",
						label: game.i18n.localize(config.abbreviation),
						tooltip: game.i18n.localize(config.label)
					};
					if (key === "material" && this.material.description) {
						data.label += "*";
						data.tooltip += ` (${this.material.description})`;
					}
					components.push(data);
				}
				return components
					.map(({ type, label, tooltip }) => `<span class="${type}" data-tooltip="${tooltip}">${label}</span>`)
					.join("");
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(this.range, "label", {
			get() {
				if (this.scalar) {
					const unit = CONFIG.BlackFlag.distanceUnits[this.units];
					return `${numberFormat(this.value)} ${game.i18n.localize(
						`${unit.localization}[${getPluralRules().select(this.value)}]`
					)}`;
				} else {
					const type = CONFIG.BlackFlag.rangeTypes[this.units];
					if (!type) return "";
					let label = game.i18n.localize(type.label);
					if (this.units === "special" && this.special) {
						label = `<span data-tooltip="${this.special}">${label}*</span>`;
					}
					return label;
				}
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(this.target, "label", {
			get() {
				return this.template.label || this.affects.label || "";
			},
			configurable: true,
			enumerable: true
		});

		Object.defineProperty(this.target.affects, "label", {
			get() {
				const type = CONFIG.BlackFlag.targetTypes[this.type];
				if (!type) return game.i18n.localize("BF.Range.Type.Self.Label");
				if (this.type === "special") {
					let label = game.i18n.localize(type.label);
					if (this.special) label = `<span data-tooltip="${this.special.capitalize()}">${label}*</span>`;
					return label;
				}
				const shortKey = `BF.Target.Label[${getPluralRules().select(this.count ?? 1)}]`;
				const longKey = type.label ?? `${type.localization}[${getPluralRules().select(this.count ?? 1)}]`;
				const number = numberFormat(this.count ?? 1);
				return `<span data-tooltip="${`${number} ${game.i18n.localize(longKey)}`}">${number} ${game.i18n.localize(shortKey)}*</span>`;
			},
			configurable: true,
			enumerable: true
		});

		Object.defineProperty(this.target.template, "label", {
			get() {
				if (!this.type) return "";
				const unit = CONFIG.BlackFlag.distanceUnits[this.units];
				let label = `<span class="number">${numberFormat(this.size, { unit, unitDisplay: "narrow" })}</span>`;
				let tooltip = `${numberFormat(this.size)} ${game.i18n.localize(`${unit.localization}[one]`)}`;
				const areaConfig = CONFIG.BlackFlag.areaOfEffectTypes[this.type];
				if (areaConfig?.icon) label += ` <img class="area-icon" src="${areaConfig.icon}">`;
				if (areaConfig?.localization) tooltip += ` ${game.i18n.localize(`${areaConfig.localization}[one]`)}`;
				else if (areaConfig?.label) tooltip += ` ${game.i18n.localize(areaConfig.label)}`;
				return `<span class="area-label" data-tooltip="${tooltip}">${label}</span>`;
			},
			configurable: true,
			enumerable: true
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseProperties() {
		Object.defineProperty(this.type, "classification", {
			value: "spell",
			writable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedTarget() {
		if (this.target.template.type) this.target.affects.type ||= "creature";
		Object.defineProperty(this.target.affects, "placeholder", {
			value: this.target.template.type ? game.i18n.localize("BF.Target.Count.Every") : 1,
			configurable: true,
			enumerable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Resolve range, duration, and target formulas.
	 */
	prepareFinalFormulas() {
		// TODO: Resolve range & duration formulas
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contribute to total spell numbers on actor if embedded.
	 */
	prepareFinalStats() {
		if (!this.parent.actor?.system.spellcasting) return;
		const stats = this.parent.actor.system.spellcasting.spells;
		if (stats) {
			stats.total += 1;
			if (this.circle.base === 0) stats.cantrips += 1;
			else if (this.tags.has("ritual")) stats.rituals += 1;
			for (const activity of this.activities) {
				if (activity.hasDamage) {
					stats.damaging += 1;
					break;
				}
			}
		}

		const origins = (this.parent.actor.system.spellcasting.origins ??= {});
		const relationship = this.parent.getFlag("black-flag", "relationship.origin") ?? {};
		const origin = (origins[relationship.identifier] ??= {});
		if (this.circle.base === 0) {
			origin.cantrips ??= { value: 0 };
			origin.cantrips.value += 1;
		} else if (this.tags.has("ritual")) {
			origin.rituals ??= { value: 0 };
			origin.rituals.value += 1;
		} else {
			origin.spells ??= { value: 0 };
			origin.spells.value += 1;
			if (relationship.spellbookOrigin === "free") {
				origin.spellbook ??= { value: 0 };
				origin.spellbook.value += 1;
			}
			if (this.preparable && this.prepared) {
				origin.prepared ??= { value: 0 };
				origin.prepared.value += 1;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine if this item matches against an inventory filter.
	 * @param {string} filter - Filter name.
	 * @returns {boolean|void} - Boolean if the filter matches or not, or undefined if filter isn't valid for this item.
	 */
	evaluateFilter(filter) {
		switch (filter) {
			case "action":
				return this.casting.type === "action";
			case "bonus":
				return this.casting.type === "bonus";
			case "reaction":
				return this.casting.type === "reaction";
			case "concentration":
				return this.tags.has("concentration");
			case "ritual":
				return this.tags.has("ritual");
			case "prepared":
				return this.prepared;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_validConsumptionTypes(types) {
		return types.filter(t => t.key !== "spellSlots");
	}
}
