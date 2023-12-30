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
 * Properties that can be applied to weapons.
 * @enum {LabeledConfiguration}
 */
export const itemProperties = {
	// Shared
	magical: {
		label: "BF.Item.Property.Magical.Label"
	},

	// Armor
	cumbersome: {
		label: "BF.Armor.Property.Cumbersome.Label"
	},
	naturalMaterials: {
		label: "BF.Armor.Property.NaturalMaterials.Label"
	},
	noisy: {
		label: "BF.Armor.Property.Noisy.Label"
	},

	// Container
	weightlessContents: {
		label: "BF.Container.Property.WeightlessContents.Label"
	},

	// Weapon
	ammunition: {
		label: "BF.Weapon.Property.Ammunition.Label"
	},
	finesse: {
		label: "BF.Weapon.Property.Finesse.Label"
	},
	heavy: {
		label: "BF.Weapon.Property.Heavy.Label"
	},
	light: {
		label: "BF.Weapon.Property.Light.Label"
	},
	loading: {
		label: "BF.Weapon.Property.Loading.Label"
	},
	reach: {
		label: "BF.Weapon.Property.Reach.Label"
	},
	thrown: {
		label: "BF.Weapon.Property.Thrown.Label"
	},
	twoHanded: {
		label: "BF.Weapon.Property.TwoHanded.Label"
	},
	versatile: {
		label: "BF.Weapon.Property.Versatile.Label"
	}
};
localizeConfig(itemProperties);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Categories of talent items.
 * @enum {LocalizedConfiguration}
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

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Categories of sundry items.
 * @enum {LocalizedConfiguration}
 */
export const sundryCategories = {
	clothing: {
		localization: "BF.Item.Sundry.Category.Clothing"
	},
	component: {
		localization: "BF.Item.Sundry.Category.Component"
	},
	tradeGood: {
		localization: "BF.Item.Sundry.Category.TradeGood"
	},
	treasure: {
		localization: "BF.Item.Sundry.Category.Treasure"
	},
	trinket: {
		localization: "BF.Item.Sundry.Category.Trinket"
	}
};
localizeConfig(sundryCategories);
