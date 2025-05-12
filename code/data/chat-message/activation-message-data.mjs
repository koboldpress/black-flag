import ChatMessageDataModel from "../abstract/chat-message-data-model.mjs";
import ActorDeltasField from "./fields/deltas-field.mjs";

const { ArrayField, DocumentIdField, ObjectField, StringField } = foundry.data.fields;

/**
 * @import { ActorDeltasData } from "./fields/deltas-field.mjs";
 */

/**
 * Data stored in a combat turn chat message.
 *
 * @property {string} [cause] - Relative ID of the activity that caused this one on the same actor.
 * @property {ActivityDeltasData} deltas - Actor/item consumption from this turn change.
 * @property {string[]} effects - Effects that can be applied.
 */
export default class ActivationMessageData extends ChatMessageDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static defineSchema() {
		return {
			cause: new StringField(),
			deltas: new ActorDeltasField(
				{
					created: new ArrayField(new DocumentIdField()),
					deleted: new ArrayField(new ObjectField())
				},
				{ initial: null, nullable: true }
			),
			effects: new ArrayField(new DocumentIdField())
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static metadata = Object.freeze(
		foundry.utils.mergeObject(
			super.metadata,
			{
				template: "systems/black-flag/templates/chat/activation-card.hbs"
			},
			{ inplace: false }
		)
	);

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The activity for the chat message.
	 * @type {Activity}
	 */
	get activity() {
		return this.parent.getAssociatedActivity();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The actor belonging to the combatant.
	 * @type {BlackFlagActor}
	 */
	get actor() {
		return this.parent.getAssociatedActor();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The item for the chat message.
	 * @type {BlackFlagItem}
	 */
	get item() {
		return this.parent.getAssociatedItem();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Rendering              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _prepareContext(options) {
		return {
			content: await (foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor).enrichHTML(
				this.parent.content,
				{ rollData: this.parent.getRollData() }
			),
			effects: this.effects
				.map(id => this.item?.effects.get(id))
				.filter(e => e && (game.user.isGM || e.transfer & (this.author.id === game.user.id)))
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	_onRender(element) {
		super._onRender(element);
		this.activity?.onRenderChatCard(this.parent, element);
		this._renderButtons(element);
		this.activity?.activateChatListeners(this.parent, element);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Control visibility of chat card action buttons based on viewing user.
	 * @param {HTMLElement} element - Rendered contents of the message.
	 * @protected
	 */
	_renderButtons(element) {
		if (this.parent.shouldDisplayChallenge) element.dataset.displayChallenge = "";

		const isCreator = game.user.isGM || this.actor?.isOwner || this.parent.author.id === game.user.id;
		for (const button of element.querySelectorAll(".menu button")) {
			if (this.activity?.shouldHideChatButton(button, this)) button.hidden = true;
			if (button.dataset.visibility === "all") continue;
			if ((button.dataset.visibility === "gm" && !game.user.isGM) || !isCreator) button.hidden = true;
		}
	}
}
