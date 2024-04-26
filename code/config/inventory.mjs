/**
 * Configuration data for sheet sections.
 *
 * @typedef {object} SheetSectionConfiguration
 * @property {string} id - ID of the section, should be unique per document type.
 * @property {string} tab - Name of the tab on which this section will appear. Places the section into an object
 *                          for that tab's name within the sheet rendering context.
 * @property {string} label - Localizable label for the section.
 * @property {FilterDescription[]} filters - Set of filters to determine which items should appear in this section.
 * @property {object[]} [create] - Data used when creating items within this section, with an optional `label`.
 * @property {object} [options]
 * @property {boolean} [options.autoHide=false] - Should this section be hidden unless it has items?
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
				{ o: "NOT", v: { k: "system.tags", o: "has", v: "ritual" } }
			],
			expand: (document, sectionData) => {
				return Object.entries(CONFIG.BlackFlag.spellCircles(true)).map(([number, label]) => {
					number = Number(number);
					const cantrip = number === 0;
					const id = cantrip ? "cantrip" : `circle-${number}`;
					const circle = document.system.spellcasting.circles[id] ?? {};
					return foundry.utils.mergeObject(
						sectionData,
						{
							id,
							label,
							filters: [...sectionData.filters, { k: "system.circle.base", v: number }],
							create: [
								{
									type: "spell",
									"system.circle.base": number,
									"flags.black-flag.relationship.mode": "standard"
								}
							],
							options: { autoHide: !circle.max && !cantrip },
							circle
						},
						{ inplace: false }
					);
				});
			}
		},
		{
			id: "ritual",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.Rituals",
			filters: [
				{ k: "type", v: "spell" },
				{ k: "system.tags", o: "has", v: "ritual" }
			],
			options: { autoHide: true }
		},
		{
			id: "atWill",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.AtWill",
			filters: [
				{ k: "type", v: "spell" },
				{ k: "flags.black-flag.relationship.mode", v: "atWill" }
			],
			create: [{ type: "spell", "flags.black-flag.relationship.mode": "atWill" }],
			options: { autoHide: true }
		},
		{
			id: "innate",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.Innate",
			filters: [
				{ k: "type", v: "spell" },
				{ k: "flags.black-flag.relationship.mode", v: "innate" }
			],
			create: [{ type: "spell", "flags.black-flag.relationship.mode": "innate" }],
			options: { autoHide: true }
		},
		{
			id: "weapons",
			tab: "inventory",
			label: "BF.Item.Type.Weapon[other]",
			filters: [{ k: "type", v: "weapon" }],
			create: [{ type: "weapon" }]
		},
		{
			id: "ammunition",
			tab: "inventory",
			label: "BF.Item.Type.Ammunition[other]",
			filters: [{ k: "type", v: "ammunition" }],
			create: [{ type: "ammunition" }],
			options: { autoHide: true }
		},
		{
			id: "armor",
			tab: "inventory",
			label: "BF.Item.Type.Armor[other]",
			filters: [{ k: "type", v: "armor" }],
			create: [{ type: "armor" }]
		},
		{
			id: "gear",
			tab: "inventory",
			label: "BF.Item.Type.Gear[other]",
			filters: [{ k: "type", v: "gear" }],
			create: [{ type: "gear" }]
		},
		{
			id: "tools",
			tab: "inventory",
			label: "BF.Item.Type.Tool[other]",
			filters: [{ k: "type", v: "tool" }],
			create: [{ type: "tool" }]
		},
		{
			id: "consumables",
			tab: "inventory",
			label: "BF.Item.Type.Consumable[other]",
			filters: [{ k: "type", v: "consumable" }],
			create: [{ type: "consumable" }] // TODO: Add option to create sub-types directly
		},
		{
			id: "containers",
			tab: "inventory",
			label: "BF.Item.Type.Container[other]",
			filters: [{ k: "type", v: "container" }],
			create: [{ type: "container" }]
		},
		{
			id: "sundries",
			tab: "inventory",
			label: "BF.Item.Type.Sundry[other]",
			filters: [{ k: "type", v: "sundry" }],
			create: [{ type: "sundry" }],
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
						return foundry.utils.mergeObject(
							sectionData,
							{
								id: `class-${identifier}`,
								label: label("other"),
								filters: [
									...sectionData.filters,
									{
										o: "OR",
										v: [
											{ k: "system.identifier.associated", v: identifier },
											{ k: "flags.black-flag.ultimateOrigin", v: `${cls.document.id}.`, o: "startswith" }
										]
									}
								],
								create: [
									{
										label: label("one"),
										type: "feature",
										"system.type.category": "class",
										"system.identifier.associated": identifier
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
			filters: [{ k: "type", v: "talent" }],
			create: [{ type: "talent" }]
		},
		{
			id: "lineage-features",
			tab: "features",
			label: "BF.Feature.Category.Lineage[other]",
			filters: [
				{ k: "type", v: "feature" },
				{ k: "system.type.category", v: "lineage" }
			],
			create: [{ label: "BF.Feature.Category.Lineage[one]", type: "feature", "system.type.category": "lineage" }]
		},
		{
			id: "heritage-features",
			tab: "features",
			label: "BF.Feature.Category.Heritage[other]",
			filters: [
				{ k: "type", v: "feature" },
				{ k: "system.type.category", v: "heritage" }
			],
			create: [{ label: "BF.Feature.Category.Heritage[one]", type: "feature", "system.type.category": "heritage" }]
		},
		{
			id: "features",
			tab: "features",
			label: "BF.Item.Category.Feature.Label",
			filters: [{ k: "type", v: "feature" }],
			create: [{ type: "feature" }],
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
			filters: [{ k: "type", o: "in", v: ["feature", "talent"] }],
			create: [{ type: "feature", "system.type.category": "monsters" }]
		},
		{
			id: "equipment",
			tab: "features",
			label: "BF.Item.Category.Equipment.Label",
			filters: [{ k: "type", o: "in", v: ["ammunition", "armor", "weapon"] }],
			create: [{ type: "armor" }, { type: "weapon" }, { type: "ammunition" }]
		},
		{
			id: "sundries",
			tab: "features",
			label: "BF.Item.Type.Sundry[other]",
			filters: [{ k: "type", v: "sundry" }],
			create: [{ type: "sundry" }],
			options: { autoHide: true }
		}
	],
	container: [
		currencySection(),
		{
			id: "contents",
			tab: "inventory",
			label: "BF.Sheet.Tab.Contents",
			filters: []
		}
	]
};
