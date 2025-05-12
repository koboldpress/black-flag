import { getPluralRules, numberFormat } from "../../utils/_module.mjs";
import BFApplication from "../api/application.mjs";

/**
 * Dialog that presents a list of class, subclass, lineage, heritage, or background options for the player to choose.
 */
export default class ConceptSelectionDialog extends BFApplication {
	// constructor(type, options = {}) {
	// 	super(options);
	// 	this.options.classes.push(type);
	// }

	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			choose: ConceptSelectionDialog.#chooseConcept
		},
		classes: ["concept-selection-dialog"],
		details: {
			classIdentifier: null,
			multiclass: false,
			type: null
		},
		position: {
			width: "auto",
			height: "auto"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		class: {
			template: "systems/black-flag/templates/actor/concept-selection-dialog-class.hbs"
		},
		other: {
			template: "systems/black-flag/templates/actor/concept-selection-dialog-other.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor to which the item will be applied.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.options.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return game.i18n.format("BF.ConceptSelection.Title", {
			type: game.i18n.localize(CONFIG.Item.typeLabels[this.type])
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Type of item to be selected by this dialog.
	 * @type {string}
	 */
	get type() {
		return this.options.details.type;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		if (this.type === "class") options.parts = ["class"];
		else options.parts = ["other"];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onFirstRender(context, options) {
		super._onFirstRender(context, options);
		this.element.classList.add(this.type);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		context.choices = await Promise.all(
			Object.values(CONFIG.BlackFlag.registration.list(this.type) ?? {}).map(o => this.getOptionData(o))
		);
		if (this.type === "class") {
			const existingClasses = new Set(Object.keys(this.actor.system.progression.classes));
			context.choices = context.choices.filter(choice => !existingClasses.has(choice.document.identifier));
		} else if (this.type === "subclass")
			context.choices = context.choices.filter(
				choice => choice.document.system.identifier.class === this.options.details.classIdentifier
			);
		context.type = this.type;
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
				description: await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(
					doc.system.description.short,
					{ secrets: false, async: true }
				)
			},
			system: doc.system
		};

		if (this.type === "class" && this.options.details.multiclass) {
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

	/**
	 * Handle choosing an option.
	 * @this {ConceptSelectionDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #chooseConcept(event, target) {
		const uuid = event.target.closest("[data-uuid]").dataset.uuid;
		const document = await fromUuid(uuid);
		await this.close();
		if (this.type === "class") await this.actor.system.levelUp(document);
		else if (this.type === "subclass") await this.actor.createEmbeddedDocuments("Item", [document.toObject()]);
		else await this.actor.system.setConcept(document);
	}
}
