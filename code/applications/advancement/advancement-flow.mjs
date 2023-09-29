/**
 * Base class for the advancement interface displayed in the progression tab that should be subclassed by
 * individual advancement types.
 *
 * @param {BlackFlagActor} actor - Actor to which the advancement is being applied.
 * @param {Advancement} advancement - Advancement being represented.
 * @param {{character: number, class: number}} levels - Level for which to configure this flow.
 * @param {object} [options={}] - Application rendering options.
 */
export default class AdvancementFlow extends FormApplication {
	constructor(actor, advancement, levels, options={}) {
		super({}, options);
		this.#advancementId = advancement.id;
		this.actor = actor;
		this.item = advancement.item;
		this.levels = levels;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/advancement/advancement-flow.hbs",
			popOut: false,
			closeOnSubmit: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * ID of the advancement this flow modifies.
	 * @type {string}
	 * @private
	 */
	#advancementId;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor to which the advancement is being applied.
	 * @type {BlackFlagActor}
	 */
	actor;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The item that houses the Advancement.
	 * @type {BlackFlagItem}
	 */
	item;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Levels for which to configure this flow.
	 * @type {{character: number, class: number}}
	 */
	levels;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Data retained by the advancement manager during a reverse step. If restoring data using
	 * {@link Advancement#restore}, this data should be used when displaying the flow's form.
	 * @type {object|null}
	 */
	retainedData = null;

	/* <><><><> <><><><> <><><><> <><><><> */

	get element() {
		// Fix an issue with jQuery not being able to fetch element properly
		if ( this._element ) return this._element;
		return $(document.getElementById(this.id));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get id() {
		return `${this.advancement.uuid}-${this.levels.character}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get title() {
		return this.advancement.title;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The Advancement object this flow modifies.
	 * @type {Advancement|null}
	 */
	get advancement() {
		return this.item.system.advancement?.get(this.#advancementId) ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	getData() {
		return {
			appId: this.id,
			accentColor: this.advancement.item.accentColor,
			advancement: this.advancement,
			editingMode: this.advancement.actor.sheet.editingMode ?? false,
			type: this.advancement.constructor.typeName,
			title: this.advancement.titleForLevel(this.levels, { flow: true }),
			icon: this.advancement.icon,
			summary: this.advancement.summaryForLevel(this.levels, { flow: true }),
			levels: this.levels,
			needsConfiguration: !this.advancement.configuredForLevel(this.levels),
			warningKey: this.advancement.warningKey(this.levels)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		html.querySelector('[data-action="reverse"]')?.addEventListener("click", event => {
			this.advancement.reverse(this.levels);
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		await this.advancement.apply(this.levels, formData);
	}
}
