import ItemDataModel from "../abstract/item-data-model.mjs";
import { IdentifierField } from "../fields/_module.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import ConceptTemplate from "./templates/concept-template.mjs";

const { SchemaField } = foundry.data.fields;

/**
 * Data definition for Subclass items.
 */
export default class SubclassData extends ItemDataModel.mixin(AdvancementTemplate, ConceptTemplate) {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "subclass",
			category: "concept",
			localization: "BF.Item.Type.Subclass",
			icon: "fa-solid fa-landmark-flag"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			identifier: new SchemaField({
				class: new IdentifierField()
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Spellcasting configuration data if defined for this subclass.
	 * @type {SpellcastingConfigurationData|null}
	 */
	get spellcasting() {
		return this.advancement.byType("spellcasting")[0]?.configuration ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	get traits() {
		const traits = [];
		if ( this.spellcasting ) traits.push({
			label: "BF.Spellcasting.Label",
			value: this.spellcasting.label
		});
		return traits;
	}
}
