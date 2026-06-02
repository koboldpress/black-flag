import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Check activities.
 */
export default class CheckSheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["check-activity"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		effect: {
			template: "systems/black-flag/templates/activity/check-effect.hbs",
			templates: [...super.PARTS.effect.templates, "systems/black-flag/templates/activity/parts/check-details.hbs"]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareEffectContext(context) {
		context = await super._prepareEffectContext(context);

		const group = _loc("BF.Ability.Label[other]");
		context.abilityOptions = [
			{ value: "", label: "" },
			{ rule: true },
			{ value: "spellcasting", label: _loc("BF.Spellcasting.Label") },
			...CONFIG.BlackFlag.abilities.localizedOptions.map(o => ({ ...o, group }))
		];

		context.associatedOptions = [
			...CONFIG.BlackFlag.skills.localizedOptions.map(o => ({
				...o,
				group: _loc("BF.Skill.Label[other]")
			})),
			...CONFIG.BlackFlag.tools.localizedOptions.map(o => ({
				...o,
				group: _loc("BF.Tool.Label[other]")
			})),
			...CONFIG.BlackFlag.vehicles.localizedPluralOptions.map(o => ({
				...o,
				group: _loc("BF.VEHICLE.Label[other]")
			}))
		];

		context.calculationOptions = [
			{ value: "", label: _loc("BF.Formula.Custom.Label") },
			{ rule: true },
			{ value: "spellcasting", label: _loc("BF.Spellcasting.Label") },
			...CONFIG.BlackFlag.abilities.localizedOptions.map(o => ({ ...o, group }))
		];

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareIdentityContext(context) {
		context = await super._prepareIdentityContext(context);
		context.behaviorFields.push({
			field: context.systemFields.check.fields.visible,
			value: context.source.system.check.visible
		});
		return context;
	}
}
