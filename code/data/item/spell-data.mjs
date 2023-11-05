import SpellSheet from "../../applications/item/spell-sheet.mjs";
import { getPluralRules, numberFormat } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";

const { HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Spell items.
 * @mixes ProficiencyTemplate
 */
export default class SpellData extends ItemDataModel {

	static get metadata() {
		return {
			type: "spell",
			category: "meta",
			localization: "BF.Item.Type.Spell",
			icon: "fa-solid fa-wand-sparkles",
			sheet: {
				application: SpellSheet,
				label: "BF.Sheet.Default.Spell"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			type: new SchemaField({
				// Innate, prepared, always prepared, etc.
			}),
			circle: new StringField({label: "BF.Spell.Circle.Label"}),
			school: new StringField({label: "BF.Spell.School.Label"}),
			ring: new SchemaField({
				value: new NumberField({label: "BF.Spell.Ring.Effective.Label"}),
				base: new NumberField({label: "BF.Spell.Ring.Base.Label"})
			}, {label: "BF.Spell.Ring.Label"}),
			casting: new SchemaField({
				value: new NumberField({min: 0, integer: true}),
				type: new StringField({initial: "action", label: "BF.Activation.Type.Label"}),
				condition: new StringField({label: "BF.Activation.Condition.Label"})
			}),
			duration: new SchemaField({
				value: new FormulaField({deterministic: true, label: "BF.Duration.Value.Label"}),
				units: new StringField({initial: "instantaneous", label: "BF.Duration.Type.Label"}),
				special: new StringField()
			}, {label: "BF.Time.Duration.Label"}),
			// Area of effect (part of activities?)
			// Targets (part of activities?)
			components: new SchemaField({
				required: new SetField(new StringField()),
				material: new SchemaField({
					description: new StringField(),
					cost: new NumberField({min: 0, integer: true}), // TODO: Should this be a formula so it can scale with level?
					denomination: new StringField()
				})
			}),
			tags: new SetField(new StringField()),
			range: new SchemaField({
				// TODO: This should probably be formula field so they can scale
				value: new NumberField({min: 0, step: 0.1, label: "BF.Range.Value.Label"}),
				units: new StringField(),
				special: new StringField()
			}, {label: "BF.Range.Label"})
			// TODO: Determine how spell scaling can happen
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	get traits() {
		const traits = [
			// TODO: Circle?
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
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareBaseLabels() {
		Object.defineProperty(this.casting, "label", {
			get() {
				const type = CONFIG.BlackFlag.activationOptions({
					pluralRule: getPluralRules().select(this.value)
				}).get(this.type);
				let label = game.i18n.format("BF.Activation.Scalar.Label", {
					number: numberFormat(this.value ?? 1), type: type.label
				});
				if ( this.condition ) label = `<span data-tooltip="${this.condition}">${label}*</span>`;
				return label;
			},
			configurable: true,
			enumerable: false
		});

		Object.defineProperty(this.components, "label", {
			get() {
				const components = [];
				for ( const key of this.required ) {
					const config = CONFIG.BlackFlag.spellComponents[key];
					const data = {
						type: "component",
						label: game.i18n.localize(config.abbreviation),
						tooltip: game.i18n.localize(config.label)
					};
					if ( (key === "material") && this.material.description ) {
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
				if ( this.scalar ) {
					const unit = CONFIG.BlackFlag.distanceUnits[this.units];
					return `${numberFormat(this.value)} ${
						game.i18n.localize(`${unit.localization}[${getPluralRules().select(this.value)}]`)
					}`;
				} else {
					const type = CONFIG.BlackFlag.rangeTypes[this.units];
					let label = game.i18n.localize(type.label);
					if ( (this.units === "special") && this.special ) {
						label = `<span data-tooltip="${this.special}">${label}*</span>`;
					}
					return label;
				}
			},
			configurable: true,
			enumerable: false
		});
	}
}
