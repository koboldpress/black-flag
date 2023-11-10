import Advancement from "./advancement.mjs";
import ScaleValueConfig from "../../applications/advancement/scale-value-config.mjs";
import { ScaleValueConfigurationData } from "../../data/advancement/scale-value/_module.mjs";

/**
 * Advancement that represents a value that scales with class level.
 */
export default class ScaleValueAdvancement extends Advancement {

	static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
		name: "scaleValue",
		dataModels: {
			configuration: ScaleValueConfigurationData
		},
		order: 60,
		icon: "systems/black-flag/artwork/advancement/scale-value.svg",
		title: "BF.Advancement.ScaleValue.Title",
		hint: "BF.Advancement.ScaleValue.Hint",
		identifier: {
			configurable: true,
			hint: "BF.Advancement.ScaleValue.Identifier.Hint"
		},
		multiLevel: true,
		apps: {
			config: ScaleValueConfig
		}
	}, {inplace: false}));

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	get levels() {
		return Array.from(Object.keys(this.configuration.scale).map(l => Number(l)));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	titleForLevel(levels, { flow=false }={}) {
		const value = this.valueForLevel(this.relavantLevel(levels))?.display;
		if ( !value ) return this.title;
		return `${this.title}: <strong>${value}</strong>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Scale value for the given level.
	 * @param {number} level - Level for which to get the scale value.
	 * @returns {ScaleValueType|null} - Scale value at the given level or null if none exists.
	 */
	valueForLevel(level) {
		const ScaleValueType = CONFIG.Advancement.types.scaleValue.dataTypes[this.configuration.type];
		const validKeys = Object.keys(new ScaleValueType());
		const data = {};
		for ( const [key, value] of Object.entries(this.configuration.scale).reverse() ) {
			if ( Number(key) > level ) continue;
			validKeys.forEach(k => data[k] ??= value[k]);
		}
		return foundry.utils.isEmpty(data) ? null : new ScaleValueType(data);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	changes(levels) {
		const value = this.valueForLevel(this.relavantLevel(levels));
		return value ? [{
			key: `system.scale.${this.item.identifier}.${this.identifier}`,
			mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
			value
		}] : null;
	}
}
