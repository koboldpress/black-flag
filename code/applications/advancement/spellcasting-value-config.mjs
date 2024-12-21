import ScaleValueConfig from "./scale-value-config.mjs";

/**
 * Configuration application for scale values.
 */
export default class SpellcastingValueConfig extends ScaleValueConfig {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["scale-value"],
		columns: 1,
		position: {
			width: 400
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/advancement/scale-value-config-details.hbs"
		},
		scale: {
			template: "systems/black-flag/templates/advancement/spellcasting-value-config-scale.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.showClassRestriction = false;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareConfigContext(context, options) {
		context = await super._prepareConfigContext(context, options);
		context.types = null;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareConfigurationUpdate(configuration) {
		let lastValue = {};
		const scale = {};
		for (const level of this.levelRange) {
			const value = configuration.scale[level] ?? {};
			scale[level] ??= {};

			// If no value or value is not greater than previous value, remove whole entry
			if (!value.value || value.value <= lastValue.value) {
				delete scale[level];
				scale[`-=${level}`] = null;
			}

			// Otherwise store it and track it as the last value
			else lastValue.value = scale[level].value = value.value;
		}
		configuration.scale = scale;

		return configuration;
	}
}
