import BFApplication from "../api/application.mjs";

/**
 * Application for selecting starting equipment from a class & background.
 */
export default class EquipmentDialog extends BFApplication {
	constructor(options = {}) {
		super(options);
		this.#actor = options.actor;
	}

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["equipment-dialog", "form-list"],
		tag: "form",
		window: {
			title: "BF.Advancement.Equipment.Selection.Title",
			icon: "fa-solid fa-shield"
		},
		form: {
			handler: EquipmentDialog.#onSubmitForm,
			closeOnSubmit: true
		},
		position: {
			width: 600,
			height: "auto"
		}
	};

	/** @override */
	static PARTS = {
		toggle: {
			template: "systems/black-flag/templates/advancement/equipment-dialog-toggle.hbs"
		},
		class: {
			template: "systems/black-flag/templates/advancement/equipment-dialog-selection.hbs"
		},
		background: {
			template: "systems/black-flag/templates/advancement/equipment-dialog-selection.hbs"
		},
		submit: {
			template: "systems/black-flag/templates/advancement/equipment-dialog-submit.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor for which the equipment is being selected.
	 * @type {BlackFlagActor}
	 */
	#actor;

	get actor() {
		return this.#actor;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Assignments that have been made.
	 * @type {{ background: GrantedEquipmentData[], class: GrantedEquipmentData[] }}
	 */
	#assignments;

	get assignments() {
		return this.#assignments;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "background":
			case "class":
				return this._prepareSelectionContext(partId, context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the rendering context for the individual selection sections.
	 * @param {string} partId - The part being rendered.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>} - Context data for a specific part.
	 * @protected
	 */
	async _prepareSelectionContext(partId, context, options) {
		if (partId === "class") {
			context.document = this.actor.system.progression.levels[1].class;
		} else {
			context.document = this.actor.system.progression.background;
		}

		const advancement = context.document.system.advancement.byType("equipment")[0];
		if (advancement) {
			context.entries = advancement.configuration.pool.filter(e => !e.group).map(e => this._prepareEquipmentEntry(e));
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare an entry in the equipment list for rendering.
	 * @param {EquipmentEntryData} entry - Entry to prepare.
	 * @returns {object}
	 */
	_prepareEquipmentEntry(entry) {
		// TODO: If proficiency is required, check first
		return {
			count: entry.type in entry.constructor.OPTION_TYPES ? entry.count ?? 1 : null,
			entry,
			entries: entry.children.map(e => this._prepareEquipmentEntry(e)),
			label: entry.label,
			options: entry.options
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);
		let li = event.target.closest("li");
		let checkbox = li.querySelector("& > .select > input");
		while (checkbox) {
			checkbox.checked = true;
			li = li.closest("ul")?.closest("li");
			checkbox = li.querySelector("& > .select > input");
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle submitting the form.
	 * @this {EquipmentDialog}
	 * @param {Event|SubmitEvent} event - The form submission event.
	 * @param {HTMLFormElement} form - The submitted form.
	 * @param {FormDataExtended} formData - Data from the form.
	 */
	static async #onSubmitForm(event, form, formData) {
		// TODO: Handle gold alternative
		// TODO: Handle adding only background or only class equipment

		this.#assignments = { background: [], class: [] };
		const selectionNeeded = [];
		const submittedSelections = foundry.utils.expandObject(formData.object)?.selection ?? {};

		const processPart = (part, type) => {
			const selection = submittedSelections[part._id];
			switch (part.type) {
				case "AND":
					part.children.forEach(p => processPart(p, type));
					break;
				case "OR":
					if (selection)
						processPart(
							part.children.find(c => c._id === selection),
							type
						);
					else selectionNeeded.push(part._id);
					break;
				default:
					const uuid = part.findSelection(selection);
					if (uuid) this.#assignments[type].push({ part: part._id, count: part.count ?? 1, uuid });
					else selectionNeeded.push(part._id);
			}
		};

		const handleAdvancement = (item, type) => {
			item.system.advancement
				.byType("equipment")[0]
				.configuration.pool.filter(e => !e.group)
				.forEach(p => processPart(p, type));
		};
		handleAdvancement(this.actor.system.progression.levels[1].class, "class");
		handleAdvancement(this.actor.system.progression.background, "background");

		if (selectionNeeded.length) {
			throw new Error("must select");
			// TODO: Properly show errors
		}
	}
}
