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
	 * Activate global tooltip listeners on the page.
	 */
	static activateListeners() {
		document.body.addEventListener("pointerenter", event => {
			const element = event.target;
			if ( !element.classList.contains("notification-badge") ) return;
			this.renderTooltip(element);
		}, true);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a badge for the provided set of notifications.
	 * @param {object[]} notifications - Notifications for which to generate the badge.
	 * @param {string} uuid - UUID of the document to which these notifications belong.
	 * @param {object} [options={}]
	 * @param {boolean} [options.displayOrder=false] - Should a number be displayed for the order?
	 * @returns {string}
	 */
	static generateBadge(notifications, uuid, { displayOrder=false }={}) {
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
		return `<div class="notification-badge" data-uuid="${uuid}" data-notification-level="${
			level}" data-notification-keys="${keys}">${center}</div>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Render this app to a tooltip.
	 * @param {HTMLElement} element - The element to which the tooltip should be attached.
	 */
	static async renderTooltip(element) {
		const keys = element.dataset.notificationKeys.split(";");
		const uuid = element.dataset.uuid;
		if ( !keys || !uuid ) return;
		const document = await fromUuid(uuid);
		const tooltip = new NotificationTooltip(document, keys);
		const context = await tooltip.getData(this.options);
		const content = (await tooltip._renderInner(context))[0];
		game.tooltip.activate(element, { content, cssClass: "notification-tooltip" });
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
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
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const context = await super.getData(options);
		context.notifications = this.notificationKeys
			.reduce((arr, k) => {
				const split = k.split(".");
				const doc = split.length > 1 ? this.document.items.get(split[0]) : this.document;
				k = split[1] ?? split[0];
				const data = foundry.utils.deepClone(doc?.notifications?.get(k));
				if ( !data ) return arr;
				data.badge = this.constructor.generateBadge([data], doc.uuid, {displayOrder: true});
				arr.push(data);
				return arr;
			}, []).sort((lhs, rhs) => lhs.order - rhs.order);
		return context;
	}
}
