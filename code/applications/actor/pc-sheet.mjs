import { Trait } from "../../utils/_module.mjs";
import AbilityAssignmentDialog from "./ability-assignment-dialog.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import ConceptSelectionDialog from "./concept-selection-dialog.mjs";
import LevelUpDialog from "./level-up-dialog.mjs";

export default class PCSheet extends BaseActorSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "pc"],
			dragDrop: [{dragSelector: "[data-item-id]"}],
			width: 820,
			height: 740,
			tabs: [
				{group: "progression", navSelector: ".progression", contentSelector: ".sheet-container", initial: "front"},
				{group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: "main", initial: "main"}
			],
			scrollY: [".window-content"]
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

		context.luckPoints = Array.fromRange(CONFIG.BlackFlag.luck.max, 1).map(l => ({
			selected: context.system.attributes.luck.value >= l
		}));

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

	async prepareTraits(context) {
		context.traits = [];
		const { traits, proficiencies } = context.system;
		const none = game.i18n.localize("None");

		// Senses

		// Size
		const size = CONFIG.BlackFlag.sizes[traits.size];
		if ( size || this.editingMode ) {
			context.traits.push({
				key: "size",
				classes: "single",
				label: "BF.Size.Label",
				value: size ? game.i18n.localize(size.label) : none
			});
		}

		// Creature Type
		// const type = CONFIG.BlackFlag.creatureTypes[traits.type.value];
		// if ( type || this.editingMode ) {
		// 	const tagFormatter = game.i18n.getListFormatter({ type: "unit" });
		// 	context.traits.push({
		// 		key: "type",
		// 		classes: "single",
		// 		label: "BF.CreatureType.Label",
		// 		value: type ? `${game.i18n.localize(type.label)}${traits.type.tags.size ? ` (${
		// 			tagFormatter.format(traits.type.tags)
		// 		})` : ""}` : none
		// 	});
		// }

		// Languages
		// TODO: Add language tags
		context.traits.push({
			key: "languages",
			label: "BF.Language.Label[other]",
			value: Trait.localizedList(proficiencies.languages.value, [], { style: "short", trait: "languages" }) || none
		});

		// Armor
		context.traits.push({
			key: "armor",
			label: "BF.Armor.Label[other]",
			value: Trait.localizedList(proficiencies.armor.value, [], { style: "short", trait: "armor" }) || none
		});

		// Weapons
		context.traits.push({
			key: "weapons",
			label: "BF.Weapon.Label[other]",
			value: Trait.localizedList(proficiencies.weapons.value, [], { style: "short", trait: "weapons" }) || none
		});

		// TODO: Resistances, Immunities, & Vulnerabilities
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
		if ( this.options.scrollY ) this._restoreScrollPositions(this.element);
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
			case "luck":
				switch (subAction) {
					case "add":
						return this.actor.system.addLuck();
				}
				break;
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
						const allowMulticlassing = true;
						// TODO: Check actual multi-classing settings
						const cls = this.actor.system.progression.levels[1]?.class;
						if ( cls ) {
							if ( allowMulticlassing ) {
								return (new LevelUpDialog(this.actor)).render(true);
							} else {
								try {
									return await this.actor.system.levelUp(cls);
								} catch(err) {
									return ui.notifications.warn(err.message);
								}
							}
						}
						properties.type = "class";
					case "select":
						if ( !properties.type ) return;
						const classIdentifier = event.target.closest("[data-class]")?.dataset.class;
						return (new ConceptSelectionDialog(this.actor, properties.type, { classIdentifier })).render(true);
				}
				break;
		}
		return super._onAction(event);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);

		// Intercept updates to available hit dice
		const hdUpdates = foundry.utils.getProperty(updates, "system.attributes.hd.d");
		if ( hdUpdates ) {
			const hd = this.actor.system.attributes.hd;
			for ( const [denomination, update] of Object.entries(hdUpdates) ) {
				const d = hd.d[denomination];
				updates.system.attributes.hd.d[denomination].spent = Math.clamped(d.max - update.available, 0, d.max);
			}
		}

		return super._updateObject(event, foundry.utils.flattenObject(updates));
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
