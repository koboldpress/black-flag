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
}
