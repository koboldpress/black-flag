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
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "talent",
				category: "features",
				legacyMixin: false,
				localization: "BF.Item.Type.Talent",
				img: "systems/black-flag/artwork/types/talent.svg"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		source = super.migrateData(source);
		this._migrateFilterIds(source);
		this._migrateSource(source);
		return source;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.prepareDescription();
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
	/*          Embeds & Tooltips          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async toEmbed(...args) {
		return this.embedPrerequisite(await super.toEmbed(...args));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async getSheetData(context, options) {
		context.descriptionParts = ["blackFlag.description-talent"];
		context.detailsParts = ["blackFlag.details-talent"];

		context.type ??= {};
		context.type.categoryOptions = CONFIG.BlackFlag.talentCategories.localizedOptions;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		await super._onCreate(data, options, userId);
		this._onCreateApplyAdvancement(data, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDelete(options, userId) {
		await super._onDelete(options, userId);
		this._onDeleteRevertAdvancement(options, userId);
	}
}
