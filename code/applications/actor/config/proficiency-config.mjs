import { filteredKeys, Trait } from "../../../utils/_module.mjs";
import BaseConfigSheet from "../api/base-config-sheet.mjs";

/**
 * Class for configuring armor & weapon proficiencies.
 */
export default class ProficiencyConfig extends BaseConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["proficiency", "grid-columns"],
		position: {
			width: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		armor: {
			container: { classes: ["column-container"], id: "column-left" },
			template: "systems/black-flag/templates/actor/config/proficiency-config-armor.hbs"
		},
		weapons: {
			container: { classes: ["column-container"], id: "column-right" },
			template: "systems/black-flag/templates/actor/config/proficiency-config-weapons.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.format("BF.Action.Configure.Specific", {
			type: game.i18n
				.getListFormatter()
				.format([game.i18n.localize("BF.Armor.Label[one]"), game.i18n.localize("BF.WEAPON.Label[one]")])
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		const proficiencies = this.document.system.proficiencies ?? {};
		context.armorOptions = Trait.choices("armor", { chosen: proficiencies.armor?.value });
		context.weaponOptions = Trait.choices("weapons", { chosen: proficiencies.weapons?.value });
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Life-Cycle Handlers         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onRender(context, options) {
		super._onRender(context, options);
		for (const checkbox of this.element.querySelectorAll('input[type="checkbox"]:checked')) {
			this._onToggleCategory(checkbox);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		if (event.target instanceof HTMLInputElement) this._onToggleCategory(event.target);
		super._onChangeForm(formConfig, event);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Disable all children when a category is checked.
	 * @param {HTMLInputElement} checkbox - Checkbox to compare.
	 * @protected
	 */
	_onToggleCategory(checkbox) {
		const children = checkbox.closest("li")?.querySelector("ol");
		if (!children) return;

		for (const child of children.querySelectorAll('input[type="checkbox"]')) {
			child.checked = child.disabled = checkbox.checked;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);
		return foundry.utils.expandObject({
			"system.proficiencies.armor.value": filteredKeys(submitData.armor),
			"system.proficiencies.weapons.value": filteredKeys(submitData.weapons)
		});
	}
}
