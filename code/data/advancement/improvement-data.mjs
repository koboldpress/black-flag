import { LocalDocumentField } from "../fields/_module.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Improvement advancement.
 *
 * @property {string} talentList - Talent list from which the player can choose.
 */
export class ImprovementConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			talentList: new StringField({label: "BF.Advancement.Improvement.TalentList.Label"})
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Improvement advancement.
 *
 * @property {string} ability - Which ability score was improved?
 * @property {object} added
 * @property {BlackFlagItem} added.document - Local document added.
 * @property {string} added.uuid - Origin UUID of the added document.
 */
export class ImprovementValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			ability: new StringField({required: false, initial: undefined}),
			added: new SchemaField({
				document: new LocalDocumentField(foundry.documents.BaseItem),
				uuid: new StringField() // TODO: Replace with UUIDField when available
			}, {required: false, initial: undefined})
		};
	}
}
