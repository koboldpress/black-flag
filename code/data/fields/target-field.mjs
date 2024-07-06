import { getPluralRules, numberFormat } from "../../utils/_module.mjs";
import FormulaField from "./formula-field.mjs";

const { BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing information about an item or activity's targeting.
 *
 * @property {object} template
 * @property {number} template.count - Number of templates to create.
 * @property {boolean} template.connected - Must all created areas be connected to one another?
 * @property {string} template.type - Type of template (e.g. sphere, cone, line)
 * @property {string} template.size - Primary template size.
 * @property {string} template.width - Width of the template if relevant.
 * @property {string} template.height - Height of the template if relevant.
 * @property {string} template.units - Units used to measure the template.
 * @property {object} affects
 * @property {string} affects.formula - Number of targets affected.
 * @property {string} affects.type - Type of targets affected (e.g. creatures, objects, allies, enemies)
 * @property {boolean} affects.choice - Can the caster select which targets are affected?
 * @property {string} affects.special - Description of the targets if type is `special`.
 *
 * @param {object} [fields={}] - Additional fields to add or, if value is `false`, default fields to remove.
 * @param {object} [options={}] - Additional options in addition to the default label.
 */
export default class TargetField extends SchemaField {
	constructor(fields = {}, options = {}) {
		fields = {
			template: new SchemaField({
				count: new NumberField({ initial: 1, positive: true, integer: true }),
				contiguous: new BooleanField(),
				type: new StringField(),
				size: new FormulaField({ deterministic: true }),
				width: new FormulaField({ deterministic: true }),
				height: new FormulaField({ deterministic: true }),
				units: new StringField({ initial: "foot" })
			}),
			affects: new SchemaField({
				count: new FormulaField({ deterministic: true }),
				type: new StringField(),
				choice: new BooleanField(),
				special: new StringField()
			}),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => (!v ? delete fields[k] : null));
		super(fields, { label: "BF.Targeting.Label", ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	initialize(value, model, options = {}) {
		const obj = super.initialize(value, model, options);

		Object.defineProperty(obj, "aoeSizes", {
			get() {
				const sizes = CONFIG.BlackFlag.areaOfEffectTypes[this.template.type]?.sizes;
				if (!sizes) return null;
				const aoeSizes = {
					size: "BF.AreaOfEffect.Size.Label",
					width: sizes.includes("width") && (sizes.includes("length") || sizes.includes("radius")),
					height: sizes.includes("height")
				};
				if (sizes.includes("radius")) aoeSizes.size = "BF.AreaOfEffect.Size.Radius";
				else if (sizes.includes("length")) aoeSizes.size = "BF.AreaOfEffect.Size.Length";
				else if (sizes.includes("width")) aoeSizes.size = "BF.AreaOfEffect.Size.Width";
				if (sizes.includes("thickness")) aoeSizes.width = "BF.AreaOfEffect.Size.Thickness";
				else if (aoeSizes.width) aoeSizes.width = "BF.AreaOfEffect.Size.Width";
				if (aoeSizes.height) aoeSizes.height = "BF.AreaOfEffect.Size.Height";
				return aoeSizes;
			},
			enumerable: false
		});

		Object.defineProperty(obj.affects, "scalar", {
			get() {
				return this.type && this.type !== "special";
			},
			enumerable: false
		});

		Object.defineProperty(obj, "label", {
			get() {
				return this.template.label || this.affects.label || "";
			},
			enumerable: false
		});

		Object.defineProperty(obj.affects, "label", {
			get() {
				const type = CONFIG.BlackFlag.targetTypes[this.type];
				if (!type) return game.i18n.localize("BF.Range.Type.Self.Label");
				if (this.type === "special") {
					let label = game.i18n.localize(type.label);
					if (this.special) label = `<span data-tooltip="${this.special.capitalize()}">${label}*</span>`;
					return label;
				}
				if (obj.template.type in CONFIG.BlackFlag.areaOfEffectTypes && !this.count) {
					return `<span>${game.i18n.format("BF.Target.Count.EverySpecific", {
						type: game.i18n.localize(`${type.localization}[one]`)
					})}</span>`;
				} else {
					const shortKey = `BF.Target.Label[${getPluralRules().select(this.count ?? 1)}]`;
					const longKey = type.label ?? `${type.localization}[${getPluralRules().select(this.count ?? 1)}]`;
					const number = numberFormat(this.count ?? 1);
					return `<span data-tooltip="${`${number} ${game.i18n.localize(longKey)}`}">${number} ${game.i18n.localize(
						shortKey
					)}*</span>`;
				}
			},
			enumerable: false
		});

		Object.defineProperty(obj.template, "label", {
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
			enumerable: false
		});

		Object.defineProperty(obj.affects, "placeholder", {
			get() {
				return obj.template.type ? game.i18n.localize("BF.Target.Count.EveryGeneric") : 1;
			},
			enumerable: false
		});

		return obj;
	}
}
