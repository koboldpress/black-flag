import { filteredKeys, Trait } from "../../../utils/_module.mjs";
import BaseConfig from "./base-config.mjs";

/**
 * Class for configuring language proficiencies.
 */
export default class LanguageConfig extends BaseConfig {

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "language"],
			template: "systems/black-flag/templates/actor/config/language-config.hbs",
			width: "auto"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get type() {
		return game.i18n.localize("BF.Language.Label[other]");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		const languages = this.document.system.proficiencies.languages ?? {};
		context.dialects = Trait.choices("languages", { chosen: languages.value });
		context.communication = Object.entries(CONFIG.BlackFlag.rangedCommunication).reduce((obj, [key, config]) => {
			obj[key] = { label: game.i18n.localize(config.label), value: languages.communication[key] ?? {} };
			return obj;
		}, {});
		context.custom = languages.custom;
		context.tagOptions = Object.entries(CONFIG.BlackFlag.languageTags).reduce((obj, [key, config]) => {
			obj[key] = { label: game.i18n.localize(config.label), chosen: languages.tags.has(key) };
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const checkbox of html.querySelectorAll('input[type="checkbox"]:checked') ) {
			this._onToggleCategory(checkbox);
		}

		html.querySelector('[data-action="add"]').addEventListener("click", event =>
			this.submit({ updateData: { newCustom: true } })
		);

		for ( const control of html.querySelectorAll('[data-action="delete"]') ) {
			control.addEventListener("click", event =>
				this.submit({ updateData: { deleteCustom: Number(event.currentTarget.dataset.index) } })
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onChangeInput(event) {
		if ( event.target instanceof HTMLInputElement ) this._onToggleCategory(event.target);
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
		if ( !children ) return;

		for ( const child of children.querySelectorAll('input[type="checkbox"]') ) {
			child.checked = child.disabled = checkbox.checked;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getSubmitData(...args) {
		const data = foundry.utils.expandObject(super._getSubmitData(...args));

		const custom = Array.from(Object.values(data.custom ?? {}));
		if ( data.deleteCustom !== undefined ) custom.splice(data.deleteCustom, 1);
		if ( data.newCustom ) custom.push("");

		return { "system.proficiencies.languages": {
			value: filteredKeys(data.dialects ?? {}),
			communication: Object.entries(data.communication).reduce((obj, [key, value]) => {
				if ( !value ) obj[`-=${key}`] = null;
				else obj[`${key}.range`] = value;
				return obj;
			}, {}),
			custom,
			tags: filteredKeys(data.tags ?? {})
		} };
	}
}
