import { cleanedObjectUpdate } from "../../utils/object.mjs";
import GrantFeaturesConfig from "./grant-features-config.mjs";

/**
 * Configuration application for feature choices.
 */
export default class ChooseFeaturesConfig extends GrantFeaturesConfig {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "advancement-config", "choose-features", "two-column"],
			dragDrop: [{ dropSelector: ".drop-target" }],
			dropKeyPath: "pool",
			template: "systems/black-flag/templates/advancement/choose-features-config.hbs",
			width: 540
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	getData(options={}) {
		const context = {
			...super.getData(options),
			validTypes: this.advancement.constructor.VALID_TYPES.reduce((obj, type) => {
				obj[type] = game.i18n.localize(CONFIG.Item.typeLabels[type]);
				return obj;
			}, {})
		};
		const makeLabels = obj => Object.fromEntries(Object.entries(obj)
			.map(([k, d]) => [k, game.i18n.localize(`${d.localization}[one]`)])
			.sort((lhs, rhs) => lhs[1].localeCompare(rhs[1]))
		);
		if ( this.advancement.configuration.type === "feature" ) {
			const selectedCategory = CONFIG.BlackFlag.featureCategories[this.advancement.configuration.restriction.category];
			context.typeRestriction = {
				categoryLabel: game.i18n.localize("BF.Item.Feature.Category.Label"),
				categoryOptions: makeLabels(CONFIG.BlackFlag.featureCategories),
				typeLabel: game.i18n.localize("BF.Item.Feature.Type.Label"),
				typeOptions: selectedCategory?.types ? makeLabels(selectedCategory.types) : null
			};
		} else if ( this.advancement.configuration.type === "talent" ) {
			// TODO: Display option to select specific talent lists
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareConfigurationUpdate(configuration) {
		if ( configuration.choices ) configuration.choices = cleanedObjectUpdate(configuration.choices);

		// Ensure items are still valid if type restriction has changed
		const pool = [];
		for ( const data of (configuration.pool ?? this.advancement.configuration.pool) ) {
			const uuid = data.uuid;
			if ( this.advancement._validateItemType(await fromUuid(uuid), {
				type: configuration.type, restriction: configuration.restriction ?? {}, strict: false
			}) ) pool.push(data);
		}
		configuration.pool = pool;

		return configuration;
	}
}
