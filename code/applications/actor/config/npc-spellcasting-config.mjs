import BaseConfigSheet from "../api/base-config-sheet.mjs";

/**
 * Configuration application for setting NPC spellcasting details and spell uses.
 */
export default class NPCSpellcastingConfig extends BaseConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["npc-spellcasting", "form-list"],
		position: {
			width: 450
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		details: {
			template: "systems/black-flag/templates/actor/config/npc-spellcasting-config-details.hbs"
		},
		spells: {
			template: "systems/black-flag/templates/actor/config/npc-spellcasting-config-spells.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.format("BF.Action.Configure.Specific", { type: game.i18n.localize("BF.Spellcasting.Label") });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "spells":
				return this._prepareSpellsContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the config section.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	async _prepareSpellsContext(context, options) {
		context.periodOptions = Object.entries(CONFIG.BlackFlag.recoveryPeriods)
			.filter(([, v]) => !v.combatOnly)
			.map(([value, { label }]) => ({ value, label }));
		context.spells = this.document.items.reduce((arr, item) => {
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
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_prepareSubmitData(event, form, formData) {
		const submitData = this._processFormData(event, form, formData);
		return submitData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _processSubmitData(event, form, { spell, ...submitData }) {
		await super._processSubmitData(event, form, submitData);

		const spellUpdates = [];
		for (const [_id, { uses, period }] of Object.entries(spell)) {
			const update = { _id };
			const spell = this.document.items.get(_id);
			const activities = spell.system.activities.filter(a => a.activation?.primary);
			if (period) {
				update["system.uses.max"] = uses ?? "";
				update["system.uses.recovery"] = [{ period }];
				activities.forEach(a => {
					update[`system.activities.${a.id}.consumption.targets`] = [{ type: "item" }];
				});
			} else {
				update["system.uses.max"] = "";
				update["system.uses.recovery"] = [];
				activities.forEach(a => {
					update[`system.activities.${a.id}.consumption.targets`] = [];
				});
			}
			spellUpdates.push(update);
		}
		await this.document.updateEmbeddedDocuments("Item", spellUpdates);
	}
}
