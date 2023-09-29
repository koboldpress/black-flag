import { log } from "../utils/_module.mjs";

/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 */
export default class BlackFlagActiveEffect extends ActiveEffect {

	_applyAdd(actor, change, current, delta, changes) {
		if ( current instanceof Set ) {
			if ( Array.isArray(delta) ) delta.forEach(item => current.add(item));
			else current.add(delta);
			return;
		}
		super._applyAdd(actor, change, current, delta, changes);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_applyOverride(actor, change, current, delta, changes) {
		if ( current instanceof Set ) {
			current.clear();
			if ( Array.isArray(delta) ) delta.forEach(item => current.add(item));
			else current.add(delta);
			return;
		}
		return super._applyOverride(actor, change, current, delta, changes);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Sheet Display            */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Sort and prepare effects to display on actor or item sheets.
	 * @param {BlackFlagActiveEffect[]} effects
	 * @param {object} [options={}]
	 * @param {boolean} [options.displaySource=false] - Should the source column be displayed?
	 * @returns {object}
	 */
	static prepareSheetSections(effects, { displaySource=false }={}) {
		const sections = {
			temporary: {
				label: "BF.Effect.Category.Temporary",
				effects: [],
				create: [],
				displaySource
			},
			passive: {
				label: "BF.Effect.Category.Passive",
				effects: [],
				create: [],
				displaySource
			},
			inactive: {
				label: "BF.Effect.Category.Inactive",
				effects: [],
				crate: [],
				displaySource
			}
		};

		for ( const effect of effects ) {
			if ( effect.disabled ) sections.inactive.effects.push(effect);
			else if ( effect.isTemporary ) sections.temporary.effects.push(effect);
			else sections.passive.effects.push(effect);
		}

		return sections;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a effect actions on an Actor or Item sheet.
	 * @param {ClickEvent} event - Triggering click event.
	 * @returns {Promise}
	 */
	static async onEffectAction(event) {
		event.preventDefault();
		const id = event.currentTarget.closest("[data-effect-id]")?.dataset.effectId;
		const section = event.currentTarget.closest("[data-section-id]")?.dataset.sectionId;
		const effect = id ? this.document.effects.get(id) : null;
		const { subAction } = event.currentTarget.dataset;
		switch (subAction) {
			case "add":
				return this.document.createEmbeddedDocuments("ActiveEffect", [{
					label: game.i18n.localize("BF.Effect.New"),
					icon: this.document instanceof getDocumentClass("Item") ? this.document.img : "icons/svg/aura.svg",
					origin: this.document.uuid,
					duration: {
						rounds: section === "temporary" ? 1 : undefined
					},
					disabled: section === "inactive"
				}]);
			case "edit":
			case "view":
				return effect.sheet.render(true);
			case "delete":
				return effect.deleteDialog();
			case "toggle":
				return effect.update({disabled: !effect.disabled});
			default:
				return log(`Invalid effect action type clicked ${subAction}.`);
		}
	}
}
