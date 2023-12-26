import EquipmentSheet from "./equipment-sheet.mjs";

export default class ContainerSheet extends EquipmentSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "container", "equipment", "item", "sheet"],
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "contents"}],
			scrollY: ["[data-tab] > section"],
			width: 600,
			height: 500
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */
}
