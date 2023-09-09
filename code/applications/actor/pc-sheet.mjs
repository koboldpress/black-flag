export default class PCSheet extends ActorSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "pc"],
			width: 820,
			height: 740,
			template: "systems/black-flag/templates/actor/pc.hbs"
		});
	}
}
