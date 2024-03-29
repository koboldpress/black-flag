import { getPluralRules, numberFormat } from "../../utils/_module.mjs";
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

		context.stealthLabel = numberFormat(context.system.attributes.stealth);
		if ( context.system.attributes.baseStealth ) context.stealthLabel = game.i18n.format("BF.Armor.StealthReduction", {
			reduced: context.stealthLabel, full: numberFormat(context.system.attributes.baseStealth)
		});

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
		if ( context.actions.legendary ) {
			const leg = context.system.attributes.legendary;
			context.actions.legendary.count = {
				prefix: "system.attributes.legendary", value: leg.value,
				max: context.editable ? leg.max : context.source.attributes.legendary.max
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
		context.traits = {};
		const { proficiencies } = context.system;
		const none = game.i18n.localize("None");

		context.traits.speed = this.actor.system.traits.movement.label?.toLowerCase() || "—";
		context.traits.senses = this.actor.system.traits.senses.label?.toLowerCase() || "—";
		context.traits.languages = proficiencies.languages.label || "—";

		// Search through active effects for any that apply to traits
		const validKeyPaths = new Set([
			"system.traits.damage.resistances.value", "system.traits.condition.resistances.value",
			"system.traits.damage.immunities.value", "system.traits.condition.immunities.value",
			"system.traits.damage.vulnerabilties.value", "system.traits.condition.vulnerabilities.value"
		]);
		const associatedEffects = [];
		for ( const effect of this.actor.allApplicableEffects() ) {
			if ( effect.disabled ) continue;
			const data = { effect };
			for ( const change of effect.changes ) {
				if ( validKeyPaths.has(change.key) ) {
					data[change.key] ??= [];
					data[change.key].push(change.value);
				}
			}
			if ( Object.values(data).length > 1 ) associatedEffects.push(data);
		}

		const formatter = game.i18n.getListFormatter({ type: "unit" });
		const createSection = (data, config) => formatter.format(data.map(d => config[d]).filter(f => f));
		const createTrait = name => {
			const sections = [];
			const damages = foundry.utils.getProperty(context.source, `traits.damage.${name}.value`);
			if ( damages?.length ) sections.push(
				createSection(damages, CONFIG.BlackFlag.damageTypes.localized).toLowerCase()
			);
			const conditions = foundry.utils.getProperty(context.source, `traits.condition.${name}.value`);
			if ( conditions?.length ) sections.push(
				createSection(conditions, CONFIG.BlackFlag.conditions.localized).toLowerCase()
			);

			for ( const effect of associatedEffects ) {
				const effectSections = [];
				const damages = effect[`system.traits.damage.${name}.value`];
				if ( damages?.length ) effectSections.push(createSection(damages, CONFIG.BlackFlag.damageTypes.localized));
				const conditions = effect[`system.traits.condition.${name}.value`];
				if ( conditions?.length ) effectSections.push(createSection(conditions, CONFIG.BlackFlag.conditions.localized));
				if ( effectSections.length ) {
					sections.push(`<span data-tooltip="${effectSections.join(" | ")}">${effect.effect.name}</span>`);
				}
			}

			return sections.join(" | ");
		};

		const resistances = createTrait("resistances");
		if ( resistances || this.modes.editing ) context.traits.resist = resistances || none;
		const immunities = createTrait("immunities");
		if ( immunities || this.modes.editing ) context.traits.immune = immunities || none;
		const vulnerabilities = createTrait("vulnerabilities");
		if ( vulnerabilities || this.modes.editing ) context.traits.vulnerable = vulnerabilities || none;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove the title from the app's header bar.
	 * @param {HTMLElement} element - Element of the app's window.
	 * @protected
	 */
	_removeTitle(element) {
		const title = element.querySelector(".window-header .window-title");
		const idLink = title.querySelector(".document-id-link");
		title.innerHTML = `<span class="title-text">${title.innerText}</span>`;
		title.appendChild(idLink);
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
