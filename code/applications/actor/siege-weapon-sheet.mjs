import BaseStatBlockSheet from "./api/base-stat-block-sheet.mjs";

/**
 * Sheet for siege weapon actors.
 */
export default class SiegeWeaponSheet extends BaseStatBlockSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["siege-weapon"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		main: {
			...super.PARTS.main,
			template: "systems/black-flag/templates/actor/tabs/siege-weapon-main.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		context.enriched = await this._prepareDescriptions(context);
		context.labels = {
			sizeAndType: `${_loc(CONFIG.BlackFlag.sizes[context.system.traits.size]?.label ?? "")} ${_loc("BF.Object")}`
		};

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*      Actor Preparation Helpers      */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActions(context) {
		await super._prepareActions(context);
		for (const [key, { items }] of Object.entries(context.actions)) {
			context.passive.push(...items);
			delete context.actions[key];
		}
		context.passive.findSplice(d => d.item.identifier === "siege-weapon-resilience");
	}
}
