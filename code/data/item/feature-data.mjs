import ItemDataModel from "../abstract/item-data-model.mjs";
import IdentifierField from "../fields/identifier-field.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import FeatureTemplate from "./templates/feature-template.mjs";
import ProficiencyTemplate from "./templates/proficiency-template.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * Data definition for Feature items.
 * @mixes {ActivitiesTemplate}
 * @mixes {AdvancementTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {FeatureTemplate}
 * @mixes {ProficiencyTemplate}
 *
 * @property {object} identifier
 * @property {string} identifier.value - Identifier for this item.
 * @property {string} identifier.associated - Identifier of a concept item this feature is associated with.
 * @property {object} level
 * @property {number} level.value - Class or character level at which this feature is available.
 */
export default class FeatureData extends ItemDataModel.mixin(
	ActivitiesTemplate,
	AdvancementTemplate,
	DescriptionTemplate,
	FeatureTemplate,
	ProficiencyTemplate
) {
	/** @inheritDoc */
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "feature",
			localization: "BF.Item.Type.Feature",
			img: "systems/black-flag/artwork/types/feature.svg"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			identifier: new SchemaField({
				value: new IdentifierField(),
				associated: new IdentifierField()
			}),
			level: new SchemaField({
				value: new NumberField({ min: 0, integer: true })
			})
		});
	}
}
