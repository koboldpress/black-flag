/**
 * Base configuration dialog for actor properties.
 * @abstract
 */
export default class BaseConfig extends DocumentSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 450,
			height: "auto",
			submitOnChange: true,
			submitOnClose: true,
			closeOnSubmit: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	get title() {
		return `${game.i18n.format("BF.Configuration.Title", { type: this.type })}`;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Configuration type used when building the title.
	 * @type {string}
	 */
	get type() {
		return "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		return foundry.utils.mergeObject({
			CONFIG: CONFIG.BlackFlag,
			source: this.document.toObject().system,
			system: this.document.system,
			modifierSections: this.prepareModifiers() ?? {}
		}, await super.getData(options));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch modifiers from the document where certain filters are met or not.
	 * @param {FilterDescription[]} [include=[]] - Filters that should be included.
	 * @param {FilterDescription[]} [exclude=[]] - Filters that should not be included.
	 * @param {Function} [filter] - Additional filtering function to apply.
	 * @returns {Modifier[]}
	 */
	getModifiers(include=[], exclude=[], filter=null) {
		let modifiers = [];
		for ( let modifier of this.document.system.modifiers ) {
			let valid = true;
			for ( const i of include ) {
				if ( !modifier.filter.some(f => foundry.utils.objectsEqual(i, f)) ) valid = false;
			}
			for ( const e of exclude ) {
				if ( modifier.filter.some(f => foundry.utils.objectsEqual(e, f)) ) valid = false;
			}
			if ( !valid ) continue;

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
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll('[data-action="modifier"]') ) {
			element.addEventListener("click", this._onModifierAction.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle creating and deleting modifiers.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async _onModifierAction(event) {
		const { subAction } = event.currentTarget.dataset;
		const index = event.target.closest("[data-index]")?.dataset.index;
		const category = event.target.closest("[data-modifier-category]").dataset.modifierCategory;
		const type = event.target.closest("[data-modifier-type]").dataset.modifierType;
		switch (subAction) {
			case "add":
				const data = this._getModifierData(category, type);
				return this.document.system.addModifier(data);
			case "delete":
				return this.document.system.deleteModifier(index);
		}
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

	async _updateObject(event, formData) {
		const data = foundry.utils.expandObject(formData);

		// Intercept changes to modifiers
		if ( data.modifier ) {
			for ( const [index, updates] of Object.entries(data.modifier) ) {
				if ( foundry.utils.hasProperty(updates, "requireProficiency") ) {
					updates.filter = this.document.system.modifiers[Number(index)].filter;
					if ( updates.requireProficiency ) updates.filter.push({k: "proficiency", v: 1, o: "gte"});
					else updates.filter.findSplice(f => f.k === "proficiency");
				}
				await this.document.system.updateModifier(Number(index), updates, { render: false });
			}
			delete data.modifier;
			formData = foundry.utils.flattenObject(data);
		}

		super._updateObject(event, formData);
	}
}
