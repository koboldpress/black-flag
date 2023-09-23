import ChooseFeaturesConfig from "../../applications/advancement/choose-features-config.mjs";
import ChooseFeaturesFlow from "../../applications/advancement/choose-features-flow.mjs";
import {
	ChooseFeaturesConfigurationData, ChooseFeaturesValueData
} from "../../data/advancement/choose-features-data.mjs";
import { linkForUUID } from "../../utils/document.mjs";
import GrantFeaturesAdvancement from "./grant-features-advancement.mjs";

/**
 * Advancement that presents the player with a choice of multiple items that they can take. Keeps track of which
 * items were selected at which levels.
 */
export default class ChooseFeaturesAdvancement extends GrantFeaturesAdvancement {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "chooseFeatures",
			dataModels: {
				configuration: ChooseFeaturesConfigurationData,
				value: ChooseFeaturesValueData
			},
			order: 50,
			icon: "systems/black-flag/artwork/advancement/choose-features.svg",
			title: game.i18n.localize("BF.Advancement.ChooseFeatures.Title"),
			hint: game.i18n.localize("BF.Advancement.ChooseFeatures.Hint"),
			multiLevel: true,
			apps: {
				config: ChooseFeaturesConfig,
				flow: ChooseFeaturesFlow
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static VALID_TYPES = new Set(["feature", "talent"]);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Instance Properties         */
	/* <><><><> <><><><> <><><><> <><><><> */

	get levels() {
		return Array.from(Object.keys(this.configuration.choices));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Preparation Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a warning key for the specified level.
	 * @param {AdvancementLevels} levels
	 * @returns {string}
	 */
	warningKey(levels) {
		return `${this.relativeID}.${levels.class}.choice-required`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	prepareWarnings(levels, notifications) {
		// TODO: Move this selection logic into separate method
		const level = this.item.type === "class" ? levels.class : levels.character;
		const choicesNeeded = (this.configuration.choices[level] ?? 0) - (this.value.added?.[level]?.length ?? 0);
		if ( choicesNeeded <= 0 ) return;
		const pluralRules = new Intl.PluralRules(game.i18n.lang);
		notifications.set(this.warningKey(levels), {
			category: `level-${levels.character}`, section: "progression", level: "warn",
			message: game.i18n.format(`BF.Advancement.ChooseFeatures.Notification[${pluralRules.select(choicesNeeded)}]`, {
				title: this.title, number: choicesNeeded
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Display Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	configuredForLevel(level) {
		// TODO: This method will need to be provided with proper level
		const selectedCount = this.value.added?.[level]?.length ?? 0;
		const targetCount = this.configuration.choices[level] ?? 0;
		return selectedCount >= targetCount;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	titleForLevel(level, { flow=false }={}) {
		const choiceCount = this.configuration.choices[level];
		if ( !choiceCount ) return this.title;
		return `${this.title} <span class="choice-count">(${game.i18n.format("BF.Advancement.ChooseFeatures.Choose", {
			number: choiceCount
		}).toLowerCase()})</span>`;
		// TODO: Use type & restriction to auto-generate title
		// Then display as "Choose _" in advancement list and "_ (choose 1)" in flow
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	summaryForLevel(level, { flow=false }={}) {
		const items = this.value.added?.[level];
		if ( !items || !flow ) return "";
		return Object.values(items).reduce((html, data) => html + linkForUUID(data.uuid), "");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Application Methods         */
	/* <><><><> <><><><> <><><><> <><><><> */

	storagePath(level) {
		return `added.${level}`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async apply(levels, data, { initial=false }={}) {
		if ( initial || !data?.length ) return;
		// TODO: Move this selection logic into separate method
		const level = this.item.type === "class" ? levels.class : levels.character;
		const existing = foundry.utils.getProperty(this.value._source, this.storagePath(level)) ?? [];
		const added = await this.createItems(data, existing);
		return await this.actor.update({[`${this.valueKeyPath}.${this.storagePath(level)}`]: added});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async reverse(levels, id) {
		if ( !id ) return super.reverse(levels);
		// TODO: Move this selection logic into separate method
		const level = this.item.type === "class" ? levels.class : levels.character;
		const keyPath = this.storagePath(level);
		const addedCollection = foundry.utils.getProperty(this.value._source, keyPath).filter(a => a.document !== id);
		await this.actor.deleteEmbeddedDocuments("Item", [id], {render: false});
		return await this.actor.update({[`${this.valueKeyPath}.${keyPath}`]: addedCollection});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Helper Methods            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Verify that the provided item can be used with this advancement based on the configuration.
	 * @param {BlackFlagItem} item - Item that needs to be tested.
	 * @param {object} config
	 * @param {string} config.type - Type restriction on this advancement.
	 * @param {object} config.restriction - Additional restrictions to be applied.
	 * @param {boolean} [config.strict=true] - Should an error be thrown when an invalid type is encountered?
	 * @returns {boolean} - Is this type valid?
	 * @throws An error if the item is invalid and strict is `true`.
	 */
	_validateItemType(item, { type, restriction, strict=true }={}) {
		super._validateItemType(item, { strict });
		type ??= this.configuration.type;
		restriction ??= this.configuration.restriction;

		// Type restriction is set and the item type does not match the selected type
		if ( type && (type !== item.type) ) {
			const typeLabel = game.i18n.localize(CONFIG.Item.typeLabels[restriction]);
			if ( strict ) throw new Error(game.i18n.format("BF.Advancement.ChooseFeatures.Warning.Type", {type: typeLabel}));
			return false;
		}

		// If additional type restrictions applied, make sure they are valid
		if ( (type === "feature") && restriction.category ) {
			const categoryConfig = CONFIG.BlackFlag.featureCategories[restriction.category];
			const typeConfig = categoryConfig.types?.[restriction.type];
			let errorLabel;
			if ( restriction.category !== item.system.type.category ) errorLabel = categoryConfig.localization;
			else if ( typeConfig && (restriction.type !== item.system.type.value) ) errorLabel = typeConfig.localization;
			if ( errorLabel ) {
				if ( strict ) throw new Error(
					game.i18n.format("BF.Advancement.ChooseFeatures.Warning.Type", {
						type: game.i18n.localize(`${errorLabel}[other]`).toLowerCase()
					})
				);
				return false;
			}
		}

		return true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine whether this item has been chosen at any level.
	 * @param {string} uuid - UUID of item to check.
	 * @returns {boolean}
	 */
	itemChosen(uuid) {
		for ( const level of Object.values(this.value.added ?? {}) ) {
			if ( level.some(a => a.uuid === uuid) ) return true;
		}
		return false;
	}
}
