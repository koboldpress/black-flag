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
				{group: "progression", navSelector: ".progression", contentSelector: ".sheet-container", initial: "front"},
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

	async prepareLists(context) {
		const listFormatter = new Intl.ListFormat(game.i18n.lang, {type: "unit", style: "short"});
		context.lists ??= {};

		context.lists.languages = listFormatter.format(
			context.system.proficiencies.languages.value.reduce((arr, language) => {
				const label = CONFIG.BlackFlag.languages[language]?.label;
				arr.push(label ? game.i18n.localize(label) : language);
				return arr;
			}, [])
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare levels on the progression tab and assign them advancement flows.
	 * @param {object} context - Context being prepared.
	 */
	async prepareProgression(context) {
		context.progressionLevels = [];
		const flowIds = new Set(Object.keys(this.advancementFlows));

		const levels = [{ levels: { character: 0, class: 0 }}, ...Object.values(context.system.progression.levels)];
		for ( let data of levels.reverse() ) {
			const level = data.levels.character;
			const levelData = {
				number: level,
				...data,
				class: data.class,
				flows: [],
				highestLevel: (level !== 0) && (level === context.system.progression.level)
			};

			for ( const advancement of this.actor.advancementForLevel(level) ) {
				const id = `${advancement.item.id}.${advancement.id}#${level}`;
				const flow = this.advancementFlows[id]
					??= new advancement.constructor.metadata.apps.flow(this.actor, advancement, data.levels);
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
			// TODO: Some sort of race condition here when advancement is being applied
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

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDropItem(event, data) {
		if ( !this.actor.isOwner ) return false;
		const item = await Item.implementation.fromDropData(data);
		const itemData = item.toObject();

		// Handle item sorting within the same Actor
		if ( this.actor.uuid === item.parent?.uuid ) return this._onSortItem(event, itemData);

		// Create the owned item
		return this._onDropItemCreate(event, item);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDropFolder(event, data) {
		if ( !this.actor.isOwner ) return [];
		const folder = await Folder.implementation.fromDropData(data);
		if ( folder.type !== "Item" ) return [];
		const droppedItems = await Promise.all(folder.contents.map(async item => {
			if ( !(document instanceof Item) ) item = await fromUuid(item.uuid);
			return item;
		}));
		return this._onDropItemCreate(event, droppedItems);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _onDropItemCreate(event, items) {
		if ( !(items instanceof Array) ) items = [items];

		const { classes, concepts, others } = items.reduce((types, item) => {
			if ( item.type === "class" ) types.classes.push(item);
			else if ( ["background", "heritage", "lineage"].includes(item.type) ) types.concepts.push(item);
			else types.others.push(item);
			return types;
		}, { classes: [], concepts: [], others: [] });

		// For classes, call level up method
		for ( const cls of classes ) {
			try {
				await this.actor.system.levelUp(cls);
			} catch(err) {
				ui.notifications.warn(err.message);
			}
		}

		// For concepts, use the set concept method
		for ( const concept of concepts ) {
			try {
				await this.actor.system.setConcept(concept);
			} catch(err) {
				ui.notifications.warn(err.message);
			}
		}

		// For normal items, create normally
		if ( others.length ) {
			await this.actor.createEmbeddedDocuments("Item", others);
		}
	}
}
