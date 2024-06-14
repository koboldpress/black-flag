import SpellSheet from "../../applications/item/spell-sheet.mjs";
import Proficiency from "../../documents/proficiency.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import ActivationField from "../fields/activation-field.mjs";
import DurationField from "../fields/duration-field.mjs";
import RangeField from "../fields/range-field.mjs";
import TargetField from "../fields/target-field.mjs";
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
			description: new SchemaField({
				short: new StringField({ label: "BF.Item.Description.ShortLabel", hint: "BF.Item.Description.ShortHint" })
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
			casting: new ActivationField({}, { label: "BF.Spell.CastingTime.Label" }),
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
			duration: new DurationField(),
			tags: new SetField(new StringField(), { label: "BF.Spell.Tag.Label" }),
			range: new RangeField(),
			target: new TargetField()
			// TODO: Determine how spell scaling can happen
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Ability used for attacks, save DCs, and damage with this spell.
	 * @type {string}
	 */
	get ability() {
		return this.parent.getFlag(game.system.id, "relationship.origin.ability") || this.defaultAbility;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get chatTags() {
		const tags = this.parent.chatTags;
		if (this.school) tags.set("type", CONFIG.BlackFlag.spellSchools.localized[this.school]);
		tags.set("details", this.components.label);
		tags.set("activation", this.casting.label);
		tags.set("duration", this.duration.label);
		if (this.range.units) tags.set("range", this.range.label);
		if (this.target.affects.type) tags.set("affects", this.target.affects.label);
		if (this.target.template.units) tags.set("template", this.target.template.label);
		tags.set("attuned", this.preparationLabel);
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Default spellcasting ability based on this spell's origin.
	 * @type {string}
	 */
	get defaultAbility() {
		return (
			this.parent.actor?.system.spellcasting?.origins?.[
				this.parent.getFlag(game.system.id, "relationship.origin.identifier")
			]?.ability ??
			this.parent.actor?.system.spellcasting?.ability ??
			"intelligence"
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get displayActions() {
		return this.prepared;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the "Always Prepared" option valid for this item?
	 * @type {boolean}
	 */
	get alwaysPreparable() {
		const config = CONFIG.BlackFlag.spellPreparationModes[this.parent.getFlag("black-flag", "relationship.mode")];
		return config?.preparable && this.circle.base !== 0 && !this.tags.has("ritual");
	}

	/**
	 * Can this spell be prepared?
	 * @type {boolean}
	 */
	get preparable() {
		const alwaysPrepared = this.parent.getFlag("black-flag", "relationship.alwaysPrepared");
		return this.alwaysPreparable && !alwaysPrepared;
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
	 * Label for displaying preparation status in chat.
	 * @type {string|null}
	 */
	get preparationLabel() {
		const preparationMode = this.parent.getFlag("black-flag", "relationship.mode");
		if (!preparationMode || preparationMode === "standard") {
			if (this.parent.getFlag("black-flag", "relationship.alwaysPrepared")) {
				return game.i18n.localize("BF.Spell.Preparation.AlwaysPrepared");
			} else if (this.alwaysPreparable) {
				return game.i18n.localize(`BF.Spell.Preparation.${this.prepared ? "" : "Not"}Prepared`);
			}
			return null;
		}
		return CONFIG.BlackFlag.spellPreparationModes.localized[preparationMode] ?? null;
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

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();

		Object.defineProperty(this.casting, "scalar", {
			get() {
				return this.type ? CONFIG.BlackFlag.activationOptions().get(this.type).scalar : false;
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

		this.type ??= {};
		Object.defineProperty(this.type, "classification", {
			value: "spell",
			writable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedTarget() {
		if (this.target.template.type) this.target.affects.type ||= "creature";
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
		if (!relationship.identifier) return;
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
