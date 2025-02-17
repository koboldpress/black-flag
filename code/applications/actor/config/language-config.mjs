import { filteredKeys, Trait } from "../../../utils/_module.mjs";
import BaseCustomConfigSheet from "../api/base-custom-config-sheet.mjs";

/**
 * Class for configuring language proficiencies.
 */
export default class LanguageConfig extends BaseCustomConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["language", "grid-columns"],
		position: {
			width: "auto"
		},
		customKeyPath: "system.proficiencies.languages.custom"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		dialects: {
			container: { classes: ["column-container"], id: "column-left" },
			template: "systems/black-flag/templates/actor/config/language-config-dialects.hbs"
		},
		custom: {
			container: { classes: ["column-container"], id: "column-right" },
			template: "systems/black-flag/templates/actor/config/language-config-custom.hbs"
		},
		tags: {
			container: { classes: ["column-container"], id: "column-right" },
			template: "systems/black-flag/templates/actor/config/language-config-tags.hbs"
		},
		communication: {
			container: { classes: ["column-container"], id: "column-right" },
			template: "systems/black-flag/templates/actor/config/language-config-communication.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.format("BF.Action.Configure.Specific", { type: game.i18n.localize("BF.Language.Label[other]") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);

		const languages = context.system.source.proficiencies.languages ?? {};
		context.languages = {
			communication: Object.entries(CONFIG.BlackFlag.rangedCommunication).reduce((obj, [key, config]) => {
				obj[key] = { label: game.i18n.localize(config.label), value: languages.communication[key] ?? {} };
				return obj;
			}, {}),
			data: languages,
			dialects: Trait.choices("languages", { chosen: languages.value }),
			fields: context.system.fields.proficiencies.fields.languages.fields,
			tagOptions: Object.entries(CONFIG.BlackFlag.languageTags.localized).reduce((obj, [key, label]) => {
				obj[key] = { label, chosen: languages.tags.includes(key) };
				return obj;
			}, {})
		};

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
		const languages = submitData.system.proficiencies?.languages ?? {};
		foundry.utils.setProperty(submitData, "system.proficiencies.languages", {
			communication: Object.entries(languages.communication ?? {}).reduce((obj, [key, value]) => {
				if (!value) obj[`-=${key}`] = null;
				else obj[key] = { range: value };
				return obj;
			}, {}),
			custom: languages.custom,
			tags: filteredKeys(languages.tags ?? {}),
			value: filteredKeys(languages.value ?? {})
		});
		return submitData;
	}
}
