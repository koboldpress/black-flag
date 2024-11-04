import ActivitySheet from "./activity-sheet.mjs";

/**
 * Application for configuring Cast activities.
 */
export default class CastSheet extends ActivitySheet {
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["cast-activity"],
		actions: {
			removeSpell: CastSheet.#removeSpell
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		identity: {
			template: "systems/black-flag/templates/activity/cast-identity.hbs",
			templates: super.PARTS.identity.templates
		},
		effect: {
			template: "systems/black-flag/templates/activity/cast-effect.hbs",
			templates: [
				"systems/black-flag/templates/activity/parts/cast-spell.hbs",
				"systems/black-flag/templates/activity/parts/cast-details.hbs"
			]
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		return {
			...(await super._prepareContext(options)),
			spell: {
				data: this.activity.system._source.spell,
				document: await fromUuid(this.activity.system.spell.uuid),
				fields: this.activity.system.schema.fields.spell.fields
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareEffectContext(context) {
		context = await super._prepareEffectContext(context);

		if (context.spell.document) {
			context.spell.contentLink = context.spell.document.toAnchor().outerHTML;
			if (context.spell.document.system.circle.base > 0) {
				context.circleOptions = Object.entries(CONFIG.BlackFlag.spellCircles())
					.filter(([circle]) => Number(circle) >= context.spell.document.system.circle.base)
					.map(([value, label]) => ({ value, label }));
			}
		}

		context.abilityOptions = [
			{ value: "", label: game.i18n.localize("BF.Default.Generic") },
			{ rule: true },
			...CONFIG.BlackFlag.abilities.localizedOptions
		];

		context.propertyOptions = [
			...Object.entries(CONFIG.BlackFlag.spellComponents).map(([value, { label }]) => ({
				value,
				label: game.i18n.localize(label),
				group: game.i18n.localize("BF.Spell.Component.Label")
			})),
			...Object.entries(CONFIG.BlackFlag.spellTags).map(([value, { label }]) => ({
				value,
				label: game.i18n.localize(label),
				group: game.i18n.localize("BF.Spell.Tag.Label")
			}))
		];

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareIdentityContext(context) {
		context = await super._prepareIdentityContext(context);
		if (context.spell.document)
			context.placeholder = {
				name: context.spell.document.name,
				img: context.spell.document.img
			};
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_getTabs() {
		const tabs = super._getTabs();
		tabs.effect.label = "BF.CAST.SECTIONS.Spell";
		tabs.effect.icon = "fa-solid fa-wand-sparkles";
		return tabs;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle removing the associated spell.
	 * @this {CastSheet}
	 * @param {Event} event - Triggering click event.
	 * @param {HTMLElement} target - Button that was clicked.
	 */
	static #removeSpell(event, target) {
		this.activity.update({ "system.spell.uuid": null });
	}
}
