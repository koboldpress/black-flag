import { Trait } from "../../utils/_module.mjs";
import AbilityAssignmentDialog from "./ability-assignment-dialog.mjs";
import BaseActorSheet from "./api/base-actor-sheet.mjs";
import ConceptSelectionDialog from "./concept-selection-dialog.mjs";
import LevelUpDialog from "./level-up-dialog.mjs";

/**
 * Sheet for PC actors.
 */
export default class PCSheet extends BaseActorSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			addLuck: PCSheet.#addLuck,
			assignAbilities: PCSheet.#assignAbilities,
			levelDown: PCSheet.#levelDown,
			levelUp: PCSheet.#levelUp,
			removeLuck: PCSheet.#removeLuck,
			resetAbilities: PCSheet.#resetAbilities,
			selectConcept: PCSheet.#selectConcept,
			toggleProgression: PCSheet.#toggleProgression
		},
		classes: ["pc"],
		position: {
			width: 820,
			height: 880
		},
		tag: "div"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static enrichedFields = {
		backstory: "system.biography.backstory",
		motivation: "system.biography.motivation",
		allies: "system.biography.allies"
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		header: {
			template: "systems/black-flag/templates/actor/pc-header.hbs"
		},
		tabs: {
			classes: ["tabs-separate"],
			template: "systems/black-flag/templates/actor/tabs.hbs"
		},
		main: {
			container: { classes: ["sheet-body"], id: "main", tag: "form" },
			template: "systems/black-flag/templates/actor/tabs/pc-main.hbs"
		},
		spellcasting: {
			container: { classes: ["sheet-body"], id: "main", tag: "form" },
			template: "systems/black-flag/templates/actor/tabs/pc-spellcasting.hbs"
		},
		inventory: {
			container: { classes: ["sheet-body"], id: "main", tag: "form" },
			template: "systems/black-flag/templates/actor/tabs/pc-inventory.hbs"
		},
		features: {
			container: { classes: ["sheet-body"], id: "main", tag: "form" },
			template: "systems/black-flag/templates/actor/tabs/pc-features.hbs"
		},
		biography: {
			container: { classes: ["sheet-body"], id: "main", tag: "form" },
			template: "systems/black-flag/templates/actor/tabs/pc-biography.hbs"
		},
		effects: {
			container: { classes: ["sheet-body"], id: "main", tag: "form" },
			template: "systems/black-flag/templates/actor/tabs/active-effects.hbs"
		},
		progression: {
			template: "systems/black-flag/templates/actor/pc-progression.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static TABS = [
		{ tab: "main", label: "BF.Sheet.Tab.Main" },
		{ tab: "spellcasting", label: "BF.Sheet.Tab.Spellcasting" },
		{ tab: "inventory", label: "BF.Sheet.Tab.Inventory" },
		{ tab: "features", label: "BF.Sheet.Tab.Features" },
		{ tab: "biography", label: "BF.Sheet.Tab.Biography" },
		{ tab: "effects", label: "BF.Sheet.Tab.Effects" }
	];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	tabGroups = {
		primary: "main"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Advancement flows currently displayed on the sheet.
	 * @type {[key: string]: AdvancementFlow}
	 */
	advancementFlows = {};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get form() {
		return this.element.querySelector("form") ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * ID of the main form on this sheet.
	 * @type {string}
	 */
	get formID() {
		return `${this.id}-main-form`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Display the progression view.
	 * @type {boolean}
	 */
	progressionView = false;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(context, options) {
		context = await super._prepareContext(context, options);
		context.formID = this.formID;
		context.progressionView = this.progressionView;
		context.portrait = this._preparePortrait(context);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "biography":
				return this._prepareBiographyContext(context, options);
			case "effects":
				return this._prepareEffectsContext(context, options);
			case "header":
				return this._prepareHeaderContext(context, options);
			case "main":
				return this._prepareMainContext(context, options);
			case "progression":
				return this._prepareProgressionContext(context, options);
			case "tabs":
				return this._prepareTabsContext(context, options);
			default:
				return context;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the biography tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareBiographyContext(context, options) {
		context.enriched = await this._prepareDescriptions(context);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the main tab.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareMainContext(context, options) {
		context.luckPoints = Array.fromRange(CONFIG.BlackFlag.luck.max, 1).map(l => ({
			selected: context.system.attributes.luck.value >= l
		}));

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare rendering context for the progression mode.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {ApplicationRenderContext}
	 * @protected
	 */
	async _prepareProgressionContext(context, options) {
		if (!this.progressionView) return context;

		context.canResetAbilityAssignment =
			context.editable && (game.settings.get("black-flag", "abilitySelectionManual") || game.user.isGM);
		context.displayLevelUp =
			this.actor.system.progression.level < CONFIG.BlackFlag.maxLevel ||
			(game.settings.get(game.system.id, "rulesConfiguration").epicAdvancement &&
				this.actor.system.progression.level < CONFIG.BlackFlag.maxLevelEpic);
		context.displayXPBar = game.settings.get(game.system.id, "levelingMode") === "xp";

		context.progressionLevels = [];
		const flowIds = new Set(Object.keys(this.advancementFlows));

		const levels = [{ levels: { character: 0, class: 0 } }, ...Object.values(context.system.progression.levels)];
		for (let data of levels.reverse()) {
			const level = data.levels.character;
			const levelData = {
				number: level,
				...data,
				class: data.class,
				className: level > CONFIG.BlackFlag.maxLevel ? _loc("BF.Progression.Epic.Label") : data.class?.name,
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

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*      Actor Preparation Helpers      */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _prepareSpecialActions(actions) {
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
	async _prepareTraits(context) {
		context.traits = [];
		const { traits, proficiencies } = context.system;
		const none = _loc("COMMON.None");

		// Size
		const size = CONFIG.BlackFlag.sizes[traits.size];
		if (size || context.editable)
			context.traits.push({
				key: "size",
				classes: "single",
				label: "BF.Size.Label",
				value: size ? _loc(size.label) : none,
				config: "type"
			});

		// Creature Type
		const type = CONFIG.BlackFlag.creatureTypes[traits.type.value];
		if (type || context.editable)
			context.traits.push({
				key: "type",
				classes: "single",
				label: "BF.CreatureType.Type.Label",
				value: traits.type.label,
				config: "type"
			});

		// Movement
		const movement = game.i18n.getListFormatter({ style: "narrow" }).format(traits.movement.labels);
		if (movement || context.editable)
			context.traits.push({
				key: "movement",
				classes: traits.movement.labels.length > 1 ? null : "single",
				label: "BF.Speed.Label",
				value: movement,
				config: "movement"
			});

		// Senses
		const senses = this.actor.system.traits.senses.label;
		if (senses || context.editable)
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
			label: "BF.ARMOR.Label[other]",
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
			if (!value && !context.editable) return;
			context.traits.push({
				key,
				label,
				value: value || _loc("COMMON.None"),
				config: "resistance"
			});
		};
		prepareResistance("resistances", _loc("BF.Resistance.Label"));
		prepareResistance("immunities", _loc("BF.Immunity.Label"));
		prepareResistance("vulnerabilities", _loc("BF.Vulnerability.Label"));
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*       Item Preparation Helpers      */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareItem(item, context, section) {
		await super._prepareItem(item, context, section);

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
	/*         Life-Cycle Handlers         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);
		const form = this.form;
		if (form) {
			form.id = this.formID;
			form.autocomplete = "off";
			form.addEventListener("submit", this._onSubmitForm.bind(this, this.options.form));
			form.addEventListener("change", this._onChangeForm.bind(this, this.options.form));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onRender(context, options) {
		await super._onRender(context, options);
		this.element.toggleAttribute("data-progression", this.progressionView);

		if (this.progressionView) {
			// Render advancement steps
			for (const flow of Object.values(this.advancementFlows)) {
				// TODO: Some sort of race condition here when advancement is being applied
				if (flow instanceof Application) {
					flow._element = null;
					await flow._render(true);
				} else {
					await flow.render({ force: true });
					const doc = this.element.ownerDocument;
					const existing = doc.getElementById(flow.element.id);
					if (existing) existing.replaceWith(flow.element);
					else flow._insertElement(flow.element);
				}
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle adding luck.
	 * @this {PCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #addLuck(event, target) {
		this.actor.system.addLuck();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle opening the ability assignment dialog.
	 * @this {PCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #assignAbilities(event, target) {
		this._renderChild(new AbilityAssignmentDialog({ document: this.actor }));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle decreasing the character's level.
	 * @this {PCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #levelDown(event, target) {
		this._confirmDialog({
			content: `<p><strong>${_loc("COMMON.AreYouSure")}</strong> ${_loc(
				"BF.Progression.Action.LevelDown.Message"
			)}</p>`,
			yes: { callback: () => this.actor.system.levelDown() },
			position: {
				width: 400
			},
			window: {
				title: `${_loc("BF.Progression.Action.LevelDown.Label")}: ${this.actor.name}`
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle increasing the character's level.
	 * @this {PCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static async #levelUp(event, target) {
		const allowMulticlassing = game.settings.get(game.system.id, "allowMulticlassing");
		const isEpicLevel = this.actor.system.progression.level >= CONFIG.BlackFlag.maxLevel;
		const cls = this.actor.system.progression.levels[1]?.class;
		if (cls && allowMulticlassing && !isEpicLevel) {
			this._renderChild(new LevelUpDialog({ document: this.actor }));
		} else if (cls || isEpicLevel) {
			try {
				await this.actor.system.levelUp(cls);
			} catch (err) {
				ui.notifications.warn(err.message);
			}
		} else {
			this._renderChild(new ConceptSelectionDialog({ document: this.actor, details: { type: "class" } }));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing luck.
	 * @this {PCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #removeLuck(event, target) {
		this.actor.update({ "system.attributes.luck.value": this.actor.system.attributes.luck.value - 1 });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle resetting previously assigned abilities.
	 * @this {PCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #resetAbilities(event, target) {
		this.actor.system.resetAbilities();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle selecting a concept item for progression.
	 * @this {PCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #selectConcept(event, target) {
		const classIdentifier = target.closest("[data-class]")?.dataset.class;
		this._renderChild(
			new ConceptSelectionDialog({
				document: this.actor,
				details: { classIdentifier, type: target.dataset.type }
			})
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle toggling the progression view.
	 * @this {PCSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #toggleProgression(event, target) {
		this.progressionView = !this.progressionView;
		this.render();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);

		// Intercept updates to available hit dice
		const hdUpdates = foundry.utils.getProperty(submitData, "system.attributes.hd.d");
		if (hdUpdates) {
			const hd = this.actor.system.attributes.hd;
			for (const [denomination, update] of Object.entries(hdUpdates)) {
				const d = hd.d[denomination];
				submitData.system.attributes.hd.d[denomination].spent = Math.clamp(d.max - update.available, 0, d.max);
			}
		}

		// Intercept updates to available spell slots
		const slotUpdates = foundry.utils.getProperty(submitData, "system.spellcasting.slots");
		if (slotUpdates) {
			const slots = this.actor.system.spellcasting.slots;
			for (const [slot, update] of Object.entries(slotUpdates)) {
				if ("value" in update) {
					const value = slots[slot];
					foundry.utils.setProperty(submitData, `system.spellcasting.slots.${slot}.spent`, value.max - update.value);
				}
			}
		}

		return submitData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Drag & Drop             */
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
