import { LocalDocumentField } from "../fields/_module.mjs";
import { GrantFeaturesConfigurationData, GrantFeaturesValueData } from "./grant-features-data.mjs";

const { ArrayField, BooleanField, EmbeddedDataField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Grant Spells advancement.
 *
 * @property {SpellConfigurationData} spell - Configuration data for granted spells.
 */
export class GrantSpellsConfigurationData extends GrantFeaturesConfigurationData {
	/** @inheritDoc */
	static defineSchema() {
		return {
			...super.defineSchema(),
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
 * @property {GrantedSpellData[]} updated - Spells updated.
 */
export class GrantSpellsValueData extends GrantFeaturesValueData {
	/** @inheritDoc */
	static defineSchema() {
		return {
			...super.defineSchema(),
			added: new ArrayField(
				new SchemaField({
					document: new LocalDocumentField(foundry.documents.BaseItem),
					modified: new BooleanField(),
					uuid: new StringField() // TODO: Replace with UUIDField when available
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
 * @property {string} source - Source the granted spell will be treated as, regardless of original source.
 * @property {string} mode - Spell preparation mode to set.
 * @property {boolean} alwaysPrepared - Should this spell be always prepared?
 */
export class SpellConfigurationData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			source: new StringField({ label: "BF.Spell.Source.Label", hint: "BF.Advancement.GrantSpells.Source.Hint" }),
			mode: new StringField({ initial: "standard", label: "BF.Spell.Preparation.Label" }),
			alwaysPrepared: new BooleanField({ label: "BF.Spell.Preparation.AlwaysPrepared" })
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
		if (this.source) updates["flags.black-flag.relationship.source"] = this.source;
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
		if (this.source) updates["flags.black-flag.relationship.-=source"] = null;
		return updates;
	}
}
