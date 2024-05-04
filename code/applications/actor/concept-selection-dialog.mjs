import { getPluralRules, numberFormat } from "../../utils/_module.mjs";

/**
 * Dialog that presents a list of class, subclass, lineage, heritage, or background options for the player to choose.
 */
export default class ConceptSelectionDialog extends FormApplication {
	constructor(actor, type, options = {}) {
		super(actor, options);
		this.options.classes.push(type);
		this.type = type;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor to which the item will be applied.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.object;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Type of item to be selected by this dialog.
	 * @type {string}
	 */
	type;

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "concept-selection-dialog"],
			width: "auto",
			height: "auto",
			classIdentifier: null
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get template() {
		const type = ["class", "subclass"].includes(this.type) ? "class" : "other";
		return `systems/black-flag/templates/actor/concept-selection-dialog-${type}.hbs`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return game.i18n.format("BF.ConceptSelection.Title", {
			type: game.i18n.localize(CONFIG.Item.typeLabels[this.type])
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.choices = await Promise.all(
			Object.values(CONFIG.BlackFlag.registration.list(this.type) ?? {}).map(o => this.getOptionData(o))
		);
		if (this.type === "class") {
			const existingClasses = new Set(Object.keys(this.actor.system.progression.classes));
			context.choices = context.choices.filter(choice => !existingClasses.has(choice.document.identifier));
		}
		if (this.type === "subclass")
			context.choices = context.choices.filter(
				choice => choice.document.system.identifier.class === this.options.classIdentifier
			);
		context.typeName = game.i18n.localize(CONFIG.Item.typeLabels[this.type]).toLowerCase();
		context.typeNamePlural = game.i18n.localize(CONFIG.Item.typeLabelsPlural[this.type]).toLowerCase();
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the data for individual options.
	 * @param {object} option - Registration information for this option.
	 * @returns {object}
	 */
	async getOptionData(option) {
		const doc = await fromUuid(option.sources[option.sources.length - 1]);
		const optionContext = {
			document: doc,
			enriched: {
				description: await TextEditor.enrichHTML(doc.system.description.short, { secrets: false, async: true })
			},
			system: doc.system
		};

		if (this.type === "class" && this.options.multiclass) {
			const abilities = this.actor.system.abilities;
			const keyAbilityOptions = doc.system.advancement.byType("keyAbility")[0]?.configuration.options;
			const validAbilities = Array.from(keyAbilityOptions).some(
				a => (abilities[a]?.value ?? 0) >= CONFIG.BlackFlag.multiclassingAbilityThreshold
			);
			if (!validAbilities) {
				const pluralRule = getPluralRules().select(keyAbilityOptions.size);
				optionContext.multiclassMessage = game.i18n.format(
					`BF.Progression.Warning.InsufficientSecondaryScore[${pluralRule}]`,
					{
						ability: game.i18n
							.getListFormatter({ type: "disjunction" })
							.format(keyAbilityOptions.map(a => CONFIG.BlackFlag.abilities.localized[a])),
						class: doc.name,
						threshold: numberFormat(CONFIG.BlackFlag.multiclassingAbilityThreshold)
					}
				);
			}
		}

		return optionContext;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll("button.choose")) {
			element.addEventListener("click", this._onChoose.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle choosing an option.
	 * @param {ClickEvent} event - Triggering click event.
	 */
	async _onChoose(event) {
		event.preventDefault();
		const uuid = event.target.closest("[data-uuid]").dataset.uuid;
		const document = await fromUuid(uuid);
		if (this.type === "class") await this.actor.system.levelUp(document);
		else if (this.type === "subclass") await this.actor.createEmbeddedDocuments("Item", [document.toObject()]);
		else await this.actor.system.setConcept(document);
		this.close();
	}
}
