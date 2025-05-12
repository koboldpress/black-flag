import { getPluralRules, numberFormat } from "../../utils/_module.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";

/**
 * Base sheet for handling sheets in the stat block-style.
 */
export default class BaseStatblockSheet extends BaseActorSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			dragDrop: [{ dragSelector: "[data-item-id]" }],
			width: 460,
			height: null,
			tabs: [
				{ group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: ".sheet-body", initial: "main" }
			],
			scrollY: [".window-content"]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Item types that will be displayed with full descriptions on the main tab of the NPC sheet.
	 * @type {Set<string>}
	 */
	static mainItemTypes = new Set(["feature", "weapon"]);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the uses for an item for display on the main tab.
	 * @param {BlackFlagItem} item - Item being displayed.
	 * @param {Activity} [activity] - Activity being highlighted.
	 * @returns {string}
	 */
	prepareUsesDisplay(item, activity) {
		const uses = item.system.uses ?? {};
		const parts = [];

		if (activity?.activation.type === "legendary" && activity.activation.value > 1) {
			const pluralRule = getPluralRules().select(activity.activation.value);
			parts.push(
				game.i18n.format(`BF.LegendaryAction.Cost[${pluralRule}]`, {
					count: numberFormat(activity.activation.value)
				})
			);
		}

		if (uses.max) {
			let label;
			let recharge;

			// If max is set and min is zero, display as "1 of 3"
			if (uses.min === 0) {
				label = game.i18n.format("BF.Uses.Display.Of", {
					value: numberFormat(uses.value),
					max: numberFormat(uses.max)
				});
			}

			// If min isn't zero, display just current value "1"
			else label = numberFormat(uses.value);

			// If only a single recovery formula that is Recharge
			if (uses.recovery.length === 1 && uses.recovery[0].period === "recharge") {
				if (uses.spent === 0 && uses.max === 1) label = game.i18n.localize("BF.Recovery.Recharge.Charged");
				else if (uses.max === 1) label = null;
				if (uses.spent > 0) {
					if (uses.recovery[0].formula === "6") recharge = game.i18n.localize("BF.Recovery.Recharge.Single");
					else recharge = game.i18n.format("BF.Recovery.Recharge.Range", { min: uses.recovery[0].formula });
				}
			}

			// If only a single recovery formula that recovers all uses is set, display "/SR" or "/Day"
			else if (uses.recovery.length === 1 && uses.recovery[0].type === "recoverAll") {
				const config = CONFIG.BlackFlag.recoveryPeriods[uses.recovery[0].period];
				const abbreviation = game.i18n.localize(config?.npcLabel ?? config?.abbreviation);
				if (abbreviation) label = game.i18n.format("BF.Uses.Display.Recovery", { value: label, period: abbreviation });
			}

			parts.push(label, recharge);
		}

		return game.i18n.getListFormatter({ type: "unit" }).format(parts.filter(p => p));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async prepareActions(context) {
		context.actions = Object.entries(CONFIG.BlackFlag.actionTypes.localized).reduce((obj, [key, label]) => {
			obj[key] = { label, items: [] };
			return obj;
		}, {});
		context.actions.other = { label: game.i18n.localize("BF.ACTIVATION.Type.Other"), items: [] };
		context.passive = [];
		context.spellcasting = { uses: {} };
		for (const item of this.actor.items) {
			if (item.type === "spell") {
				const uses = item.system.uses;
				const key = !uses.max ? "atwill" : `${uses.max}-${uses.recovery[0]?.period ?? ""}`;
				context.spellcasting.uses[key] ??= { spells: [] };
				context.spellcasting.uses[key].spells.push(item);
			} else if (this.constructor.mainItemTypes.has(item.type)) {
				const activities = Array.from(item.system.activities ?? []);
				const onlyActivity = activities.length === 1 ? activities[0] : undefined;
				const actionTypes = new Set(activities.map(a => a.actionType));
				const firstActionType = actionTypes.first();
				const data = {
					activity: onlyActivity,
					item,
					description: await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(
						item.system.description.value,
						{
							secrets: false,
							rollData: item.getRollData(),
							async: true,
							relativeTo: item
						}
					),
					uses: this.prepareUsesDisplay(item, onlyActivity)
				};
				if (actionTypes.has("action")) context.actions.action.items.push(data);
				else if (firstActionType === "free" || !actionTypes.size) context.passive.push(data);
				else if (firstActionType in context.actions) context.actions[firstActionType].items.push(data);
				else context.actions.other.items.push(data);
			}
		}

		await this.prepareSpellcasting(context);

		// Sorting & Clearing
		context.passive.sort((lhs, rhs) => lhs.item.sort - rhs.item.sort);
		for (const [key, value] of Object.entries(context.actions)) {
			if (!value.items.length && (key !== "action" || !context.spellcasting)) delete context.actions[key];
			else context.actions[key].items.sort((lhs, rhs) => (lhs.item?.sort ?? Infinity) - (rhs.item?.sort ?? Infinity));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the spellcasting section of the sheet.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 */
	async prepareSpellcasting(context) {
		const spellcasting = context.system.spellcasting;
		if (!spellcasting || foundry.utils.isEmpty(context.spellcasting.uses)) {
			delete context.spellcasting;
			return;
		}

		let ability;
		let dc;
		if (context.editable) {
			ability = `<select name="system.spellcasting.ability">${(
				foundry.applications?.handlebars?.selectOptions ?? HandlebarsHelpers.selectOptions
			)(CONFIG.BlackFlag.abilities.localized, { hash: { selected: spellcasting.ability } })}</select>`;
			dc = `<input type="number" name="system.spellcasting.dc" value="${context.source.spellcasting.dc}"
			       placeholder="${spellcasting.autoDC}" step="1" min="0">`;
		} else {
			ability = CONFIG.BlackFlag.abilities.localizedAbbreviations[spellcasting.ability];
			dc = spellcasting.dc;
		}
		context.spellcasting.label = game.i18n.format("BF.Spellcasting.NPC.Description", {
			ability,
			dc,
			name: this.actor.name.toLowerCase()
		});

		const sections = [];
		for (const [, value] of Object.entries(context.spellcasting.uses).sort((a, b) => b[0].localeCompare(a[0]))) {
			const uses = value.spells[0].system.uses;
			if (uses.max) {
				const config = CONFIG.BlackFlag.recoveryPeriods[uses.recovery[0]?.period];
				const abbreviation = game.i18n.localize(config?.npcLabel ?? config?.abbreviation);
				if (abbreviation)
					value.label = game.i18n.format("BF.Uses.Display.Recovery", {
						value: numberFormat(uses.max),
						period: abbreviation.toLowerCase()
					});
				else value.label = numberFormat(uses.max);
			} else {
				value.label = game.i18n.localize("BF.Spell.Preparation.Mode.AtWill");
			}
			const spells = [];
			for (const spell of value.spells.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name, game.i18n.lang))) {
				const usesRemaining = uses.max
					? ` <span class="remaining">${numberFormat(spell.system.uses.value)}</span>`
					: "";
				spells.push(
					`<span class="spell"><a data-action="activate" data-item-id="${spell.id}">${spell.name.toLowerCase()}</a>${usesRemaining}</span>`
				);
			}
			sections.push(`<p>${value.label}: ${spells.join(", ")}`);
		}

		context.spellcasting.description = `<p class="description">${context.spellcasting.label}</p>${sections.join("\n")}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareTraits(context) {
		context.traits = {};
		const none = game.i18n.localize("None");

		// Search through active effects for any that apply to traits
		const validKeyPaths = new Set([
			"system.traits.damage.resistances.value",
			"system.traits.damage.resistances.nonmagical",
			"system.traits.condition.resistances.value",
			"system.traits.damage.immunities.value",
			"system.traits.damage.immunities.nonmagical",
			"system.traits.condition.immunities.value",
			"system.traits.damage.vulnerabilties.value",
			"system.traits.damage.vulnerabilties.nonmagical",
			"system.traits.condition.vulnerabilities.value"
		]);
		const associatedEffects = [];
		for (const effect of this.actor.allApplicableEffects()) {
			if (effect.disabled) continue;
			const data = { effect };
			for (const change of effect.changes) {
				if (validKeyPaths.has(change.key)) {
					data[change.key] ??= [];
					data[change.key].push(change.value);
				}
			}
			if (Object.values(data).length > 1) associatedEffects.push(data);
		}

		for (const name of ["resistances", "immunities", "vulnerabilities"]) {
			const damage = { ...foundry.utils.getProperty(context.source, `traits.damage.${name}`) };
			damage.value = new Set(damage.value ?? []);
			damage.nonmagical = new Set(damage.nonmagical ?? []);
			const condition = { ...foundry.utils.getProperty(context.source, `traits.condition.${name}`) };
			condition.value = new Set(condition.value ?? []);
			this.actor.system.cleanLabelResistances(condition, damage);
			const sections = [damage.label.toLowerCase(), condition.label.toLowerCase()].filter(t => t);

			for (const effect of associatedEffects) {
				const damage = {
					value: new Set(effect[`system.traits.damage.${name}.value`] ?? []),
					nonmagical: new Set(effect[`system.traits.damage.${name}.nonmagical`] ?? [])
				};
				const condition = { value: new Set(effect[`system.traits.condition.${name}.value`] ?? []) };
				this.actor.system.cleanLabelResistances(condition, damage);
				const effectSections = [damage.label.toLowerCase(), condition.label.toLowerCase()].filter(t => t);
				if (effectSections.length) {
					sections.push(`<span data-tooltip="${effectSections.join(" | ")}">${effect.effect.name}</span>`);
				}
			}

			if (sections.length || this.modes.editing) context.traits[name] = sections.join(" | ") || none;
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
		const textSource = title.querySelector(".title-text") ?? title;
		const idLink = title.querySelector(".document-id-link");
		title.innerHTML = `<span class="title-text">${textSource.innerText}</span>`;
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
	async _onAction(event, dataset) {
		const { action } = dataset ?? event.currentTarget.dataset;
		switch (action) {
			case "add-feature":
				const features = this.element[0].querySelector('blackflag-inventory[tab="features"]');
				const section = features?.querySelector('[data-section="features"]');
				return features?._onAddItem(section);
		}
		return super._onAction(event, dataset);
	}
}
