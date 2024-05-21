import { LocalDocumentField } from "../fields/_module.mjs";

const { SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Improvement advancement.
 *
 * @property {Set<string>} talentList - One or more talent list from which the player can choose.
 */
export class ImprovementConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			talentList: new SetField(new StringField(), {
				label: "BF.Advancement.Improvement.TalentList.Label"
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Migrations           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		if (foundry.utils.getType(source.talentList) === "string") {
			source.talentList = [source.talentList];
		}
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Improvement advancement.
 *
 * @property {string} ability - Which ability score was improved?
 * @property {object} talent
 * @property {BlackFlagItem} talent.document - Local document added.
 * @property {string} talent.uuid - Origin UUID of the added document.
 */
export class ImprovementValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			ability: new StringField({ required: false, initial: undefined }),
			talent: new SchemaField(
				{
					document: new LocalDocumentField(foundry.documents.BaseItem),
					uuid: new StringField() // TODO: Replace with UUIDField when available
				},
				{ required: false, initial: undefined }
			)
		};
	}
}
