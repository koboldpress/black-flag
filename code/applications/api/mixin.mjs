const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Mixin method for ApplicationV2-based applications.
 * @param {typeof ApplicationV2} Base - Application class to extend.
 * @returns {class}
 * @mixin
 */
export default Base =>
	class extends HandlebarsApplicationMixin(Base) {
		/** @override */
		static DEFAULT_OPTIONS = {
			classes: ["black-flag"]
		};

		/* <><><><> <><><><> <><><><> <><><><> */
		/*              Rendering              */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _prepareContext(options) {
			const context = await super._prepareContext(options);
			context.CONFIG = CONFIG.BlackFlag;
			return context;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _preparePartContext(partId, context, options) {
			return { ...(await super._preparePartContext(partId, context, options)) };
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Disable form fields that aren't marked with the `interface-only` class.
		 */
		_disableFields() {
			const selector = `.window-content :is(${[
				"INPUT",
				"SELECT",
				"TEXTAREA",
				"BUTTON",
				"BLACKFLAG-MULTISELECT",
				"COLOR-PICKER",
				"DOCUMENT-TAGS",
				"FILE-PICKER",
				"HUE-SLIDER",
				"MULTI-SELECT",
				"PROSE-MIRROR",
				"RANGE-PICKER",
				"STRING-TAGS"
			].join(", ")}):not(.interface-only)`;
			for (const element of this.element.querySelectorAll(selector)) {
				if (element.tagName === "TEXTAREA") element.readOnly = true;
				else element.disabled = true;
			}
		}
	};
