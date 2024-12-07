import { formatCR, getPluralRules, numberFormat } from "../../utils/_module.mjs";
import BaseStatblockSheet from "./base-statblock-sheet.mjs";
import NPCSpellcastingConfig from "./config/npc-spellcasting-config.mjs";

export default class NPCSheet extends BaseStatblockSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "npc"]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static enrichedFields = {
		biography: "system.biography.value"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.cr = formatCR(context.system.attributes.cr);

		context.labels = {
			sizeAndType: `${game.i18n.localize(CONFIG.BlackFlag.sizes[context.system.traits.size]?.label ?? "")} ${
				context.system.traits.type.label
			}`
		};

		context.placeholders = {
			perception: 10 + (context.system.abilities.wisdom?.mod ?? 0),
			stealth: 10 + (context.system.abilities.dexterity?.mod ?? 0)
		};

		context.stealthLabel = numberFormat(context.system.attributes.stealth);
		if (context.system.attributes.baseStealth)
			context.stealthLabel = game.i18n.format("BF.Armor.StealthReduction", {
				reduced: context.stealthLabel,
				full: numberFormat(context.system.attributes.baseStealth)
			});

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async prepareActions(context) {
		await super.prepareActions(context);

		// Legendary Actions
		if (context.actions.legendary) {
			const leg = context.system.attributes.legendary;
			context.actions.legendary.count = {
				prefix: "system.attributes.legendary",
				value: leg.value ?? 0,
				max: context.editable ? leg.max ?? 0 : context.source.attributes.legendary.max
			};
			context.actions.legendary.description = game.i18n.format(
				`BF.LegendaryAction.Description[${getPluralRules().select(context.system.attributes.legendary.max)}]`,
				{ type: context.actor.name.toLowerCase(), count: context.system.attributes.legendary.max }
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareTraits(context) {
		super.prepareTraits(context);
		const { proficiencies } = context.system;
		context.traits.speed = this.actor.system.traits.movement.label?.toLowerCase() || "—";
		context.traits.senses = this.actor.system.traits.senses.label?.toLowerCase() || "—";
		context.traits.languages = proficiencies.languages.label || "—";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getHeaderButtons() {
		const buttons = super._getHeaderButtons();
		if (this.actor.isOwner && !game.packs.get(this.actor.pack)?.locked) {
			buttons.splice(
				buttons.findIndex(b => b.class === "toggle-editing-mode") + 1,
				0,
				{
					label: "BF.Rest.Type.Short.Label",
					class: "short-rest",
					icon: "fa-solid fa-utensils",
					onclick: () => this.actor.shortRest()
				},
				{
					label: "BF.Rest.Type.Long.Label",
					class: "long-rest",
					icon: "fa-solid fa-campground",
					onclick: () => this.actor.longRest()
				}
			);
		}
		return buttons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getSubmitData(updateData = {}) {
		const data = super._getSubmitData(updateData);

		// TODO: Convert to custom NumberField
		if ("system.attributes.cr" in data) {
			let cr = data["system.attributes.cr"];
			cr =
				{
					"": null,
					"-": null,
					"1/8": 0.125,
					"⅛": 0.125,
					"1/4": 0.25,
					"¼": 0.25,
					"1/2": 0.5,
					"½": 0.5
				}[cr] ?? parseFloat(cr);
			if (Number.isNaN(cr)) cr = null;
			else if (cr > 1) cr = parseInt(cr);
			data["system.attributes.cr"] = cr;
		}

		if ("system.attributes.legendary.value" in data)
			data["system.attributes.legendary.spent"] =
				this.actor.system.attributes.legendary.max - parseInt(data["system.attributes.legendary.value"]);

		return data;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onAction(event, dataset) {
		const { action, ...properties } = dataset ?? event.currentTarget.dataset;
		switch (action) {
			case "config":
				switch (properties.type) {
					case "spellcasting":
						return new NPCSpellcastingConfig(this.actor).render(true);
				}
		}
		return super._onAction(event, dataset);
	}
}
