import Proficiency from "../../../documents/proficiency.mjs";
import { Trait } from "../../../utils/_module.mjs";

const { BooleanField, SchemaField } = foundry.data.fields;

/**
 * Data definition template for items with proficiency.
 *
 * @property {object} overrides
 * @property {boolean} overrides.proficiency - Is the user always proficient (`true`), never proficient (`false`),
 *                                             or should it be calculated automatically (`null`).
 */
export default class ProficiencyTemplate extends foundry.abstract.DataModel {

	/** @inheritDoc */
	static defineSchema() {
		return {
			overrides: new SchemaField({
				proficiency: new BooleanField({nullable: true, initial: null})
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Trait type used to establish proficiency.
	 */
	static proficiencyCategory;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is the current actor proficient with this item?
	 * @type {boolean|null}
	 */
	get proficient() {
		if ( !this.parent.isEmbedded ) return null;
		if ( this.overrides.proficiency !== null ) return this.overrides.proficiency;
		const actorProficiency = foundry.utils.getProperty(
			this.parent.actor, `${Trait.actorKeyPath(this.constructor.proficiencyCategory)}.value`
		);
		if ( !actorProficiency ) return true;
		return actorProficiency.has(this.type.category) || actorProficiency.has(this.type.base);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Proficiency description.
	 * @type {Proficiency}
	 */
	get proficiency() {
		return new Proficiency(
			this.parent.actor?.system.attributes?.proficiency ?? 0,
			this.proficient ? 1 : 0
		);
	}
}
