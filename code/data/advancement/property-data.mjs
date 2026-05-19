import AdvancementDataModel from "../abstract/advancement-data-model.mjs";

const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Property advancement.
 */
export class PropertyConfigurationData extends AdvancementDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Advancement.Property"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static defineSchema() {
		return {
			changes: new ArrayField(
				new SchemaField({
					key: new StringField({ required: true }),
					value: new StringField({ required: true }),
					type: new StringField({ integer: true, initial: "add" }),
					priority: new NumberField()
				})
			)
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	static #MODES_TO_TYPES = {
		0: "custom",
		1: "multiply",
		2: "add",
		3: "downgrade",
		4: "upgrade",
		5: "override"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		if (!source) return super.migrateData(source);

		if (Array.isArray(source.changes)) {
			for (const change of source.changes) {
				if (!Object.hasOwn(change, "type") && typeof change.mode === "number") {
					change.type = PropertyConfigurationData.#MODES_TO_TYPES[change.mode] ?? `custom.${change.mode}`;
					delete change.mode;
				}
			}
		}

		return super.migrateData(source);
	}
}
