import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for scale values.
 */
export default class ScaleValueConfig extends AdvancementConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["scale-value"],
		columns: 2,
		position: {
			width: 640
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			classes: ["left-column"],
			template: "systems/black-flag/templates/advancement/scale-value-config-details.hbs"
		},
		scale: {
			classes: ["right-column"],
			template: "systems/black-flag/templates/advancement/scale-value-config-scale.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Range of levels that can be used based on what item type this advancement is within.
	 * @type {number[]}
	 */
	get levelRange() {
		let levels = Array.fromRange(CONFIG.BlackFlag.maxLevel + 1);
		return ["class", "subclass"].includes(this.advancement.item.type) ? levels.slice(1) : levels;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		await super._preparePartContext(partId, context, options);
		context.type = CONFIG.Advancement.types.scaleValue.dataTypes[this.advancement.configuration.type].metadata;
		if (partId === "config") return await this._prepareConfigContext(context, options);
		if (partId === "scale") return await this._prepareScaleContext(context, options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the config section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareConfigContext(context, options) {
		let identifierHint = game.i18n.format(this.advancement.metadata.identifier.hint, {
			parentIdentifier: this.advancement.parentIdentifier,
			identifier: this.advancement.identifier
		});
		if (this.advancement.configuration.type === "dice") {
			identifierHint = `${identifierHint} ${game.i18n.format("BF.Advancement.ScaleValue.Identifier.DiceHint", {
				parentIdentifier: this.advancement.parentIdentifier,
				identifier: this.advancement.identifier
			})}`;
		}
		context.default.identifierHint = identifierHint;
		context.types = Object.fromEntries(
			Object.entries(CONFIG.Advancement.types.scaleValue.dataTypes).map(([key, d]) => [
				key,
				game.i18n.localize(d.metadata.label)
			])
		);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the scale section.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 */
	async _prepareScaleContext(context, options) {
		const ScaleValueType = CONFIG.Advancement.types.scaleValue.dataTypes[this.advancement.configuration.type];
		context.faces = Object.fromEntries(CONFIG.BlackFlag.scaleDiceSizes.map(die => [die, `d${die}`]));
		context.levels = this.levelRange.reduce((obj, level) => {
			obj[level] = {
				placeholder: this.advancement.valueForLevel(level - 1)?.placeholder ?? new ScaleValueType().placeholder,
				value: this.advancement.configuration.scale[level] ?? {}
			};
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _processSubmitData(event, form, submitData) {
		const type = foundry.utils.getProperty(submitData, "configuration.type");
		if (!type || type === this.advancement.configuration.type) return super._processSubmitData(event, form, submitData);

		// Perform the update with old type
		delete submitData.configuration.type;
		await super._processSubmitData(event, form, submitData);

		// Transform values into new type
		const NewType = CONFIG.Advancement.types.scaleValue.dataTypes[type];
		for (const level of this.levelRange) {
			const value = this.advancement.valueForLevel(level);
			if (value) submitData.configuration.scale[level] = NewType.convertFrom(value)?.toObject();
			else submitData.configuration.scale[`-=${level}`] = null;
		}
		submitData.configuration.type = type;

		// Perform the update once more with new data
		return super._processSubmitData(event, form, submitData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareConfigurationUpdate(configuration) {
		// Determine keys that should be present
		const ScaleValueType =
			CONFIG.Advancement.types.scaleValue.dataTypes[configuration.type ?? this.advancement.configuration.type];
		const validKeys = Object.keys(ScaleValueType.schema.initial());

		let lastValue = {};
		const scale = {};
		for (const level of this.levelRange) {
			const value = configuration.scale[level] ?? {};
			scale[level] ??= {};
			for (const key of validKeys) {
				// No value or same as previous value, don't store it
				if (!value[key] || value[key] === lastValue[key]) scale[level][`-=${key}`] = null;
				// Value is new, store it and update lastValue
				else lastValue[key] = scale[level][key] = value[key];
				// TODO: Run value through validator on DataField
			}

			// Strip out any unrecognized keys
			for (const key of Object.keys(this.advancement.configuration.scale[level] ?? {})) {
				if (!validKeys.includes(key)) scale[level][`-=${key}`] = null;
			}

			// If all updates are removals, just remove the level
			if (Object.keys(scale[level]).every(k => k.startsWith("-="))) {
				delete scale[level];
				scale[`-=${level}`] = null;
			}
		}
		configuration.scale = scale;

		return configuration;
	}
}
