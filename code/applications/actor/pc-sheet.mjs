import { numberFormat, Trait } from "../../utils/_module.mjs";
import AbilityAssignmentDialog from "./ability-assignment-dialog.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import ConceptSelectionDialog from "./concept-selection-dialog.mjs";
import LevelUpDialog from "./level-up-dialog.mjs";

export default class PCSheet extends BaseActorSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "pc"],
			width: 820,
			height: 880,
			tabs: [
				{group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: ".sheet-body", initial: "main"}
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

	modes = {
		conditionAdd: false,
		editing: false,
		progression: false
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);

		if ( this.modes.progression ) this.prepareProgression(context);

		context.displayXPBar = game.settings.get(game.system.id, "levelingMode") === "xp";
		context.luckPoints = Array.fromRange(CONFIG.BlackFlag.luck.max, 1).map(l => ({
			selected: context.system.attributes.luck.value >= l
		}));

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async prepareSpecialActions(actions) {
		actions.other.activities.push({
			name: "BF.Rest.Type.Short.Label",
			activationText: "BF.Rest.Action.Rest.Label",
			dataset: { action: "rest", type: "short" }
		});
		actions.other.activities.push({
			name: "BF.Rest.Type.Long.Label",
			activationText: "BF.Rest.Action.Rest.Label",
			dataset: { action: "rest", type: "long" }
		});
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
				const flow = this.advancementFlows[id] ??= advancement.flow(this.actor, data.levels);
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

		// Size
		const size = CONFIG.BlackFlag.sizes[traits.size];
		if ( size || this.modes.editing ) context.traits.push({
			key: "size",
			classes: "single",
			label: "BF.Size.Label",
			value: size ? game.i18n.localize(size.label) : none,
			config: "type"
		});

		// Creature Type
		const type = CONFIG.BlackFlag.creatureTypes[traits.type.value];
		if ( type || this.modes.editing ) context.traits.push({
			key: "type",
			classes: "single",
			label: "BF.CreatureType.Type.Label",
			value: traits.type.label,
			config: "type"
		});

		// Movement
		const movement = game.i18n.getListFormatter({ style: "narrow" }).format(traits.movement.labels);
		if ( movement || this.modes.editing ) context.traits.push({
			key: "movement",
			classes: traits.movement.labels.length > 1 ? null : "single",
			label: "BF.Speed.Label",
			value: movement,
			config: "movement"
		});

		// Senses
		const senses = game.i18n.getListFormatter({ style: "narrow" }).format(
			Object.entries(this.actor.system.traits.senses.types).map(([key, value]) =>
				value ? `${game.i18n.localize(CONFIG.BlackFlag.senses[key]?.label ?? "")} ${
					numberFormat(value, { unit: "foot" })}` : null
			).filter(a => a)
		);
		if ( senses || this.modes.editing ) context.traits.push({
			key: "senses",
			label: "BF.Senses.Label",
			value: senses || none,
			config: "senses"
		});

		// Languages
		context.traits.push({
			key: "languages",
			label: "BF.Language.Label[other]",
			value: proficiencies.languages.label || none,
			config: "language"
		});

		// Armor
		context.traits.push({
			key: "armor",
			label: "BF.Armor.Label[other]",
			value: Trait.localizedList(proficiencies.armor.value, [], { style: "short", trait: "armor" }) || none,
			config: "proficiency"
		});

		// Weapons
		context.traits.push({
			key: "weapons",
			label: "BF.Weapon.Label[other]",
			value: Trait.localizedList(proficiencies.weapons.value, [], { style: "short", trait: "weapons" }) || none,
			config: "proficiency"
		});

		// Resistances
		const resistances = traits.damage.resistances.value.map(t =>
			game.i18n.localize(CONFIG.BlackFlag.damageTypes[t].label)
		).filter(t => t);
		if ( resistances.size || this.modes.editing ) context.traits.push({
			key: "resistances",
			label: "resistances",
			value: game.i18n.getListFormatter({ style: "short" }).format(resistances) || none,
			config: "resistance"
		});

		// Immunities
		const immunities = [
			...traits.damage.immunities.value.map(t =>
				game.i18n.localize(CONFIG.BlackFlag.damageTypes[t].label)
			),
			...traits.condition.immunities.value.map(t =>
				CONFIG.BlackFlag.registration.get("condition", t)?.name
			)
		].filter(t => t);
		if ( immunities?.length || this.modes.editing ) context.traits.push({
			key: "immunities",
			label: "immunities",
			value: game.i18n.getListFormatter({ style: "short" }).format(immunities) || none,
			config: "resistance"
		});

		// Vulnerabilities
		const vulnerabilities = traits.damage.vulnerabilities.value.map(t =>
			game.i18n.localize(CONFIG.BlackFlag.damageTypes[t].label)
		).filter(t => t);
		if ( vulnerabilities.size || this.modes.editing ) context.traits.push({
			key: "vulnerabilities",
			label: "vulnerabilities",
			value: game.i18n.getListFormatter({ style: "short" }).format(vulnerabilities) || none,
			config: "resistance"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _render(force, options) {
		await super._render(force, options);
		if ( (this._state !== Application.RENDER_STATES.RENDERED) || !this.modes.progression ) return;

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

	async _onAction(event, dataset) {
		const { action, subAction, ...properties } = dataset ?? event.currentTarget.dataset;
		switch ( action ) {
			case "luck":
				switch ( subAction ) {
					case "add":
						return this.actor.system.addLuck();
				}
				break;
			case "progression":
				switch ( subAction ) {
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
						const allowMulticlassing = game.settings.get(game.system.id, "allowMulticlassing");
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
		return super._onAction(event, dataset);
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

	/**
	 * Handle a dropped item in place of normal handler in InventoryElement.
	 * @param {Event} event - Triggering drop event.
	 * @param {BlackFlagItem[]} items - Dropped items.
	 * @returns {BlackFlagItem[]|void} - Return any items that should continue through to InventoryElement for handling.
	 */
	async _handleDroppedItems(event, items) {
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
			return others;
		}
	}
}
