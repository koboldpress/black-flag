import ConceptTemplate from "./templates/concept-template.mjs";

/**
 * Data definition for Class items.
 */
export default class ClassData extends ConceptTemplate {

	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "class",
			localization: "BF.Item.Type.Class"
		});
	}


	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareDerivedDetails() {
		const hpAdvancement = this.advancement.byType("hitPoints")[0];
		this.hitDie = hpAdvancement ? `d${hpAdvancement.configuration.denomination}` : "";
	}
}
