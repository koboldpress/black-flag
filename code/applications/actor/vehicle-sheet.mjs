import { numberFormat } from "../../utils/_module.mjs";
import BaseStatblockSheet from "./base-statblock-sheet.mjs";

/**
 * Sheet for vehicle actors.
 */
export default class VehicleSheet extends BaseStatblockSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "vehicle"]
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

		const dimensions = game.i18n.format("BF.VEHICLE.Dimensions", {
			length: numberFormat(context.system.traits.dimensions.length, { unit: context.system.traits.dimensions.units }),
			width: numberFormat(context.system.traits.dimensions.width, { unit: context.system.traits.dimensions.units })
		});
		context.labels = {
			sizeAndType: `${game.i18n.localize(CONFIG.BlackFlag.sizes[context.system.traits.size]?.label ?? "")} ${
				CONFIG.BlackFlag.vehicles.localized[context.system.traits.type.value] ?? ""
			} (${dimensions})`
		};

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async prepareActions(context) {
		await super.prepareActions(context);
		context.passive.findSplice(d => d.item.identifier === "vehicle-resilience");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareTraits(context) {
		super.prepareTraits(context);
		context.traits.speed = this.actor.system.traits.movement.label || "—";
	}
}
