import { getPluralRules, makeLabel, numberFormat } from "../../utils/_module.mjs";
import LocalDocumentField from "../fields/local-document-field.mjs";
import MappingField from "../fields/mapping-field.mjs";

const {
	ArrayField,
	BooleanField,
	DocumentIdField,
	DocumentUUIDField,
	EmbeddedDataField,
	IntegerSortField,
	NumberField,
	SchemaField,
	StringField
} = foundry.data.fields;

/**
 * Configuration data for the Equipment advancement.
 *
 * @property {EquipmentEntryData[]} pool - Different equipment entries that will be granted.
 */
export class EquipmentConfigurationData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			pool: new ArrayField(new EmbeddedDataField(EquipmentEntryData))
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Data for a single entry in the equipment list.
 *
 * @property {string} _id - Unique ID of this entry.
 * @property {string|null} group - Parent entry that contains this one.
 * @property {number} sort - Sorting order of this entry.
 * @property {string} type - Entry type as defined in `EquipmentEntryData#TYPES`.
 * @property {number} [count] - Number of items granted. If empty, assumed to be `1`.
 * @property {string} [key] - Category or item key unless type is "linked", in which case it is a UUID.
 * @property {boolean} [requiresProficiency] - Is this only a valid item if character already has the
 *                                             required proficiency.
 */
export class EquipmentEntryData extends foundry.abstract.DataModel {
	/**
	 * Types that group together child entries.
	 * @enum {string}
	 */
	static GROUPING_TYPES = {
		OR: "BF.Advancement.Equipment.Operator.OR",
		AND: "BF.Advancement.Equipment.Operator.AND"
	};

	/**
	 * Types that contain an option for the player.
	 * @enum {string}
	 */
	static OPTION_TYPES = {
		// Category types
		armor: "BF.Advancement.Equipment.Choice.Armor",
		tool: "BF.Advancement.Equipment.Choice.Tool",
		weapon: "BF.Advancement.Equipment.Choice.Weapon",

		// Generic item type
		linked: "BF.Advancement.Equipment.SpecificItem"
	};

	/**
	 * Equipment entry types.
	 * @type {Record<string, string>}
	 */
	static get TYPES() {
		return { ...this.GROUPING_TYPES, ...this.OPTION_TYPES };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Where in `CONFIG.BlackFlag` to find the type category labels.
	 * @enum {{ label: string, config: string }}
	 */
	static CATEGORIES = {
		armor: {
			localization: "BF.Item.Type.Armor",
			config: "armor"
		},
		tool: {
			localization: "BF.Item.Type.Tool",
			config: "tools"
		},
		weapon: {
			localization: "BF.Item.Type.Weapon",
			config: "weapons"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			_id: new DocumentIdField({ initial: () => foundry.utils.randomID() }),
			group: new StringField({ nullable: true, initial: null }),
			sort: new IntegerSortField(),
			type: new StringField({ required: true, initial: "OR", choices: this.TYPES }),
			count: new NumberField({ initial: undefined }),
			key: new StringField({ initial: undefined }),
			requiresProficiency: new BooleanField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get any children represented by this entry in order.
	 * @returns {EquipmentEntryData[]}
	 */
	get children() {
		if (!(this.type in this.constructor.GROUPING_TYPES)) return [];
		return this.parent.pool.filter(entry => entry.group === this._id).sort((lhs, rhs) => lhs.sort - rhs.sort);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Transform this entry into a human readable label.
	 * @type {string}
	 */
	get label() {
		return this.generateLabel();
	}

	/**
	 * Generate a human readable label, taking depth into account for OR prefixes.
	 * @param {number} depth
	 * @returns {string|void}
	 */
	generateLabel(depth = 1) {
		let label;
		switch (this.type) {
			// For AND/OR, use a simple conjunction/disjunction list (e.g. "first, second, and third")
			case "AND":
			case "OR":
				// TODO: Add (a), (b) before ORed entries
				return game.i18n
					.getListFormatter({ type: this.type === "AND" ? "conjunction" : "disjunction", style: "long" })
					.format(this.children.map(c => c.generateLabel(depth + 1)).filter(l => l));

			// For linked type, fetch the name using the index
			case "linked":
				const index = fromUuidSync(this.key);
				if (index) label = index.name;
				break;

			// For category types, grab category information from config
			default:
				label = this.categoryLabel;
				break;
		}

		if (!label) return;
		if (this.count > 1) label = `${numberFormat(this.count, { spellOut: true })} ${label}`;
		else if (this.type !== "linked") {
			label = game.i18n.format("BF.Advancement.Trait.Choice.AnyUncounted", { type: label });
		}
		if (this.type === "linked" && this.requiresProficiency) {
			label += ` (${game.i18n.localize("BF.Advancement.Equipment.IfProficient").toLowerCase()})`;
		}
		return label;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Blank label if no key is specified for a choice type.
	 * @type {string}
	 */
	get blankLabel() {
		const localization = this.constructor.CATEGORIES[this.type]?.localization;
		if (!localization) return "";
		return game.i18n.localize(`${localization}[${getPluralRules().select(this.count ?? 1)}]`);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Get the label for a category.
	 * @type {string}
	 */
	get categoryLabel() {
		const label = this.keyOptions[this.key];
		return label?.toLowerCase() ?? this.blankLabel.toLowerCase();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a list of possible key options for this entry's type.
	 * @returns {Record<string, string>}
	 */
	get keyOptions() {
		const config = foundry.utils.deepClone(CONFIG.BlackFlag[this.constructor.CATEGORIES[this.type]?.config]);
		const pluralRule = getPluralRules().select(this.count ?? 1);
		const choices = Object.entries(config ?? {}).reduce((obj, [key, value]) => {
			if (value.children) obj[key] = makeLabel(value, { pluralRule, labelKeyPath: null });
			return obj;
		}, {});

		// Special handling for weapons
		if (this.type === "weapon") {
			for (const [categoryKey, category] of Object.entries(CONFIG.BlackFlag.weapons.localized)) {
				for (const [typeKey, type] of Object.entries(CONFIG.BlackFlag.weaponTypes.localized)) {
					choices[`${categoryKey}.${typeKey}`] = game.i18n.format(`BF.Weapon.Type.CombinedLabel[${pluralRule}]`, {
						category,
						type
					});
				}
			}
		}

		return choices;
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Equipment advancement.
 *
 * @property {Record<string, GrantedFeatureData>} added - Equipment item added for each entry.
 */
export class EquipmentValueData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			added: new MappingField(
				new SchemaField({
					document: new LocalDocumentField(foundry.documents.BaseItem),
					uuid: new DocumentUUIDField({ type: "Item" })
				})
			)
		};
	}
}
