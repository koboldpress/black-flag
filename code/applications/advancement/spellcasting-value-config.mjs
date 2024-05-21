import ScaleValueConfig from "./scale-value-config.mjs";

/**
 * Configuration application for scale values.
 */
export default class SpellcastingValueConfig extends ScaleValueConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "scale-value"],
			template: "systems/black-flag/templates/advancement/spellcasting-value-config.hbs",
			width: 400
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData() {
		const context = super.getData();
		context.showClassRestriction = false;
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
