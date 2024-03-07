import Proficiency from "../../documents/proficiency.mjs";
import BaseDataModel from "./base-data-model.mjs";

export default class ActorDataModel extends BaseDataModel {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare data that needs to be prepared after embedded documents have been prepared,
	 * but before active effects are applied.
	 */
	prepareEmbeddedData() {
		this.constructor._getMethods({ startingWith: "prepareEmbedded", notEndingWith: "Data" }).forEach(k => this[k]());
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Embeds                */
	/* <><><><> <><><><> <><><><> <><><><> */

	async toEmbed(config, options={}) {
		if ( !foundry.utils.hasProperty(this, "biography.value") ) return null;
		const description = foundry.utils.getProperty(this, "biography.value");
		const enriched = await TextEditor.enrichHTML(description, {
			...options, relativeTo: this.parent
		});
		const section = document.createElement("section");
		section.innerHTML = enriched;
		return section.children;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare a data object which defines the data schema used by dice roll commands against this Actor.
	 * @param {object} [options]
	 * @param {boolean} [options.deterministic] - Whether to force deterministic values for data properties that could be
	 *                                            either a die term or a flat term.
	 * @returns {object}
	 */
	getRollData({ deterministic=false }={}) {
		const rollData = { ...this };
		rollData.prof = new Proficiency(this.attributes?.proficiency ?? 0, 1);
		if ( deterministic ) rollData.prof = rollData.prof.flat;
		return rollData;
	}
}
