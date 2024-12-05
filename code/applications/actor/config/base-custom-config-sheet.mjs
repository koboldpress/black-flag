import BaseConfigSheet from "../api/base-config-sheet.mjs";

/**
 * Base configuration application that supports adding & deleting custom values.
 */
export default class BaseCustomConfigSheet extends BaseConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			addCustom: BaseCustomConfigSheet.#addCustom,
			deleteCustom: BaseCustomConfigSheet.#deleteCustom
		},
		customKeyPath: ""
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle adding a custom tag.
	 * @this {BaseCustomConfigSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #addCustom(event, target) {
		this.submit({ updateData: { newCustom: true } });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing a custom tag.
	 * @this {BaseCustomConfigSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #deleteCustom(event, target) {
		this.submit({ updateData: { deleteCustom: Number(target.dataset.index) } });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);
		foundry.utils.setProperty(
			submitData,
			this.options.customKeyPath,
			Array.from(Object.values(submitData.custom ?? {}))
		);
		return submitData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _processSubmitData(event, form, submitData) {
		if (submitData.newCustom || submitData.deleteCustom !== undefined) {
			const custom = foundry.utils.getProperty(submitData, this.options.customKeyPath) ?? [];
			if (submitData.deleteCustom !== undefined) custom.splice(submitData.deleteCustom, 1);
			if (submitData.newCustom) custom.push("");
			foundry.utils.setProperty(submitData, this.options.customKeyPath, custom);
		}
		super._processSubmitData(event, form, submitData);
	}
}
