import BaseConfig from "./base-config.mjs";

export default class NPCSpellcastingConfig extends BaseConfig {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "npc-spellcasting"],
			template: "systems/black-flag/templates/actor/config/npc-spellcasting-config.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get type() {
		return game.i18n.localize("BF.Spellcasting.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		context.periods = Object.entries(CONFIG.BlackFlag.recoveryPeriods).reduce((obj, [k, v]) => {
			if (!v.combatOnly) obj[k] = v.label;
			return obj;
		}, {});
		context.spells = this.object.items.reduce((arr, item) => {
			if (item.type === "spell") {
				arr.push({
					id: item.id,
					name: item.name,
					uses: item._source.system.uses.max,
					period: item.system.uses.recovery[0]?.period
				});
			}
			return arr;
		}, []);
		context.spells.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name, game.i18n.lang));
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _updateObject(event, formData) {
		const { spell, ...data } = foundry.utils.expandObject(formData);
		await super._updateObject(event, data);

		const spellUpdates = [];
		for (const [_id, { uses, period }] of Object.entries(spell)) {
			const update = { _id };
			const spell = this.object.items.get(_id);
			const activityId = spell.system.activities.find(a => a.activation.primary)?._id;
			if (period) {
				update["system.uses.max"] = uses ?? "";
				update["system.uses.recovery"] = [{ period }];
				if (activityId) update[`system.activites.${activityId}.consumption.targets`] = [{ type: "item" }];
			} else {
				update["system.uses.max"] = "";
				update["system.uses.recovery"] = [];
				if (activityId) update[`system.activites.${activityId}.consumption.targets`] = [];
			}
			spellUpdates.push(update);
		}
		await this.object.updateEmbeddedDocuments("Item", spellUpdates);
	}
}
