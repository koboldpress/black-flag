import { formatDistance } from "../../utils/_module.mjs";
import BaseStatBlockSheet from "./api/base-stat-block-sheet.mjs";

/**
 * Sheet for vehicle actors.
 */
export default class VehicleSheet extends BaseStatBlockSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["vehicle"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		main: {
			...super.PARTS.main,
			template: "systems/black-flag/templates/actor/tabs/vehicle-main.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		const dimensions = _loc("BF.VEHICLE.Dimensions", {
			length: formatDistance(context.system.traits.dimensions.length, context.system.traits.dimensions.unit),
			width: formatDistance(context.system.traits.dimensions.width, context.system.traits.dimensions.unit)
		});
		context.labels = {
			sizeAndType: `${_loc(CONFIG.BlackFlag.sizes[context.system.traits.size]?.label ?? "")} ${
				CONFIG.BlackFlag.vehicles.localized[context.system.traits.type.value] ?? ""
			} (${dimensions})`
		};

		context.showCurrency = true;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*      Actor Preparation Helpers      */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareActions(context) {
		await super._prepareActions(context);
		const descriptions = {
			action: "system.description.actions",
			bonus: "system.description.bonusActions",
			reaction: "system.description.reactions"
		};
		for (const [key, keyPath] of Object.entries(descriptions)) {
			if (!(key in context.actions)) continue;
			context.actions[key].description = foundry.utils.getProperty(context, keyPath);
			context.actions[key].descriptionKeyPath = keyPath;
		}
		context.passive.findSplice(d => d.item.identifier === "vehicle-resilience");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareTraits(context) {
		super._prepareTraits(context);
		context.traits.speed = this.actor.system.traits.movement.label || "—";
	}
}
