import { Trait } from "../../../utils/_module.mjs";
import BaseConfig from "./base-config.mjs";

/**
 * Dialog for configuring tool & vehicle proficiencies
 * @param {string} toolId - The tool being modified by this app.
 * @param {BlackFlagActor} actor - The actor to modify.
 * @param {object} options - Additional application rendering options.
 */
export default class ToolConfig extends BaseConfig {
	constructor(toolId, actor, options) {
		super(actor, options);
		this.toolId = toolId ?? null;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "config", "tool"],
			template: "systems/black-flag/templates/actor/config/tool-config.hbs",
			trait: "tools"
		});
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Properties                               */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * The tool being modified by this app.
	 * @type {string|null}
	 */
	toolId;

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/**
	 * Config for the currently selected tool.
	 * @type {object|null}
	 */
	get toolConfig() {
		return this.toolId ? Trait.configForKey(this.toolId, { trait: this.options.trait }) : null;
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/** @inheritDoc */
	get type() {
		return Trait.traitLabel(this.options.trait, 1);
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Context Preparation                      */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);
		const tools =
			context.source.proficiencies[this.options.trait] ?? this.document.system.proficiencies[this.options.trait] ?? {};
		context.toolId = this.toolId;
		context.tool = this.toolId ? tools[this.toolId] : null;
		context.toolOptions = Array.from(Trait.choices(this.options.trait).set).reduce((obj, k) => {
			obj[k] = { label: Trait.keyLabel(k, { trait: this.options.trait }), selected: k in tools };
			return obj;
		}, {});
		context.tools = Object.keys(tools).reduce((obj, key) => {
			if (key in context.toolOptions) {
				obj[key] = context.toolOptions[key];
			}
			return obj;
		}, {});
		context.toolValues = Object.keys(context.tools).join(" ");
		context.proficiencyLevels = {
			0: game.i18n.localize("BF.Proficiency.Level.None"),
			0.5: game.i18n.localize("BF.Proficiency.Level.Half"),
			1: game.i18n.localize("BF.Proficiency.Level.Proficient"),
			2: game.i18n.localize("BF.Proficiency.Level.Expertise")
		};
		context.trait = this.options.trait;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareModifiers() {
		let checkModifiers;
		let global;
		const shortTrait = this.options.trait.replace("s", "");
		if (this.toolId) {
			checkModifiers = this.getModifiers([
				{ k: "type", v: `${shortTrait}-check` },
				{ k: shortTrait, v: this.toolId }
			]);
			global = false;
		} else {
			const filter = modifier => !modifier.filter.some(f => f.k === shortTrait);
			checkModifiers = this.getModifiers([{ k: "type", v: `${shortTrait}-check` }], [], filter);
			global = true;
		}
		return [
			{
				category: "check",
				type: "bonus",
				label: "BF.CHECK.Label[one]",
				global,
				modifiers: checkModifiers.filter(m => m.type === "bonus")
			},
			{
				category: "check",
				type: "min",
				label: "BF.CHECK.Label[one]",
				global,
				modifiers: checkModifiers.filter(m => m.type === "min")
			},
			{
				category: "check",
				type: "note",
				label: "BF.CHECK.Label[one]",
				global,
				modifiers: checkModifiers.filter(m => m.type === "note")
			}
		];
	}

	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */
	/*  Action Handlers                          */
	/* ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~ */

	/** @inheritDoc */
	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		const select = html.querySelector('[name="listed-tools"]');
		if (select) {
			select.addEventListener("change", this._onChangeTools.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeInput(event) {
		super._onChangeInput(event);
		if (event.target.name === "toolId") {
			this.toolId = event.target.value;
			this.render();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Respond to a change in the current tools.
	 * @param {Event} event - Triggering event.
	 */
	_onChangeTools(event) {
		if (event.target.open) return;
		const removeKeys = new Set(Object.keys(this.document.system.proficiencies[this.options.trait]));
		const updates = {};
		for (const key of event.target.value) {
			if (key in this.document.system.proficiencies[this.options.trait]) removeKeys.delete(key);
			else updates[`system.proficiencies.${this.options.trait}.${key}`] = {};
		}
		removeKeys.forEach(key => (updates[`system.proficiencies.${this.options.trait}.-=${key}`] = null));
		this.document.update(updates);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getModifierData(category, type) {
		const shortTrait = this.options.trait.replace("s", "");
		const data = { type, filter: [{ k: "type", v: `${shortTrait}-${category}` }] };
		if (this.toolId) data.filter.push({ k: shortTrait, v: this.toolId });
		return data;
	}
}
