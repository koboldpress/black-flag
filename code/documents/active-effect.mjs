import { log } from "../utils/_module.mjs";

/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 */
export default class BlackFlagActiveEffect extends ActiveEffect {

	apply(document, change) {
		// Grab DataField instance for target, if not found, fallback on default Foundry implementation
		const keyPath = change.key.replace("system.", "");
		const field = document.system.schema.getField(keyPath);
		if ( !change.key.startsWith("system.") || !field ) return super.apply(document, change);

		// Get the current value of the target field
		const current = foundry.utils.getProperty(document, change.key) ?? null;

		// Convert input using field's _bfCastEffectValue if it exists
		let delta;
		try {
			delta = field._bfCastDelta(this._parseOrString(change.value));
			field._bfValidateDelta(delta);
		} catch(err) {
			console.warn(
				`Actor ${document.name} [${document.id}] | Unable to parse active effect change `
				+ `for %c${change.key}%c "${change.value}": %c${err.message}`,
				"color: blue", "", "color: crimson"
			);
			return;
		}

		const MODES = CONST.ACTIVE_EFFECT_MODES;
		const changes = {};
		switch ( change.mode ) {
			case MODES.ADD:
				field._bfApplyAdd(document, change, current, delta, changes);
				break;
			case MODES.MULTIPLY:
				field._bfApplyMultiply(document, change, current, delta, changes);
				break;
			case MODES.OVERRIDE:
				field._bfApplyOverride(document, change, current, delta, changes);
				break;
			case MODES.UPGRADE:
				field._bfApplyUpgrade(document, change, current, delta, changes);
				break;
			case MODES.DOWNGRADE:
				field._bfApplyDowngrade(document, change, current, delta, changes);
				break;
			default:
				this._applyCustom(document, change, current, delta, changes);
				break;
		}

		// Apply all changes to the Document data
		foundry.utils.mergeObject(document, changes);
		return changes;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_parseOrString(raw) {
		if ( raw instanceof foundry.abstract.DataModel ) return raw;
		return super._parseOrString(raw);
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
