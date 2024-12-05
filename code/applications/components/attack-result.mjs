import ChatTrayElement from "./chat-tray-element.mjs";

/**
 * Element that handles displaying attack results.
 */
export default class AttackResultElement extends ChatTrayElement {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The attack roll.
	 * @type {ChallengeRoll}
	 */
	roll;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Damage descriptions that will be applied by this application.
	 * @type {DamageDescription[]}
	 */
	targets = [];

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The list of application targets.
	 * @type {HTMLUListElement}
	 */
	#targetList;

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	connectedCallback() {
		super.connectedCallback();
		if (!this.message) return;

		// Build the frame HTML only once
		if (!this.#targetList) {
			const div = document.createElement("div");
			div.classList.add("card-tray", "attack-tray", "collapsible");
			if (!this.open) div.classList.add("collapsed");
			div.innerHTML = `
				<label>
					<i class="fa-solid fa-bullseye" inert></i>
					<span>${game.i18n.localize("BF.TARGET.Label[other]")}</span>
					<i class="fa-solid fa-caret-down" inert></i>
				</label>
				<div class="collapsible-content">
					<div class="wrapper">
						<ul class="targets unlist"></ul>
					</div>
				</div>
			`;
			this.replaceChildren(div);
			this.#targetList = div.querySelector(".targets");
			div.addEventListener("click", this._handleClickToggle.bind(this));
		}
		// TODO: Add event listener for when luck is applied to the message

		this.buildTargetsList();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a list of targeted tokens based on current mode & replace any existing targets.
	 */
	buildTargetsList() {
		const targetedTokens = this.message.getFlag(game.system.id, "targets") ?? [];
		const targets = targetedTokens.map(t => this.buildTargetListEntry(t)).filter(t => t);
		if (targets.length) this.#targetList.replaceChildren(...targets);
		else {
			const li = document.createElement("li");
			li.classList.add("none");
			li.innerText = game.i18n.localize("BF.Tokens.None.Targeted");
			this.#targetList.replaceChildren(li);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a list entry for a single target.
	 * @param {TargetDescriptor} target - Targeting data.
	 * @returns {HTMLLIElement|void}
	 */
	buildTargetListEntry(target) {
		const isHit = this.roll.isCriticalSuccess || (this.roll.total >= target.ac && !this.roll.isCriticalFailure);
		const li = document.createElement("li");
		li.classList.add("target", isHit ? "hit" : "miss");
		li.dataset.uuid = target.uuid;
		li.innerHTML = '<div class="name"></div>';
		li.querySelector("div.name").innerText = target.name;
		if (game.user.isGM || game.settings.get(game.system.id, "attackVisibility") !== "hideAC")
			li.innerHTML += `
			<div class="ac">
				<i class="fa-solid fa-shield-halved" inert></i>
				<span>${target.ac}</span>
			</div>
		`;

		li.addEventListener("click", this.message.onTargetMouseDown.bind(this));
		li.addEventListener("pointerover", this.message.onTargetHoverIn.bind(this));
		li.addEventListener("pointerout", this.message.onTargetHoverOut.bind(this));

		return li;
	}
}
