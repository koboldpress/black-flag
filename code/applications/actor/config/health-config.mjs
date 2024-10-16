import { numberFormat } from "../../../utils/_module.mjs";
import BaseConfigSheet from "../api/base-config-sheet.mjs";

/**
 * Configuration application for hit points & hit dice.
 */
export default class HealthConfig extends BaseConfigSheet {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["health"],
		position: {
			width: 500
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		config: {
			template: "systems/black-flag/templates/actor/config/health-config.hbs"
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	get title() {
		return game.i18n.localize("BF.Health.Label");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _preparePartContext(partId, context, options) {
		context = await super._preparePartContext(partId, context, options);
		context.hp = {
			data: context.system.data.attributes.hp,
			fields: context.system.fields.attributes.fields.hp.fields,
			source: context.system.source.attributes.hp
		};

		// Display positive ability modifier as its own row, but if negative merge into classes totals
		const ability = CONFIG.BlackFlag.abilities.localized[CONFIG.BlackFlag.defaultAbilities.hitPoints];
		const mod = this.document.system.abilities?.[CONFIG.BlackFlag.defaultAbilities.hitPoints]?.mod ?? 0;
		if (ability && mod > 0) context.ability = { mod, label: ability };

		// Summarize HP from classes
		context.classes = Object.values(this.document.system.progression?.classes ?? {}).map(cls => ({
			id: cls.document.id,
			anchor: cls.document.toAnchor().outerHTML,
			name: cls.document.name,
			total: cls.document.system.advancement.byType("hitPoints")[0]?.getAdjustedTotal(mod > 0 ? 0 : mod) ?? 0
		}));

		// Display active effects targeting bonus fields
		context.effects = {
			level: this.document.activeEffectAttributions("system.attributes.hp.bonuses.level"),
			overall: this.document.activeEffectAttributions("system.attributes.hp.bonuses.overall")
		};
		Object.keys(context.effects).forEach(
			k =>
				(context.effects[k] = context.effects[k]
					.filter(e => e.mode === CONST.ACTIVE_EFFECT_MODES.ADD)
					.map(e => ({ ...e, anchor: e.document.toAnchor().outerHTML })))
		);

		// Create level multiplier HTML
		context.levels = this.document.system.progression?.level ?? 0;
		context.levelMultiplier = `
			<span class="multiplier"><span class="times">&times;</span> ${numberFormat(context.levels)}</span>
		`;

		context.hd = {
			data: context.system.data.attributes.hd,
			fields: context.system.fields.attributes.fields.hd.fields,
			source: context.system.source.attributes.hp
		};
		context.hd.types = Object.entries(context.hd.data.d).map(([denomination, data]) => ({
			data,
			denomination,
			keyPath: `system.attributes.hd.d.${denomination}.`,
			label: `d${denomination}`
		}));
		context.hd.typeFields = context.hd.fields.d.model.fields;

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Form Submission           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processFormData(event, form, formData) {
		const submitData = super._processFormData(event, form, formData);
		for (const [denomination, data] of Object.entries(submitData.system?.attributes?.hd?.d ?? {})) {
			if (!("available" in data)) continue;
			data.spent = this.document.system.attributes.hd.d[denomination].max - data.available;
			delete data.available;
		}
		return submitData;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_processSubmitData(event, form, submitData) {
		const clone = this.document.clone(submitData);
		const { value, max } = this.document.system.attributes.hp;
		const maxDelta = clone.system.attributes.hp.max - max;
		const current = submitData.system.attributes.hp.value ?? value;
		foundry.utils.setProperty(submitData, "system.attributes.hp.value", Math.max(current + maxDelta, 0));
		super._processSubmitData(event, form, submitData);
	}
}
