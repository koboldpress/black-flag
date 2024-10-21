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
		/*           Initialization            */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_initializeApplicationOptions(options) {
			const applicationOptions = super._initializeApplicationOptions(options);
			// Fix focus bug caused by the use of UUIDs in application IDs
			// TODO: Remove once https://github.com/foundryvtt/foundryvtt/issues/11742 is fixed
			applicationOptions.uniqueId = CSS.escape(applicationOptions.uniqueId);
			return applicationOptions;
		}

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

		/* <><><><> <><><><> <><><><> <><><><> */
		/*         Life-Cycle Handlers         */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_onRender(context, options) {
			super._onRender(context, options);

			// Allow multi-select tags to be removed when the whole tag is clicked.
			this.element.querySelectorAll("multi-select").forEach(select => {
				if (select.disabled) return;
				select.querySelectorAll(".tag").forEach(tag => {
					tag.classList.add("remove");
					tag.querySelector(":scope > span")?.classList.add("remove");
				});
			});

			// Add special styling for label-top hints.
			this.element.querySelectorAll(".label-top > p.hint").forEach(hint => {
				const label = hint.parentElement.querySelector(":scope > label");
				if (!label) return;
				label.classList.add("hinted-label");
				label.dataset.tooltip = hint.innerHTML;
			});
		}
	};
