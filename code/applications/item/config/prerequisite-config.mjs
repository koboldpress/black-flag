import { Trait } from "../../../utils/_module.mjs";
import BFDocumentSheet from "../../api/document-sheet.mjs";

const { BooleanField, DocumentUUIDField, NumberField, SetField, StringField } = foundry.data.fields;

/**
 * Configuration dialog for feature & talent prerequisites.
 */
export default class PrerequisiteConfig extends BFDocumentSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["prerequisite", "standard-form", "form-list"],
		form: {
			submitOnChange: true
		},
		position: {
			width: 480
		},
		sheetConfig: false
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		general: {
			template: "systems/black-flag/templates/shared/fieldset.hbs"
		},
		items: {
			template: "systems/black-flag/templates/item/config/prerequisite-config-items.hbs"
		},
		abilities: {
			template: "systems/black-flag/templates/item/config/prerequisite-config-abilities.hbs"
		},
		spellcasting: {
			template: "systems/black-flag/templates/shared/fieldset.hbs"
		},
		proficiencies: {
			template: "systems/black-flag/templates/shared/fieldset.hbs"
		},
		traits: {
			template: "systems/black-flag/templates/shared/fieldset.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Restriction filters currently set.
	 * @type {FilterDescription[]}
	 */
	get filters() {
		return this.document.system.restriction.filters;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.localize("BF.Prerequisite.Config.Title");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.filters = this.filters.reduce((obj, f) => {
			obj[f._id] = f;
			return obj;
		}, {});
		context.source = this.document.system._source;
		context.system = this.document.system;
		context.restrictionFields = this.document.system.schema.fields.restriction.fields;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		switch (partId) {
			case "abilities":
				return this._prepareAbilitiesContext(context, options);
			case "general":
				return this._prepareGeneralContext(context, options);
			case "items":
				return this._prepareItemsContext(context, options);
			case "proficiencies":
				return this._prepareProficienciesContext(context, options);
			case "spellcasting":
				return this._prepareSpellcastingContext(context, options);
			case "traits":
				return this._prepareTraitsContext(context, options);
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare abilities rendering context.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	_prepareAbilitiesContext(context, options) {
		context.abilities = {};
		for (const [key, ability] of Object.entries(CONFIG.BlackFlag.abilities)) {
			context.abilities[key] = {
				label: ability.labels.abbreviation,
				value: context.filters[`ability-${key}`]?.v ?? ""
			};
		}
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare general rendering context.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	_prepareGeneralContext(context, options) {
		context.fields = [
			{
				classes: "label-hinted",
				field: context.restrictionFields.requireAll,
				localize: true,
				name: "system.restriction.requireAll",
				value: context.source.restriction.requireAll
			}
		];
		context.legend = game.i18n.localize("BF.Prerequisite.Config.Details");
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare items rendering context.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	_prepareItemsContext(context, options) {
		context.field = new SetField(new DocumentUUIDField({ type: "Item" }), {
			label: game.i18n.localize("BF.Prerequisite.Items.Label")
		});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare proficiencies rendering context.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	_prepareProficienciesContext(context, options) {
		const prepareProficiency = (trait, label) => ({
			field: new SetField(new StringField(), { label: game.i18n.localize(label) }),
			name: `proficiencies.${trait}`,
			options: Trait.choices(trait, { any: true, category: true, priority: "localization" }).formOptions(),
			value: new Set([
				...(context.filters[`${trait}Proficiency`]?.v ?? []).map(s => s._key ?? s),
				...(context.filters[`${trait}Categories`]?.v ?? []).map(s => `${s}:*`)
			])
		});
		context.fields = [
			prepareProficiency("armor", "BF.Item.Type.Armor[one]"),
			prepareProficiency("weapons", "BF.Item.Type.Weapon[one]"),
			prepareProficiency("tools", "BF.Item.Type.Tool[one]"),
			prepareProficiency("skills", "BF.Skill.Label[one]")
		];
		context.legend = game.i18n.localize("BF.Proficiency.Label[other]");
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare spellcasting rendering context.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	_prepareSpellcastingContext(context, options) {
		context.fields = [
			{
				field: new BooleanField({ label: game.i18n.localize("BF.Prerequisite.SpellcastingFeature.ConfigLabel") }),
				name: "spellcasting.feature",
				value: context.filters.spellcastingFeature?.v
			},
			{
				field: new StringField({ label: game.i18n.localize("BF.Prerequisite.SpellcastingCircle.ConfigLabel") }),
				name: "spellcasting.circle",
				options: [
					{ value: "", label: "" },
					...CONFIG.BlackFlag.spellCircles({ formOptions: true, includeCantrip: false })
				],
				value: context.filters.spellCircle?.v
			},
			{
				field: new BooleanField({ label: game.i18n.localize("BF.Prerequisite.SpellcastingCantrip.ConfigLabel") }),
				name: "spellcasting.cantrip",
				value: context.filters.hasCantrips?.v
			},
			{
				field: new BooleanField({ label: game.i18n.localize("BF.Prerequisite.SpellcastingDamage.ConfigLabel") }),
				name: "spellcasting.damage",
				value: context.filters.hasDamagingSpells?.v
			}
		];
		context.legend = game.i18n.localize("BF.Spellcasting.Label");
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare traits context.
	 * @param {ApplicationRenderContext} context - Context being prepared.
	 * @param {HandlebarsRenderOptions} options - Options which configure application rendering behavior.
	 * @returns {Promise<ApplicationRenderContext>}
	 * @protected
	 */
	_prepareTraitsContext(context, options) {
		const level = {};
		if (context.filters.characterLevel) {
			level.value = context.filters.characterLevel.v;
		} else if (context.filters.classLevel) {
			level.class = context.filters.classLevel._class;
			level.value = context.filters.classLevel.v;
		}
		context.fields = [
			{
				field: new NumberField({
					label: game.i18n.localize(`BF.Prerequisite.Level${level.class ? "Class" : "Character"}.ConfigLabel`)
				}),
				name: "traits.level.value",
				options: [
					{ value: "", label: "" },
					...Object.entries(CONFIG.BlackFlag.levels()).map(([value, label]) => ({ value, label }))
				],
				value: level.value
			},
			level.value
				? {
						field: new StringField({ label: game.i18n.localize("BF.Advancement.FIELDS.level.classIdentifier.label") }),
						name: "traits.level.class",
						options: [
							{ value: "", label: "" },
							...Object.entries(CONFIG.BlackFlag.registration.list("class")).map(([value, { name }]) => ({
								value,
								label: name
							}))
						],
						value: level.class
					}
				: null,
			{
				field: new StringField({ label: game.i18n.localize("BF.Size.Label") }),
				name: "traits.size",
				options: [{ value: "", label: "" }, ...CONFIG.BlackFlag.sizes.localizedOptions],
				value: context.filters.creatureSize?.v
			}
		];
		context.legend = game.i18n.localize("BF.Trait.Label[other]");
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const data = super._processFormData(event, form, formData);
		const filters = this.filters;

		const updateFilter = (_id, k, v, o, d = {}) => {
			const existingIdx = filters.findIndex(f => f._id === _id);
			if (v) {
				const value = { _id, k, v, o, ...d };
				if (existingIdx !== -1) filters[existingIdx] = value;
				else filters.push(value);
			} else if (existingIdx !== -1) filters.splice(existingIdx, 1);
		};

		// Abilities
		Object.entries(data.abilities).forEach(([k, v]) =>
			updateFilter(`ability-${k}`, `system.abilities.${k}.value`, v, "gte")
		);

		// Proficiencies
		const updateProficiency = (trait, extended) => {
			const [proficiencies, categories] = (data.proficiencies?.[trait] ?? []).reduce(
				(arr, k) => {
					if (k.endsWith(":*")) arr[1].push(k.replace(":*", ""));
					else arr[0].push(k);
					return arr;
				},
				[[], []]
			);
			updateFilter(
				`${trait}Proficiency`,
				extended ? undefined : `system.proficiencies.${trait}.value`,
				proficiencies.length
					? extended
						? proficiencies.map(_key => ({
								k: `system.proficiencies.${trait}.${_key}.proficiency.multiplier`,
								o: "gte",
								v: 1,
								_key
							}))
						: proficiencies
					: false,
				extended ? "OR" : "hasAny"
			);
			updateFilter(
				`${trait}Categories`,
				`system.proficiencies.${trait}.categories`,
				categories.length ? categories : false,
				"hasAny"
			);
		};
		updateProficiency("armor");
		updateProficiency("weapons");
		updateProficiency("tools", true);
		updateProficiency("skills", true);

		// Spellcasting
		updateFilter(
			"hasCantrips",
			undefined,
			data.spellcasting?.cantrip
				? [
						{ k: "system.spellcasting.spells.cantrips", v: 1, o: "gte" },
						{ k: "system.spellcasting.spells.knowable.cantrips", v: 1, o: "gte" }
					]
				: false,
			"OR"
		);
		updateFilter("spellCircle", "system.spellcasting.maxCircle", data.spellcasting?.circle, "gte");
		updateFilter("hasDamagingSpells", "system.spellcasting.spells.damaging", Number(data.spellcasting?.damage), "gte");
		updateFilter("spellcastingFeature", "system.spellcasting.hasSpellcastingAdvancement", data.spellcasting?.feature);

		// Traits
		if (data.traits?.level?.class) {
			updateFilter("characterLevel");
			updateFilter(
				"classLevel",
				`system.progression.classes.${data.traits.level.class}.levels`,
				data.traits?.level?.value,
				"gte",
				{ _class: data.traits.level.class }
			);
		} else {
			updateFilter("characterLevel", "system.progression.level", data.traits?.level?.value, "gte");
			updateFilter("classLevel");
		}
		updateFilter("creatureSize", "system.traits.size", data.traits?.size);

		foundry.utils.setProperty(data, "system.restriction.filters", filters);
		return data;
	}
}
