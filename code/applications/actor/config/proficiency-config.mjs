import { filteredKeys, Trait } from "../../../utils/_module.mjs";
import BaseConfig from "./base-config.mjs";

/**
 * Class for configuring armor & weapon proficiencies.
 */
export default class ProficiencyConfig extends BaseConfig {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "proficiency"],
			template: "systems/black-flag/templates/actor/config/proficiency-config.hbs",
			width: "auto"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	get type() {
		return game.i18n
			.getListFormatter()
			.format([game.i18n.localize("BF.Armor.Label[one]"), game.i18n.localize("BF.Weapon.Label[one]")]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		const proficiencies = this.document.system.proficiencies ?? {};
		context.armorOptions = Trait.choices("armor", { chosen: proficiencies.armor?.value });
		context.weaponOptions = Trait.choices("weapons", { chosen: proficiencies.weapons?.value });
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for (const checkbox of html.querySelectorAll('input[type="checkbox"]:checked')) {
			this._onToggleCategory(checkbox);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _onChangeInput(event) {
		if (event.target instanceof HTMLInputElement) this._onToggleCategory(event.target);
		super._onChangeInput(event);
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

	_updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);
		this.document.update({
			"system.proficiencies.armor.value": filteredKeys(updates.armor),
			"system.proficiencies.weapons.value": filteredKeys(updates.weapons)
		});
	}
}
