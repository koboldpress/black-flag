export default class BlackFlagDialog extends Dialog {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	getData(options = {}) {
		const context = super.getData(options);
		for (const button of Object.values(context.buttons)) {
			if (button.cssClass.includes("default")) button.cssClass += " heavy-button";
			else button.cssClass += " light-button";
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Wrap the Dialog with an enclosing Promise which resolves or rejects when the client makes a choice.
	 * @param {object} tooltip
	 * @param {HTMLElement} tooltip.element - Element onto which to attach the tooltip.
	 * @param {DialogData} [data] - Data passed to the Dialog constructor.
	 * @param {DialogOptions} [options] - Options passed to the Dialog constructor.
	 * @param {object} [renderOptions] - Options passed to the Dialog render call.
	 * @returns {Promise} - A Promise that resolves to the chosen result.
	 */
	static async tooltipWait({ element, ...tooltipOptions }, data = {}, options = {}, renderOptions = {}) {
		return new Promise((resolve, reject) => {
			// Wrap buttons with Promise resolution.
			const buttons = foundry.utils.deepClone(data.buttons);
			for (const [id, button] of Object.entries(buttons)) {
				const cb = button.callback;
				button.callback = (html, event) => {
					const result = cb instanceof Function ? cb.call(this, html, event) : undefined;
					resolve(result === undefined ? id : result);
				};
			}

			// Wrap close with Promise resolution or rejection.
			const originalClose = data.close;
			const close = element => {
				const result = originalClose instanceof Function ? originalClose() : undefined;
				const tooltip = element.closest(".locked-tooltip");
				if (tooltip) game.tooltip.dismissLockedTooltip(tooltip);
				else game.tooltip.deactivate();
				if (result !== undefined) resolve(result);
				else reject(new Error("The Dialog was closed without a choice being made."));
			};

			// Construct the dialog.
			const dialog = new this({ ...data, buttons, close }, { ...options, popOut: false });
			dialog._element = $(document.createElement("section"));
			dialog._render(true).then(() => {
				let content = dialog.element;
				if (!(content instanceof HTMLElement)) {
					content = $(document.createElement("div"));
					content.append(dialog.element);
					content = content[0];
				}
				content.classList.add("dialog-tooltip");
				game.tooltip.activate(element, {
					[game.release.generation < 12 ? "content" : "html"]: content,
					locked: true,
					...tooltipOptions
				});
			});
		});

		// TODO: Reject properly when tooltip is closed by moving mouse away
	}
}
