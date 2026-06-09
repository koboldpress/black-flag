import { formatCR, formatNumber, getPluralLocalizationKey } from "../../utils/_module.mjs";
import BaseStatBlockSheet from "./api/base-stat-block-sheet.mjs";
import NPCSpellcastingConfig from "./config/npc-spellcasting-config.mjs";

/**
 * Sheet for NPC actors.
 */
export default class NPCSheet extends BaseStatBlockSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			longRest: NPCSheet.#longRest,
			shortRest: NPCSheet.#shortRest
		},
		classes: ["npc"],
		window: {
			controls: [
				{
					action: "shortRest",
					icon: "fa-solid fa-utensils",
					label: "BF.Rest.Type.Short.Label",
					ownership: "OWNER"
				},
				{
					action: "longRest",
					icon: "fa-solid fa-campground",
					label: "BF.Rest.Type.Long.Label",
					ownership: "OWNER"
				}
			]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static enrichedFields = {
		description: "system.biography.value"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		header: {
			template: "systems/black-flag/templates/actor/npc-header.hbs"
		},
		main: {
			...super.PARTS.main,
			template: "systems/black-flag/templates/actor/tabs/npc-main.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		context.cr = formatCR(context.system.attributes.cr);

		context.labels = {
			sizeAndType: `${_loc(CONFIG.BlackFlag.sizes[context.system.traits.size]?.label ?? "")} ${
				context.system.traits.type.label
			}`
		};

		context.placeholders = {
			perception: 10 + (context.system.abilities.wisdom?.mod ?? 0),
			stealth: 10 + (context.system.abilities.dexterity?.mod ?? 0)
		};

		context.showCurrency = true;

		context.stealthLabel = formatNumber(context.system.attributes.stealth);
		if (context.system.attributes.baseStealth)
			context.stealthLabel = _loc("BF.ARMOR.StealthReduction", {
				reduced: context.stealthLabel,
				full: formatNumber(context.system.attributes.baseStealth)
			});

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareBiographyContext(context, options) {
		context = await super._prepareBiographyContext(context, options);
		context.description = {
			path: "system.biography.value",
			value: context.source.biography.value
		};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*      Actor Preparation Helpers      */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _prepareActions(context) {
		await super._prepareActions(context);

		// Legendary Actions
		if (context.actions.legendary) {
			const leg = context.system.attributes.legendary;
			context.actions.legendary.count = {
				prefix: "system.attributes.legendary",
				value: leg.value ?? 0,
				max: context.editable ? leg.max ?? 0 : context.source.attributes.legendary.max
			};
			context.actions.legendary.description = _loc(
				getPluralLocalizationKey(
					context.system.attributes.legendary.max,
					pr => `BF.LegendaryAction.Description[${pr}]`
				),
				{ type: context.actor.name.toLowerCase(), count: context.system.attributes.legendary.max }
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareTraits(context) {
		super._prepareTraits(context);
		const { proficiencies } = context.system;
		context.traits.speed = this.actor.system.traits.movement.label?.toLowerCase() || "—";
		context.traits.senses = this.actor.system.traits.senses.label?.toLowerCase() || "—";
		context.traits.languages = proficiencies.languages.label || "—";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onAction(event, dataset) {
		if (dataset.action === "config" && dataset.type === "spellcasting") {
			this._renderChild(new NPCSpellcastingConfig({ document: this.actor }));
			return;
		}
		return super._onAction(event, dataset);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle resting the actor.
	 * @this {NPCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #longRest(event, target) {
		// TODO: Figure out why this is not getting the individual context menu entry
		this.actor.rest({ sheet: this, type: "long" });
	}

	/**
	 * Handle resting the actor.
	 * @this {NPCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #shortRest(event, target) {
		// TODO: Figure out why this is not getting the individual context menu entry
		this.actor.rest({ sheet: this, type: "short" });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _showConfiguration(event, target) {
		if (target.dataset.type === "spellcasting") {
			this._renderChild(new NPCSpellcastingConfig({ document: this.actor }));
			return false;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);

		if (submitData.system?.attributes?.cr !== undefined) {
			let cr = submitData.system.attributes.cr;
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
			submitData.system.attributes.cr = cr;
		}

		if (Number.isNumeric(submitData.system?.attributes?.legendary?.value)) {
			submitData.system.attributes.legendary.spent =
				this.actor.system.attributes.legendary.max - parseInt(submitData.system.attributes.legendary.value);
		}

		return submitData;
	}
}
