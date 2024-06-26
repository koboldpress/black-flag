import { numberFormat } from "../../utils/_module.mjs";
import ConceptSelectionDialog from "./concept-selection-dialog.mjs";

/**
 * Dialog that gives the open of increasing a current class or multi-classing into a new one.
 */
export default class LevelUpDialog extends FormApplication {
	/**
	 * Actor to which the level up will be applied.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.object;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "level-up-dialog"],
			width: 500,
			height: "auto",
			template: "systems/black-flag/templates/actor/level-up-dialog.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return `${game.i18n.localize("BF.Progression.Action.LevelUp.Label")} ${this.actor.name}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		context.CONFIG = CONFIG.BlackFlag;
		context.system = this.actor.system;

		const primaryClass = this.actor.system.progression.levels[1].class;
		const abilityValue = this.actor.system.abilities[primaryClass.system.keyAbility]?.value ?? 0;
		if (abilityValue < CONFIG.BlackFlag.multiclassingAbilityThreshold) {
			context.multiclassMessage = game.i18n.format("BF.Progression.Warning.InsufficientPrimaryScore", {
				ability: CONFIG.BlackFlag.abilities.localized[primaryClass.system.keyAbility],
				threshold: numberFormat(CONFIG.BlackFlag.multiclassingAbilityThreshold),
				value: numberFormat(abilityValue)
			});
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const element of html.querySelectorAll("button")) {
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
		const classIdentifier = event.target.closest("[data-class]")?.dataset.class;
		const cls = this.actor.system.progression.classes[classIdentifier]?.document;
		if (cls) {
			try {
				this.actor.system.levelUp(cls);
			} catch (err) {
				ui.notifications.warn(err.message);
			}
		} else {
			new ConceptSelectionDialog(this.actor, "class", { multiclass: true }).render(true);
		}
		this.close();
	}
}
