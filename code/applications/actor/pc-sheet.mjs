export default class PCSheet extends ActorSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "pc"],
			width: 820,
			height: 740,
			tabs: [
				{navSelector: 'nav[data-group="primary"]', contentSelector: "main", initial: "main"}
			],
			template: "systems/black-flag/templates/actor/pc.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.system = this.document.system;
		context.source = this.document.toObject().system;
		return context;
	}
}
