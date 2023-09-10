export default class BaseItemSheet extends ItemSheet {

	/**
	 * Fields that will be enriched during data preparation.
	 * @type {object}
	 */
	static enrichedFields = {
		description: "system.description.value"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		context.CONFIG = CONFIG.BlackFlag;
		context.system = this.document.system;
		context.source = this.document.toObject().system;

		const enrichmentContext = {
			secrets: this.item.isOwner, rollData: this.item.getRollData(), async: true, relativeTo: this.item
		};
		context.enriched = await Object.entries(this.constructor.enrichedFields).reduce(async (enriched, [key, path]) => {
			enriched[key] = await TextEditor.enrichHTML(foundry.utils.getProperty(context, path), enrichmentContext);
			return enriched;
		}, {});

		return context;
	}
}
