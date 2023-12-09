import { numberFormat } from "../../utils/_module.mjs";
import AppAssociatedElement from "./app-associated-element.mjs";

/**
 * Custom element for displaying the XP bar on the character sheet.
 */
export default class XPBarElement extends AppAssociatedElement {

	connectedCallback() {
		super.connectedCallback();

		const xp = this.actor?.system.progression?.xp;
		if ( !xp ) return;
		this.innerHTML = `
			<div role="meter"></div>
			<label id="${this.app.id}-xp-bar-label">${game.i18n.localize("BF.ExperiencePoints.Label")}</label>
			<div class="input">
				<input type="number" name="xpChange" placeholder="${game.i18n.localize("BF.ExperiencePoints.Action.Add")}">
				<button type="submit" name="addXP"><i class="fa-solid fa-plus"></i></button>
			</div>
			<div class="values">
				<span class="min"></span>
				<span class="sep">/</span>
				<span class="max"></span>
			</div>
		`;
		this.#setValues();
		this.querySelector('[name="xpChange"]').addEventListener("change", event => event.stopPropagation());
		this.querySelector("button").addEventListener("click", this.#onSubmit.bind(this));
		this.#hookID = Hooks.on("updateActor", this.#onUpdateActor.bind(this));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	disconnectedCallback() {
		Hooks.off("updateActor", this.#hookID);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Set the various values to match what is configured on actor.
	 */
	#setValues() {
		const xp = this.actor.system.progression?.xp;
		const bar = this.querySelector('[role="meter"]');
		bar.style = `--bar-percentage: ${xp.percentage}%;`;
		bar.setAttribute("aria-valuenow", xp.percentage);
		bar.setAttribute("aria-valuetext", game.i18n.format("BF.ExperiencePoints.LabelSpecific", {value: xp.value}));
		bar.setAttribute("aria-valuemin", xp.min);
		bar.setAttribute("aria-valuemax", xp.max);
		this.querySelector('[name="xpChange"]').value = "";
		this.querySelector(".values .min").innerText = numberFormat(xp.value);
		this.querySelector(".values .max").innerText = numberFormat(xp.max);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * ID of the change listener.
	 * @type {number}
	 */
	#hookID;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Actor that this XP bar is representing.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.app.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle updating XP.
	 * @param {ClickEvent} event - Triggering click event.
	 */
	async #onSubmit(event) {
		event.preventDefault();
		const input = this.querySelector('[name="xpChange"]');
		if ( Number.isNumeric(input.valueAsNumber) ) {
			const value = Math.round(input.valueAsNumber);
			const update = {
				value: this.actor.system.progression.xp.value + value,
				log: this.actor.system.progression.xp.log.concat([{ amount: value, source: "manual" }])
			};
			await this.actor.update({"system.progression.xp": update}, {render: false});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Watch for changes to XP on this actor.
	 * @param {BlackFlagActor} actor - Actor that was changed.
	 * @param {object} changes - Changes applied.
	 * @param {object} options - Options for the change.
	 * @param {string} userId - ID of the user who performed the change.
	 */
	#onUpdateActor(actor, changes, options, userId) {
		if ( (actor !== this.actor) || !foundry.utils.hasProperty(changes, "system.progression.xp.value") ) return;
		this.#setValues();
	}
}
