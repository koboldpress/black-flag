import { numberFormat, Trait } from "../../utils/_module.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";

export default class NPCSheet extends BaseActorSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "npc"],
			dragDrop: [{dragSelector: "[data-item-id]"}],
			width: 460,
			height: "auto",
			tabs: [
				{group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: ".sheet-content", initial: "main"}
			],
			scrollY: [".window-content"]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.labels = {
			sizeAndType: `${game.i18n.localize(CONFIG.BlackFlag.sizes[context.system.traits.size]?.label ?? "")} ${
				context.system.traits.type.label}`
		};

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareActions(context) {
		await super.prepareActions(context);
		const rollData = this.actor.getRollData();
		context.passive = await Promise.all(this.actor.items.filter(i => {
			if ( i.type !== "feature" ) return false;
			return true;
		}).map(async item => ({
			item, description: await TextEditor.enrichHTML(item.system.description.value, {
				secrets: false, rollData, async: true, relativeTo: item
			})
		})));
		await Promise.all(Object.values(context.actions)
			.flatMap(t => t.activities.map(async a => {
				a.description = await TextEditor.enrichHTML(a.activity.description, {
					secrets: false, rollData, async: true, relativeTo: a.item
				});
				return a.description;
			}))
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareItems(context) {
		await this._prepareItemSections(context);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareTraits(context) {
		context.traits = {};
		const { proficiencies, traits } = context.system;
		const none = game.i18n.localize("None");

		const formatEntry = (value, label) => {
			value = numberFormat(value, { unit: "foot" });
			return label ? `${label.toLowerCase()} ${value}` : value;
		};

		// Speed
		const speeds = [formatEntry(this.actor.system.traits.movement.types.walk ?? 0)];
		for ( const [key, value] of Object.entries(this.actor.system.traits.movement.types) ) {
			if ( !value || (key === "walk") ) continue;
			speeds.push(formatEntry(value, game.i18n.localize(CONFIG.BlackFlag.movementTypes[key]?.label ?? "")));
		}
		context.traits.speed = game.i18n.getListFormatter({ style: "narrow" }).format(speeds);
		// TODO: Add movement tags

		// Senses
		context.traits.senses = game.i18n.getListFormatter({ style: "narrow" }).format(
			Object.entries(this.actor.system.traits.senses.types).map(([key, value]) =>
				value ? formatEntry(value, game.i18n.localize(CONFIG.BlackFlag.senses[key]?.label ?? "")) : null
			).filter(a => a)
		);
		// TODO: Add senses tags

		// Languages
		context.traits.languages = Trait.localizedList(
			proficiencies.languages.value, [], { style: "narrow", trait: "languages" }
		) || "—";
		// TODO: Add language tags

		// Resistances
		const resistances = traits.damage.resistances.value.map(t =>
			game.i18n.localize(CONFIG.BlackFlag.damageTypes[t].label)
		).filter(t => t);
		if ( resistances.size || this.modes.editing ) {
			context.traits.resist = game.i18n.getListFormatter({ style: "short" }).format(resistances) || none;
		}

		// Immunities
		const immunities = [
			...traits.damage.immunities.value.map(t =>
				game.i18n.localize(CONFIG.BlackFlag.damageTypes[t].label)
			),
			...traits.condition.immunities.value.map(t =>
				CONFIG.BlackFlag.registration.get("condition", t)?.name
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

	async _renderOuter() {
		const jQuery = await super._renderOuter();
		this._removeTitle(jQuery[0]);
		return jQuery;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_replaceHTML(element, html) {
		super._replaceHTML(element, html);
		this._removeTitle(element[0]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(html) {
		super.activateListeners(html);
		html.on("sl-change", "sl-select", this._onChangeInput.bind(this));
	}
}
