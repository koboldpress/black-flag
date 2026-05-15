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
				obj[key] = {
					fields: context.system.fields.proficiencies.fields.languages.fields.communication.model.fields,
					label: game.i18n.localize(config.label),
					prefix: `system.proficiencies.languages.communication.${key}.`,
					value: languages.communication[key] ?? {}
				};
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
		this._processChoices(languages, context.languages.dialects);

		return context;
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
				if (!value?.range) obj[key] = _del;
				else obj[key] = value;
				return obj;
			}, {}),
			custom: languages.custom,
			tags: filteredKeys(languages.tags ?? {}),
			value: filteredKeys(languages.value ?? {})
		});
		return submitData;
	}
}
