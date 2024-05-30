import { getPluralRules, numberFormat } from "../../utils/_module.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import NPCSpellcastingConfig from "./config/npc-spellcasting-config.mjs";

export default class NPCSheet extends BaseActorSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "npc"],
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

		context.cr = { 0.125: "⅛", 0.25: "¼", 0.5: "½" }[context.system.attributes.cr] ?? context.system.attributes.cr;

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

	/**
	 * Prepare the uses for an item for display on the main tab.
	 * @param {BlackFlagItem} item - Item being displayed.
	 * @param {Activity} [activity] - Activity being highlighted.
	 * @returns {string}
	 */
	prepareUsesDisplay(item, activity) {
		const uses = item.system.uses;
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
			obj[key] = { label, activities: [] };
			return obj;
		}, {});
		context.actions.other = { label: game.i18n.localize("BF.Activation.Type.Other"), activities: [] };
		context.passive = [];
		context.spellcasting = { uses: {} };
		for (const item of this.actor.items) {
			if (item.type === "spell") {
				const uses = item.system.uses;
				const key = `${uses.max}-${uses.recovery[0]?.period ?? ""}`;
				context.spellcasting.uses[key] ??= { spells: [] };
				context.spellcasting.uses[key].spells.push(item);
			} else if (item.system.activities?.size) {
				for (const activity of item.system.actions?.() ?? []) {
					const data = {
						activity,
						item,
						description: await TextEditor.enrichHTML(activity.description || item.system.description.value, {
							secrets: false,
							rollData: item.getRollData(),
							async: true,
							relativeTo: activity
						}),
						uses: this.prepareUsesDisplay(item, activity)
					};
					if (activity.actionType === "free") context.passive.push(data);
					else if (activity.actionType in context.actions) context.actions[activity.actionType].activities.push(data);
					else context.actions.other.activities.push(data);
				}
			} else if (item.type === "feature") {
				context.passive.push({
					item,
					description: await TextEditor.enrichHTML(item.system.description.value, {
						secrets: false,
						rollData: item.getRollData(),
						async: true,
						relativeTo: item
					}),
					uses: this.prepareUsesDisplay(item)
				});
			}
		}

		await this.prepareSpellcasting(context);

		// Sorting & Clearing
		context.passive.sort((lhs, rhs) => lhs.item.sort - rhs.item.sort);
		for (const [key, value] of Object.entries(context.actions)) {
			if (!value.activities.length && (key !== "action" || !context.spellcasting)) delete context.actions[key];
			else
				context.actions[key].activities.sort((lhs, rhs) => (lhs.item?.sort ?? Infinity) - (rhs.item?.sort ?? Infinity));
		}

		// Legendary Actions
		if (context.actions.legendary) {
			const leg = context.system.attributes.legendary;
			context.actions.legendary.count = {
				prefix: "system.attributes.legendary",
				value: leg.value,
				max: context.editable ? leg.max : context.source.attributes.legendary.max
			};
			context.actions.legendary.description = game.i18n.format(
				`BF.LegendaryAction.Description[${getPluralRules().select(context.system.attributes.legendary.max)}]`,
				{ type: context.actor.name.toLowerCase(), count: context.system.attributes.legendary.max }
			);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare the spellcasting section of the sheet.
	 * @param {object} context - Context object for rendering the sheet. **Will be mutated.**
	 */
	async prepareSpellcasting(context) {
		if (foundry.utils.isEmpty(context.spellcasting.uses)) return;

		const spellcasting = context.system.spellcasting;
		let ability;
		let dc;
		if (context.editable) {
			ability = `<select name="system.spellcasting.ability">${HandlebarsHelpers.selectOptions(
				CONFIG.BlackFlag.abilities.localized,
				{ hash: { selected: spellcasting.ability } }
			)}</select>`;
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
		for (const [, value] of Object.entries(context.spellcasting.uses).sort((a, b) => a[0].localeCompare(b[0]))) {
			const uses = value.spells[0].system.uses;
			if (uses.max) {
				const config = CONFIG.BlackFlag.recoveryPeriods[uses.recovery[0]?.period];
				const abbreviation = game.i18n.localize(config?.npcLabel ?? config?.abbreviation);
				if (abbreviation)
					value.label = game.i18n.format("BF.Uses.Display.Recovery", {
						value: numberFormat(uses.max),
						period: abbreviation
					});
				else value.label = numberFormat(uses.max);
			} else {
				value.label = game.i18n.localize("BF.Spell.Preparation.Mode.AtWill");
			}
			const spells = [];
			for (const spell of value.spells.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name, game.i18n.lang))) {
				const activity = spell.system.activities.find(a => a.activation.primary) ?? spell.system.activities.contents[0];
				const usesRemaining = uses.max
					? ` <span class="remaining">${numberFormat(spell.system.uses.value)}</span>`
					: "";
				spells.push(
					`<span class="spell"><a data-action="activate" data-item-id="${spell.id}" data-activity-id="${activity.id}">${spell.name.toLowerCase()}</a>${usesRemaining}</span>`
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
		const { proficiencies } = context.system;
		const none = game.i18n.localize("None");

		context.traits.speed = this.actor.system.traits.movement.label?.toLowerCase() || "—";
		context.traits.senses = this.actor.system.traits.senses.label?.toLowerCase() || "—";
		context.traits.languages = proficiencies.languages.label || "—";

		// Search through active effects for any that apply to traits
		const validKeyPaths = new Set([
			"system.traits.damage.resistances.value",
			"system.traits.condition.resistances.value",
			"system.traits.damage.immunities.value",
			"system.traits.condition.immunities.value",
			"system.traits.damage.vulnerabilties.value",
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

		const formatter = game.i18n.getListFormatter({ type: "unit" });
		const createSection = (data, config) => formatter.format(data.map(d => config[d]).filter(f => f));
		const createTrait = name => {
			const sections = [];
			const damages = foundry.utils.getProperty(context.source, `traits.damage.${name}.value`);
			if (damages?.length) sections.push(createSection(damages, CONFIG.BlackFlag.damageTypes.localized).toLowerCase());
			const conditions = foundry.utils.getProperty(context.source, `traits.condition.${name}.value`);
			if (conditions?.length)
				sections.push(createSection(conditions, CONFIG.BlackFlag.conditions.localized).toLowerCase());

			for (const effect of associatedEffects) {
				const effectSections = [];
				const damages = effect[`system.traits.damage.${name}.value`];
				if (damages?.length) effectSections.push(createSection(damages, CONFIG.BlackFlag.damageTypes.localized));
				const conditions = effect[`system.traits.condition.${name}.value`];
				if (conditions?.length) effectSections.push(createSection(conditions, CONFIG.BlackFlag.conditions.localized));
				if (effectSections.length) {
					sections.push(`<span data-tooltip="${effectSections.join(" | ")}">${effect.effect.name}</span>`);
				}
			}

			return sections.join(" | ");
		};

		const resistances = createTrait("resistances");
		if (resistances || this.modes.editing) context.traits.resist = resistances || none;
		const immunities = createTrait("immunities");
		if (immunities || this.modes.editing) context.traits.immune = immunities || none;
		const vulnerabilities = createTrait("vulnerabilities");
		if (vulnerabilities || this.modes.editing) context.traits.vulnerable = vulnerabilities || none;
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
	_getSubmitData(updateData = {}) {
		const data = super._getSubmitData(updateData);

		// TODO: Convert to custom NumberField
		let cr = data["system.attributes.cr"];
		cr =
			{
				"1/8": 0.125,
				"⅛": 0.125,
				"1/4": 0.25,
				"¼": 0.25,
				"1/2": 0.5,
				"½": 0.5
			}[cr] ?? parseFloat(cr);
		if (Number.isNumeric(cr)) data["system.attributes.cr"] = cr;

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
			case "add-feature":
				const features = this.element[0].querySelector('blackflag-inventory[tab="features"]');
				const section = features?.querySelector('[data-section="features"]');
				return features?._onAddItem(section);
			case "config":
				switch (properties.type) {
					case "spellcasting":
						return new NPCSpellcastingConfig(this.actor).render(true);
				}
		}
		return super._onAction(event, dataset);
	}
}
