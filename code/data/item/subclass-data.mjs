import ItemDataModel from "../abstract/item-data-model.mjs";
import { IdentifierField } from "../fields/_module.mjs";
import AdvancementTemplate from "./templates/advancement-template.mjs";
import ConceptTemplate from "./templates/concept-template.mjs";
import DescriptionTemplate from "./templates/description-template.mjs";

const { SchemaField } = foundry.data.fields;

/**
 * Data definition for Subclass items.
 * @mixes {AdvancementTemplate}
 * @mixes {ConceptTemplate}
 * @mixes {DescriptionTemplate}
 */
export default class SubclassData extends ItemDataModel.mixin(
	AdvancementTemplate,
	ConceptTemplate,
	DescriptionTemplate
) {
	/** @inheritDoc */
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "subclass",
			category: "concept",
			localization: "BF.Item.Type.Subclass",
			icon: "fa-solid fa-landmark-flag",
			img: "systems/black-flag/artwork/types/subclass.svg"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			identifier: new SchemaField({
				class: new IdentifierField({ label: "BF.Item.Type.Class[one]" })
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Fetch the color from parent class if available.
	 * @type {string|void}
	 */
	get color() {
		const parentClass = this.parent.actor?.system.progression?.classes?.[this.identifier.class]?.document;
		return parentClass?.system.color;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Key ability selected for this subclass.
	 * @type {string|null}
	 */
	get keyAbility() {
		return this.parent?.actor?.system.progression?.classes?.[this.identifier.class]?.system.keyAbility ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Number of levels of the class associated with this subclass a character has.
	 * @type {number}
	 */
	get levels() {
		return this.parent.actor?.system.progression?.classes[this.identifier.class]?.levels ?? 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	get traits() {
		const traits = [];
		if (this.spellcasting)
			traits.push({
				label: "BF.Spellcasting.Label",
				value: this.spellcasting.label
			});
		return traits;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		super.prepareFinalData();
		this.prepareSpellcastingSource();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	_preCreateAdvancement(data, options, user) {
		if (data._id || foundry.utils.hasProperty(data, "system.advancement")) return;
		this._createInitialAdvancement(
			CONFIG.BlackFlag.subclassFeatureLevels.map(level => ({ type: "grantFeatures", level: { value: level } }))
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_preCreateSubclass(data, options, user) {
		if (!this.parent.actor) return;

		const matchingClass = this.parent.actor.system.progression?.classes?.[this.identifier.class];
		if (!matchingClass) {
			ui.notifications.error(
				game.i18n.format("BF.Subclass.Warning.MissingClass", {
					class: CONFIG.BlackFlag.registration.all.class[this.identifier.class]?.name ?? this.identifier.class
				})
			);
			return false;
		} else if (matchingClass.subclass) {
			ui.notifications.error(
				game.i18n.format("BF.Subclass.Warning.ExistingSubclass", {
					class: CONFIG.BlackFlag.registration.all.class[this.identifier.class]?.name ?? this.identifier.class,
					subclass: matchingClass.subclass.name
				})
			);
			return false;
		}
	}
}
