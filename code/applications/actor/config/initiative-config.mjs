import BaseConfigSheet from "../api/base-config-sheet.mjs";

/**
 * Configuration application for actor initiative.
 */
export default class InitiativeConfig extends BaseConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["initiative", "form-list"],
		position: {
			width: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/actor/config/initiative-config.hbs"
		},
		modifiers: {
			classes: ["contents"],
			template: "systems/black-flag/templates/actor/config/modifier-section.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.format("BF.Action.Configure.Specific", { type: game.i18n.localize("BF.Initiative.Label") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		const defaultAbility = CONFIG.BlackFlag.abilities.localized[CONFIG.BlackFlag.defaultAbilities.initiative];
		context.abilityOptions = [
			{ value: "", label: game.i18n.format("BF.Default.Specific", { default: defaultAbility }) },
			{ rule: true },
			...CONFIG.BlackFlag.abilities.localizedOptions
		];
		context.initiative = {
			data: context.system.data.attributes.initiative,
			fields: context.system.fields.attributes.fields.initiative.fields
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareModifiers() {
		const modifiers = this.getModifiers([{ k: "type", v: "initiative" }]);
		return [
			{
				category: "initiative",
				type: "bonus",
				label: "BF.Initiative.Label",
				modifiers: modifiers.filter(m => m.type === "bonus")
			},
			{
				category: "initiative",
				type: "min",
				label: "BF.Initiative.Label",
				modifiers: modifiers.filter(m => m.type === "min")
			},
			{
				category: "initiative",
				type: "note",
				label: "BF.Initiative.Label",
				modifiers: modifiers.filter(m => m.type === "note")
			}
		];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_getModifierData(category, type) {
		const data = { type, filter: [{ k: "type", v: "initiative" }] };
		return data;
	}
}
