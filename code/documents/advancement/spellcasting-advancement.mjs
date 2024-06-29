import { SpellcastingConfigurationData } from "../../data/advancement/spellcasting-data.mjs";
import Advancement from "./advancement.mjs";

export default class SpellcastingAdvancement extends Advancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "spellcasting",
				dataModels: {
					configuration: SpellcastingConfigurationData
				},
				order: 35,
				icon: "systems/black-flag/artwork/advancement/spellcasting.svg",
				title: "BF.Advancement.Spellcasting.Title",
				hint: "BF.Advancement.Spellcasting.Hint"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		return flow ? "" : this.configuration.label;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Helper Methods            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Highest circle of spells available depending on spellcasting type and progression.
	 * @param {number} level - Class level to use for calculating the max circle.
	 * @returns {number|null}
	 */
	computeMaxCircle(level) {
		const data = { circle: null };
		const { type, progression } = this.configuration;

		/**
		 * A hook event that fires while determining the max circle available for a specific spellcasting method.
		 * @param {object} data
		 * @param {number} data.circle - The maximum allowed circle.
		 * @param {number} level - Class level to use for calculating the max circle.
		 * @param {string} progression - Spellcasting progression type.
		 * @param {SpellcastingAdvancement} spellcasting - The spellcasting advancement.
		 * @function blackFlag.computeSpellcastingMaxCircle
		 * @memberof hookEvents
		 */
		Hooks.callAll(`blackFlag.compute${type.capitalize()}MaxCircle`, data, level, progression, this);

		if (data.circle) return data.circle;

		switch (type) {
			case "leveled":
				const divisor = CONFIG.BlackFlag.spellcastingTypes.leveled.progression[progression]?.divisor ?? 1;
				const row =
					CONFIG.BlackFlag.spellSlotTable[
						Math.clamp(Math.floor(level / divisor), 0, CONFIG.BlackFlag.spellSlotTable.length - 1)
					];
				if (row?.length) data.circle = row.length - 1;
				break;
		}

		return data.circle;
	}
}
