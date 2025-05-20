/**
 * System for presenting custom tooltips.
 */
export default class TooltipConductor {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Mutation observer that monitors for changes.
	 * @type {MutationObserver}
	 */
	#observer;

	/**
	 * The current ephemeral tooltip.
	 * @type {HTMLElement}
	 */
	get tooltip() {
		return document.getElementById("tooltip");
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Observation             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Initialize the observer.
	 */
	observe() {
		this.#observer?.disconnect();
		this.#observer = new MutationObserver(this.#handleMutation.bind(this));
		this.#observer.observe(this.tooltip, { attributeFilter: ["class"], attributeOldValue: true });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a mutation event.
	 * @param {MutationRecord[]} mutationList - List of changes.
	 */
	#handleMutation(mutationList) {
		const tooltip = this.tooltip;
		for (const { type, attributeName, oldValue } of mutationList) {
			if (type === "attributes" && attributeName === "class") {
				const difference = new Set(tooltip.classList).difference(new Set(oldValue?.split(" ")));
				if (difference.has("active")) {
					this._onTooltipActivate();
					return;
				}
			}
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Activation              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine what to present when tooltip if activated.
	 * @returns {Promise}
	 * @protected
	 */
	async _onTooltipActivate() {
		// Content Links
		if (game.tooltip.element?.classList.contains("content-link")) {
			const doc = await fromUuid(game.tooltip.element.dataset.uuid);
			return this._onHoverContentLink(doc);
		}

		const loading = this.tooltip.querySelector(".loading");

		if (loading?.dataset.uuid) {
			const doc = await fromUuid(loading.dataset.uuid);
			// TODO: Custom actor hovers
			return this._onHoverContentLink(doc);
		}

		// TODO: Passive checks
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle hovering over a content link and showing rich tooltips if available.
	 * @param {Document} doc - The linked document being hovered.
	 * @protected
	 */
	async _onHoverContentLink(doc) {
		const { content, classes } = (await (doc.richTooltip?.() ?? doc.system?.richTooltip?.())) ?? {};
		if (!content) return;
		this.tooltip.innerHTML = content;
		if (classes?.length) this.tooltip.classList.add(...classes);
		const { tooltipDirection } = game.tooltip.element.dataset;
		requestAnimationFrame(() => this._positionTooltip(tooltipDirection));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Re-position a tooltip after rendering.
	 * @param {string} [direction] - The direction to position the tooltip, if there is enough space.
	 * @protected
	 */
	_positionTooltip(direction) {
		const { TOOLTIP_DIRECTIONS, TOOLTIP_MARGIN_PX } = foundry.helpers.interaction.TooltipManager.implementation;
		if (!direction) {
			direction = TOOLTIP_DIRECTIONS.LEFT;
			game.tooltip._setAnchor(direction);
		}

		const position = this.tooltip.getBoundingClientRect();
		switch (direction) {
			case TOOLTIP_DIRECTIONS.UP:
				if (position.y - TOOLTIP_MARGIN_PX <= 0) direction = TOOLTIP_DIRECTIONS.DOWN;
				break;
			case TOOLTIP_DIRECTIONS.DOWN:
				if (position.y + this.tooltip.offsetHeight > window.innerHeight) direction = TOOLTIP_DIRECTIONS.UP;
				break;
			case TOOLTIP_DIRECTIONS.LEFT:
				if (position.x - TOOLTIP_MARGIN_PX <= 0) direction = TOOLTIP_DIRECTIONS.RIGHT;
				break;
			case TOOLTIP_DIRECTIONS.RIGHT:
				if (position.x + this.tooltip.offsetWidth > window.innerWith) direction = TOOLTIP_DIRECTIONS.LEFT;
				break;
		}

		game.tooltip._setAnchor(direction);

		// Detect whether the item description is overflowing
		if (tooltip.classList.contains("item-tooltip")) {
			const description = tooltip.querySelector(".description");
			description?.classList.toggle("overflowing", description.clientHeight < description.scrollHeight);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prevent middle mouse button from triggering scrolling when attempting to lock within another locked tooltip.
	 */
	static activateListeners() {
		document.addEventListener(
			"pointerdown",
			event => {
				if (event.button === 1 && event.target.closest(".locked-tooltip")) event.preventDefault();
			},
			{ capture: true }
		);
	}
}
