export default class NotificationTooltip extends Application {
	constructor(document, notificationKeys, options={}) {
		super(options);
		this.document = document;
		this.notificationKeys = notificationKeys;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/black-flag/templates/notification-tooltip.hbs"
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Activate tooltip listeners on the provided HTML.
	 * @param {Document} document - Document which contains the necessary notification information.
	 * @param {Element} html
	 */
	static activateListeners(document, html) {
		const activateTooltip = event => {
			const keys = event.currentTarget.dataset.notificationKeys.split(";");
			const tooltip = new NotificationTooltip(document, keys);
			tooltip.renderTooltip(event.currentTarget);
		};
		for ( const element of html.querySelectorAll(".notification-badge") ) {
			element.addEventListener("pointerenter", activateTooltip);
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a badge for the provided set of notifications.
	 * @param {object[]} notifications - Notifications for which to generate the badge.
	 * @param {object} [options={}]
	 * @param {boolean} [options.displayOrder=false] - Should a number be displayed for the order?
	 * @returns {string}
	 */
	static generateBadge(notifications, { displayOrder=false }={}) {
		let level = "info";
		let order = Infinity;
		for ( const notification of notifications ) {
			if ( notification.level && notification.level !== level ) {
				if ( notification.level === "error" ) level = "error";
				else if ( (notification.level === "warn") && (level !== "error") ) level = "warn";
			}
			if ( notification.order && (notification.order < order) ) order = notification.order;
		}

		let center;
		if ( Number.isFinite(order) && displayOrder ) {
			center = `<span class="order">${order}</span>`;
		} else {
			center = `<i class="${CONFIG.BlackFlag.notificationLevels[level]?.symbol ?? ""}"></i>`;
		}

		const keys = notifications.map(n => n.key).join(";");
		return `<div class="notification-badge" data-notification-level="${level}" data-notification-keys="${keys}">${center}</div>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Document for which the notifications should be displayed.
	 * @param {Document}
	 */
	document;

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Notifications that should be displayed in the tooltip.
	 * @param {string[]}
	 */
	notificationKeys;

	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.notifications = this.notificationKeys
			.reduce((arr, k) => {
				const data = foundry.utils.deepClone(this.document.notifications?.get(k));
				if ( !data ) return arr;
				data.badge = this.constructor.generateBadge([data], {displayOrder: true});
				arr.push(data);
				return arr;
			}, []).sort((lhs, rhs) => lhs.order - rhs.order);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Render this app to a tooltip.
	 * @param {HTMLElement} element - The element to which the tooltip should be attached.
	 */
	async renderTooltip(element) {
		const context = await this.getData(this.options);
		const content = (await this._renderInner(context))[0];
		game.tooltip.activate(element, { content, cssClass: "notification-tooltip" });
	}
}
