import { EquipmentConfigurationData, EquipmentValueData } from "../../data/advancement/equipment-data.mjs";
import Advancement from "./advancement.mjs";

/**
 * Advancement that gives a character their starting equipment.
 */
export default class EquipmentAdvancement extends Advancement {
	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "equipment",
				dataModels: {
					configuration: EquipmentConfigurationData,
					value: EquipmentValueData
				},
				order: 32,
				icon: "systems/black-flag/artwork/advancement/equipment.svg",
				title: "BF.Advancement.Equipment.Title",
				hint: "BF.Advancement.Equipment.Hint",
				configurableHint: true
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	configuredForLevel(levels) {
		// TODO
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbedContents(config, options) {
		// TODO
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	summaryForLevel(levels, { flow = false } = {}) {
		const labels = this.configuration.pool
			.filter(e => !e.group)
			.map(p => p.label)
			.filter(l => l);
		return labels.length ? `<ul>${labels.map(l => `<li>${l}</li>`).join("")}</ul>` : "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async apply(levels, data, { initial = false, render = true } = {}) {
		// TODO
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async reverse(levels, data, { render = true } = {}) {
		// TODO
	}
}
