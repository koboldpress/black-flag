import ItemDataModel from "../abstract/item-data-model.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import ConceptTemplate from "./templates/concept-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";

/**
 * Data definition for Background items.
 * @mixes {AdvancementTemplate}
 * @mixes {ConceptTemplate}
 * @mixes {DescriptionTemplate}
 */
export default class HeritageData extends ItemDataModel.mixin(
	AdvancementTemplate,
	ConceptTemplate,
	DescriptionTemplate
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
				type: "heritage",
				category: "concept",
				legacyMixin: false,
				localization: "BF.Item.Type.Heritage",
				icon: "fa-solid fa-monument",
				img: "systems/black-flag/artwork/types/heritage.svg",
				accentColor: "#aa0000",
				hasEffects: false,
				register: true
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
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		if ((await super._preCreate(data, options, user)) === false) return false;
		if (data._id || foundry.utils.hasProperty(data, "system.advancement")) return;
		this._createInitialAdvancement([
			{
				type: "trait",
				title: "Languages",
				configuration: { grants: ["languages:standard:common"], choices: [{ count: 1, pool: "languages:*" }] }
			}
		]);
	}

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
