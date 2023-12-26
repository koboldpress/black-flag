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
 * Sections that will appear on documnet sheets. They are arrays of objects grouped by document type.
 * @enum {SheetSectionConfiguration[]}
 */
export const sheetSections = {
	pc: [
		{
			id: "ring-*",
			tab: "spellcasting",
			filters: [
				{k: "type", v: "spell"},
				{k: "flags.black-flag.relationship.preparationMode", o: "in", v: ["standard", "alwaysPrepared", undefined]}
			],
			expand: (document, sectionData) => {
				return Object.entries(CONFIG.BlackFlag.spellRings(true)).map(([number, label]) => {
					number = Number(number);
					const cantrip = number === 0;
					const id = cantrip ? "cantrip" : `ring-${number}`;
					const ring = document.system.spellcasting.rings[id] ?? {};
					return foundry.utils.mergeObject(sectionData, {
						id, label,
						filters: [...sectionData.filters, {k: "system.ring.base", v: number}],
						create: [{
							type: "spell",
							"system.ring.base": number,
							"flags.black-flag.relationship.preparationMode": "standard"
						}],
						options: { autoHide: !ring.max && !cantrip }, ring
					}, {inplace: false});
				});
			}
		},
		{
			id: "ritual",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.Ritual",
			filters: [{k: "type", v: "spell"}, {k: "flags.black-flag.relationship.preparationMode", v: "ritual"}],
			create: [{type: "spell", "flags.black-flag.relationship.preparationMode": "ritual"}],
			options: {autoHide: true}
		},
		{
			id: "innate",
			tab: "spellcasting",
			label: "BF.Spell.Preparation.Mode.Innate",
			filters: [{k: "type", v: "spell"}, {k: "flags.black-flag.relationship.preparationMode", v: "innate"}],
			create: [{type: "spell", "flags.black-flag.relationship.preparationMode": "innate"}],
			options: {autoHide: true}
		},
		{
			id: "equipment",
			tab: "inventory",
			label: "BF.Item.Category.Equipment.Label",
			filters: [{k: "type", o: "in", v: ["armor", "weapon", "ammunition"]}],
			create: [{type: "armor"}, {type: "weapon"}, {type: "ammunition"}]
		},
		{
			id: "containers",
			tab: "inventory",
			label: "BF.Item.Type.Container[other]",
			filters: [{k: "type", v: "container"}],
			create: [{type: "container"}]
		},
		{
			id: "class-features",
			tab: "features",
			label: "BF.Item.Feature.Category.Class[other]",
			filters: [{k: "type", v: "feature"}, {k: "system.type.category", v: "class"}],
			expand: (document, sectionData) => {
				if ( document.system.progression.level === 0 ) return [];
				return Object.entries(document.system.progression.classes).map(([identifier, cls]) => {
					const label = pluralRule => game.i18n.format(
						`BF.Item.Feature.Category.ClassSpecific[${pluralRule}]`, { class: cls.document.name }
					);
					return foundry.utils.mergeObject(sectionData, {
						id: `class-${identifier}`, label: label("other"),
						filters: [...sectionData.filters, {k: "system.identifier.associated", v: identifier}],
						create: [{
							label: label("one"),
							type: "feature",
							"system.type.category": "class",
							"system.identifier.associated": identifier
						}],
						levels: cls.levels
					}, {inplace: false});
				}).sort((lhs, rhs) => rhs.levels - lhs.levels);
			}
		},
		{
			id: "talents",
			tab: "features",
			label: "BF.Item.Type.Talent[other]",
			filters: [{k: "type", v: "talent"}],
			create: [{type: "talent"}]
		},
		{
			id: "lineage-features",
			tab: "features",
			label: "BF.Item.Feature.Category.Lineage[other]",
			filters: [{k: "type", v: "feature"}, {k: "system.type.category", v: "lineage"}],
			create: [{label: "BF.Item.Feature.Category.Lineage[one]", type: "feature", "system.type.category": "lineage"}]
		},
		{
			id: "heritage-features",
			tab: "features",
			label: "BF.Item.Feature.Category.Heritage[other]",
			filters: [{k: "type", v: "feature"}, {k: "system.type.category", v: "heritage"}],
			create: [{label: "BF.Item.Feature.Category.Heritage[one]", type: "feature", "system.type.category": "heritage"}]
		},
		{
			id: "features",
			tab: "features",
			label: "BF.Item.Category.Feature.Label",
			filters: [{k: "type", v: "feature"}],
			create: [{type: "feature"}],
			options: {autoHide: true}
		},
		{
			id: "progression",
			tab: "progression",
			filters: [{k: "type", o: "in", v: ["class", "background", "heritage", "lineage"]}]
		}
	],
	npc: [
		{
			id: "features",
			tab: "features",
			label: "BF.Item.Category.Feature.Label",
			filters: [{k: "type", o: "in", v: ["feature", "talent"]}],
			create: [{type: "feature"}]
		},
		{
			id: "equipment",
			tab: "features",
			label: "BF.Item.Category.Equipment.Label",
			filters: [{k: "type", o: "in", v: ["ammunition", "armor", "weapon"]}],
			create: [{type: "armor"}, {type: "weapon"}, {type: "ammunition"}]
		}
	],
	container: [
		{
			id: "contents",
			tab: "inventory",
			label: "BF.Sheet.Tab.Contents",
			filters: []
		}
	]
};
