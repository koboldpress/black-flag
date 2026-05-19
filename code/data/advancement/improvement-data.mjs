import AdvancementDataModel from "../abstract/advancement-data-model.mjs";
import { LocalDocumentField } from "../fields/_module.mjs";

const { DocumentUUIDField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Improvement advancement.
 *
 * @property {Set<string>} talentList - One or more talent list from which the player can choose.
 */
export class ImprovementConfigurationData extends AdvancementDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Advancement.Improvement"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static defineSchema() {
		return {
			talentList: new SetField(new StringField())
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		if (!source) return super.migrateData(source);

		if (foundry.utils.getType(source.talentList) === "string") {
			source.talentList = [source.talentList];
		}

		return super.migrateData(source);
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for the Improvement advancement.
 *
 * @property {object} ability - Which ability scores were improved?
 * @property {string} ability.one
 * @property {string} ability.two
 * @property {object} talent
 * @property {BlackFlagItem} talent.document - Local document added.
 * @property {string} talent.uuid - Origin UUID of the added document.
 */
export class ImprovementValueData extends foundry.abstract.DataModel {
	/** @override */
	static defineSchema() {
		return {
			ability: new SchemaField({
				one: new StringField({ required: false, initial: undefined }),
				two: new StringField({ required: false, initial: undefined })
			}),
			talent: new SchemaField(
				{
					document: new LocalDocumentField(foundry.documents.BaseItem),
					uuid: new DocumentUUIDField()
				},
				{ required: false, initial: undefined }
			)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static migrateData(source) {
		if (foundry.utils.getType(source.ability) === "string") {
			source.ability = { one: source.ability };
		}

		return source;
	}
}
