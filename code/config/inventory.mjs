/**
 * Configuration data for sheet sections.
 *
 * @typedef {object} SheetSectionConfiguration
 * @property {string} id - ID of the section, should be unique per document type.
 * @property {string} tab - Name of the tab on which this section will appear. Places the section into an object
 *                          for that tab's name within the sheet rendering context.
 * @property {string} label - Localizable label for the section.
 * @property {FilterDescription[]} filters - Set of filters to determine which items should appear in this section.
 * @property {ExpandSheetSectionCallback} expand - Callback used to expand a single section into multiple based on data
 *                                                 in the document instance.
 * @property {CheckVisibilityCallback} [checkVisibility] - Callback used to determine whether an item should be visible.
 * @property {object[]} [create] - Data used when creating items within this section, with an optional `label`.
 * @property {object} [options]
 * @property {boolean} [options.autoHide=false] - Should this section be hidden unless it has items?
 * @property {boolean} [options.canDelete=true] - Should the delete control be exposed to the user?
 * @property {boolean} [options.canDuplicate=true] - Should the duplicate control be exposed to the user?
 * @property {string} [options.sorting] - Force a specific sorting mode on this section.
 */

/**
 * Method that expands a single section into multiple based on document's data.
 *
 * @callback ExpandSheetSectionCallback
 * @param {BlackFlagActor|BlackFlagItem} document - Document whose sheet is being rendered.
 * @param {object} sectionData - Existing data for the section being expanded.
 * @returns {object[]} - Sections that should replace the expanded section.
 */

/**
 * Method that determines whether a specific item should be visible after being sorted into a section.
 *
 * @callback CheckVisibilityCallback
 * @param {object} sectionData - Data on the section.
 * @param {BlackFlagItem} item - Item for which visibility should be checked.
 * @returns {boolean}
 */

const currencySection = () => ({
	id: "currency",
	tab: "currency",
	label: "BF.Item.Type.Currency[one]",
	filters: [{ k: "type", v: "currency" }],
	options: { sorting: "currency" }
});

/**
 * Sections that will appear on document sheets. They are arrays of objects grouped by document type.
 * @enum {SheetSectionConfiguration[]}
 */
