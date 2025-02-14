import { filteredKeys } from "../../../utils/_module.mjs";
import BaseCustomConfigSheet from "../api/base-custom-config-sheet.mjs";

/**
 * Configuration application for an actor's senses.
 */
export default class SensesConfig extends BaseCustomConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["senses", "form-list"],
		position: {
			width: 450
		},
		customKeyPath: "system.traits.senses.custom"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		types: {
			template: "systems/black-flag/templates/actor/config/senses-config-types.hbs"
		},
		tags: {
			template: "systems/black-flag/templates/actor/config/senses-config-tags.hbs"
		},
		custom: {
			template: "systems/black-flag/templates/actor/config/senses-config-custom.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.format("BF.Action.Configure.Specific", { type: game.i18n.localize("BF.SENSES.Label[other]") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);

		const senses = context.system.source.traits.senses ?? {};
		context.senses = {
			data: senses,
			fields: context.system.fields.traits.fields.senses.fields,
			tagOptions: Object.entries(CONFIG.BlackFlag.senseTags).reduce((obj, [key, config]) => {
				obj[key] = { label: game.i18n.localize(config.label), chosen: senses.tags?.includes(key) };
				return obj;
			}, {}),
			types: Object.entries(CONFIG.BlackFlag.senses.localized).reduce((obj, [key, label]) => {
				const keyPath = `system.traits.senses.types.${key}`;
				obj[key] = {
					label,
					value: senses.types?.[key] ?? "",
					placeholder:
						foundry.utils.getProperty(this.document.overrides, keyPath) ??
						foundry.utils.getProperty(this.document.advancementOverrides, keyPath) ??
						""
				};
				return obj;
			}, {})
		};

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);
		submitData.system.traits.senses.tags = filteredKeys(submitData.system.traits.senses.tags ?? {});
		return submitData;
	}
}
