import { numberFormat } from "../../utils/_module.mjs";
import BFApplication from "../api/application.mjs";
import ConceptSelectionDialog from "./concept-selection-dialog.mjs";

/**
 * Dialog that gives the open of increasing a current class or multi-classing into a new one.
 */
export default class LevelUpDialog extends BFApplication {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			choose: LevelUpDialog.#chooseOption
		},
		classes: ["level-up-dialog"],
		position: {
			width: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/actor/level-up-dialog.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor to which the level up will be applied.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.options.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return `${game.i18n.localize("BF.Progression.Action.LevelUp.Label")} ${this.actor.name}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

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

	/**
	 * Handle choosing an option.
	 * @this {LevelUpDialog}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #chooseOption(event, target) {
		const classIdentifier = target.closest("[data-class]")?.dataset.class;
		const cls = this.actor.system.progression.classes[classIdentifier]?.document;
		await this.close();
		if (cls) {
			try {
				this.actor.system.levelUp(cls);
			} catch (err) {
				ui.notifications.warn(err.message);
			}
		} else {
			new ConceptSelectionDialog({ document: this.actor, details: { multiclass: true, type: "class" } }).render({
				force: true
			});
		}
	}
}
