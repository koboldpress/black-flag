import ItemDataModel from "../abstract/item-data-model.mjs";
import ActivityTemplate from "./templates/activities-template.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import FeatureTemplate from "./templates/feature-template.mjs";
import ProficiencyTemplate from "./templates/proficiency-template.mjs";

const { BooleanField, SchemaField } = foundry.data.fields;

/**
 * Data definition for Talent items.
 * @mixes {ActivityTemplate}
 * @mixes {AdvancementTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {FeatureTemplate}
 * @mixes {ProficiencyTemplate}
 *
 * @property {object} restriction
 * @property {boolean} restriction.allowMultipleTimes - Can this talent be taken more than once?
 */
export default class TalentData extends ItemDataModel.mixin(
	ActivityTemplate,
	AdvancementTemplate,
	DescriptionTemplate,
	FeatureTemplate,
	ProficiencyTemplate
) {
	/** @inheritDoc */
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "talent",
			localization: "BF.Item.Type.Talent",
			img: "systems/black-flag/artwork/types/talent.svg"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			restriction: new SchemaField({
				allowMultipleTimes: new BooleanField({
					label: "BF.Talent.AllowMultipleTimes.Label",
					hint: "BF.Talent.AllowMultipleTimes.Hint"
				})
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Embeds                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbed(...args) {
		return this.embedPrerequisite(await super.toEmbed(...args));
	}
}
