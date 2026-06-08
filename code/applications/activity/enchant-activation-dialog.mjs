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

		// const enchantments = this.activity.availableEnchantments;
		// if ( (enchantments.length > 1) && this._shouldDisplay("create.enchantment") ) {
		// 	const existingProfile = this.activity.existingEnchantment?.flags.dnd5e?.enchantmentProfile;
		// 	context.hasCreation = true;
		// 	context.enchantment = {
		// 		field: new StringField({ required: true, blank: false, label: _loc("DND5E.ENCHANTMENT.Label") }),
		// 		name: "enchantmentProfile",
		// 		value: this.config.enchantmentProfile,
		// 		options: enchantments.map(e => ({
		// 			value: e._id,
		// 			label: e._id === existingProfile
		// 				? _loc("DND5E.ENCHANT.Enchantment.Active", { name: e.effect.name })
		// 				: e.effect.name
		// 		}))
		// 	};
		// } else if ( enchantments.length ) {
		// 	context.enchantment = enchantments[0]?._id ?? false;
		// }

		return context;
	}
}
