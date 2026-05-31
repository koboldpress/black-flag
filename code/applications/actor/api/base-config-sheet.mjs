import BFDocumentSheet from "../../api/document-sheet.mjs";

/**
 * Base document sheet from which all actor configuration applications should be based.
 */
export default class BaseConfigSheet extends BFDocumentSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["config-sheet", "standard-form"],
		sheetConfig: false,
		actions: {
			addModifier: BaseConfigSheet.#addModifier,
			deleteModifier: BaseConfigSheet.#deleteModifier
		},
		form: {
			submitOnChange: true
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.fields = this.document.schema.fields;
		context.source = this.document.toObject();
		context.system = {
			data: this.document.system,
			source: context.source.system,
			fields: this.document.system.schema.fields
		};
		context.modifierSections = this.prepareModifiers();
		context.proficiencyOptions = [
			{ value: 0, label: _loc("BF.Proficiency.Level.None") },
			{ value: 0.5, label: _loc("BF.Proficiency.Level.Half") },
			{ value: 1, label: _loc("BF.Proficiency.Level.Proficient") },
			{ value: 2, label: _loc("BF.Proficiency.Level.Expertise") }
		];
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch modifiers from the document where certain filters are met or not.
	 * @param {FilterDescription[]} [include=[]] - Filters that should be included.
	 * @param {FilterDescription[]} [exclude=[]] - Filters that should not be included.
	 * @param {Function} [filter] - Additional filtering function to apply.
	 * @returns {Modifier[]}
	 */
	getModifiers(include = [], exclude = [], filter = null) {
		let modifiers = [];
		for (let modifier of this.document.system.modifiers) {
			let valid = true;
			for (const i of include) {
				if (!modifier.filter.some(f => foundry.utils.equals(i, f))) valid = false;
			}
			for (const e of exclude) {
				if (modifier.filter.some(f => foundry.utils.equals(e, f))) valid = false;
			}
			if (!valid) continue;

			const mod = foundry.utils.deepClone(modifier);
			mod.index = modifier.index;
			mod.requireProficiency = mod.filter.some(f => f.k === "proficiency");
			modifiers.push(mod);
		}
		return foundry.utils.getType(filter) === "function" ? modifiers.filter(filter) : modifiers;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare modifier sections that should be displayed.
	 * @returns {object}
	 * @abstract
	 */
	prepareModifiers() {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Processes the choices to ensure that children are checked if the category is checked and that
	 * masteries are only enabled if character has proficiency.
	 * @param {object} data - Traits data.
	 * @param {SelectChoices} choices - Choices object.
	 * @param {boolean} [categoryChosen=false] - Is the category above this one selected?
	 * @protected
	 */
	_processChoices(data, choices, categoryChosen = false) {
		for (const [key, choice] of Object.entries(choices)) {
			this._processChoice(data, key, choice, categoryChosen);
			if (choice.children) this._processChoices(data, choice.children, choice.chosen && key !== "OTHER");
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any modification on a choice.
	 * @param {object} data - Traits data.
	 * @param {string} key - Choice key.
	 * @param {object} choice - Data for the choice.
	 * @param {boolean} [categoryChosen=false] - Is the category above this one selected?
	 * @protected
	 */
	_processChoice(data, key, choice, categoryChosen = false) {
		if ((data.value?.includes?.("ALL") && key !== "ALL") || categoryChosen) {
			choice.chosen = true;
			choice.disabled = true;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle adding a modifier of certain type.
	 * @this {BaseConfigSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #addModifier(event, target) {
		const category = target.closest("[data-modifier-category]")?.dataset.modifierCategory;
		const type = target.closest("[data-modifier-type]")?.dataset.modifierType;
		if (!category || !type) return;
		const data = this._getModifierData(category, type);
		this.document.system.addModifier(data);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing a modifier of certain type.
	 * @this {BaseConfigSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #deleteModifier(event, target) {
		const index = target.closest("[data-index]")?.dataset.index;
		if (index) this.document.system.deleteModifier(index);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Produce modifier creation data.
	 * @param {string} category - Modifier category.
	 * @param {string} type - Modifier type.
	 * @returns {object}
	 * @abstract
	 */
	_getModifierData(category, type) {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);
		if ("modifier" in submitData) {
			const modifierData = this.document.system.toObject().modifiers ?? [];
			for (const [index, updates] of Object.entries(submitData.modifier)) {
				const entryData = modifierData[Number(index)];
				if (!entryData) continue;
				if ("requireProficiency" in updates) {
					updates.filter = entryData.filter;
					if (updates.requireProficiency) updates.filter.push({ k: "proficiency", v: 1, o: "gte" });
					else updates.filter.findSplice(f => f.k === "proficiency");
				}
				foundry.utils.mergeObject(entryData, updates, { performDeletions: true });
			}
			delete submitData.modifier;
			foundry.utils.setProperty(submitData, "system.modifiers", modifierData);
		}
		return submitData;
	}
}
