import BaseAdvancement from "../../data/advancement/base-advancement.mjs";
import PseudoDocumentMixin from "../mixins/pseudo-document.mjs";

/**
 * @typedef {object} AdvancementLevels
 *
 * @property {number} character - Character levels for advancement being applied.
 * @property {number} class - Levels in whatever class was advanced at current level.
 * @property {string} [identifier] - Class identifier if relevant.
 */

/**
 * Error that can be thrown during the advancement update preparation process.
 */
class AdvancementError extends Error {
	constructor(...args) {
		super(...args);
		this.name = "AdvancementError";
	}
}

/**
 * Abstract base class which various advancement types can subclass.
 * @param {object} [data={}] - Raw data stored in the advancement object.
 * @param {object} [options={}] - Options which affect DataModel construction.
 * @abstract
 */
export default class Advancement extends PseudoDocumentMixin(BaseAdvancement) {
	static ERROR = AdvancementError;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Information on how an advancement type is configured.
	 *
	 * @typedef {BaseAdvancementMetadata} AdvancementMetadata
	 * @property {string} [like] - Similar advancement type. Advancement of this type will be grouped with others
	 *                             of their "like" type when fetching from the item. Like types should generally have
	 *                             shared inheritance and similar APIs to avoid issues.
	 * @property {object} [dataModels]
	 * @property {DataModel} [dataModels.configuration] - Data model used for validating configuration data.
	 * @property {DataModel} [dataModels.value] - Data model used for validating value data.
	 * @property {number} order - Number used to determine default sorting order of advancement items.
	 * @property {string} icon - Icon used for this advancement type if no user icon is specified.
	 * @property {string} title - Title to be displayed if no user title is specified.
	 * @property {string} hint - Description of this type shown in the advancement selection dialog.
	 * @property {object} identifier
	 * @property {boolean} identifier.configurable - Should this identifier be customizable for this advancement type?
	 * @property {string} identifier.hint - Hint that is shown with the identifier.
	 * @property {boolean} configurableHint - Should the advancement hint be configurable?
	 * @property {boolean} multiLevel - Can this advancement affect more than one level? If this is set to true,
	 *                                  the level selection control in the configuration window is hidden and the
	 *                                  advancement should provide its own implementation of `Advancement#levels`
	 *                                  and potentially its own level configuration interface.
	 * @property {boolean} singleton - Only allow a single advancement of this type on an item.
	 */

