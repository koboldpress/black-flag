import BlackFlagDragDrop from "../drag-drop.mjs";
import * as fields from "../fields.mjs";

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
			actions: {
				toggleCollapsed: BaseApplication.#toggleCollapsed
			},
			classes: ["black-flag"],
			dragDrop: true,
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
		/*              Properties             */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Expanded states for collapsible sections to persist between renders.
		 * @type {Map<string, boolean>}
		 */
		#expandedSections = new Map();

		get expandedSections() {
			return this.#expandedSections;
		}

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
			context.inputs = fields;
			return context;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _preparePartContext(partId, context, options) {
			return { ...(await super._preparePartContext(partId, context, options)) };
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_replaceHTML(result, content, options) {
			for (const part of Object.values(result)) {
				for (const element of part.querySelectorAll("[data-expand-id]")) {
					element
						.querySelector(".collapsible")
						?.classList.toggle("collapsed", !this.#expandedSections.get(element.dataset.expandId));
				}
			}
			super._replaceHTML(result, content, options);
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
			].join(", ")}):not(.always-interactive, .interface-only)`;
			for (const element of this.element.querySelectorAll(selector)) {
				if (element.closest("prose-mirror[open]")) continue; // Skip active ProseMirror editors
				if (element.tagName === "TEXTAREA") element.readOnly = true;
				else element.disabled = true;
			}
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*         Life-Cycle Handlers         */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _onFirstRender(context, options) {
			await super._onFirstRender(context, options);
			const containers = {};
			for (const [part, config] of Object.entries(this.constructor.PARTS)) {
				if (!config.container?.id) continue;
				const element = this.element.querySelector(`[data-application-part="${part}"]`);
				if (!element) continue;
				if (!containers[config.container.id]) {
					const div = document.createElement(config.container.tag ?? "div");
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
		async _onRender(context, options) {
			await super._onRender(context, options);

			// Attach draggable
			if (this.options.dragDrop && this.options.dragSelectors.length) {
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
			this.element.addEventListener("plugins", this._onConfigurePlugins.bind(this));

			if (this.options.dragDrop) {
				const drag = this.#onDragEvent.bind(this);
				this.element.addEventListener("dragenter", drag);
				this.element.addEventListener("dragleave", drag);
				this.element.addEventListener("dragover", drag);
				this.element.addEventListener("drop", drag);
			}
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Configure plugins for the ProseMirror instance.
		 * @param {ProseMirrorPluginsEvent} event
		 * @protected
		 */
		_onConfigurePlugins(event) {
			event.plugins.highlightDocumentMatches = ProseMirror.ProseMirrorHighlightMatchesPlugin.build(
				ProseMirror.defaultSchema
			);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Edit a Document image. Not restricted to `<img>` elements to allow editing `<blackFlag-icon>` elements.
		 * @this {DocumentSheetV2}
		 * @param {Event} event - Triggering click event.
		 * @param {HTMLElement} target - Button that was clicked.
		 */
		static async _onEditImage(event, target) {
			const attr = target.dataset.edit;
			const current = foundry.utils.getProperty(this.document._source, attr);
			const defaultArtwork = this.document.constructor.getDefaultArtwork?.(this.document._source) ?? {};
			const defaultImage = foundry.utils.getProperty(defaultArtwork, attr);
			const fp = new foundry.applications.apps.FilePicker.implementation({
				current,
				type: target.dataset.type || "image",
				redirectToRoot: defaultImage ? [defaultImage] : [],
				callback: path => {
					const isVideo = foundry.helpers.media.VideoHelper.hasVideoExtension(path);
					for (const element of this.element.querySelectorAll(`[data-edit="${attr}"]`)) {
						if ((element instanceof HTMLVideoElement && isVideo) || (element instanceof HTMLImageElement && !isVideo))
							element.src = path;
						else {
							const repl = document.createElement(isVideo ? "video" : "img");
							Object.assign(repl.dataset, element.dataset);
							if (isVideo)
								Object.assign(repl, {
									autoplay: true,
									muted: true,
									disablePictureInPicture: true,
									loop: true,
									playsInline: true
								});
							repl.src = path;
							element.replaceWith(repl);
						}
					}

					if (this.options.form.submitOnChange) {
						if (attr.startsWith("token.")) this.token.update({ [attr.slice(6)]: path });
						else {
							const submit = new Event("submit", { cancelable: true });
							this.form.dispatchEvent(submit);
						}
					}
				},
				position: {
					top: this.position.top + 40,
					left: this.position.left + 10
				},
				document: this.document
			});
			await fp.browse();
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle toggling the collapsed state of collapsible sections.
		 * @this {BaseApplication}
		 * @param {Event} event - Triggering click event.
		 * @param {HTMLElement} target - Button that was clicked.
		 */
		static #toggleCollapsed(event, target) {
			if (event.target.closest(".collapsible-content")) return;
			target.classList.toggle("collapsed");
			this.#expandedSections.set(
				target.closest("[data-expand-id]")?.dataset.expandId,
				!target.classList.contains("collapsed")
			);
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
			handler.call(this, event, BlackFlagDragDrop);
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
