import ActivityActivationDialog from "./activity-activation-dialog.mjs";

const { StringField } = foundry.data.fields;

/**
 * Dialog for configuring the activation of the Enchant activity.
 */
export default class EnchantActivationDialog extends ActivityActivationDialog {
	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		creation: {
			template: "systems/black-flag/templates/activity/enchant-activation-creation.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareCreationContext(context, options) {
		context = await super._prepareCreationContext(context, options);

		const enchantments = this.activity.system.applicableEffects;
		if (enchantments.length > 1 && this._shouldDisplay("create.enchantment")) {
			const existingProfile = this.activity.existingEnchantment?.flags[game.system.id]?.enchantmentProfile;
			context.hasCreation = true;
			context.enchantment = {
				field: new StringField({ required: true, blank: false, label: _loc("BF.EFFECT.Type.Enchantment[one]") }),
				name: "enchantmentProfile",
				value: this.config.enchantmentProfile,
				options: await Promise.all(
					enchantments.map(async e => {
						const effect = await e.getEffect();
						return {
							value: e._id,
							label:
								e._id === existingProfile
									? _loc("DND5E.ENCHANT.Enchantment.Active", { name: effect.name })
									: effect.name
						};
					})
				)
			};
		} else if (enchantments.length) {
			context.enchantment = enchantments[0]?._id ?? false;
		}

		return context;
	}
}