	/**
	 * Configuration information for this advancement type.
	 * @type {AdvancementMetadata}
	 */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				order: 100,
				icon: "icons/svg/upgrade.svg",
				title: "BF.Advancement.Core.Title",
				hint: "",
				identifier: {
					configurable: false,
					hint: ""
				},
				configurableHint: false,
				multiLevel: false,
				singleton: false
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform the pre-localization of this data model.
	 */
	static localize() {
		foundry.helpers.Localization.localizeDataModel(this);
		this.metadata.dataModels?.configuration?.localize?.();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * List of levels in which this advancement object should be displayed. Will be a list of class levels if this
	 * advancement is being applied to classes or subclasses, otherwise a list of character levels.
	 * @returns {number[]}
	 */
	get levels() {
		return ![null, undefined].includes(this.level?.value) ? [this.level.value] : [];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Minimum level that can be set for a specific advancement based on its item type.
	 * @type {number}
	 */
	get minimumLevel() {
		switch (this.item.type) {
			case "class":
				return 1;
			case "subclass":
				return 3;
			default:
				return this.level.classIdentifier ? 1 : 0;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Value data for this advancement stored on an actor.
	 * @type {DataModel|object}
	 */
	get value() {
		const value = foundry.utils.getProperty(this.actor ?? {}, this.valueKeyPath) ?? {};
		const DataModel = this.metadata.dataModels?.value;
		if (!DataModel || value instanceof DataModel) return value;
		return new DataModel(value, { parent: this });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Key path under which the value data is stored on the actor.
	 * @type {string}
	 */
	get valueKeyPath() {
		return `system.progression.advancement.${this.relativeID}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	prepareData() {
		this.title = this.title || game.i18n.localize(this.metadata.title);
		this.icon = this.icon || this.metadata.icon;
		this.identifier = this.identifier || this.title.slugify({ strict: true });
		if (!this.metadata.multiLevel) this.level.value ??= this.minimumLevel;
		if (foundry.utils.getType(this.configuration?.prepareData) === "function") this.configuration.prepareData();
		if (foundry.utils.getType(this.value?.prepareData) === "function") this.value.prepareData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_preCreate(data) {
		if (foundry.utils.hasProperty(data, "level") || this.metadata.multiLevel) return;
		this.updateSource({ "level.value": this.minimumLevel });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a warning key for the specified level.
	 * @param {AdvancementLevels} levels
	 * @returns {string}
	 */
	warningKey(levels) {
		return `${this.relativeID}.${this.relavantLevel(levels)}.warning`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare any warnings that should be displayed on the actor.
	 * @param {AdvancementLevels} levels - Levels for which the warning should be generated.
	 * @param {NotificationCollection} notifications - Collection into which notifications should be set.
	 * @abstract
	 */
	prepareWarnings(levels, notifications) {}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Has the player made choices for this advancement at the specified level?
	 * @param {AdvancementLevels} levels - Level for which to check configuration.
	 * @returns {boolean} - Have any available choices been made?
	 */
	configuredForLevel(levels) {
		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Value used for sorting this advancement at a certain level.
	 * @param {AdvancementLevels} levels - Level for which this entry is being sorted.
	 * @returns {string} - String that can be used for sorting.
	 */
	sortingValueForLevel(levels) {
		return `${this.metadata.order.paddedString(4)} ${this.titleForLevel(levels)}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Title displayed in advancement list for a specific level.
	 * @param {AdvancementLevels} levels - Level for which to generate a title.
	 * @param {object} [options={}]
	 * @param {object} [options.flow=false] - Is this title being used in an advancement flow?
	 * @returns {string} - HTML title with any level-specific information.
	 */
	titleForLevel(levels, { flow = false } = {}) {
		return this.title;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbedContents(config, options) {
		const p = document.createElement("p");
		p.innerText = this.hint ?? "";
		return p;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Summary content displayed beneath the title in the advancement list.
	 * @param {AdvancementLevels} levels - Level for which to generate the summary.
	 * @param {object} [options={}]
	 * @param {object} [options.flow=false] - Is this summary being used in an advancement flow?
	 * @returns {string} - HTML content of the summary.
	 */
	summaryForLevel(levels, { flow = false } = {}) {
		return "";
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Editing Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static _validateDocumentCreation(data, context) {
		const c = CONFIG.Advancement.types[data.type];
		if (!c?.validItemTypes.has(context.parent.type) || !c?.documentClass.availableForItem(context.parent)) {
			throw new Error(`${data.type} advancement cannot be added to ${context.parent.name}`);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Update this advancement's value data stored on the actor.
	 * @param {object} [updates={}] - A differential data object.
	 * @param {DocumentModificationContext} [context={}] - Additional context which customizes the update workflow.
	 * @returns {Promise<Advancement>} - Updated advancement instance.
	 */
	async updateValue(updates = {}, context = {}) {
		if (!this.parent.isEmbedded) throw new Error("Cannot update values for an advancement not stored on an actor.");
		await this.parent.actor.update({ [`system.progression.advancement.${this.valueID}`]: updates }, context);
		return this;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Can an advancement of this type be added to the provided item?
	 * @param {BlackFlagItem} item - Item to check against.
	 * @returns {boolean} - Should this be enabled as an option on the {@link AdvancementSelection} dialog?
	 */
	static availableForItem(item) {
		return this.metadata.singleton ? !item.system.advancement.byType(this.metadata.type).length : true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a new flow application for this advancement.
	 * @param {BlackFlagActor} actor - Actor to which the advancement is being applied.
	 * @param {AdvancementLevels} levels - Level for which to configure this flow.
	 * @param {object} [options={}] - Application rendering options.
	 * @returns {AdvancementFlow}
	 */
	flow(actor, levels, options) {
		const FlowClass =
			CONFIG.Advancement.types[this.type]?.sheetClasses?.flow ??
			CONFIG.Advancement.types[CONST.BASE_DOCUMENT_TYPE].sheetClasses.flow;
		return new FlowClass(actor, this, levels, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Dynamic changes this advancement applies to the actor during data preparation. Changes will be made
	 * after base data is prepared any before active effects are applied using a mechanism similar to active
	 * effects. By default changes will be made in advancement order, but if priority is provided it can be
	 * used to adjust the order.
	 * @param {AdvancementLevels} levels - Levels being applied.
	 * @returns {EffectChangeData[]}
	 * @abstract
	 */
	changes(levels) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Locally apply this advancement to the actor.
	 * @param {AdvancementLevels} levels - Levels being advanced.
	 * @param {*} [data] - Data from the advancement form.
	 * @param {object} [options={}]
	 * @param {boolean} [options.initial=false] - Is this the initial application?
	 * @param {boolean} [options.render=true] - Should the update re-render the actor?
	 * @abstract
	 */
	async apply(levels, data, { initial = false, render = true } = {}) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Locally remove this advancement's changes from the actor.
	 * @param {AdvancementLevels} levels - Levels being removed.
	 * @param {*} [data] - Data that might guide the reversing process.
	 * @param {object} [options={}]
	 * @param {boolean} [options.render=true] - Should the update re-render the actor?
	 * @abstract
	 */
	async reverse(levels, data, { render = true } = {}) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch and item and create a clone with the proper flags.
	 * @param {string} uuid - UUID of the item to fetch.
	 * @param {object} [options={}]
	 * @param {object} [options.changes={}] - Additional changes to apply when creating the clone.
	 * @param {object} [options.data] - Data from the advancement process.
	 * @param {string} [options.id] - Optional ID to use instead of a random one.
	 * @param {number} [options.index=0] - If advancement grants more than one item, position of this particular item.
	 *                                     Helps determine proper sorting order.
	 * @returns {object|null}
	 */
	async createItemData(uuid, { changes = {}, data, id, index = 0 } = {}) {
		const source = await fromUuid(uuid);
		if (!source) return null;
		id ??= foundry.utils.randomID();
		const advancementOrigin = `${this.item.id}.${this.id}`;
		const ultimateOrigin = this.item.getFlag("black-flag", "ultimateOrigin");
		const updates = foundry.utils.SortingHelpers.performIntegerSort(source, {
			target: ultimateOrigin && ultimateOrigin !== advancementOrigin ? this.item : undefined,
			siblings: this.item.actor.items
		});
		let sort = updates.find(u => u.target._id === source.id)?.update?.sort ?? null;
		if (sort !== null) sort += (index * CONST.SORT_INTEGER_DENSITY) / 100;
		const { _stats } = game.items.fromCompendium(source);
		return source
			.clone(
				foundry.utils.mergeObject(
					{
						_id: id,
						_stats,
						folder: null,
						sort,
						"flags.black-flag.sourceId": uuid,
						"flags.black-flag.advancementOrigin": advancementOrigin,
						"flags.black-flag.ultimateOrigin": this.item.getFlag("black-flag", "ultimateOrigin") ?? advancementOrigin
					},
					changes
				),
				{ keepId: true }
			)
			.toObject();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Helper Methods            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Select the relevant level from the provided levels data, or return null if not applicable.
	 * @param {AdvancementLevels} levels
	 * @returns {number|null}
	 */
	relavantLevel(levels) {
		if (levels.character === 0 || levels.class === 0) return 0;
		let identifier;

		// Classes & subclasses are always based on class level, as long as identifiers match
		if (this.item.type === "class") identifier = this.item.identifier;
		else if (this.item.type === "subclass") identifier = this.item.system.identifier.class;
		// Class level if explicit class identifier is set and it matches provided identifier
		else if (this.level.classIdentifier) identifier = this.level.classIdentifier;
		// Otherwise revert to character level
		else return levels.character;

		if (this.level.classRestriction) {
			const isOriginalClass = this.item.actor?.system.progression.classes[identifier]?.originalClass;
			if ((this.level.classRestriction === "original") !== isOriginalClass) return null;
		}

		return identifier === levels.identifier ? levels.class : !levels.identifier ? levels.character : null;
	}
}
