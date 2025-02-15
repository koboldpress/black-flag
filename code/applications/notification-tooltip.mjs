import BFApplication from "./api/application.mjs";

/**
 * Tooltip that displays notifications on a sheet.
 */
export default class NotificationTooltip extends BFApplication {
	constructor(doc, notificationKeys, options = {}) {
		super(options);
		this.document = doc;
		this.notificationKeys = notificationKeys;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static DEFAULT_OPTIONS = {
		window: {
			frame: false,
			positioned: false
		}
	};

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static PARTS = {
		tooltip: {
			template: "systems/black-flag/templates/notification-tooltip.hbs"
		}
	};

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
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	_insertElement(element) {}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		context.notifications = this.notificationKeys
			.reduce((arr, k) => {
				let doc = this.document;
				let notification = this.document.notifications.get(k);
				if (!notification) {
					const [first, ...rest] = k.split(".");
					if (rest?.length) doc = this.document.items.get(first);
					k = rest.join(".") ?? split[0];
					notification = doc?.notifications?.get(k);
				}
				if (!notification) return arr;
				notification = foundry.utils.deepClone(notification);
				notification.badge = this.constructor.generateBadge([notification], doc.uuid, { displayOrder: true });
				arr.push(notification);
				return arr;
			}, [])
			.sort((lhs, rhs) => lhs.order - rhs.order);
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Activate global tooltip listeners on the page.
	 */
	static activateListeners() {
		document.body.addEventListener(
			"pointerenter",
			event => {
				const element = event.target;
				if (!element.classList.contains("notification-badge")) return;
				this.renderTooltip(element);
			},
			true
		);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Generate a badge for the provided set of notifications.
	 * @param {object[]} notifications - Notifications for which to generate the badge.
	 * @param {string} uuid - UUID of the document to which these notifications belong.
	 * @param {object} [options={}]
	 * @param {boolean} [options.displayOrder=false] - Should a number be displayed for the order?
	 * @returns {string}
	 */
	static generateBadge(notifications, uuid, { displayOrder = false } = {}) {
		let level = "info";
		let order = Infinity;
		for (const notification of notifications) {
			if (notification.level && notification.level !== level) {
				if (notification.level === "error") level = "error";
				else if (notification.level === "warn" && level !== "error") level = "warn";
			}
			if (notification.order && notification.order < order) order = notification.order;
		}

		let center;
		if (Number.isFinite(order) && displayOrder) {
			center = `<span class="order">${order}</span>`;
		} else {
			center = `<i class="${CONFIG.BlackFlag.notificationLevels[level]?.symbol ?? ""}"></i>`;
		}

		const keys = notifications.map(n => n.key).join(";");
		return `<div class="notification-badge" data-uuid="${uuid}" data-notification-level="${level}" data-notification-keys="${keys}">${center}</div>`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Render this app to a tooltip.
	 * @param {HTMLElement} element - The element to which the tooltip should be attached.
	 */
	static async renderTooltip(element) {
		const keys = element.dataset.notificationKeys?.split(";");
		const uuid = element.dataset.uuid;
		if (!keys || !uuid) return;
		const doc = await fromUuid(uuid);
		const tooltip = new NotificationTooltip(doc, keys);
		await tooltip.render({ force: true });
		game.tooltip.activate(element, { content: tooltip.element, cssClass: "notification-tooltip" });
	}
}
