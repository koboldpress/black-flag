const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * @typedef {ApplicationContainerParts}
 * @property {object} [container]
 * @property {string} [container.id]         ID of the container. Containers with the same ID will be grouped together.
 * @property {string[]} [container.classes]  Classes to add to the container.
 */

/**
 * Mixin method for ApplicationV2-based applications.
 * @template {ApplicationV2} T
 * @param {typeof T} Base - Application class to extend.
 * @returns {BaseApplication}
 * @mixin
 */
export default function ApplicationV2Mixin(Base) {
	class BaseApplication extends HandlebarsApplicationMixin(Base) {
		/** @override */
		static DEFAULT_OPTIONS = {
			classes: ["black-flag"],
			dragDropHandlers: {
				dragstart: null,
				dragend: BaseApplication.#onDragEnd,
				dragenter: null,
				dragleave: null,
				dragover: null,
				drop: BaseApplication.#onDragEnd
			},
			dragSelectors: []
		};

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * @type {Record<string, HandlebarsTemplatePart & ApplicationContainerParts>}
		 */
		static PARTS = {};

		/* <><><><> <><><><> <><><><> <><><><> */
		/*           Initialization            */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_initializeApplicationOptions(options) {
			const applicationOptions = super._initializeApplicationOptions(options);
			// Fix focus bug caused by the use of UUIDs in application IDs
			// TODO: Remove once https://github.com/foundryvtt/foundryvtt/issues/11742 is fixed
			applicationOptions.uniqueId = applicationOptions.uniqueId.replace(/\./g, "-");
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
		_onFirstRender(context, options) {
			super._onFirstRender(context, options);
			const containers = {};
			for (const [part, config] of Object.entries(this.constructor.PARTS)) {
				if (!config.container?.id) continue;
				const element = this.element.querySelector(`[data-application-part="${part}"]`);
				if (!element) continue;
				if (!containers[config.container.id]) {
					const div = document.createElement("div");
					div.dataset.containerId = config.container.id;
					div.classList.add(...(config.container.classes ?? []));
					containers[config.container.id] = div;
					element.replaceWith(div);
				}
				containers[config.container.id].append(element);
			}
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_onRender(context, options) {
			super._onRender(context, options);

			// Attach draggable
			if (this.options.dragSelectors.length) {
				const drag = this.#onDragEvent.bind(this);
				for (const selector of this.options.dragSelectors) {
					for (const element of this.element.querySelectorAll(selector)) {
						element.setAttribute("draggable", true);
						element.addEventListener("dragstart", drag);
						element.addEventListener("dragend", drag);
					}
				}
			}

			// Allow multi-select tags to be removed when the whole tag is clicked.
			this.element.querySelectorAll("multi-select").forEach(select => {
				if (select.disabled) return;
				select.querySelectorAll(".tag").forEach(tag => {
					tag.classList.add("remove");
					tag.querySelector(":scope > span")?.classList.add("remove");
				});
			});

			// Add special styling for label-top hints.
			this.element.querySelectorAll(":is(.label-top, .label-hinted) > p.hint").forEach(hint => {
				const label = hint.parentElement.querySelector(":scope > label");
				if (!label) return;
				label.classList.add("hinted-label");
				label.dataset.tooltip = hint.innerHTML;
			});
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*            Event Handlers           */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_attachFrameListeners() {
			super._attachFrameListeners();

			const drag = this.#onDragEvent.bind(this);
			this.element.addEventListener("dragenter", drag);
			this.element.addEventListener("dragleave", drag);
			this.element.addEventListener("dragover", drag);
			this.element.addEventListener("drop", drag);
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*             Drag & Drop             */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle a drag event.
		 * @param {Event} event - The originating drag event.
		 */
		#onDragEvent(event) {
			const handler = this.options.dragDropHandlers[event.type];
			if (!handler) return;
			handler.call(this, event, DragDrop);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Finish the drag event.
		 * @this {PseudoDocumentSheet}
		 * @param {Event} event - Triggering event.
		 * @param {DragDrop} dragDrop - The drag event manager.
		 */
		static #onDragEnd(event, dragDrop) {
			dragDrop.finishDragEvent(event);
		}
	}
	return BaseApplication;
}
