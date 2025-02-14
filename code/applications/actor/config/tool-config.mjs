import { Trait } from "../../../utils/_module.mjs";
import BaseSelectorConfigSheet from "../api/base-selector-config-sheet.mjs";

const { SetField, StringField } = foundry.data.fields;

/**
 * Dialog for configuring tool & vehicle proficiencies.
 */
export default class ToolConfig extends BaseSelectorConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["tool", "form-list"],
		position: {
			width: 450
		},
		trait: "tools"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		...super.PARTS,
		config: {
			template: "systems/black-flag/templates/actor/config/tool-config.hbs"
		},
		modifiers: {
			classes: ["contents"],
			template: "systems/black-flag/templates/actor/config/modifier-section.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.format("BF.Action.Configure.Specific", { type: Trait.traitLabel(this.options.trait, 999) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Config for the currently selected tool.
	 * @type {object|null}
	 */
	get toolConfig() {
		return this.selectedId ? Trait.configForKey(this.selectedId, { trait: this.options.trait }) : null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context.toolSource =
			context.system.source.proficiencies[this.options.trait] ??
			context.system.data.proficiencies[this.options.trait] ??
			{};
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "config":
				return this._prepareConfigContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareSelectorContext(context, options) {
		context = await super._prepareSelectorContext(context, options);
		context.options = [
			...context.options,
			...Object.keys(context.toolSource).map(value => ({
				value,
				label: Trait.keyLabel(value, { trait: this.options.trait })
			}))
		];
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
	async _prepareConfigContext(context, options) {
		if (this.selectedId)
			context.tool = {
				data:
					context.system.source.proficiencies[this.options.trait]?.[this.selectedId] ??
					context.system.data.proficiencies[this.options.trait][this.selectedId] ??
					{},
				fields: context.system.fields.proficiencies.fields[this.options.trait].model.fields,
				id: this.selectedId,
				keyPath: `system.proficiencies.${this.options.trait}.${this.selectedId}`
			};
		else
			context.toolSelector = {
				field: new SetField(new StringField()),
				options: Array.from(Trait.choices(this.options.trait).set).map(value => ({
					value,
					label: Trait.keyLabel(value, { trait: this.options.trait })
				})),
				value: new Set(Object.keys(context.toolSource))
			};
		context.trait = this.options.trait;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareModifiers() {
		let checkModifiers;
		let global;
		const shortTrait = this.options.trait.replace("s", "");
		if (this.selectedId) {
			checkModifiers = this.getModifiers([
				{ k: "type", v: `${shortTrait}-check` },
				{ k: shortTrait, v: this.selectedId }
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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);
		if (event.target.name === "listed-tools") this._onChangeTools(event);
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
		this.submit({ updateData: foundry.utils.expandObject(updates) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getModifierData(category, type) {
		const shortTrait = this.options.trait.replace("s", "");
		const data = { type, filter: [{ k: "type", v: `${shortTrait}-${category}` }] };
		if (this.selectedId) data.filter.push({ k: shortTrait, v: this.selectedId });
		return data;
	}
}
