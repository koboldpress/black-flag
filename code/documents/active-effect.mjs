import FormulaField from "../data/fields/formula-field.mjs";
import MappingField from "../data/fields/mapping-field.mjs";
import { formatNumber, parseOrString, staticID } from "../utils/_module.mjs";
import DependentDocumentMixin from "./mixins/dependent-document.mjs";

const { ObjectField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 */
export default class BlackFlagActiveEffect extends DependentDocumentMixin(ActiveEffect) {
	/**
	 * Status effect for the various conditions.
	 * @type {Record<string, string>}
	 */
	static ID = {
		ENCUMBERED: staticID("bfencumbered"),
		EXHAUSTION: staticID("bfexhaustion")
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Additional key paths to properties added during base data preparation that should be treated as formula fields.
	 * @type {Set<string>}
	 */
	static FORMULA_FIELDS = new Set([
		"system.attributes.encumbrance.bonuses.encumbered",
		"system.attributes.encumbrance.bonuses.heavilyEncumbered",
		"system.attributes.encumbrance.bonuses.maximum",
		"system.attributes.encumbrance.bonuses.overall",
		"system.attributes.encumbrance.multipliers.encumbered",
		"system.attributes.encumbrance.multipliers.heavilyEncumbered",
		"system.attributes.encumbrance.multipliers.maximum",
		"system.attributes.encumbrance.multipliers.overall",
		"system.traits.movement.multiplier"
	]);

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static async _fromStatusEffect(statusId, { reference, ...effectData }, options) {
		if (!("description" in effectData) && reference) effectData.description = `@Embed[${reference} inline]`;
		return super._fromStatusEffect(statusId, effectData, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Document type to which this active effect should apply its changes.
	 * @type {string}
	 */
	get applicableType() {
		return this.system.applicableType ?? "Actor";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Another effect that granted this effect as a rider.
	 * @type {BlackFlagActiveEffect|null}
	 */
	get dependentOrigin() {
		if (!this.item) return null;
		return (
			this.item.effects.get(this.flags[game.system.id]?.dependentOn ?? this.flags[game.system.id]?.riderOrigin) ?? null
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Is this effect an enchantment on an item that accepts enchantment?
	 * @type {boolean}
	 */
	get isAppliedEnchantment() {
		return this.type === "enchantment" && this.system.applied;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get isSuppressed() {
		if (super.isSuppressed) return true;
		if (!this.item?.isEmbedded || this.type === "enchantment") return false;
		return this.suppressionReasons.length > 0;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Another effect that granted this effect as a rider.
	 * @type {BlackFlagActiveEffect|null}
	 */
	get riderOrigin() {
		foundry.utils.logCompatibilityWarning("Active Effect's rider origin can now be accessed using `dependentOrigin`.", {
			since: "Black Flag 3.0",
			until: "Black Flag 4.0"
		});
		return this.dependentOrigin;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * One or more reasons why this effect is suppressed.
	 * @type {string[]}
	 */
	get suppressionReasons() {
		const reasons = [];
		if (this.actor?.type !== "pc" || !this.item) return reasons;
		if (this.item.getFlag(game.system.id, "relationship.enabled") === false) {
			reasons.push("BF.EFFECT.SuppressionReason.Disabled");
		}
		if (this.item.system.equippable && !this.item.system.equipped) {
			reasons.push("BF.EFFECT.SuppressionReason.NotEquipped");
		}
		if (this.item.system.attunement?.value === "required" && !this.item.system.attuned) {
			reasons.push("BF.EFFECT.SuppressionReason.NotAttuned");
		}
		return reasons;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static migrateData(source) {
		if (source.type === "standard") source.type = "base";
		return super.migrateData(source);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareBaseData() {
		this.origin = this.getFlag("core", "originText") ?? this.origin;
		super.prepareBaseData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Effect Application          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static applyChange(model, change, options = {}) {
		// Handle special actor flags
		if (change.key.startsWith(`flags.${game.system.id}.`)) {
			const config = CONFIG.BlackFlag.actorFlags[change.key.replace(`flags.${game.system.id}.`, "")];
			// TODO: Make sure this actually works
			if (config?.actorTypes.has(model.type)) options.field = config.field;
			// if (config?.actorTypes.has(doc.type)) return this.constructor.applyField(doc, change, config.field);
		}

		// Properly handle formulas that don't exist as part of the data model
		if (this.FORMULA_FIELDS.has(change.key)) {
			const field = new FormulaField({ deterministic: true });
			return { [change.key]: this.applyChangeField(model, change, { field }) };
		}

		// Handle activity-targeted changes
		if (
			(change.key.startsWith("activities[") || change.key.startsWith("system.activities.")) &&
			model instanceof Item
		) {
			return change.effect.applyActivity(model, change);
		}

		return super.applyChange(model, change, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply a change to activities on this item.
	 * @param {BlackFlagItem} item - The Item to whom this change should be applied.
	 * @param {EffectChangeData} change - The change data being applied.
	 * @returns {Record<string, *>} - An object of property paths and their updated values.
	 */
	applyActivity(item, change) {
		const changes = {};
		const apply = (activity, key) => {
			const c = this.apply(activity, { ...change, key });
			Object.entries(c).forEach(([k, v]) => (changes[`system.activities.${activity.id}.${k}`] = v));
		};
		if (change.key.startsWith("system.activities.")) {
			const [, , id, ...keyPath] = change.key.split(".");
			const activity = item.system.activities?.get(id);
			if (activity) apply(activity, keyPath.join("."));
		} else {
			const { type, key } = change.key.match(/activities\[(?<type>[^\]]+)]\.(?<key>.+)/)?.groups ?? {};
			item.system.activities?.byType(type)?.forEach(activity => apply(activity, key));
		}
		return changes;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static applyChangeField(model, change, options = {}) {
		const current = foundry.utils.getProperty(model, change.key);
		const { field } = options;

		// Replace value when using string interpolation syntax
		if (field instanceof StringField && change.type === "override" && change.value?.includes?.("{}")) {
			change.value = change.value.replace("{}", current ?? "");
		}

		// If current value is `null`, UPGRADE & DOWNGRADE should always just set the value
		if (current === null && ["upgrade", "downgrade"].includes(change.type)) change.type = "override";

		// Handle removing entries from sets
		if (field instanceof SetField && change.type === "add" && foundry.utils.getType(current) === "Set") {
			for (const value of field._castChangeDelta(change.value)) {
				const neg = value.replace(/^\s*-\s*/, "");
				if (neg !== value) current.delete(neg);
				else current.add(value);
			}
			return current;
		}

		// If attempting to apply active effect to empty MappingField entry, create it
		if (current === undefined && change.key.startsWith("system.")) {
			const keyPathParts = change.key.split(".");
			let mappingField = field;
			while (!(mappingField instanceof MappingField) && mappingField) {
				if (mappingField.name && mappingField.name !== "element") keyPathParts.pop();
				mappingField = mappingField.parent;
			}
			const keyPath = keyPathParts.join(".");
			if (mappingField && foundry.utils.getProperty(model, keyPath) === undefined) {
				const created = mappingField.model.initialize(mappingField.model.getInitialValue(), mappingField);
				foundry.utils.setProperty(model, keyPath, created);
			}
		}

		// Parse any JSON provided when targeting an object
		if (field instanceof ObjectField || field instanceof SchemaField) {
			change = { ...change, value: parseOrString(change.value) };
		}

		return super.applyChangeField(model, change, options);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static _applyChangeUnguided(actor, change, changes, { replacementData } = {}) {
		// Double-check whether the target should be treated as a formula if the key has been modified
		if (BlackFlagActiveEffect.FORMULA_FIELDS.has(change.key)) {
			const field = new FormulaField({ deterministic: true });
			return { [change.key]: this.applyChangeField(actor, change, { field }) };
		}

		super._applyChangeUnguided(actor, change, changes, { replacementData });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static _applyChangeUpgrade(actor, change, current, delta, changes) {
		if (current === null) return this._applyChangeOverride(actor, change, current, delta, changes);
		return super._applyChangeUpgrade(actor, change, current, delta, changes);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add modifications to the core ActiveEffect config.
	 * @param {ActiveEffectConfig} app - The ActiveEffect config.
	 * @param {HTMLElement} html - The ActiveEffect config element.
	 * @param {ApplicationRenderContext} context - The app's rendering context.
	 */
	static onRenderActiveEffectConfig(app, html, context) {
		if (app.document.system.onRenderActiveEffectConfig?.(app, html, context) === false) return;

		const fields = app.document.system.schema.fields;
		const magicalField = fields.magical?.toFormGroup(
			{},
			{
				disabled: !context.editable,
				value: app.document.system._source.magical
			}
		);
		const statusesField = fields.rider?.fields?.statuses?.toFormGroup(
			{},
			{
				disabled: !context.editable,
				options: CONFIG.statusEffects.map(se => ({ value: se.id, label: se.name })),
				value: app.document.system._source.rider?.statuses ?? []
			}
		);

		const detailsTab = html.querySelector("[data-application-part=details]");
		const statuses = detailsTab.querySelector("& > .form-group:has([name=statuses])");
		if (statuses) {
			if (magicalField) statuses.before(magicalField);
			if (statusesField) statuses.after(statusesField);
		} else {
			detailsTab.append(...[magicalField, statusesField].filter(_ => _));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create conditions that are applied alongside initial effect.
	 * @returns {Promise<BlackFlagActiveEffect[]>} - Created effects.
	 */
	async createRiderConditions() {
		const riders = new Set(this.system.rider?.statuses ?? []);

		for (const status of this.statuses) {
			const r = CONFIG.statusEffects.find(e => e.id === status)?.riders ?? [];
			r.forEach(p => riders.add(p));
		}

		if (!riders.size) return [];

		const createRider = async id => {
			const existing = this.parent.effects.get(staticID(`bf${id}`));
			if (existing) return;
			const effect = await BlackFlagActiveEffect.fromStatusEffect(id);
			return effect.toObject();
		};

		const effectData = await Promise.all(Array.from(riders).map(createRider));
		return BlackFlagActiveEffect.createDocuments(
			effectData.filter(_ => _),
			{ keepId: true, parent: this.parent }
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		if (
			this.item &&
			options[game.system.id]?.keepOrigin !== true &&
			!options[game.system.id]?.keepOrigin?.includes(data._id)
		)
			this.updateSource({ origin: this.parent.uuid });
		if ((await super._preCreate(data, options, user)) === false) return false;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		await super._onCreate(data, options, userId);
		if (userId === game.userId) {
			if (this.active && this.parent instanceof Actor) await this.createRiderConditions();
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onUpdate(data, options, userId) {
		super._onUpdate(data, options, userId);
		const originalLevel = foundry.utils.getProperty(options, `${game.system.id}.originalExhaustion`);
		const newLevel = foundry.utils.getProperty(data, `flags.${game.system.id}.level`);
		const originalEncumbrance = foundry.utils.getProperty(options, `${game.system.id}.originalEncumbrance`);
		const newEncumbrance = data.statuses?.[0];
		const name = this.name;

		// Display proper scrolling status effects for exhaustion
		if (this.id === this.constructor.ID.EXHAUSTION && Number.isFinite(newLevel) && Number.isFinite(originalLevel)) {
			if (newLevel === originalLevel) return;
			if (newLevel < originalLevel)
				this.name = _loc("BF.Condition.Exhaustion.Numbered", {
					level: formatNumber(originalLevel)
				});
			this._displayScrollingStatus(newLevel > originalLevel);
			this.name = name;
		}

		// Display proper scrolling status effects for encumbrance
		else if (this.id === this.constructor.ID.ENCUMBERED && originalEncumbrance && newEncumbrance) {
			if (newEncumbrance === originalEncumbrance) return;
			const increase =
				!originalEncumbrance ||
				(originalEncumbrance === "encumbered" && newEncumbrance) ||
				newEncumbrance === "exceedingCarryingCapacity";
			if (!increase) this.name = CONFIG.BlackFlag.encumbrance.effects[originalEncumbrance].name;
			this._displayScrollingStatus(increase);
			this.name = name;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Levels Handling           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Register listeners for custom exhaustion handling in the TokenHUD.
	 */
	static registerHUDListeners() {
		Hooks.on("renderTokenHUD", this._onTokenHUDRender);
		document.addEventListener("click", this._onClickTokenHUD.bind(this), { capture: true });
		document.addEventListener("contextmenu", this._onClickTokenHUD.bind(this), { capture: true });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Adjust exhaustion icon display to match current level.
	 * @param {Application} app - The TokenHUD application.
	 * @param {HTMLElement} html - The TokenHUD HTML.
	 * @protected
	 */
	static _onTokenHUDRender(app, html) {
		const actor = app.object.actor;
		const level = foundry.utils.getProperty(actor, "system.attributes.exhaustion");
		if (Number.isFinite(level) && level > 0) {
			const element = html.querySelector('[data-status-id="exhaustion"]');
			if (element) {
				element.style.objectPosition = "-100px";
				element.style.background = `url('systems/black-flag/artwork/statuses/exhaustion-${level}.svg') no-repeat center / contain`;
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Implement custom exhaustion cycling when interacting with the Token HUD.
	 * @param {PointerEvent} event - The triggering event.
	 * @protected
	 */
	static _onClickTokenHUD(event) {
		const { target } = event;
		if (!target.classList?.contains("effect-control")) return;

		const actor = canvas.hud.token.object?.actor;
		if (!actor) return;

		const id = target.dataset?.statusId;
		if (id === "exhaustion") BlackFlagActiveEffect._manageExhaustion(event, actor);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Manage custom exhaustion cycling when interacting with the token HUD.
	 * @param {PointerEvent} event - The triggering event.
	 * @param {Actor5e} actor - The actor belonging to the token.
	 */
	static _manageExhaustion(event, actor) {
		let level = foundry.utils.getProperty(actor, "system.attributes.exhaustion");
		if (!Number.isFinite(level)) return;
		event.preventDefault();
		event.stopPropagation();
		if (event.button === 0) level++;
		else level--;
		actor.update({ "system.attributes.exhaustion": Math.clamp(level, 0, 6) });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create an ActiveEffect instance from some status effect data.
	 * @param {string|object} effectData - The status effect ID or its data.
	 * @param {DocumentModificationContext} [options] - Additional options to pass to ActiveEffect instantiation.
	 * @returns {BlackFlagActiveEffect|void}
	 */
	// static fromStatusEffect(effectData, options = {}) {
	// 	if (typeof effectData === "string") effectData = CONFIG.statusEffects.find(e => e.id === effectData);
	// 	if (foundry.utils.getType(effectData) !== "Object") return;
	// 	const createData = {
	// 		...foundry.utils.deepClone(effectData),
	// 		_id: staticID(`bf${effectData.id}`),
	// 		name: _loc(effectData.name),
	// 		statuses: [effectData.id, ...(effectData.statuses ?? [])]
	// 	};
	// 	this.migrateDataSafe(createData);
	// 	this.cleanData(createData);
	// 	return new this(createData, { keepId: true, ...options });
	// }
}
