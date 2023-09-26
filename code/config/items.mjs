/**
 * Configuration data for feature type categories.
 *
 * @typedef {object} FeatureCategoryConfiguration
 * @property {string} label - Localized label for this category.
 * @property {{[key: string]: FeatureTypeConfiguration}} [types] - Types available in this category.
 */

/**
 * @typedef {object} FeatureTypeConfiguration
 * @property {string} localization - Pluralizable localized label for this type.
 */

/**
 * Classifications of feature items (e.g. Class Feature, Heritage Trait) and any types available within that
 * category (e.g. Channel Divinity, Martial Action)
 * @enum {FeatureCategoryConfiguration}
 */
export const featureCategories = {
	class: {
		localization: "BF.Item.Feature.Category.Class",
		types: {
			channelDivinity: {
				localization: "BF.Item.Feature.Type.ChannelDivinity"
			},
			martialAction: {
				localization: "BF.Item.Feature.Type.MartialAction"
			},
			stunt: {
				localization: "BF.Item.Feature.Type.Stunt"
			}
		}
	},
	lineage: {
		localization: "BF.Item.Feature.Category.Lineage"
	},
	heritage: {
		localization: "BF.Item.Feature.Category.Heritage"
	}
};