import { parseInputDelta } from "../../utils/_module.mjs";
import IdentityConfig from "../identity-config.mjs";

/**
 * Adds V2 sheet functionality shared between primary document sheets (Actors & Items).
 * @param {typeof DocumentSheet} Base - The base class being mixed.
 * @returns {typeof PrimarySheet}
 */
export default function PrimarySheetMixin(Base) {
	return class PrimarySheet extends Base {
		/** @override */
		static DEFAULT_OPTIONS = {
			actions: {
				configureIdentity: PrimarySheet.#configureIdentity,
				deleteDocument: PrimarySheet.#onDeleteDocument,
				editImage: PrimarySheet._onEditImage,
				showDocument: PrimarySheet.#onShowDocument,
				toggleSheetMode: PrimarySheet.#toggleSheetMode
			},
			window: {
				controls: [
					{
						action: "configureIdentity",
						icon: "fa-solid fa-id-card",
						label: "BF.Identity.Configure",
						ownership: "OWNER"
					}
				]
			}
		};

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Available sheet modes.
		 * @enum {number}
		 */
		static MODES = {
			PLAY: 1,
			EDIT: 2
		};

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * @typedef BFSheetTabDescriptor
		 * @property {string} tab                       The tab key.
		 * @property {string} label                     The tab label's localization key.
		 * @property {string} [icon]                    A font-awesome icon.
		 * @property {string} [svg]                     An SVG icon.
		 * @property {BFSheetTabCondition} [condition]  A predicate to check before rendering the tab.
		 */

		/**
		 * @callback BFSheetTabCondition
		 * @param {Document} doc - The Document instance.
		 * @returns {boolean} - Whether to render the tab.
		 */

		/**
		 * Sheet tabs.
		 * @type {BFSheetTabDescriptor[]}
		 */
		static TABS = [];

		/* <><><><> <><><><> <><><><> <><><><> */
		/*             Properties              */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * The mode the sheet is currently in.
		 * @type {PrimarySheet.MODES|null}
		 * @protected
		 */
		_mode = null;

		/* <><><><> <><><><> <><><><> <><><><> */
		/*              Rendering              */
		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_attachFrameListeners() {
			new CONFIG.ux.ContextMenu(this.element, '.header-control[data-action="toggleControls"]', [], {
				eventName: "click",
				fixed: true,
				jQuery: false,
				onOpen: () => (ui.context.menuItems = Array.from(this._getHeaderControlContextEntries()))
			});
			super._attachFrameListeners();
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_configureRenderOptions(options) {
			super._configureRenderOptions(options);

			// Set initial mode
			let { mode, renderContext } = options;
			if (mode === undefined && renderContext === "createItem") mode = this.constructor.MODES.EDIT;
			this._mode = mode ?? this._mode ?? this.constructor.MODES.PLAY;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_configureRenderParts(options) {
			const parts = super._configureRenderParts(options);
			for (const key of Object.keys(parts)) {
				const tab = this.constructor.TABS.find(t => t.tab === key);
				if (tab?.condition && !tab.condition(this.document)) delete parts[key];
			}
			return parts;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Translate header controls to context menu entries.
		 * @returns {Generator<ContextMenuEntry>}
		 * @yields {ContextMenuEntry}
		 * @protected
		 */
		*_getHeaderControlContextEntries() {
			for (const { icon, label, action, onClick } of this._headerControlButtons()) {
				let handler = this.options.actions[action];
				if (typeof handler === "object") {
					if (handler.buttons && !handler.buttons.includes(0)) continue;
					handler = handler.handler;
				}
				yield {
					label,
					icon: `<i class="${icon}" inert></i>`,
					onClick: (event, target) => {
						if (onClick) onClick(event);
						else if (handler) handler.call(this, event, target);
						else this._onClickAction(event, target);
					}
				};
			}
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle re-rendering the mode toggle on ownership changes.
		 * @protected
		 */
		_renderModeToggle() {
			const header = this.element.querySelector(".window-header");
			const sibling = header.querySelector('[data-action="copyUuid"], [data-action="close"]');
			let toggle = header.querySelector(".mode-toggle");
			if (this.isEditable && !toggle) {
				toggle = document.createElement("button");
				toggle.type = "button";
				toggle.classList.add("header-control", "state-toggle", "mode-toggle", "icon", "fa-solid");
				Object.assign(toggle.dataset, { action: "toggleSheetMode", tooltipDirection: "DOWN" });
				sibling.before(toggle);
			} else if (!this.isEditable && toggle) {
				toggle.remove();
				toggle = null;
			}

			if (toggle) {
				const editing = this._mode === this.constructor.MODES.EDIT;
				toggle.ariaPressed = editing;
				toggle.dataset.tooltip = `BF.EditingMode.${editing ? "Editable" : "Locked"}`;
				toggle.classList.toggle("fa-lock", !editing);
				toggle.classList.toggle("fa-lock-open", editing);
			}
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _prepareContext(options) {
			const context = await super._prepareContext(options);
			context.editable = this.isEditable && this._mode === this.constructor.MODES.EDIT;
			context.locked = !this.isEditable;
			context.owner = this.document.isOwner;
			context.tabs = this._getTabs();
			return context;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _preparePartContext(partId, options) {
			const context = await super._preparePartContext(partId, options);
			context.tab = context.tabs[partId];
			return context;
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Prepare the tab information for the sheet.
		 * @returns {Record<string, Partial<ApplicationTab>>}
		 * @protected
		 */
		_getTabs() {
			return this.constructor.TABS.reduce((tabs, { tab, condition, ...config }) => {
				if (!condition || condition(this.document))
					tabs[tab] = {
						...config,
						id: tab,
						group: "primary",
						active: this.tabGroups.primary === tab,
						cssClass: this.tabGroups.primary === tab ? "active" : ""
					};
				return tabs;
			}, {});
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		_toggleDisabled(disabled) {
			super._toggleDisabled(disabled);
			this.element
				.querySelectorAll("fieldset, .always-interactive, .interface-only")
				.forEach(input => (input.disabled = false));
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*         Life-Cycle Handlers         */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Add tooltips to inventory items.
		 * @param {HTMLElement} element - The element to get a tooltip.
		 * @protected
		 */
		_applyItemTooltip(element) {
			if ("tooltip" in element.dataset) return;

			const target = element.closest("[data-item-id], [data-effect-id], [data-uuid]");
			let { uuid, effectId, itemId, parentId } = target?.dataset ?? {};
			let targetClass = "item-tooltip";
			if (!uuid && itemId) uuid = this.actor.items.get(itemId)?.uuid;
			else if (!uuid && effectId) {
				const collection = parentId ? this.actor.items.get(parentId)?.effects : this.actor.effects;
				uuid = collection.get(effectId)?.uuid;
				targetClass = "effect-tooltip";
			}
			if (!uuid) return;

			element.dataset.tooltip = `<section class="loading" data-uuid="${uuid}"></section>`;
			element.dataset.tooltipClass = `black-flag black-flag-tooltip ${targetClass}`;
			element.dataset.tooltipDirection ??= "LEFT";
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/** @inheritDoc */
		async _onRender(context, options) {
			await super._onRender(context, options);

			// Set toggle state and add status class to frame
			this._renderModeToggle();
			this.element.classList.toggle("editable", this.isEditable && this._mode === this.constructor.MODES.EDIT);
			this.element.classList.toggle("interactable", this.isEditable && this._mode === this.constructor.MODES.PLAY);
			this.element.classList.toggle("locked", !this.isEditable);

			for (const element of this.element.querySelectorAll(".item-tooltip")) this._applyItemTooltip(element);

			if (this.document.system.color) {
				this.element.style.setProperty("--bf-item-color", this.document.system.color);
			}

			if (this.isEditable) {
				// Automatically select input contents when focused
				this.element.querySelectorAll("input").forEach(e => e.addEventListener("focus", e.select));

				// Handle delta inputs
				this.element
					.querySelectorAll('input[type="text"][data-dtype="Number"]')
					.forEach(i => i.addEventListener("change", this._onChangeInputDelta.bind(this)));
			}
		}

		/* <><><><> <><><><> <><><><> <><><><> */
		/*            Event Handlers           */
		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle showing the identify configuration application.
		 * @this {PrimarySheet}
		 * @param {Event} event - Triggering click event.
		 * @param {HTMLElement} target - Button that was clicked.
		 */
		static async #configureIdentity(event, target) {
			new IdentityConfig({ document: this.document }).render({ force: true });
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle input changes to numeric form fields, allowing them to accept delta-typed inputs.
		 * @param {Event} event - Triggering event.
		 * @protected
		 */
		_onChangeInputDelta(event) {
			const input = event.target;
			const target = this.actor.items.get(input.closest("[data-item-id]")?.dataset.itemId) ?? this.actor;
			const { activityId } = input.closest("[data-activity-id]")?.dataset ?? {};
			const activity = target?.system.activities?.get(activityId);
			const result = parseInputDelta(input, activity ?? target);
			if (result !== undefined) {
				// Special case handling for Item uses.
				if (input.dataset.name === "system.uses.value") {
					target.update({ "system.uses.spent": target.system.uses.max - result });
				} else if (activity && input.dataset.name === "uses.value") {
					target.updateActivity(activityId, { "uses.spent": activity.uses.max - result });
				} else target.update({ [input.dataset.name]: result });
			}
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle removing an document.
		 * @this {PrimarySheet}
		 * @param {Event} event - Triggering click event.
		 * @param {HTMLElement} target - Button that was clicked.
		 */
		static async #onDeleteDocument(event, target) {
			if ((await this._onDeleteDocument(event, target)) === false) return;
			const uuid = target.closest("[data-uuid]")?.dataset.uuid;
			const doc = await fromUuid(uuid);
			doc?.deleteDialog({ sheet: this });
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle removing an document.
		 * @param {Event} event - Triggering click event.
		 * @param {HTMLElement} target - Button that was clicked.
		 * @returns {any} - Return `false` to prevent default behavior.
		 */
		async _onDeleteDocument(event, target) {}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle opening a document sheet.
		 * @this {PrimarySheet}
		 * @param {Event} event - Triggering click event.
		 * @param {HTMLElement} target - Button that was clicked.
		 */
		static async #onShowDocument(event, target) {
			if ((await this._onShowDocument(event, target)) === false) return;
			if ([HTMLInputElement, HTMLSelectElement].some(el => event.target instanceof el)) return;
			const uuid = target.closest("[data-uuid]")?.dataset.uuid;
			const doc = await fromUuid(uuid);
			this._openDocumentSheet(doc);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle opening a document sheet.
		 * @param {Event} event - Triggering click event.
		 * @param {HTMLElement} target - Button that was clicked.
		 * @returns {any} - Return `false` to prevent default behavior.
		 */
		async _onShowDocument(event, target) {}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Open a document's sheet, rendering it as a child of this application if supported.
		 * @param {Document} doc - The document whose sheet should be opened.
		 * @param {RenderOptions} [options] - Options passed to render.
		 * @protected
		 */
		_openDocumentSheet(doc, options = {}) {
			if (doc?.sheet) this._renderChild(doc.sheet, options);
		}

		/* <><><><> <><><><> <><><><> <><><><> */

		/**
		 * Handle changing the mode on the sheet.
		 * @this {PrimarySheet}
		 * @param {Event} event - Triggering click event.
		 * @param {HTMLElement} target - Button that was clicked.
		 */
		static async #toggleSheetMode(event, target) {
			if ((await this._toggleSheetMode(event, target)) === false) return;
			const { MODES } = this.constructor;
			this._mode = target.ariaPressed === "false" ? MODES.EDIT : MODES.PLAY;
			await this.submit();
			this.render();
		}

		/**
		 * Handle changing the mode on the sheet.
		 * @param {Event} event - Triggering click event.
		 * @param {HTMLElement} target - Button that was clicked.
		 * @returns {any} - Return `false` to prevent default behavior.
		 * @protected
		 */
		async _toggleSheetMode(event, target) {}
	};
}