export const sheetSections = {
	pc: [
		currencySection(),
		{
			id: "circle-*",
			tab: "spellcasting",
			filters: [
				{ k: "type", v: "spell" },
				{ k: "flags.black-flag.relationship.mode", o: "in", v: ["standard", undefined] },
				{ k: "flags.black-flag.cachedFor", v: undefined },
				{ o: "NOT", v: { k: "system.tags", o: "has", v: "ritual" } }
			],
			expand: (document, sectionData) => {
				return Object.entries(CONFIG.BlackFlag.spellCircles({ plural: true })).map(([number, label]) => {
					number = Number(number);
					const cantrip = number === 0;
					const id = cantrip ? "cantrip" : `circle-${number}`;
					const slot = document.system.spellcasting.slots[id] ?? {};
					return foundry.utils.mergeObject(
						sectionData,
						{
							id,
							label,
							filters: [...sectionData.filters, { k: "system.circle.base", v: number }],
							options: { autoHide: !slot.max && !cantrip },
							slot
						},
						{ inplace: false }
					);
				});
			}
		},
		{
			id: "pact",
			tab: "spellcasting",
			label: "pact",
			filters: [
				{ k: "type", v: "spell" },
				{ k: "flags.black-flag.relationship.mode", v: "pact" },
				{ k: "flags.black-flag.cachedFor", v: undefined },
				{ o: "NOT", v: { k: "system.tags", o: "has", v: "ritual" } }
			],
			options: { autoHide: true },
			expand: (document, sectionData) => {
				sectionData.slot = document.system.spellcasting.slots.pact;
				if (sectionData.slot?.max) {
					sectionData.label = sectionData.slot.label;
					sectionData.options.autoHide = false;
				}
				return [sectionData];
			}
		},
		{
			id: "ritual",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.Rituals",
			filters: [
				{ k: "type", v: "spell" },
				{ k: "system.tags", o: "has", v: "ritual" },
				{ k: "flags.black-flag.cachedFor", v: undefined }
			],
			options: { autoHide: true }
		},
		{
			id: "atWill",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.AtWill",
			filters: [
				{ k: "type", v: "spell" },
				{ k: "flags.black-flag.relationship.mode", v: "atWill" },
				{ k: "flags.black-flag.cachedFor", v: undefined }
			],
			options: { autoHide: true }
		},
		{
			id: "innate",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.Innate",
			filters: [
				{ k: "type", v: "spell" },
				{ k: "flags.black-flag.relationship.mode", v: "innate" },
				{ k: "flags.black-flag.cachedFor", v: undefined }
			],
			options: { autoHide: true }
		},
		{
			id: "item-spells",
			tab: "spellcasting",
			label: "BF.CAST.SECTION.Spellbook",
			filters: [
				{ k: "type", v: "spell" },
				{ o: "NOT", v: { k: "flags.black-flag.cachedFor", v: undefined } }
			],
			checkVisibility: item => item.system.linkedActivity?.displayInSpellbook ?? false,
			options: { autoHide: true, canDelete: false, canDuplicate: false }
		},
		{
			id: "weapons",
			tab: "inventory",
			label: "BF.Item.Type.Weapon[other]",
			filters: [{ k: "type", v: "weapon" }]
		},
		{
			id: "ammunition",
			tab: "inventory",
			label: "BF.Item.Type.Ammunition[other]",
			filters: [{ k: "type", v: "ammunition" }],
			options: { autoHide: true }
		},
		{
			id: "armor",
			tab: "inventory",
			label: "BF.Item.Type.Armor[other]",
			filters: [{ k: "type", v: "armor" }]
		},
		{
			id: "gear",
			tab: "inventory",
			label: "BF.Item.Type.Gear[other]",
			filters: [{ k: "type", v: "gear" }]
		},
		{
			id: "tools",
			tab: "inventory",
			label: "BF.Item.Type.Tool[other]",
			filters: [{ k: "type", v: "tool" }]
		},
		{
			id: "consumables",
			tab: "inventory",
			label: "BF.Item.Type.Consumable[other]",
			filters: [{ k: "type", v: "consumable" }]
		},
		{
			id: "containers",
			tab: "inventory",
			label: "BF.Item.Type.Container[other]",
			filters: [{ k: "type", v: "container" }]
		},
		{
			id: "sundries",
			tab: "inventory",
			label: "BF.Item.Type.Sundry[other]",
			filters: [{ k: "type", v: "sundry" }],
			options: { autoHide: true }
		},
		{
			id: "class-features",
			tab: "features",
			label: "BF.Feature.Category.Class[other]",
			filters: [
				{ k: "type", v: "feature" },
				{ k: "system.type.category", v: "class" }
			],
			expand: (document, sectionData) => {
				if (document.system.progression.level === 0) return [];
				return Object.entries(document.system.progression.classes)
					.map(([identifier, cls]) => {
						const label = pluralRule =>
							game.i18n.format(`BF.Feature.Category.ClassSpecific[${pluralRule}]`, { class: cls.document.name });
						const filters = [
							{ k: "system.identifier.associated", v: identifier },
							{ k: "flags.black-flag.ultimateOrigin", v: `${cls.document.id}.`, o: "startswith" }
						];
						if (cls.subclass)
							filters.push(
								{ k: "system.identifier.associated", v: cls.subclass.identifier },
								{ k: "flags.black-flag.ultimateOrigin", v: `${cls.subclass.id}.`, o: "startswith" }
							);
						return foundry.utils.mergeObject(
							sectionData,
							{
								id: `class-${identifier}`,
								label: label("other"),
								filters: [
									...sectionData.filters,
									{
										o: "OR",
										v: filters
									}
								],
								levels: cls.levels
							},
							{ inplace: false }
						);
					})
					.sort((lhs, rhs) => rhs.levels - lhs.levels);
			}
		},
		{
			id: "talents",
			tab: "features",
			label: "BF.Item.Type.Talent[other]",
			filters: [{ k: "type", v: "talent" }]
		},
		{
			id: "lineage-features",
			tab: "features",
			label: "BF.Feature.Category.Lineage[other]",
			filters: [
				{ k: "type", v: "feature" },
				{ k: "system.type.category", v: "lineage" }
			]
		},
		{
			id: "heritage-features",
			tab: "features",
			label: "BF.Feature.Category.Heritage[other]",
			filters: [
				{ k: "type", v: "feature" },
				{ k: "system.type.category", v: "heritage" }
			]
		},
		{
			id: "features",
			tab: "features",
			label: "BF.Item.Category.Feature.Label",
			filters: [{ k: "type", v: "feature" }],
			options: { autoHide: true }
		},
		{
			id: "progression",
			tab: "progression",
			filters: [{ k: "type", o: "in", v: ["class", "subclass", "background", "heritage", "lineage"] }]
		}
	],
	npc: [
		currencySection(),
		{
			id: "features",
			tab: "features",
			label: "BF.Item.Category.Feature.Label",
			filters: [{ k: "type", o: "in", v: ["feature", "talent"] }]
		},
		{
			id: "equipment",
			tab: "features",
			label: "BF.Item.Category.Equipment.Label",
			filters: [{ k: "type", o: "in", v: ["ammunition", "armor", "gear", "tool", "weapon"] }]
		},
		{
			id: "spells",
			tab: "features",
			label: "BF.Item.Type.Spell[other]",
			filters: [{ k: "type", v: "spell" }],
			options: { autoHide: true }
		},
		{
			id: "sundries",
			tab: "features",
			label: "BF.Item.Type.Sundry[other]",
			filters: [{ k: "type", o: "in", v: ["consumable", "sundry"] }],
			options: { autoHide: true }
		}
	],
	lair: [
		{
			id: "lairActions",
			tab: "features",
			filters: [
				{ k: "type", v: "feature" },
				{ k: "system.type.value", v: "lairAction" }
			]
		},
		{
			id: "regionalEffects",
			tab: "features",
			filters: [
				{ k: "type", v: "feature" },
				{ k: "system.type.value", v: "regionalEffect" }
			]
		}
	],
	siege: [
		{
			id: "features",
			tab: "features",
			label: "BF.Item.Category.Feature.Label",
			filters: []
		}
	],
	vehicle: [
		currencySection(),
		{
			id: "features",
			tab: "features",
			label: "BF.Item.Category.Feature.Label",
			filters: [{ k: "type", o: "in", v: ["feature"] }]
		},
		{
			id: "equipment",
			tab: "features",
			label: "BF.Item.Category.Equipment.Label",
			filters: [{ k: "type", o: "in", v: ["ammunition", "weapon"] }]
		},
		{
			id: "cargo",
			tab: "features",
			label: "BF.VEHICLE.FIELDS.attributes.cargo.label",
			filters: [{ k: "type", o: "in", v: ["armor", "consumable", "gear", "sundry", "tool"] }],
			options: { autoHide: true }
		}
	],
	container: [
		currencySection(),
		{
			id: "contents",
			tab: "inventory",
			label: "BF.Sheet.Tab.Contents",
			filters: [
				{
					k: "type",
					o: "in",
					v: ["ammunition", "armor", "consumable", "container", "gear", "tool", "sundry", "weapon"]
				}
			]
		}
	]
};
