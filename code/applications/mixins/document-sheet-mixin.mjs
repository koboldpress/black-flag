import IdentityConfig from "../identity-config.mjs";

/**
 * Adds identity & lock control to header and support for edit mode.
 * @param {typeof DocumentSheet} Base - The base class being mixed.
 * @returns {typeof BlackFlagDocumentSheet}
 */
export default function DocumentSheetMixin(Base) {
	return class BlackFlagDocumentSheet extends Base {
		/**
		 * Sheet modes that can be active.
		 * @type {Record<string, boolean>}
		 */
		modes = {
			editing: false
		};

		/* <><><><> <><><><> <><><><> <><><><> */
		/*              Rendering              */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async getData(options) {
			const context = await super.getData(options);
			context.modes = this.modes;
			context.editable = this.isEditable && this.modes.editing;
			return context;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_getHeaderButtons() {
			let buttons = super._getHeaderButtons();
			if (game.user.isGM || this.document.isOwner) {
				// Identity / Source button
				buttons.unshift({
					label: game.i18n.localize("BF.Identity.Label"),
					class: "identity-config",
					icon: "fa-solid fa-id-card",
					onclick: async ev => new IdentityConfig({ document: this.document }).render({ force: true })
				});
			}
			if (this.isEditable && this.options.editable !== false) {
				// Editing Mode toggle
				const getLabel = () => (this.modes.editing ? "BF.EditingMode.Editable" : "BF.EditingMode.Locked");
				const getIcon = () => `fa-solid fa-lock${this.modes.editing ? "-open" : ""} fa-fw`;
				buttons.unshift({
					label: getLabel(),
					class: "toggle-editing-mode",
					icon: getIcon(),
					onclick: async ev => {
						this.modes.editing = !this.modes.editing;
						ev.currentTarget.innerHTML = `<i class="${getIcon()}"></i> <span>${game.i18n.localize(getLabel())}</span>`;
						await this.submit();
						this.render();
					}
				});
			}
			return buttons;
		}
	};
}
