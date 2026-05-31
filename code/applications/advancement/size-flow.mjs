import AdvancementFlow from "./advancement-flow-v2.mjs";

const { StringField } = foundry.data.fields;

/**
 * Inline application that presents a size choice.
 */
export default class SizeFlow extends AdvancementFlow {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActionsContext(context, options) {
		context = await super._prepareActionsContext(context, options);
		if (context.needsConfiguration)
			context.actions.push({
				field: new StringField(),
				name: "size",
				options: [
					{ value: "", label: _loc("BF.Advancement.Size.Notification"), rule: true },
					...this.advancement.configuration.options.map(value => ({
						value,
						label: CONFIG.BlackFlag.sizes.localized[value]
					}))
				]
			});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareControlsContext(context, options) {
		context = await super._prepareControlsContext(context, options);
		context.showReverse = context.editable;
		return context;
	}
}
