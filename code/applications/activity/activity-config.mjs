import { log } from "../../utils/_module.mjs";
import PseudoDocumentSheet from "../pseudo-document-sheet.mjs";

/**
 * Base configuration application for activities that can be extended by other types to implement custom
 * editing interfaces.
 */
export default class ActivityConfig extends PseudoDocumentSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["black-flag", "activity-config"],
			tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "details"}],
			template: "systems/black-flag/templates/activities/activity-config.hbs",
			width: 500,
			height: "auto",
			submitOnChange: true,
			closeOnSubmit: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The activity being created or edited.
	 * @type {Activity}
	 */
	get activity() {
		return this.document;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async close(options={}) {
		await super.close(options);
		delete this.activity.apps[this.appId];
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Context Preparation         */
	/* <><><><> <><><><> <><><><> <><><><> */

	async getData(options) {
		const source = this.activity.toObject();
		const activationOptions = CONFIG.BlackFlag.activationOptions({ chosen: source.activation.type });
		const defaultActivation = activationOptions.get(this.item.system.casting?.type)?.label;

		const context = foundry.utils.mergeObject(super.getData(options), {
			activity: this.activity,
			system: this.activity.system,
			source,
			default: {
				title: game.i18n.localize(this.activity.constructor.metadata.title),
				icon: this.activity.constructor.metadata.icon
			},
			enriched: await TextEditor.enrichHTML(source.description ?? "", {
				secrets: true, rollData: this.item.getRollData(), async: true, relativeTo: this.item
			}),
			labels: {
				defaultActivation: defaultActivation ? game.i18n.format("BF.Default.Specific", {
					default: defaultActivation.toLowerCase()
				}) : null
			},
			activation: {
				options: activationOptions,
				scalar: activationOptions.get(this.activity.activation.type)?.scalar ?? false
			},
			showBaseDamage: Object.hasOwn(this.item.system, "damage")
		}, {inplace: false});
		context.CONFIG = CONFIG.BlackFlag;
		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Event Handlers           */
	/* <><><><> <><><><> <><><><> <><><><> */

	activateListeners(jQuery) {
		super.activateListeners(jQuery);
		const html = jQuery[0];

		for ( const element of html.querySelectorAll("[data-action]") ) {
			element.addEventListener("click", this._onAction.bind(this));
		}

		for ( const element of html.querySelectorAll("img[data-edit]") ) {
			element.addEventListener("click", this._onEditIcon.bind(this));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle a sheet action.
	 * @param {ClickEvent} event - The click event.
	 * @returns {Promise}
	 */
	_onAction(event) {
		const { action, subAction } = event.currentTarget.dataset;
		return log(`Unrecognized action: ${action}/${subAction}`, { level: "warn" });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Handle changing a Activity's icon.
	 * @param {ClickEvent} event - The click event.
	 * @returns {Promise}
	 */
	_onEditIcon(event) {
		const attr = event.currentTarget.dataset.edit;
		const current = foundry.utils.getProperty(this.activity, attr);
		const fp = new FilePicker({
			current,
			type: "image",
			redirectToRoot: [this.activity.constructor.metadata.icon],
			callback: path => {
				event.currentTarget.src = path;
				if ( this.options.submitOnChange ) return this._onSubmit(event);
			},
			top: this.position.top + 40,
			left: this.position.left + 10
		});
		return fp.browse();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	async _updateObject(event, formData) {
		const updates = foundry.utils.expandObject(formData);

		// TODO: Find a way to move this behavior into DamageListElement & ConsumptionElement
		if ( foundry.utils.hasProperty(updates, "system.damage.parts") ) {
			updates.system.damage.parts = Object.entries(updates.system.damage.parts).reduce((arr, [k, v]) => {
				arr[k] = v;
				return arr;
			}, []);
		}
		if ( foundry.utils.hasProperty(updates, "consumption.targets") ) {
			updates.consumption.targets = Object.entries(updates.consumption.targets).reduce((arr, [k, v]) => {
				arr[k] = v;
				return arr;
			}, []);
		}

		await this.activity.update(updates);
	}
}
