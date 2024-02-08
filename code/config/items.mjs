import { localizeConfig } from "../utils/_module.mjs";

/**
 * Categories of consumable items.
 * @enum {NestedTypeConfiguration}
 */
export const consumableCategories = {
	food: {
		localization: "BF.Item.Consumable.Category.Food"
	},
	potion: {
		localization: "BF.Item.Consumable.Category.Potion"
	},
	scroll: {
		localization: "BF.Item.Consumable.Category.Scroll"
	}
};
localizeConfig(consumableCategories);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Classifications of feature items (e.g. Class Feature, Heritage Trait) and any types available within that
 * category (e.g. Channel Divinity, Martial Action).
 * @enum {NestedTypeConfiguration}
 */
export const featureCategories = {
	class: {
		localization: "BF.Feature.Category.Class",
		children: {
			channelDivinity: {
				localization: "BF.Feature.Type.ChannelDivinity"
			},
			martialAction: {
				localization: "BF.Feature.Type.MartialAction"
			},
			stunt: {
				localization: "BF.Feature.Type.Stunt"
			}
		}
	},
	lineage: {
		localization: "BF.Feature.Category.Lineage",
		children: {
			naturalAdaptation: {
				localization: "BF.Feature.Type.NaturalAdaptation"
			}
		}
	},
	heritage: {
		localization: "BF.Feature.Category.Heritage"
	},
	monsters: {
		localization: "BF.Feature.Category.Monster"
	}
};
localizeConfig(featureCategories, { sort: false });
localizeConfig(featureCategories.class.children);
localizeConfig(featureCategories.lineage.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Categories of gear items.
 * @enum {NestedTypeConfiguration}
 */
export const gearCategories = {
	adventuringGear: {
		localization: "BF.Item.Gear.Category.AdventuringGear"
	},
	clothing: {
		localization: "BF.Item.Gear.Category.Clothing",
		children: {
			amulet: {
				localization: "BF.Item.Clothing.Type.Amulet"
			},
			belt: {
				localization: "BF.Item.Clothing.Type.Belt"
			},
			cloak: {
				localization: "BF.Item.Clothing.Type.Cloak"
			},
			helm: {
				localization: "BF.Item.Clothing.Type.Helm"
			},
			ring: {
				localization: "BF.Item.Clothing.Type.Ring"
			}
		}
	},
	focus: {
		localization: "BF.Item.Gear.Category.Focus",
		children: {
			arcaneFocus: {
				localization: "BF.Item.Focus.Type.ArcaneFocus"
			},
			holySymbol: {
				localization: "BF.Item.Focus.Type.HolySymbol"
			}
		}
	},
	rod: {
		localization: "BF.Item.Gear.Category.Rod"
	},
	wand: {
		localization: "BF.Item.Gear.Category.Wand"
	},
	wondrousItem: {
		localization: "BF.Item.Gear.Category.WondrousItem"
	}
};
localizeConfig(gearCategories);
localizeConfig(gearCategories.clothing.children);
localizeConfig(gearCategories.focus.children);

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
		localization: "BF.Feature.Talent.Category.Magic"
	},
	martial: {
		localization: "BF.Feature.Talent.Category.Martial"
	},
	technical: {
		localization: "BF.Feature.Talent.Category.Technical"
	}
};
localizeConfig(talentCategories);
localizeConfig(talentCategories, { propertyName: "localizedPlural", pluralRule: "other" });

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Rarities of magic items.
 * @enum {object}
 */
export const rarities = {
	common: {
		label: "BF.Rarity.Level.Common"
	},
	uncommon: {
		label: "BF.Rarity.Level.Uncommon"
	},
	rare: {
		label: "BF.Rarity.Level.Rare"
	},
	veryRare: {
		label: "BF.Rarity.Level.VeryRare"
	},
	legendary: {
		label: "BF.Rarity.Level.Legendary"
	},
	fabled: {
		label: "BF.Rarity.Level.Fabled"
	},
	artifact: {
		label: "BF.Rarity.Level.Artifact"
	}
};

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
