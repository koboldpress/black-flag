import { localizeConfig } from "../utils/_module.mjs";

/**
 * Categories of consumable items.
 * @enum {NestedTypeConfiguration}
 */
export const consumableCategories = {
	food: {
		localization: "BF.Item.Consumable.Category.Food"
	},
	poison: {
		localization: "BF.Item.Consumable.Category.Poison",
		children: {
			contact: {
				localization: "BF.Item.Poison.Type.Contact"
			},
			ingested: {
				localization: "BF.Item.Poison.Type.Ingested"
			},
			inhaled: {
				localization: "BF.Item.Poison.Type.Inhaled"
			},
			injury: {
				localization: "BF.Item.Poison.Type.Injury"
			}
		}
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
 * Properties that can be applied to consumables.
 * @type {string[]}
 */
export const consumableProperties = ["magical"];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * @typedef {NestedTypeConfiguration} FeatureCategoryConfiguration
 * @property {number} [level] - Fixed level at which this feature will be gained.
 * @property {string[]} [sources] - If set, source identifier from these categories will be listed.
 * @property {Record<string, FeatureCategoryConfiguration>} [children] - Nested children.
 */

/**
 * Classifications of feature items (e.g. Class Feature, Heritage Trait) and any types available within that
 * category (e.g. Channel Divinity, Martial Action).
 * @enum {NestedTypeConfiguration}
 */
export const featureCategories = {
	class: {
		localization: "BF.Feature.Category.Class",
		sources: ["class", "subclass"],
		children: {
			bardicPerformance: {
				localization: "BF.Feature.Type.BardicPerformance",
				sources: ["class", "subclass"]
			},
			channelDivinity: {
				localization: "BF.Feature.Type.ChannelDivinity",
				sources: ["class", "subclass"]
			},
			epicBoon: {
				localization: "BF.Feature.Type.EpicBoon",
				level: 20,
				sources: ["class"]
			},
			heroicBoon: {
				localization: "BF.Feature.Type.HeroicBoon",
				level: 10,
				sources: ["class"]
			},
			martialAction: {
				localization: "BF.Feature.Type.MartialAction"
			},
			stunt: {
				localization: "BF.Feature.Type.Stunt"
			},
			wildShape: {
				localization: "BF.Feature.Type.WildShape",
				sources: ["class", "subclass"]
			}
		}
	},
	lineage: {
		localization: "BF.Feature.Category.Lineage",
		sources: ["lineage"],
		children: {
			naturalAdaptation: {
				localization: "BF.Feature.Type.NaturalAdaptation"
			}
		}
	},
	heritage: {
		localization: "BF.Feature.Category.Heritage",
		sources: ["heritage"]
	},
	monsters: {
		localization: "BF.Feature.Category.Monster",
		children: {
			lairAction: {
				localization: "BF.Feature.Type.LairAction"
			},
			regionalEffect: {
				localization: "BF.Feature.Type.RegionalEffect"
			}
		}
	},
	talent: {
		localization: "BF.Feature.Category.Talent"
	}
};
localizeConfig(featureCategories, { sort: false });
localizeConfig(featureCategories.class.children);
localizeConfig(featureCategories.lineage.children);
localizeConfig(featureCategories.monsters.children);

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
			},
			primordialFocus: {
				localization: "BF.Item.Focus.Type.PrimordialFocus"
			},
			wyrdFocus: {
				localization: "BF.Item.Focus.Type.WyrdFocus"
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
 * Properties that can be applied to gear.
 * @type {string[]}
 */
export const gearProperties = ["magical"];

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
	special: {
		label: "BF.Item.Property.Special.Label"
	},

	// Armor
	cumbersome: {
		label: "BF.Armor.Property.Cumbersome"
	},
	naturalMaterials: {
		label: "BF.Armor.Property.NaturalMaterials"
	},
	noisy: {
		label: "BF.Armor.Property.Noisy"
	},

	// Container
	weightlessContents: {
		label: "BF.Container.Property.WeightlessContents.Label"
	},

	// Weapon
	ammunition: {
		label: "BF.Weapon.Property.Ammunition"
	},
	finesse: {
		label: "BF.Weapon.Property.Finesse"
	},
	heavy: {
		label: "BF.Weapon.Property.Heavy"
	},
	light: {
		label: "BF.Weapon.Property.Light"
	},
	loading: {
		label: "BF.Weapon.Property.Loading"
	},
	reach: {
		label: "BF.Weapon.Property.Reach"
	},
	thrown: {
		label: "BF.Weapon.Property.Thrown"
	},
	twoHanded: {
		label: "BF.Weapon.Property.TwoHanded"
	},
	versatile: {
		label: "BF.Weapon.Property.Versatile"
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
		localization: "BF.Feature.Talent.Category.Magic",
		description: "BF.Feature.Talent.Category.MagicDescription"
	},
	martial: {
		localization: "BF.Feature.Talent.Category.Martial",
		description: "BF.Feature.Talent.Category.MartialDescription"
	},
	technical: {
		localization: "BF.Feature.Talent.Category.Technical",
		description: "BF.Feature.Talent.Category.TechnicalDescription"
	}
};
localizeConfig(talentCategories);
localizeConfig(talentCategories, { propertyName: "localizedPlural", pluralRule: "other" });
localizeConfig(talentCategories, { labelKeyPath: "description", propertyName: "localizedDescription" });

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
