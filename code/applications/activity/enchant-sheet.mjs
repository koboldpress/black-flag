import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Enchant activities.
 */
export default class EnchantSheet extends ActivitySheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["enchant-activity"]
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		effect: {
			template: "systems/black-flag/templates/activity/enchant-effect.hbs",
			templates: [
				...super.PARTS.effect.templates,
				"systems/black-flag/templates/activity/parts/enchant-restrictions.hbs"
			]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	tabGroups = {
		sheet: "identity",
		activation: "time",
		effect: "enchantments"
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareEffectContext(context, options) {
		context = await super._prepareEffectContext(context, options);

		const appliedEnchantments = new Set(context.activity.system.effects?.map(e => e?._id) ?? []);
		context.allEffects = this.item.effects
			.filter(e => e.type === "enchantment")
			.map(effect => ({
				value: effect.id,
				label: effect.name,
				selected: appliedEnchantments.has(effect.id)
			}));

		context.enchantmentLabels = {
			add: "BF.ENCHANT.Enchantment.Action.Add",
			delete: "BF.ENCHANT.Enchantment.Action.Delete",
			dissociate: "BF.ENCHANT.Enchantment.Action.Dissociate",
			legend: "BF.ENCHANT.Enchantment.Config"
		};

		const type = context.source.system.restrictions.type;
		const typeDataModel = CONFIG.Item.dataModels[type];
		context.typeOptions = [
			{ value: "", label: _loc("BF.ENCHANT.FIELDS.restrictions.type.Any"), rule: true },
			...Object.entries(CONFIG.Item.dataModels)
				.filter(([, d]) => d.metadata?.hasEffects)
				.map(([value]) => ({ value, label: _loc(CONFIG.Item.typeLabels[value]) }))
				.sort((lhs, rhs) => lhs.label.localeCompare(rhs.label, game.i18n.lang))
		];
		context.isTypePhysical = !type || !!typeDataModel?.isPhysical;

		if (typeDataModel) {
			context.categoryOptions = typeDataModel.validCategories?.localizedOptions;
			context.subtypeOptions = typeDataModel.validTypes?.localizedOptions;
		}

		context.propertyOptions = (CONFIG.BlackFlag[`${type}Properties`] ?? [])
			.map(value => ({ value, label: CONFIG.BlackFlag.itemProperties.localized[value] }))
			.filter(o => o.label);

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareIdentityContext(context, options) {
		context = await super._prepareIdentityContext(context, options);
		context.behaviorFields.unshift({
			field: context.systemFields.autoSelf,
			value: context.source.system.autoSelf
		});
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getTabs() {
		const tabs = super._getTabs();
		tabs.effect.label = "BF.ENCHANT.SECTIONS.Enchanting";
		tabs.effect.icon = "fa-solid fa-wand-sparkles";
		tabs.effect.tabs = this._markTabs({
			enchantments: {
				id: "enchantments",
				group: "effect",
				icon: "fa-solid fa-star",
				label: "BF.ENCHANT.SECTIONS.Enchantments"
			},
			restrictions: {
				id: "restrictions",
				group: "effect",
				icon: "fa-solid fa-ban",
				label: "BF.ENCHANT.SECTIONS.Restrictions"
			}
		});
		return tabs;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_addEffectData() {
		const { name, img } = this.activity._source;
		return {
			type: "enchantment",
			name: name || this.item.name,
			img: img || this.item.img,
			disabled: true
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_validRemoteEffect(effect) {
		return effect.type === "enchantment";
	}
}
