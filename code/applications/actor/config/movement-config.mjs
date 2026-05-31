import { filteredKeys } from "../../../utils/_module.mjs";
import BaseCustomConfigSheet from "../api/base-custom-config-sheet.mjs";

/**
 * Configuration application for an actor's movement.
 */
export default class MovementConfig extends BaseCustomConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["movement", "form-list"],
		position: {
			width: 450
		},
		customKeyPath: "system.traits.movement.custom"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			classes: ["contents"],
			template: "systems/black-flag/templates/actor/config/movement-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return _loc("BF.Action.Configure.Specific", { type: _loc("BF.MOVEMENT.Label") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);

		context.difficultTerrainTypes = [
			{ value: "ALL", label: _loc("BF.REGIONBEHAVIORS.DIFFICULTTERRAIN.Type.All") },
			{ value: "magical", label: _loc("BF.REGIONBEHAVIORS.DIFFICULTTERRAIN.Type.Magical") },
			{ value: "nonmagical", label: _loc("BF.REGIONBEHAVIORS.DIFFICULTTERRAIN.Type.Nonmagical") },
			{ rule: true },
			...CONFIG.BlackFlag.difficultTerrainTypes.localizedOptions
		];

		context.movement = {
			data: context.system.source.traits.movement,
			fields: context.system.fields.traits.fields.movement.fields
		};
		context.showBase = Object.hasOwn(this.document.system.traits.movement ?? {}, "base");
		context.types = Object.entries(CONFIG.BlackFlag.movementTypes).reduce((obj, [key, config]) => {
			const keyPath = `system.traits.movement.types.${key}`;
			obj[key] = {
				field: context.movement.fields.types.model,
				label: _loc(config.label),
				name: keyPath,
				placeholder:
					foundry.utils.getProperty(this.document.overrides, keyPath) ??
					foundry.utils.getProperty(this.document.advancementOverrides, keyPath) ??
					"",
				value: context.movement.data.types?.[key] ?? ""
			};
			return obj;
		}, {});
		context.tagOptions = Object.entries(CONFIG.BlackFlag.movementTags).reduce((obj, [key, config]) => {
			if (!config.validTypes || config.validTypes.has(this.document.type)) {
				obj[key] = { label: _loc(config.label), chosen: context.movement.data.tags?.includes(key) };
			}
			return obj;
		}, {});

		if (Object.hasOwn(this.document.system.traits, "pace")) {
			context.pace = {
				data: context.system.source.traits.pace,
				fields: context.system.fields.traits.fields.pace.fields,
				types: CONFIG.BlackFlag.movementTypes.localizedOptions.map(({ value, label }) => ({
					field: context.system.fields.traits.fields.pace.fields.types.model,
					label,
					name: `system.traits.pace.types.${value}`,
					value: context.system.source.traits.pace.types[value]
				}))
			};
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);
		if (!submitData.system.traits.movement) foundry.utils.setProperty(submitData, "system.traits.movement", {});
		submitData.system.traits.movement.tags = filteredKeys(submitData.system.traits.movement.tags ?? {});
		return submitData;
	}
}
