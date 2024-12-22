import AdvancementDataModel from "../abstract/advancement-data-model.mjs";

const { SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Size advancement.
 */
export class SizeConfigurationData extends AdvancementDataModel {
	static defineSchema() {
		return {
			options: new SetField(new StringField(), {
				initial: ["medium"],
				label: "BF.Advancement.Size.Options.Label",
				hint: "BF.Advancement.Size.Options.Hint"
			})
		};
	}
}

/**
 * Value data for the Size advancement.
 */
export class SizeValueData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			selected: new StringField({ label: "BF.Size.Label" })
		};
	}
}
