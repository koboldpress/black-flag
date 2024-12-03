import { Trait } from "../../utils/_module.mjs";
import AbilityAssignmentDialog from "./ability-assignment-dialog.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import ConceptSelectionDialog from "./concept-selection-dialog.mjs";
import LevelUpDialog from "./level-up-dialog.mjs";

export default class PCSheet extends BaseActorSheet {
	/** @inheritDoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "actor", "sheet", "pc"],
			width: 820,
			height: 880,
			tabs: [
				{ group: "primary", navSelector: 'nav[data-group="primary"]', contentSelector: ".sheet-body", initial: "main" }
			],
			scrollY: [".window-content"]
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static enrichedFields = {
		backstory: "system.biography.backstory",
		motivation: "system.biography.motivation",
		allies: "system.biography.allies"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Advancement flows currently displayed on the sheet.
	 * @type {[key: string]: AdvancementFlow}
	 */
	advancementFlows = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	modes = {
		editing: false,
		progression: false
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async getData(options) {
		const context = await super.getData(options);

		if (this.modes.progression) this.prepareProgression(context);

		context.canResetAbilityAssignment =
			context.editable && (game.settings.get("black-flag", "abilitySelectionManual") || game.user.isGM);
		context.displayXPBar = game.settings.get(game.system.id, "levelingMode") === "xp";
		context.luckPoints = Array.fromRange(CONFIG.BlackFlag.luck.max, 1).map(l => ({
			selected: context.system.attributes.luck.value >= l
		}));

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async prepareSpecialActions(actions) {
		actions.other.activities.push({
			name: "BF.Rest.Type.Short.Label",
			label: "BF.Rest.Action.Rest.Label",
			dataset: { action: "rest", type: "short" }
		});
		actions.other.activities.push({
			name: "BF.Rest.Type.Long.Label",
			label: "BF.Rest.Action.Rest.Label",
			dataset: { action: "rest", type: "long" }
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareItem(item, context, section) {
		await super.prepareItem(item, context, section);

		if (item.type === "spell") {
			const { alwaysPrepared, mode } = item.getFlag("black-flag", "relationship") ?? {};
			const ritual = item.system.tags.has("ritual");
			const always = (alwaysPrepared && item.system.alwaysPreparable) || ritual;
			const pressed = always || item.system.prepared;
			if (always || item.system.preparable)
				context.buttons.push({
					action: "prepare",
					classes: "status fade",
					disabled: !item.isOwner || always,
					label: "BF.Spell.Preparation.Prepared",
					pressed,
					title: `BF.Spell.Preparation.${always ? "Always" : !item.system.prepared ? "Not" : ""}Prepared`,
					icon: `<i class="fa-${pressed ? "solid" : "regular"} fa-${
						ritual ? "atom" : always ? "bahai" : "sun"
					}" inert></i>`
				});
			context.dataset.spellType = mode;
			if (item.system.prepared && !ritual) context.dataset.spellPrepared = "";
			if (alwaysPrepared) context.dataset.spellAlwaysPrepared = "";
			if (item.system.tags.size) context.dataset.properties = Array.from(item.system.tags).join(" ");
		}

		if (item.system.attunable)
			context.buttons.push({
				action: "attune",
				classes: "status fade",
				disabled: !item.isOwner,
				label: "BF.Attunement.Attuned",
				pressed: item.system.attuned,
				title: `BF.Attunement.${item.system.attuned ? "Attuned" : "NotAttuned"}`,
				icon: '<i class="fa-solid fa-sun" inert></i>'
			});

		if (item.system.equippable)
			context.buttons.push({
				action: "equip",
				classes: "status fade",
				disabled: !item.isOwner,
				label: "BF.Item.Equipped",
				pressed: item.system.equipped,
				title: `BF.Item.${item.system.equipped ? "Equipped" : "Unequipped"}`,
				icon: '<i class="fa-solid fa-shield-halved" inert></i>'
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

		const levels = [{ levels: { character: 0, class: 0 } }, ...Object.values(context.system.progression.levels)];
		for (let data of levels.reverse()) {
			const level = data.levels.character;
			const levelData = {
				number: level,
				...data,
				class: data.class,
				flows: [],
				highestLevel: level !== 0 && level === context.system.progression.level
			};

			for (const advancement of this.actor.advancementForLevel(level)) {
				const id = `${advancement.item.id}.${advancement.id}#${level}`;
				const flow = (this.advancementFlows[id] ??= advancement.flow(this.actor, data.levels));
				flowIds.delete(id);
				levelData.flows.push(flow);
			}

			context.progressionLevels.push(levelData);
		}

		// Remove any flows that no longer have associated advancements
		flowIds.forEach(id => delete this.advancementFlows[id]);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async prepareTraits(context) {
		context.traits = [];
		const { traits, proficiencies } = context.system;
		const none = game.i18n.localize("None");

		// Size
		const size = CONFIG.BlackFlag.sizes[traits.size];
		if (size || this.modes.editing)
			context.traits.push({
				key: "size",
				classes: "single",
				label: "BF.Size.Label",
				value: size ? game.i18n.localize(size.label) : none,
				config: "type"
			});

		// Creature Type
		const type = CONFIG.BlackFlag.creatureTypes[traits.type.value];
		if (type || this.modes.editing)
			context.traits.push({
				key: "type",
				classes: "single",
				label: "BF.CreatureType.Type.Label",
				value: traits.type.label,
				config: "type"
			});

		// Movement
		const movement = game.i18n.getListFormatter({ style: "narrow" }).format(traits.movement.labels);
		if (movement || this.modes.editing)
			context.traits.push({
				key: "movement",
				classes: traits.movement.labels.length > 1 ? null : "single",
				label: "BF.Speed.Label",
				value: movement,
				config: "movement"
			});

		// Senses
		const senses = this.actor.system.traits.senses.label;
		if (senses || this.modes.editing)
			context.traits.push({
				key: "senses",
				label: "BF.SENSES.Label[other]",
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
			label: "BF.WEAPON.Label[other]",
			value: Trait.localizedList(proficiencies.weapons.value, [], { style: "short", trait: "weapons" }) || none,
			config: "proficiency"
		});

		const prepareResistance = (key, label) => {
			const traits = context.system.traits;
			const value = [traits.damage[key].label, traits.condition[key].label].filter(t => t).join(" | ");
			if (!value && !this.modes.editing) return;
			context.traits.push({
				key,
				label,
				value: value || game.i18n.localize("None"),
				config: "resistance"
			});
		};
		prepareResistance("resistances", game.i18n.localize("BF.Resistance.Label"));
		prepareResistance("immunities", game.i18n.localize("BF.Immunity.Label"));
		prepareResistance("vulnerabilities", game.i18n.localize("BF.Vulnerability.Label"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _render(force, options) {
		await super._render(force, options);
		if (this._state !== Application.RENDER_STATES.RENDERED || !this.modes.progression) return;

		// Render advancement steps
		for (const flow of Object.values(this.advancementFlows)) {
			flow._element = null;
			// TODO: Some sort of race condition here when advancement is being applied
			await flow._render(true, options);
		}

		this.setPosition();
		if (this.options.scrollY) this._restoreScrollPositions(this.element);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onAction(event, dataset) {
		const { action, subAction, ...properties } = dataset ?? event.currentTarget.dataset;
		switch (action) {
			case "luck":
				switch (subAction) {
					case "add":
						return this.actor.system.addLuck();
					case "remove":
						return this.actor.update({ "system.attributes.luck.value": this.actor.system.attributes.luck.value - 1 });
				}
				break;
			case "progression":
				switch (subAction) {
					case "assign-abilities":
						return new AbilityAssignmentDialog(this.actor).render(true);
					case "reset-abilities":
						await this.actor.system.resetAbilities();
						return new AbilityAssignmentDialog(this.actor).render(true);
					case "level-down":
						return Dialog.confirm({
							title: `${game.i18n.localize("BF.Progression.Action.LevelDown.Label")}: ${this.actor.name}`,
							content: `<h4>${game.i18n.localize("AreYouSure")}</h4><p>${game.i18n.localize(
								"BF.Progression.Action.LevelDown.Message"
							)}</p>`,
							yes: () => this.actor.system.levelDown()
						});
					case "level-up":
						const allowMulticlassing = game.settings.get(game.system.id, "allowMulticlassing");
						const cls = this.actor.system.progression.levels[1]?.class;
						if (cls) {
							if (allowMulticlassing) {
								return new LevelUpDialog(this.actor).render(true);
							} else {
								try {
									return await this.actor.system.levelUp(cls);
								} catch (err) {
									return ui.notifications.warn(err.message);
								}
							}
						}
						properties.type = "class";
					case "select":
						if (!properties.type) return;
						const classIdentifier = event.target.closest("[data-class]")?.dataset.class;
						return new ConceptSelectionDialog(this.actor, properties.type, { classIdentifier }).render(true);
				}
				break;
		}
		return super._onAction(event, dataset);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);

		// Intercept updates to available hit dice
		const hdUpdates = foundry.utils.getProperty(updates, "system.attributes.hd.d");
		if (hdUpdates) {
			const hd = this.actor.system.attributes.hd;
			for (const [denomination, update] of Object.entries(hdUpdates)) {
				const d = hd.d[denomination];
				updates.system.attributes.hd.d[denomination].spent = Math.clamp(d.max - update.available, 0, d.max);
			}
		}

		// Intercept updates to available spell slots
		const slotUpdates = foundry.utils.getProperty(updates, "system.spellcasting.slots");
		if (slotUpdates) {
			const slots = this.actor.system.spellcasting.slots;
			for (const [slot, update] of Object.entries(slotUpdates)) {
				if ("value" in update) {
					const value = slots[slot];
					foundry.utils.setProperty(updates, `system.spellcasting.slots.${slot}.spent`, value.max - update.value);
				}
			}
		}

		return super._updateObject(event, foundry.utils.flattenObject(updates));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _onDropItem(event, data) {
		if (!this.actor.isOwner) return false;
		const item = await Item.implementation.fromDropData(data);
		const itemData = item.toObject();

		// Handle item sorting within the same Actor
		if (this.actor.uuid === item.parent?.uuid) return this._onSortItem(event, itemData);

		// Create the owned item
		return this._onDropItemCreate(event, item);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _onDropFolder(event, data) {
		if (!this.actor.isOwner) return [];
		const folder = await Folder.implementation.fromDropData(data);
		if (folder.type !== "Item") return [];
		const droppedItems = await Promise.all(
			folder.contents.map(async item => {
				if (!(document instanceof Item)) item = await fromUuid(item.uuid);
				return item;
			})
		);
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
		if (!(items instanceof Array)) items = [items];

		const { classes, concepts, others } = items.reduce(
			(types, item) => {
				if (item.type === "class") types.classes.push(item);
				else if (["background", "heritage", "lineage"].includes(item.type)) types.concepts.push(item);
				else types.others.push(item);
				return types;
			},
			{ classes: [], concepts: [], others: [] }
		);

		// For classes, call level up method
		for (const cls of classes) {
			try {
				await this.actor.system.levelUp(cls);
			} catch (err) {
				ui.notifications.warn(err.message);
			}
		}

		// For concepts, use the set concept method
		for (const concept of concepts) {
			try {
				await this.actor.system.setConcept(concept);
			} catch (err) {
				ui.notifications.warn(err.message);
			}
		}

		// For normal items, create normally
		if (others.length) {
			return others;
		}
	}
}
