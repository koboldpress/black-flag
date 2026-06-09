import { defaultUnit, formatDistance, formatNumber, getPluralLocalizationKey } from "../../../utils/_module.mjs";
import FormulaField from "../formula-field.mjs";

const { BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Field for storing information about an item or activity's targeting.
 *
 * @property {object} template
 * @property {string} template.count - Number of templates to create.
 * @property {boolean} template.connected - Must all created areas be connected to one another?
 * @property {string} template.type - Type of template (e.g. sphere, cone, line)
 * @property {string} template.size - Primary template size.
 * @property {string} template.width - Width of the template if relevant.
 * @property {string} template.height - Height of the template if relevant.
 * @property {string} template.unit - Unit used to measure the template.
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
	constructor(fields = {}, options = {}, context = {}) {
		fields = {
			template: new SchemaField({
				count: new FormulaField({ deterministic: true }),
				contiguous: new BooleanField(),
				type: new StringField(),
				size: new FormulaField({ deterministic: true }),
				width: new FormulaField({ deterministic: true }),
				height: new FormulaField({ deterministic: true }),
				unit: new StringField({ required: true, blank: false, initial: () => defaultUnit("distance") })
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
		super(fields, { label: "BF.Targeting.Label", ...options }, context);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	initialize(value, model, options = {}) {
		// TODO: Move all this into prepareData instead
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

		Object.defineProperty(obj.template, "label", {
			get() {
				return TargetField.templateLabel(obj);
			},
			enumerable: false
		});

		Object.defineProperty(obj.affects, "placeholder", {
			get() {
				return obj.template.type ? _loc("BF.TARGET.Count.EveryGeneric") : _loc("BF.TARGET.Count.AnyGeneric");
			},
			enumerable: false
		});

		return obj;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data for this field. Should be called during `prepareFinalData` stage.
	 * @this {ItemDataModel|BaseActivityData}
	 */
	static prepareData(rollData, labels = {}) {
		const actor = this.actor ?? this.parent?.actor;
		const item = this.item ?? this.parent;

		const affectsConfig = CONFIG.BlackFlag.targetTypes[this.target.affects.type];
		this.target.affects.labels ??= {};
		this.target.affects.labels.sheet = TargetField.affectsLabel(this.target);
		this.target.affects.labels.statBlock = _loc(
			getPluralLocalizationKey(
				this.target.affects.count || 1,
				pr => `${affectsConfig?.counted ?? "BF.TARGET.Type.Target.Counted"}[${pr}]`
			),
			{ number: formatNumber(this.target.affects.count || 1, { spelledOut: true }) }
		);
		if (actor?.system.isSwarm && item.type === "weapon" && item.system.range.reach === 0) {
			this.target.affects.labels.statBlock = _loc("BF.TARGET.InSwarmsSpace", {
				target: this.target.affects.labels.statBlock
			});
		}
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
			short = _loc(type.label);
		} else if (!affects.count) {
			const key = template.type in CONFIG.BlackFlag.areaOfEffectTypes ? "Every" : "Any";
			const pluralRule = template.type in CONFIG.BlackFlag.areaOfEffectTypes ? "one" : "other";
			short = long = _loc(`BF.TARGET.Count.${key}Specific`, {
				type: _loc(`${type.localization}[${pluralRule}]`),
				typeLowercase: _loc(`${type.localization}[${pluralRule}]`).toLowerCase()
			});
		} else {
			const number = formatNumber(affects.count ?? 1);
			short = `${number} ${game.i18n
				.localize(getPluralLocalizationKey(affects.count ?? 1, pr => `BF.TARGET.Label[${pr}]`))
				.toLowerCase()}`;
			long = `${number} ${game.i18n
				.localize(type.label ?? getPluralLocalizationKey(affects.count ?? 1, pr => `${type.localization}[${pr}]`))
				.toLowerCase()}`;
		}

		if (affects.choice) {
			long = _loc("BF.TARGET.Choice", { number: long ?? short });
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

		const shape = type.localization
			? _loc(getPluralLocalizationKey(template.count, pr => `${type.localization}[${pr}]`))
			: _loc(type.label) ?? "";

		if (type.icon) {
			let size = formatDistance(template.size, template.unit, { unitDisplay: "narrow" });
			const image = `<img class="area-icon" src="${type.icon}" alt="${shape}"></img>`;
			short = _loc("BF.AreaOfEffect.Described", {
				size: style === "combined" ? `<span class="number">${size}</span>` : size,
				shape: image,
				shapeLowercase: image
			});
			if (template.count > 1) {
				short = `${formatNumber(template.count)} x ${short}`;
			}
		}

		if (style !== "short" && short) {
			long = _loc("BF.AreaOfEffect.Described", {
				size: formatDistance(template.size, template.unit),
				shape,
				shapeLowercase: shape.toLowerCase()
			});
			if (template.count > 1) {
				long = _loc("BF.AreaOfEffect.Counted", {
					count: formatNumber(template.count, { spelledOut: true }).capitalize(),
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
