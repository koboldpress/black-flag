import BlackFlagChatMessage from "../documents/chat-message.mjs";

export default class BlackFlagChatLog extends (foundry.applications?.sidebar?.tabs?.ChatLog ?? ChatLog) {
	/** @inheritDoc */
	async updateMessage(message, notify = false) {
		const element = this.element instanceof HTMLElement ? this.element : this.element[0];
		const card = element.querySelector(`.message[data-message-id="${message.id}"]`);
		if (card)
			message._trayStates = new Map(
				Array.from(card.querySelectorAll(BlackFlagChatMessage.TRAY_TYPES.join(", "))).map(t => [t.tagName, t.open])
			);

		await super.updateMessage(message, notify);
	}
}
