import { localizeConfig } from "../utils/_module.mjs";

/**
 * Classifications of feature items (e.g. Class Feature, Heritage Trait) and any types available within that
 * category (e.g. Channel Divinity, Martial Action).
 * @enum {NestedTypeConfiguration}
 */
export const featureCategories = {
	class: {
		localization: "BF.Item.Feature.Category.Class",
		children: {
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
		localization: "BF.Item.Feature.Category.Lineage",
		children: {
			naturalAdaptation: {
				localization: "BF.Item.Feature.Type.NaturalAdaptation"
			}
		}
	},
	heritage: {
		localization: "BF.Item.Feature.Category.Heritage"
	},
	monsters: {
		localization: "BF.Item.Feature.Category.Monster"
	}
};
localizeConfig(featureCategories, { sort: false });
localizeConfig(featureCategories.class.children);
localizeConfig(featureCategories.lineage.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for talent type categories.
 *
 * @typedef {object} TalentCategoryConfiguration
 * @property {string} localization - Pluralizable label for this category.
 */

/**
 * Categories of talent items.
 * @enum {TalentCategoryConfiguration}
 */
export const talentCategories = {
	magic: {
		localization: "BF.Item.Talent.Category.Magic"
	},
	martial: {
		localization: "BF.Item.Talent.Category.Martial"
	},
	technical: {
		localization: "BF.Item.Talent.Category.Technical"
	}
};
localizeConfig(talentCategories);
localizeConfig(talentCategories, { propertyName: "localizedPlural", pluralRule: "other" });
