export default class BlackFlagActor extends Actor {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	applyActiveEffects() {
		this.system.prepareEmbeddedData?.();
		return super.applyActiveEffects();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Character Creation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Assign a concept item to the actor.
	 * @param {string} type - Type of item to set ("class", "heritage", "lineage", "background").
	 * @param {BlackFlagItem} document - Document to assign.
	 */
	async setConcept(type, document) {
		if ( type === "class" ) await this.update({"system.progression.levels.1.class": document.identifier});
		else await this.update({[`system.progression.${type}`]: document.identifier});
	}
}
