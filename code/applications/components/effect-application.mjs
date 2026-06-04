import ChatTrayElement from "./chat-tray-element.mjs";
import TargetedApplicationMixin from "./targeted-application-mixin.mjs";

/**
 * Application to handle applying active effects from a chat card.
 */
export default class EffectApplicationElement extends TargetedApplicationMixin(ChatTrayElement) {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Active effects that will be applied by this application.
	 * @type {BlackFlagActiveEffect[]}
	 */
	effects = [];

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The list of active effects.
	 * @type {HTMLUListElement}
	 */
	effectsList;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Checked status for application targets.
	 * @type {Map<string, boolean>}
	 */
	#targetOptions = new Map();

	/**
	 * Options for a specific target.
	 * @param {string} uuid - UUID of the target.
	 * @returns {boolean} - Should this target be checked?
	 */
	targetChecked(uuid) {
		if (this.targetingMode === "selected") return true;
		return this.#targetOptions.get(uuid) ?? true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async connectedCallback() {
		super.connectedCallback();
		if (!this.message) return;

		// Build the frame HTML only once
		if (!this.effectsList || !this.targetList) {
			if (!this.effects.length) {
				this.effects = (
					await Promise.all(Array.from(this.querySelectorAll("option")).map(o => fromUuid(o.value)))
				).filter(_ => _);
			}

			const div = document.createElement("div");
			div.classList.add("card-tray", "effects-tray", "collapsible");
			if (!this.open) div.classList.add("collapsed");
			div.innerHTML = `
				<label>
					<i class="fa-solid fa-bolt" inert></i>
					<span>${_loc("BF.EFFECT.Application.Label")}</span>
					<i class="fa-solid fa-caret-down" inert></i>
				</label>
				<div class="collapsible-content">
					<div class="wrapper">
						<hr>
						<menu class="effects unlist"></menu>
					</div>
				</div>
			`;
			this.replaceChildren(div);
			this.effectsList = div.querySelector(".effects");
			this.buildEffectsList();
			div.querySelector(".wrapper").prepend(...this.buildTargetContainer());
			this.targetList.addEventListener("change", this._onCheckTarget.bind(this));
			div.addEventListener("click", this._handleClickToggle.bind(this));
		}

		this.targetingMode = this.targetSourceControl.hidden ? "selected" : "targeted";
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Build a list of active effects.
	 */
	buildEffectsList() {
		for (const effect of this.effects) {
			const li = document.createElement("li");
			li.classList.add("effect");
			li.dataset.uuid = effect.uuid;
			li.innerHTML = `
				<img class="icon">
				<div class="name-stacked">
					<span class="title"></span>
					<span class="subtitle">${effect.duration.label}</span>
				</div>
				<button class="apply-effect light-button" type="button" data-action="applyEffect"
								data-tooltip="BF.EFFECT.Action.ApplyTokens"
								aria-label="${_loc("BF.EFFECT.Action.ApplyTokens")}">
					<i class="fas fa-reply-all fa-flip-horizontal" inert></i>
				</button>
			`;
			Object.assign(li.querySelector(".icon"), { alt: effect.name, src: effect.img });
			li.querySelector(".title").innerText = effect.name;
			this.effectsList.append(li);
			li.addEventListener("click", this._onApplyEffect.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	buildTargetListEntry({ uuid, name }) {
		const actor = fromUuidSync(uuid);
		if (!actor?.isOwner) return;

		const disabled = this.targetingMode === "selected" ? " disabled" : "";
		const checked = this.targetChecked(uuid) ? " checked" : "";

		const li = document.createElement("li");
		li.classList.add("target");
		li.dataset.targetUuid = uuid;
		li.innerHTML = `
			<img class="icon circular" data-uuid="${actor.uuid}">
			<div class="name-stacked">
				<span class="title"></span>
			</div>
			<div class="checkbox">
				<input type="checkbox" name="${uuid}"${checked}${disabled}></input>
			</div>
		`;
		Object.assign(li.querySelector(".icon"), { alt: name, src: actor.img });
		li.querySelector(".title").innerText = name;

		return li;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle applying an Active Effect to a Token.
	 * @param {BlackFlagActiveEffect} effect - The effect to apply.
	 * @param {BlackFlagActor} actor - The actor.
	 * @returns {Promise<BlackFlagActiveEffect>} - The created effect.
	 * @throws {Error} - If the effect could not be applied.
	 * @protected
	 */
	async _applyEffectToActor(effect, actor) {
		const item = this.message.getAssociatedItem() ?? {};
		const origin = effect.inCompendium ? item : effect;
		if (!game.user.isGM && !actor.isOwner) {
			throw new Error(_loc("BF.EFFECT.Application.Warning.NotOwner"));
		}

		const effectFlags = {
			flags: {
				[game.system.id]: {
					scaling: this.message.getFlag(game.system.id, "scaling"),
					spellSlot: this.message.getFlag(game.system.id, "spellSlot")
				}
			}
		};

		// Enable an existing effect on the target if it originated from this effect
		const existingEffect = actor.effects.find(e => e.origin === origin.uuid);
		if (existingEffect) {
			return existingEffect.update(
				foundry.utils.mergeObject(
					{
						...effect.constructor.getEffectStart(),
						disabled: false
					},
					effectFlags
				)
			);
		}

		// Otherwise, create a new effect on the target
		const effectData = foundry.utils.mergeObject(
			{
				...effect.toObject(),
				disabled: false,
				transfer: false,
				origin: origin.uuid,
				_stats: {
					[effect.inCompendium ? "compendiumSource" : "duplicateSource"]: effect.uuid,
					[effect.inCompendium ? "duplicateSource" : "compendiumSource"]: null
				}
			},
			effectFlags
		);
		const applied = await ActiveEffect.implementation.create(effectData, { parent: actor });
		return applied;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle clicking the apply effect button.
	 * @param {PointerEvent} event - Triggering click event.
	 */
	async _onApplyEffect(event) {
		event.preventDefault();
		const effect = await fromUuid(event.target.closest("[data-uuid]")?.dataset.uuid);
		if (!effect) return;
		for (const target of this.targetList.querySelectorAll("[data-target-uuid]")) {
			const actor = fromUuidSync(target.dataset.targetUuid);
			if (!actor || !target.querySelector("input")?.checked) continue;
			try {
				await this._applyEffectToActor(effect, actor);
			} catch (err) {
				Hooks.onError("EffectApplicationElement._applyEffectToToken", err, { notify: "warn", log: "warn" });
			}
		}
		this.querySelector(".collapsible").dispatchEvent(new PointerEvent("click", { bubbles: true, cancelable: true }));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle checking or unchecking a target.
	 * @param {Event} event - Triggering change event.
	 */
	_onCheckTarget(event) {
		const uuid = event.target.closest("[data-target-uuid]")?.dataset.targetUuid;
		if (!uuid) return;
		this.#targetOptions.set(uuid, event.target.checked);
	}
}
