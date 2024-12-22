import AdvancementDataModel from "../abstract/advancement-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import LocalDocumentField from "../fields/local-document-field.mjs";
import IdentifierField from "../fields/identifier-field.mjs";

const { ArrayField, BooleanField, DocumentUUIDField, EmbeddedDataField, SchemaField, SetField, StringField } =
	foundry.data.fields;

/**
 * Configuration data for the Grant Spells advancement.
 *
 * @property {SpellConfigurationData} spell - Configuration data for granted spells.
 */
export class GrantSpellsConfigurationData extends AdvancementDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Advancement.GrantSpells"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			pool: new ArrayField(new SchemaField({ uuid: new DocumentUUIDField() })),
			spell: new EmbeddedDataField(SpellConfigurationData)
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for granted spells.
 *
 * @typedef {GrantedFeatureData} GrantedSpellData
 * @property {boolean} modified - Was an existing item on the actor modified rather than a new one created?
 */

/**
 * Value data for the Grant Spells advancement.
 *
 * @property {string} ability - Ability to assign if applicable.
 * @property {GrantedSpellData[]} added - Spells added or updated.
 */
export class GrantSpellsValueData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new StringField(),
			added: new ArrayField(
				new SchemaField({
					document: new LocalDocumentField(foundry.documents.BaseItem),
					modified: new BooleanField(),
					uuid: new DocumentUUIDField()
				}),
				{ required: false, initial: undefined }
			)
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for spells that can be granted.
 *
 * @property {Set<string>} ability - One or more abilities that will be used for the provided spell.
 * @property {boolean} alwaysPrepared - Should this spell be always prepared?
 * @property {string} mode - Spell preparation mode to set.
 * @property {string} origin - Identifier of a class or subclass to associated with these spells.
 * @property {string} source - Source the granted spell will be treated as, regardless of original source.
 */
export class SpellConfigurationData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new SetField(new StringField()),
			alwaysPrepared: new BooleanField(),
			mode: new StringField({ initial: "standard" }),
			origin: new IdentifierField(),
			source: new StringField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Changes to be performed on the created spell.
	 * @param {object} [data={}] - Data from the advancement process.
	 * @returns {object}
	 */
	getApplyChanges(data = {}) {
		const updates = {
			"flags.black-flag.relationship.mode": this.mode,
			"flags.black-flag.relationship.alwaysPrepared": this.alwaysPrepared
		};
		if (this.ability.size)
			updates["flags.black-flag.relationship.origin.ability"] = this.ability.has(data.ability)
				? data.ability
				: this.ability.first();
		if (this.origin) updates["flags.black-flag.relationship.origin.identifier"] = this.origin;
		if (this.source) updates["flags.black-flag.relationship.origin.source"] = this.source;
		return updates;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Changes needed to reverse a modification to an existing spell.
	 * @param {BlackFlagItem} spell - The existing spell to reverse changes upon.
	 * @param {object} [data={}] - Data from the advancement process.
	 * @returns {object}
	 */
	getReverseChanges(spell, data = {}) {
		const updates = {};
		if (this.alwaysPrepared) updates["flags.black-flag.relationship.alwaysPrepared"] = false;
		if (this.ability.size) updates["flags.black-flag.relationship.origin.-=ability"] = null;
		if (this.origin) updates["flags.black-flag.relationship.origin.-=identifier"] = null;
		if (this.source) updates["flags.black-flag.relationship.origin.-=source"] = null;
		return updates;
	}
}
