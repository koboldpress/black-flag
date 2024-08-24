import BasicRollConfigurationDialog from "./basic-configuration-dialog.mjs";

/**
 * Roll configuration dialog for Damage Rolls.
 */
export default class DamageRollConfigurationDialog extends BasicRollConfigurationDialog {
	/** @override */
	static PARTS = {
		...super.PARTS,
		formulas: {
			template: "systems/black-flag/templates/dice/damage-formulas.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static get rollType() {
		return CONFIG.Dice.DamageRoll;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _prepareButtonsContext(context, options) {
		context.buttons = {
			critical: {
				icon: '<i class="fa-solid fa-bomb"></i>',
				label: game.i18n.localize("BF.Roll.Action.Critical.Label")
			},
			normal: {
				icon: '<i class="fa-solid fa-dice"></i>',
				label: game.i18n.localize("BF.Roll.Action.Normal.Label")
			}
		};
		if (this.config.critical?.allow === false) delete context.buttons.critical;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareFormulasContext(context, options) {
		context = await super._prepareFormulasContext(context, options);
		const allTypes = foundry.utils.mergeObject(CONFIG.BlackFlag.damageTypes, CONFIG.BlackFlag.healingTypes, {
			inplace: false
		});
		context.rolls = context.rolls.map(({ roll }) => ({
			roll,
			damageConfig: allTypes[roll.options.damageType] ?? allTypes[roll.options.damageTypes?.first()],
			damageTypes: roll.options.damageTypes
				? Object.entries(allTypes).reduce((obj, [key, config]) => {
						if (roll.options.damageTypes.has(key)) {
							obj[key] = game.i18n.localize(config.label);
						}
						return obj;
					}, {})
				: null
		}));
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Roll Handling            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_buildConfig(config, formData, index) {
		config = super._buildConfig(config, formData, index);

		const damageType = formData?.get(`roll.${index}.damageType`);
		if (damageType) config.options.damageType = damageType;

		return config;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_finalizeRolls(action) {
		const rolls = [];
		for (const roll of this.rolls) {
			roll.options.isCritical = action === "critical";
			roll.configureRoll({ critical: this.config.critical });
			rolls.push(roll);
		}
		return rolls;
	}
}
