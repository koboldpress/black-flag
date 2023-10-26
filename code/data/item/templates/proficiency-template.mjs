import { Trait } from "../../../utils/_module.mjs";

/**
 * Data definition template for items with proficiency.
 */
export default class ProficiencyTemplate extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			overrides: new foundry.data.fields.SchemaField({
				proficiency: new foundry.data.fields.BooleanField({nullable: true, initial: null})
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
	 * Is the current actor proficient with this weapon?
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
}
