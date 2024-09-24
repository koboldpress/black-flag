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
	 * The EquipmentAdvancement on the background & class documents.
	 * @type {{ background: EquipmentAdvancement, class: EquipmentAdvancement }}
	 */
	get advancements() {
		return Object.fromEntries(
			Object.entries(this.documents).map(([k, v]) => [k, v?.system.advancement.byType("equipment")[0]])
		);
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

	/**
	 * The background & class documents offering starting equipment.
	 * @type {{ background: BlackFlagItem, class: BlackFlagItem }}
	 */
	get documents() {
		return {
			background: this.actor.system.progression.background,
			class: this.actor.system.progression.levels[1]?.class
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Total wealth granted after rolling.
	 * @type {number}
	 */
	#wealth;

	get wealth() {
		return this.#wealth;
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
			case "toggle":
				return this._prepareToggleContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare an entry in the equipment list for rendering.
	 * @param {EquipmentEntryData} entry - Entry to prepare.
	 * @returns {object}
	 */
	async _prepareEquipmentEntry(entry) {
		let disabled = false;
		if (entry.type === "linked" && entry.requiresProficiency) {
			const item = await fromUuid(entry.key);
			disabled = !item.system.proficientFor?.(this.actor);
		}
		return {
			count: entry.type in entry.constructor.OPTION_TYPES ? entry.count ?? 1 : null,
			disabled,
			entry,
			entries: await Promise.all(entry.children.map(e => this._prepareEquipmentEntry(e))),
			label: entry.label,
			options: entry.optionsWithProficiency(this.actor)
		};
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
		context.document = this.documents[partId];
		context.documentType = game.i18n.localize(CONFIG.Item.typeLabels[partId]).toLowerCase();
		const advancement = this.advancements[partId];
		if (!context.document || !advancement) return context;

		context.locked = advancement.configuredForLevel();
		if (advancement)
			context.entries = await Promise.all(
				advancement.configuration.pool.filter(e => !e.group).map(e => this._prepareEquipmentEntry(e))
			);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the rendering context for the mode toggle.
	 * @param {ApplicationRenderContext} context - Shared context provided by _prepareContext.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>} - Context data for a specific part.
	 */
	async _prepareToggleContext(context, options) {
		context.formula = `${CONFIG.BlackFlag.startingWealth.formula.replace("*", "×")} ${
			CONFIG.BlackFlag.startingWealth.currency
		}`;
		context.locked =
			this.advancements.class?.configuredForLevel() || this.advancements.background?.configuredForLevel();
		context.mode = this.advancements.class?.value.wealth ? "wealth" : "equipment";
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);
		if (event.target.name === "mode") {
			this.element
				.querySelectorAll("fieldset")
				.forEach(f => f.toggleAttribute("disabled", event.target.value === "wealth"));
		} else {
			let li = event.target.closest("li");
			let checkbox = li?.querySelector("& > .select > input");
			while (checkbox) {
				checkbox.checked = true;
				li = li.closest("ul")?.closest("li");
				checkbox = li.querySelector("& > .select > input");
			}
			this.#refreshRequiredStates();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onRender(context, options) {
		super._onRender(context, options);
		this.#refreshRequiredStates();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Modify the "required" attribute on form elements to reflect state of OR choices.
	 * @param {HTMLULElement} [list] - List element within which to search.
	 * @param {boolean} [remove=false] - Remove the required attribute regardless of radio state.
	 */
	#refreshRequiredStates(list, remove = false) {
		if (!list) {
			this.element.querySelectorAll("fieldset > .equipment-list").forEach(l => this.#refreshRequiredStates(l));
		} else if (remove) {
			list.querySelectorAll("input, select").forEach(e => e.removeAttribute("required"));
		} else {
			for (const li of list.children) {
				const radio = li.querySelector("& > .select > input");
				const childList = li.querySelector("& > .details > ul");
				const childSelect = li.querySelector("& > .details > select");
				const required = !radio || radio.checked;

				radio?.setAttribute("required", "");
				if (childList) this.#refreshRequiredStates(childList, !required);
				else if (childSelect && required) childSelect.setAttribute("required", "");
				else if (childSelect) childSelect.removeAttribute("required");
			}
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
		if (formData.get("mode") === "wealth") {
			if (!this.documents.class) throw new Error(game.i18n.localize("BF.Advancement.Equipment.Warning.NoClass"));
			const rolls = await CONFIG.Dice.BasicRoll.build(
				{ rolls: [{ parts: [CONFIG.BlackFlag.startingWealth.formula] }] },
				{ configure: false },
				{ data: { flavor: game.i18n.localize("BF.Advancement.Equipment.WealthRoll") } }
			);
			if (!rolls[0]) throw new Error("Could not roll for wealth.");
			this.#wealth = rolls[0].total;
			return;
		}

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

		for (const [type, advancement] of Object.entries(this.advancements)) {
			if (!advancement || advancement.configuredForLevel()) continue;
			advancement.configuration.pool.filter(e => !e.group).forEach(p => processPart(p, type));
		}

		if (selectionNeeded.length) {
			throw new Error(game.i18n.localize("BF.Advancement.Equipment.Warning.ChoiceRequired"));
		}
	}
}
