import { filteredKeys } from "../../../utils/_module.mjs";
import BaseConfigSheet from "../api/base-config-sheet.mjs";

/**
 * Configuration application for condition & damage resistances, immunities, and vulnerabilities.
 */
export default class ResistanceConfig extends BaseConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["resistance"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		damageAll: {
			template: "systems/black-flag/templates/actor/config/resistance-entries.hbs"
		},
		damageNonmagical: {
			template: "systems/black-flag/templates/actor/config/resistance-entries.hbs"
		},
		conditions: {
			template: "systems/black-flag/templates/actor/config/resistance-entries.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.format("BF.Action.Configure.Specific", { type: game.i18n.localize("BF.Resistance.Config") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _preparePartContext(partId, context, options) {
		context = { ...(await super._preparePartContext(partId, context, options)) };
		let all = false;
		switch (partId) {
			case "conditions":
				context.header = "BF.Condition.Label[other]";
				context.name = "BF.Condition.Label[one]";
				context.entries = Object.entries(CONFIG.BlackFlag.conditions.localized).map(([key, label]) =>
					this._prepareEntry(key, "condition", label)
				);
				break;
			case "damageAll":
				all = true;
			case "damageNonmagical":
				context.header = all ? "BF.DAMAGE.Source.All" : "BF.DAMAGE.Source.Nonmagical";
				context.name = "BF.DAMAGE.Label";
				const options = { section: all ? "value" : "nonmagical" };
				context.entries = [
					this._prepareEntry("all", "damage", game.i18n.localize("BF.Resistance.AllDamage"), options),
					...Object.entries(CONFIG.BlackFlag.damageTypes.localized).map(([key, label]) =>
						this._prepareEntry(key, "damage", label, options)
					)
				];
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare a single entry in the resistances list.
	 * @param {string} key - Key for the entry.
	 * @param {"condition"|"damage"} type - Type of resistance being prepared.
	 * @param {string} label - Display label for the entry.
	 * @param {object} [options={}]
	 * @param {string} [options.section="value"] - Key of the set for which to get the values.
	 * @returns {object}
	 */
	_prepareEntry(key, type, label, { section = "value" } = {}) {
		return {
			label,
			prefix: `system.traits.${type}`,
			key: `${section}.${key}`,
			resistant: this.document._source.system.traits?.[type]?.resistances?.[section]?.includes(key),
			immune: this.document._source.system.traits?.[type]?.immunities?.[section]?.includes(key),
			vulnerable: this.document._source.system.traits?.[type]?.vulnerabilities?.[section]?.includes(key)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		formData = super._processFormData(event, form, formData);
		for (const type of ["damage", "condition"]) {
			for (const kind of ["resistances", "immunities", "vulnerabilities"]) {
				for (const section of ["value", "nonmagical"]) {
					if (type !== "damage" && section === "nonmagical") continue;
					const path = `system.traits.${type}.${kind}.${section}`;
					foundry.utils.setProperty(formData, path, filteredKeys(foundry.utils.getProperty(formData, path)));
				}
			}
		}
		return formData;
	}
}
