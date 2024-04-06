import { filteredKeys } from "../../../utils/_module.mjs";
import BaseConfig from "./base-config.mjs";

export default class ResistanceConfig extends BaseConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "resistance"],
			template: "systems/black-flag/templates/actor/config/resistance-config.hbs",
			width: "auto"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get type() {
		return game.i18n.localize("BF.Resistance.Config");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		const traits = context.source.traits ?? {};
		context.damageTypes = Object.entries(CONFIG.BlackFlag.damageTypes.localized).reduce((obj, [key, label]) => {
			obj[key] = {
				label,
				resistant: traits.damage.resistances?.value?.includes(key),
				immune: traits.damage.immunities?.value?.includes(key),
				vulnerable: traits.damage.vulnerabilities?.value?.includes(key)
			};
			return obj;
		}, {});
		context.conditions = Object.entries(CONFIG.BlackFlag.conditions.localized).reduce((obj, [key, label]) => {
			obj[key] = {
				label,
				resistant: traits.condition.resistances?.value?.includes(key),
				immune: traits.condition.immunities?.value?.includes(key),
				vulnerable: traits.condition.vulnerabilities?.value?.includes(key)
			};
			return obj;
		}, {});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);
		foundry.utils.setProperty(updates, "condition.resistances.value", filteredKeys(updates.cr.value));
		foundry.utils.setProperty(updates, "condition.immunities.value", filteredKeys(updates.ci.value));
		foundry.utils.setProperty(updates, "condition.vulnerabilities.value", filteredKeys(updates.cv.value));
		foundry.utils.setProperty(updates, "damage.resistances.value", filteredKeys(updates.dr.value));
		foundry.utils.setProperty(updates, "damage.immunities.value", filteredKeys(updates.di.value));
		foundry.utils.setProperty(updates, "damage.vulnerabilities.value", filteredKeys(updates.dv.value));
		delete updates.cr;
		delete updates.ci;
		delete updates.dr;
		delete updates.di;
		delete updates.dv;
		this.document.update({ "system.traits": updates });
	}
}
