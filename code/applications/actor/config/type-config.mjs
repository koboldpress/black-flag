import SelectChoices from "../../../documents/select-choices.mjs";
import { filteredKeys } from "../../../utils/_module.mjs";
import BaseCustomConfigSheet from "../api/base-custom-config-sheet.mjs";

/**
 * Configuration application for an actor's type & size.
 */
export default class TypeConfig extends BaseCustomConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["type"],
		position: {
			width: 500
		},
		customKeyPath: "system.traits.type.custom"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/actor/config/type-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get title() {
		return game.i18n.localize("BF.CreatureType.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);

		const type = context.system.source.traits?.type ?? {};
		context.custom = type.custom;
		context.showDimensions = Object.hasOwn(this.document.system.traits, "dimensions");
		context.showSwarm = Object.hasOwn(this.document.system.traits.type ?? {}, "swarm");
		context.showTags = Object.hasOwn(this.document.system.traits.type ?? {}, "tags");
		context.tagOptions = new SelectChoices(CONFIG.BlackFlag.creatureTags, new Set(type.tags)).localize().sort();

		context.type = {
			data: context.system.source.traits.type,
			fields: context.system.fields.traits.fields.type.fields,
			options:
				this.document.type === "vehicle"
					? CONFIG.BlackFlag.vehicles.localizedOptions
					: CONFIG.BlackFlag.creatureTypes.localizedOptions
		};

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);
		if (!submitData.system.traits.type) foundry.utils.setProperty(submitData, "system.traits.type", {});
		submitData.system.traits.type.tags = filteredKeys(submitData.system.traits.type.tags ?? {});
		return submitData;
	}
}
