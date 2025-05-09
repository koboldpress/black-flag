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
				type: "feature",
				category: "features",
				localization: "BF.Item.Type.Feature",
				img: "systems/black-flag/artwork/types/feature.svg"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			identifier: new SchemaField({
				associated: new IdentifierField()
			}),
			level: new SchemaField({
				value: new NumberField({ min: 0, integer: true })
			})
		});
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
	async getSheetData(context) {
		context.descriptionParts = ["blackFlag.description-feature"];
		context.detailsParts = ["blackFlag.details-feature"];

		context.type ??= {};
		context.type.categories = CONFIG.BlackFlag.featureCategories.localized;

		const featureCategory = CONFIG.BlackFlag.featureCategories[context.source.type.category];
		const id = new Set([context.source.identifier.associated]);
		if (featureCategory?.sources)
			context.type.categorySources = CONFIG.BlackFlag.registration.groupedOptions(featureCategory.sources, id);
		const featureType = featureCategory?.children?.[context.source.type.value];
		if (featureType?.sources)
			context.type.typeSources = CONFIG.BlackFlag.registration.groupedOptions(featureType.sources, id);

		if (
			(featureCategory && ["class", "lineage", "heritage"].includes(context.source.type.category)) ||
			featureCategory?.children
		) {
			context.type.types = {
				label: game.i18n.format("BF.Feature.Type.LabelSpecific", {
					type: game.i18n.localize(`${featureCategory.localization}[one]`)
				}),
				options: featureCategory?.children?.localized ?? null,
				selected: context.source.type.value || context.source.identifier.associated
			};
		}

		if (context.source.type.category === "class" && (featureType || context.source.identifier.associated)) {
			context.type.displayLevel = featureType?.level !== false;
			context.type.fixedLevel = featureType?.level;
		}
	}
}
