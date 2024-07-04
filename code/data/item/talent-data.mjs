import ItemDataModel from "../abstract/item-data-model.mjs";
import ActivityTemplate from "./templates/activities-template.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import FeatureTemplate from "./templates/feature-template.mjs";
import ProficiencyTemplate from "./templates/proficiency-template.mjs";

/**
 * Data definition for Talent items.
 * @mixes {ActivityTemplate}
 * @mixes {AdvancementTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {FeatureTemplate}
 * @mixes {ProficiencyTemplate}
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
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.preparePrerequisiteLabel();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		super.prepareFinalData();
		const rollData = this.parent.getRollData({ deterministic: true });
		this.prepareFinalActivities(rollData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Embeds                */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbed(...args) {
		return this.embedPrerequisite(await super.toEmbed(...args));
	}
}
