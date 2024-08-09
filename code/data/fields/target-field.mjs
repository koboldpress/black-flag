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
				const templateShort = TargetField.templateLabel(obj, { style: "short" });
				if (!templateShort) return TargetField.affectsLabel(obj, { style: "combined" });
				const templateLong = TargetField.templateLabel(obj, { style: "long" });
				const affectsLong = TargetField.affectsLabel(obj, { style: "long" });
				const tooltip = affectsLong ? `${templateLong}, ${affectsLong.toLowerCase()}` : templateLong;
				return `<span class="template-label" aria-label="${tooltip}" data-tooltip="${tooltip}">${templateShort}</span>`;
			},
			enumerable: false
		});

		Object.defineProperty(obj.affects, "label", {
			get() {
				return TargetField.affectsLabel(obj);
			},
			enumerable: false
		});

		Object.defineProperty(obj.template, "label", {
			get() {
				return TargetField.templateLabel(obj);
			},
			enumerable: false
		});

		Object.defineProperty(obj.affects, "placeholder", {
			get() {
				return obj.template.type
					? game.i18n.localize("BF.TARGET.Count.EveryGeneric")
					: game.i18n.localize("BF.TARGET.Count.AnyGeneric");
			},
			enumerable: false
		});

		return obj;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Labels                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a label describing the affected targets.
	 * @param {TargetField} data - Data from the targeting field.
	 * @param {object} [options={}]
	 * @param {string} [options.style="combined"] - Short, long, or combined.
	 * @returns {string}
	 */
	static affectsLabel(data, { style = "combined" } = {}) {
		const { affects, template } = data;
		const type = CONFIG.BlackFlag.targetTypes[affects.type];
		if (!type) return "";

		let short;
		let long;

		if (affects.type === "special") {
			short = game.i18n.localize(type.label);
		} else if (!affects.count) {
			const key = template.type in CONFIG.BlackFlag.areaOfEffectTypes ? "Every" : "Any";
			const pluralRule = template.type in CONFIG.BlackFlag.areaOfEffectTypes ? "one" : "other";
			short = long = game.i18n.format(`BF.TARGET.Count.${key}Specific`, {
				type: game.i18n.localize(`${type.localization}[${pluralRule}]`),
				typeLowercase: game.i18n.localize(`${type.localization}[${pluralRule}]`).toLowerCase()
			});
		} else {
			const number = numberFormat(affects.count ?? 1);
			short = `${number} ${game.i18n
				.localize(`BF.TARGET.Label[${getPluralRules().select(affects.count ?? 1)}]`)
				.toLowerCase()}`;
			long = `${number} ${game.i18n
				.localize(type.label ?? `${type.localization}[${getPluralRules().select(affects.count ?? 1)}]`)
				.toLowerCase()}`;
		}

		if (affects.choice) {
			long = game.i18n.format("BF.TARGET.Choice", { number: long ?? short });
		}

		const tooltip = long ? (affects.special ? `${long} (${affects.special})` : long) : affects.special?.capitalize();

		return style === "short"
			? short
			: style === "long"
				? tooltip ?? short
				: `<span${tooltip ? ` data-tooltip="${tooltip}"` : ""}>${short}</span>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a label describing the created template.
	 * @param {TargetField} data - Data from the targeting field.
	 * @param {object} [options={}]
	 * @param {string} [options.style="combined"] - Short, long, or combined.
	 * @returns {string}
	 */
	static templateLabel(data, { style = "combined" } = {}) {
		const { template } = data;
		const type = CONFIG.BlackFlag.areaOfEffectTypes[template.type];
		if (!type || !template.size) return "";

		let short;
		let long;

		const pluralRule = getPluralRules().select(template.count);
		const unit = CONFIG.BlackFlag.distanceUnits[template.units];
		const shape = type.localization
			? game.i18n.localize(`${type.localization}[${pluralRule}]`)
			: game.i18n.localize(type.label) ?? "";

		if (type.icon) {
			let size = numberFormat(template.size, { unit, unitDisplay: "narrow" });
			const image = `<img class="area-icon" src="${type.icon}" alt="${shape}"></img>`;
			short = game.i18n.format("BF.AreaOfEffect.Described", {
				size: style === "combined" ? `<span class="number">${size}</span>` : size,
				shape: image,
				shapeLowercase: image
			});
			if (template.count > 1) {
				short = `${numberFormat(template.count)} x ${short}`;
			}
		}

		if (style !== "short" && short) {
			long = game.i18n.format("BF.AreaOfEffect.Described", {
				size: numberFormat(template.size, { unit }),
				shape,
				shapeLowercase: shape.toLowerCase()
			});
			if (template.count > 1) {
				long = game.i18n.format("BF.AreaOfEffect.Counted", {
					count: numberFormat(template.count, { spelledOut: true }).capitalize(),
					sizedShape: long
				});
			}
		}

		return style === "short"
			? short ?? long
			: style === "long" || !short
				? long
				: `<span class="template-label" aria-label="${long}" data-tooltip="${long}">${short ?? long}</span>`;
	}
}
