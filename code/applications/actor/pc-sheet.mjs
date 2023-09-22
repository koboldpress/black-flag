import AbilityAssignmentDialog from "./ability-assignment-dialog.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import ConceptSelectionDialog from "./concept-selection-dialog.mjs";

export default class PCSheet extends BaseActorSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "pc"],
			width: 820,
			height: 740,
			tabs: [
				{group: "progression", navSelector: ".progression", contentSelector: "form", initial: "front"},
				{group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: "main", initial: "main"}
			]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Advancement flows currently displayed on the sheet.
	 * @type {[key: string]: AdvancementFlow}
	 */
	advancementFlows = {};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		this.prepareProgression(context);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareItems(context) {
		await this._prepareItemSections(context);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare levels on the progression tab and assign them advancement flows.
	 * @param {object} context - Context being prepared.
	 */
	async prepareProgression(context) {
		context.progressionLevels = [];
		const flowIds = new Set(Object.keys(this.advancementFlows));

		for ( let [level, data] of Object.entries(context.system.progression.levels).reverse() ) {
			level = Number(level);
			const levelData = {
				number: level,
				...data,
				class: data.class,
				flows: [],
				highestLevel: level === context.system.progression.level
			};
			const levels = { character: level, class: level };
			// TODO: Adjust this to provide proper class level once multi-classing is enabled

			for ( const advancement of this.actor.advancementForLevel(Number(level)) ) {
				const id = `${advancement.item.id}.${advancement.id}#${level}`;
				const flow = this.advancementFlows[id]
					??= new advancement.constructor.metadata.apps.flow(this.actor, advancement, levels);
				flowIds.delete(id);
				levelData.flows.push(flow);
			}

			context.progressionLevels.push(levelData);
		}

		// Remove any flows that no longer have associated advancements
		flowIds.forEach(id => delete this.advancementFlows[id]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _render(force, options) {
		await super._render(force, options);
		if ( this._state !== Application.RENDER_STATES.RENDERED ) return;

		// Render advancement steps
		for ( const flow of Object.values(this.advancementFlows) ) {
			flow._element = null;
			await flow._render(true, options);
		}
		this.setPosition();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a click on an action link.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	async _onAction(event) {
		const { action, subAction, ...properties } = event.currentTarget.dataset;
		switch (action) {
			case "progression":
				switch (subAction) {
					case "assign-abilities":
						return (new AbilityAssignmentDialog(this.actor)).render(true);
					case "level-down":
						return Dialog.confirm({
							title: `${game.i18n.localize("BF.Progression.Action.LevelDown.Label")}: ${this.actor.name}`,
							content: `<h4>${game.i18n.localize("AreYouSure")}</h4><p>${
								game.i18n.localize("BF.Progression.Action.LevelDown.Message")
							}</p>`,
							yes: () => this.actor.system.levelDown()
						});
					case "level-up":
						const cls = this.actor.system.progression.levels[1]?.class;
						// TODO: Will need to present a dialog confirming whether to level up existing class or multiclass
						if ( cls ) {
							try {
								return await this.actor.system.levelUp(cls);
							} catch(err) {
								return ui.notifications.warn(err.message);
							}
						}
						properties.type = "class";
					case "select":
						if ( !properties.type ) return;
						return (new ConceptSelectionDialog(this.actor, properties.type)).render(true);
				}
		}
		return super._onAction(event);
	}
}
