import BaseActorSheet from "./base-actor-sheet.mjs";

export default class NPCSheet extends BaseActorSheet {

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "npc"],
			dragDrop: [{dragSelector: "[data-item-id]"}],
			width: 460,
			height: null,
			tabs: [
				{group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: ".sheet-body", initial: "main"}
			],
			scrollY: [".window-content"]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		context.cr = { 0.125: "⅛", 0.25: "¼", 0.5: "½" }[context.system.attributes.cr] ?? context.system.attributes.cr;

		context.labels = {
			sizeAndType: `${game.i18n.localize(CONFIG.BlackFlag.sizes[context.system.traits.size]?.label ?? "")} ${
				context.system.traits.type.label}`
		};

		context.placeholders = {
			perception: 10 + (context.system.abilities.wisdom?.mod ?? 0),
			stealth: 10 + (context.system.abilities.dexterity?.mod ?? 0)
		};

		context.skills = {
			perception: context.system.attributes.perception ?? context.placeholders.perception,
			stealth: context.system.attributes.stealth ?? context.placeholders.stealth
		};

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareActions(context) {
		await super.prepareActions(context);
		context.passive = (await Promise.all(this.actor.items.filter(i => {
			if ( i.type !== "feature" ) return false;
			if ( i.system.activities?.size ) return false;
			return true;
		}).map(async item => ({
			item, description: await TextEditor.enrichHTML(item.system.description.value, {
				secrets: false, rollData: item.getRollData(), async: true, relativeTo: item
			})
		})))).sort((lhs, rhs) => lhs.item.sort - rhs.item.sort);
		await Promise.all(Object.values(context.actions)
			.flatMap(t => t.activities.map(async a => {
				a.description = await TextEditor.enrichHTML(a.activity.description || a.item.system.description.value, {
					secrets: false, rollData: a.item.getRollData(), async: true, relativeTo: a.item
				});
				return a.description;
			}))
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareTraits(context) {
		context.traits = {};
		const { proficiencies, traits } = context.system;
		const none = game.i18n.localize("None");

		context.traits.speed = this.actor.system.traits.movement.label?.toLowerCase() || "—";
		context.traits.senses = this.actor.system.traits.senses.label?.toLowerCase() || "—";
		context.traits.languages = proficiencies.languages.label || "—";

		// TODO: For Resistances, Immunities, and Vulnerabilities, find any entries added by active effects
		// and simply show the name of the item that provided them with a tooltip

		// Resistances
		const resistances = [
			...Array.from(traits.damage.resistances.value).map(t =>
				game.i18n.localize(CONFIG.BlackFlag.damageTypes[t]?.label ?? t)
			).filter(t => t),
			...Array.from(traits.condition.resistances.value).map(t =>
				game.i18n.localize(CONFIG.BlackFlag.conditions[t]?.label ?? t)
			)
		].filter(t => t);
		if ( resistances.length || this.modes.editing ) {
			context.traits.resist = game.i18n.getListFormatter({ style: "short" }).format(resistances) || none;
		}

		// Immunities
		const immunities = [
			...Array.from(traits.damage.immunities.value).map(t =>
				game.i18n.localize(CONFIG.BlackFlag.damageTypes[t].label)
			),
			...Array.from(traits.condition.immunities.value).map(t =>
				game.i18n.localize(CONFIG.BlackFlag.conditions[t].label)
			)
		].filter(t => t);
		if ( immunities.length || this.modes.editing ) {
			context.traits.immune = game.i18n.getListFormatter({ style: "short" }).format(immunities) || none;
		}

		// Vulnerabilities
		const vulnerabilities = traits.damage.vulnerabilities.value.map(t =>
			game.i18n.localize(CONFIG.BlackFlag.damageTypes[t].label)
		).filter(t => t);
		if ( vulnerabilities.size || this.modes.editing ) {
			context.traits.vulnerable = game.i18n.getListFormatter({ style: "short" }).format(vulnerabilities) || none;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove the title from the app's header bar.
	 * @param {HTMLElement} element - Element of the app's window.
	 * @protected
	 */
	_removeTitle(element) {
		const title = element.querySelector(".window-header .window-title");
		const uuid = title.querySelector("a");
		title.innerHTML = `<span></span>${uuid?.outerHTML ?? ""}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _renderOuter() {
		const jQuery = await super._renderOuter();
		this._removeTitle(jQuery[0]);
		return jQuery;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_replaceHTML(element, html) {
		super._replaceHTML(element, html);
		this._removeTitle(element[0]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	activateListeners(html) {
		super.activateListeners(html);
		html.on("sl-change", "sl-select", this._onChangeInput.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getSubmitData(updateData={}) {
		const data = super._getSubmitData(updateData);

		// TODO: Convert to custom NumberField
		let cr = data["system.attributes.cr"];
		cr = {
			"1/8": 0.125, "⅛": 0.125,
			"1/4": 0.25, "¼": 0.25,
			"1/2": 0.5, "½": 0.5
		}[cr] ?? parseFloat(cr);
		if ( Number.isNumeric(cr) ) data["system.attributes.cr"] = cr;

		return data;
	}
}
