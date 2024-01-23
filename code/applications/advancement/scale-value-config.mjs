import AdvancementConfig from "./advancement-config.mjs";

/**
 * Configuration application for scale values.
 */
export default class ScaleValueConfig extends AdvancementConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "scale-value", "two-column"],
			template: "systems/black-flag/templates/advancement/scale-value-config.hbs",
			width: 600
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Range of levels that can be used based on what item type this advancement is within.
	 * @type {number[]}
	 */
	get levelRange() {
		let levels = Array.fromRange(CONFIG.BlackFlag.maxLevel + 1);
		return ["class", "subclass"].includes(this.advancement.item.type) ? levels.slice(1) : levels;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	getData() {
		const config = this.advancement.configuration;
		const types = CONFIG.Advancement.types.scaleValue.dataTypes;
		const type = types[config.type];
		const ScaleValueType = CONFIG.Advancement.types.scaleValue.dataTypes[this.advancement.configuration.type];
		const emptyPlaceholder = new ScaleValueType().placeholder;
		return foundry.utils.mergeObject(super.getData(), {
			default: {
				identifierHint: game.i18n.format(this.advancement.metadata.identifier.hint, {
					parentIdentifier: this.advancement.parentIdentifier,
					identifier: this.advancement.identifier
				})
			},
			type: type.metadata,
			types: Object.fromEntries(
				Object.entries(types).map(([key, d]) => [key, game.i18n.localize(d.metadata.label)])
			),
			faces: Object.fromEntries(CONFIG.BlackFlag.scaleDiceSizes.map(die => [die, `d${die}`])),
			levels: this.levelRange.reduce((obj, level) => {
				obj[level] = {
					placeholder: this.advancement.valueForLevel(level - 1)?.placeholder ?? emptyPlaceholder,
					value: this.advancement.configuration.scale[level] ?? {}
				};
				return obj;
			}, {})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		// this.form.querySelector(".identifier-hint-copy").addEventListener("click", this._onIdentifierHintCopy.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Copies the full scale identifier hint to the clipboard.
	 * @param {Event} event - The triggering click event.
	 * @protected
	 */
	_onIdentifierHintCopy(event) {
		game.clipboard.copyPlainText(`@scale.${this.item.identifier}.${this.advancement.identifier}`);
		game.tooltip.activate(event.target, {text: game.i18n.localize("DND5E.IdentifierCopied"), direction: "UP"});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);
		if ( !("configuration.type" in formData) || (updates.configuration.type === this.advancement.configuration.type) ) {
			return super._updateObject(event, foundry.utils.flattenObject(updates));
		}

		// Perform the update with old type
		const type = updates.configuration.type;
		delete updates.configuration.type;
		await super._updateObject(event, foundry.utils.flattenObject(updates));

		// Transform values into new type
		const NewType = CONFIG.Advancement.types.scaleValue.dataTypes[type];
		for ( const level of this.levelRange ) {
			const value = this.advancement.valueForLevel(level);
			if ( value ) updates.configuration.scale[level] = NewType.convertFrom(value)?.toObject();
			else updates.configuration.scale[`-=${level}`] = null;
		}
		updates.configuration.type = type;

		// Perform the update once more with new data
		return super._updateObject(event, foundry.utils.flattenObject(updates));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareConfigurationUpdate(configuration) {
		// Determine keys that should be present
		const ScaleValueType = CONFIG.Advancement.types.scaleValue.dataTypes[
			configuration.type ?? this.advancement.configuration.type
		];
		const validKeys = Object.keys(ScaleValueType.schema.initial());

		let lastValue = {};
		const scale = {};
		for ( const level of this.levelRange ) {
			const value = configuration.scale[level] ?? {};
			scale[level] ??= {};
			for ( const key of validKeys ) {
				// No value or same as previous value, don't store it
				if ( !value[key] || (value[key] === lastValue[key]) ) scale[level][`-=${key}`] = null;

				// Value is new, store it and update lastValue
				else lastValue[key] = scale[level][key] = value[key];
				// TODO: Run value through validator on DataField
			}

			// Strip out any unrecognized keys
			for ( const key of Object.keys(this.advancement.configuration.scale[level] ?? {}) ) {
				if ( !validKeys.includes(key) ) scale[level][`-=${key}`] = null;
			}

			// If all updates are removals, just remove the level
			if ( Object.keys(scale[level]).every(k => k.startsWith("-=")) ) {
				delete scale[level];
				scale[`-=${level}`] = null;
			}
		}
		configuration.scale = scale;

		return configuration;
	}
}
