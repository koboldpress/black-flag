import BaseStatblockSheet from "./base-statblock-sheet.mjs";

/**
 * Sheet for siege weapon actors.
 */
export default class SiegeWeaponSheet extends BaseStatblockSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "siege-weapon", "statblock"]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static enrichedFields = {
		description: "system.description.value"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.labels = {
			sizeAndType: `${game.i18n.localize(CONFIG.BlackFlag.sizes[context.system.traits.size]?.label ?? "")} ${game.i18n.localize(
				"BF.Object"
			)}`
		};

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async prepareActions(context) {
		await super.prepareActions(context);
		for (const [key, { items }] of Object.entries(context.actions)) {
			context.passive.push(...items);
			delete context.actions[key];
		}
		context.passive.findSplice(d => d.item.identifier === "siege-weapon-resilience");
	}
}
