import { simplifyBonus } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import DamageField from "../fields/shared/damage-field.mjs";
import ActivitiesTemplate from "./templates/activities-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";
import IdentifiableTemplate from "./templates/identifiable-template.mjs";
import PhysicalTemplate from "./templates/physical-template.mjs";
import PropertiesTemplate from "./templates/properties-template.mjs";
import TypeTemplate from "./templates/type-template.mjs";

const { BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Ammunition items.
 * @mixes {ActivitiesTemplate}
 * @mixes {DescriptionTemplate}
 * @mixes {IdentifiableTemplate}
 * @mixes {PhysicalTemplate}
 * @mixes {PropertiesTemplate}
 * @mixes {TypeTemplate}
 *
 * @property {object} damage
 * @property {DamageField} damage.base - Base ammunition damage.
 * @property {boolean} damage.replace - Does this ammunition's base damage replace the weapon's base damage
 *                                      rather than supplement it?
 * @property {string} magicalBonus - Magical bonus added to attack & damage rolls.
 * @property {object} type
 * @property {string} type.category - Ammunition category as defined in `CONFIG.BlackFlag.ammunition`.
 */
export default class AmmunitionData extends ItemDataModel.mixin(
	ActivitiesTemplate,
	DescriptionTemplate,
	IdentifiableTemplate,
	PhysicalTemplate,
	PropertiesTemplate,
	TypeTemplate
) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.AMMUNITION", "BF.IDENTIFIABLE", "BF.SOURCE"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				type: "ammunition",
				category: "equipment",
				legacyMixin: false,
				localization: "BF.Item.Type.Ammunition",
				icon: "fa-solid fa-lines-leaning",
				img: "systems/black-flag/artwork/types/ammunition.svg"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			damage: new SchemaField({
				base: new DamageField(),
				replace: new BooleanField()
			}),
			magicalBonus: new FormulaField({ deterministic: true }),
			type: new SchemaField({
				category: new StringField({ label: "BF.Equipment.Category.Label" })
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get attackMagicalBonus() {
		return this.magicAvailable ? this.magicalBonus : null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get chatTags() {
		const tags = this.parent.chatTags;
		this.setPhysicalChatTags(tags);
		return tags;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static get validCategories() {
		return CONFIG.BlackFlag.ammunition;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		source = super.migrateData(source);
		this._migrateSource(source);
		this._migrateWeightUnits(source);
		return source;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		super.prepareBaseData();
		this._shimWeightUnits();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		this.prepareDescription();
		this.prepareIdentifiable();
		this.preparePhysicalLabels();

		this.magicalBonus = this.magicAvailable
			? simplifyBonus(this.magicalBonus, this.parent.getRollData({ deterministic: true }))
			: 0;

		const type = CONFIG.BlackFlag.ammunition.localized[this.type.category];
		if (type) this.type.label = `${_loc("BF.WEAPON.Label[one]")} (${type})`;
		else this.type.label = _loc("BF.WEAPON.Label[one]");
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		super.prepareFinalData();
		const rollData = this.parent.getRollData({ deterministic: true });
		this.prepareFinalActivities(rollData);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		await super._onCreate(data, options, userId);
		this._onCreatePhysicalItem(data, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preUpdate(changes, options, user) {
		if ((await super._preUpdate(changes, options, user)) === false) return false;
		await this._preUpdateIdentifiable(changes, options, user);
		await this._preUpdatePhysicalItem(changes, options, user);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onUpdate(changed, options, userId) {
		await super._onUpdate(changed, options, userId);
		this._onUpdatePhysicalItem(changed, options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onDelete(options, userId) {
		await super._onDelete(options, userId);
		this._onDeletePhysicalItem(options, userId);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async getSheetData(context, options) {
		context.detailsParts = ["blackFlag.details-ammunition"];
	}
}
