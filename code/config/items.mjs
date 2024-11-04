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
localizeConfig(consumableCategories.poison.children);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Properties that can be applied to consumables.
 * @type {string[]}
 */
export const consumableProperties = ["magical"];

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * @typedef {NestedTypeConfiguration} FeatureCategoryConfiguration
 * @property {number|false} [level] - Fixed level at which this feature will be gained.
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
			animalFocus: {
				localization: "BF.Feature.Type.AnimalFocus",
				level: false
			},
			augmentEffect: {
				localization: "BF.Feature.Type.AugmentEffect",
				level: false,
				sources: ["class", "subclass"]
			},
			bardicPerformance: {
				localization: "BF.Feature.Type.BardicPerformance",
				sources: ["class", "subclass"]
			},
			channelDivinity: {
				localization: "BF.Feature.Type.ChannelDivinity",
				sources: ["class", "subclass"]
			},
			dragonAncestor: {
				localization: "BF.Feature.Type.DragonAncestor",
				level: false
			},
			enhancedBoon: {
				localization: "BF.Feature.Type.EnhancedBoon",
				level: false
			},
			eldritchInvocation: {
				localization: "BF.Feature.Type.EldritchInvocation",
				level: false
			},
			elementalInfusion: {
				localization: "BF.Feature.Type.ElementalInfusion"
			},
			empoweredRage: {
				localization: "BF.Feature.Type.EmpoweredRage",
				level: false
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
			metamagicOption: {
				localization: "BF.Feature.Type.MetamagicOption"
			},
			pactBoon: {
				localization: "BF.Feature.Type.PactBoon",
				level: false
			},
			primalAspect: {
				localization: "BF.Feature.Type.PrimalAspect",
				level: false
			},
			stunt: {
				localization: "BF.Feature.Type.Stunt"
			},
			technique: {
				localization: "BF.Feature.Type.Technique"
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

const clothingTypes = {
	amulet: {
		localization: "BF.Item.Clothing.Type.Amulet"
	},
	belt: {
		localization: "BF.Item.Clothing.Type.Belt"
	},
	boots: {
		localization: "BF.Item.Clothing.Type.Boots"
	},
	cloak: {
		localization: "BF.Item.Clothing.Type.Cloak"
	},
	glasses: {
		localization: "BF.Item.Clothing.Type.Glasses"
	},
	gloves: {
		localization: "BF.Item.Clothing.Type.Gloves"
	},
	helm: {
		localization: "BF.Item.Clothing.Type.Helm"
	},
	ring: {
		localization: "BF.Item.Clothing.Type.Ring"
	}
};

/**
 * Categories of gear items.
 * @enum {NestedTypeConfiguration}
 */
export const gearCategories = {
	adventuringGear: {
		localization: "BF.Item.Gear.Category.AdventuringGear",
		children: {
			...clothingTypes,
			focus: {
				localization: "BF.Item.Gear.Category.Focus"
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
		localization: "BF.Item.Gear.Category.WondrousItem",
		children: { ...clothingTypes }
	}
};
localizeConfig(gearCategories);
localizeConfig(gearCategories.adventuringGear.children);
localizeConfig(gearCategories.wondrousItem.children);

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
		label: "BF.Armor.Property.Cumbersome",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.520mFFl9c7MsE3X5"
	},
	naturalMaterials: {
		label: "BF.Armor.Property.NaturalMaterials",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.DgadUc3PINhgxqT7"
	},
	noisy: {
		label: "BF.Armor.Property.Noisy",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.fbvoFGjhh0fwqVxI"
	},

	// Container
	weightlessContents: {
		label: "BF.Container.Property.WeightlessContents.Label"
	},

	// Weapon
	ammunition: {
		label: "BF.Weapon.Property.Ammunition",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.hEqdEZpofvIVhZbV"
	},
	finesse: {
		label: "BF.Weapon.Property.Finesse",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.Nwe1EXlZHGBrNOGD"
	},
	heavy: {
		label: "BF.Weapon.Property.Heavy",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.06OJCIgMWhfAWfi6"
	},
	light: {
		label: "BF.Weapon.Property.Light",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.AjLCb6Qp0btCuzv1"
	},
	loading: {
		label: "BF.Weapon.Property.Loading",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.6T8MmG97dLpEOv36"
	},
	reach: {
		label: "BF.Weapon.Property.Reach",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.IqJ491vX9cgfBC4a"
	},
	thrown: {
		label: "BF.Weapon.Property.Thrown",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.nlNCYugyCLULTc55"
	},
	twoHanded: {
		label: "BF.Weapon.Property.TwoHanded",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.ncge72BaBpqk68V0"
	},
	versatile: {
		label: "BF.Weapon.Property.Versatile",
		reference: "Compendium.black-flag.rules.JournalEntry.zHvTHITijHvb07FK.JournalEntryPage.iuDmrgxZEnH5bQF0"
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
localizeConfig(rarities);

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
