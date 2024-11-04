import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Attack activities.
 */
export default class AttackSheet extends ActivitySheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["attack-activity"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		identity: {
			template: "systems/black-flag/templates/activity/attack-identity.hbs",
			templates: [...super.PARTS.identity.templates, "systems/black-flag/templates/activity/parts/attack-identity.hbs"]
		},
		effect: {
			template: "systems/black-flag/templates/activity/attack-effect.hbs",
			templates: [
				"systems/black-flag/templates/activity/parts/activity-effects.hbs",
				"systems/black-flag/templates/activity/parts/attack-damage.hbs",
				"systems/black-flag/templates/activity/parts/attack-details.hbs",
				"systems/black-flag/templates/activity/parts/damage-part.hbs",
				"systems/black-flag/templates/activity/parts/damage-parts.hbs"
			]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareEffectContext(context) {
		context = await super._prepareEffectContext(context);
		context.abilityOptions = [
			{ value: "none", label: game.i18n.localize("None") },
			...CONFIG.BlackFlag.abilities.localizedOptions.map(o => ({
				...o,
				group: game.i18n.localize("BF.Ability.Label[other]")
			}))
		];
		const defaultAbility = this.activity.system.defaultAbility;
		if (defaultAbility)
			context.abilityOptions.unshift(
				{
					value: "",
					label: game.i18n.format("BF.Default.Specific", { default: game.i18n.localize(defaultAbility).toLowerCase() })
				},
				{ rule: true }
			);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareIdentityContext(context) {
		context = await super._prepareIdentityContext(context);
		const defaultType = CONFIG.BlackFlag.weaponTypes[this.item.system.type?.value]?.label;
		const defaultClassification = CONFIG.BlackFlag.attackTypes[this.item.system.type?.classification];
		context.defaultType = defaultType
			? game.i18n.format("BF.Default.Specific", { default: game.i18n.localize(defaultType).toLowerCase() })
			: null;
		context.defaultClassification = defaultClassification
			? game.i18n.format("BF.Default.Specific", { default: game.i18n.localize(defaultClassification).toLowerCase() })
			: null;
		return context;
	}
}
