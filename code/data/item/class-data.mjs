import ItemDataModel from "../abstract/item-data-model.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import ConceptTemplate from "./templates/concept-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";

const { ColorField } = foundry.data.fields;

/**
 * Data definition for Class items.
 * @mixes {AdvancementTemplate}
 * @mixes {ConceptTemplate}
 * @mixes {DescriptionTemplate}
 *
 * @property {string} color - Color used to represent this class, used to tinting headers.
 */
export default class ClassData extends ItemDataModel.mixin(AdvancementTemplate, ConceptTemplate, DescriptionTemplate) {
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
				type: "class",
				category: "concept",
				legacyMixin: false,
				localization: "BF.Item.Type.Class",
				icon: "fa-solid fa-landmark-dome",
				img: "systems/black-flag/artwork/types/class.svg",
				hasEffects: false,
				register: true
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			color: new ColorField()
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Key ability selected for this class.
	 * @type {string|null}
	 */
	get keyAbility() {
		const keyAbility = this.advancement.byType("keyAbility")[0];
		return keyAbility?.configuration.options.first();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Number of levels of this class a character has.
	 * @type {number}
	 */
	get levels() {
		return this.parent.actor?.system.progression?.classes[this.parent.identifier]?.levels ?? 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get traits() {
		const traits = [];
		if (this.labels.hitDie)
			traits.push({
				label: "BF.HitDie.Label[one]",
				value: this.labels.hitDie
			});
		if (this.labels.keyAbility)
			traits.push({
				label: "BF.Advancement.KeyAbility.Title",
				value: this.labels.keyAbility
			});
		if (this.spellcasting)
			traits.push({
				label: "BF.Spellcasting.Label",
				value: this.spellcasting.label
			});
		return traits;
	}

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

		this.labels ??= {};

		// Hit Die
		const hpAdvancement = this.advancement.byType("hitPoints")[0];
		this.labels.hitDie = hpAdvancement ? `d${hpAdvancement.configuration.denomination}` : "";

		// Key Ability
		const keyAbilityAdvancement = this.advancement.byType("keyAbility")[0];
		if (keyAbilityAdvancement) {
			const keyAbilityOptions = keyAbilityAdvancement.configuration.options.map(
				o => _loc(CONFIG.BlackFlag.abilities.localized[o]) ?? o
			);
			const listFormatter = game.i18n.getListFormatter({ style: "short", type: "conjunction" });
			this.labels.keyAbility = listFormatter.format(keyAbilityOptions);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		super.prepareFinalData();
		this.prepareSpellcastingSource();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		if ((await super._preCreate(data, options, user)) === false) return false;
		if (data._id || foundry.utils.hasProperty(data, "system.advancement")) return;
		this._createInitialAdvancement([
			{ type: "hitPoints" },
			{ type: "keyAbility" },
			{ type: "trait", level: { classRestriction: "original", value: 1 } },
			{ type: "trait", configuration: { choices: [{ count: 2, pool: ["skills:*"] }] } },
			{ type: "equipment", level: { classRestriction: "original" } }
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
