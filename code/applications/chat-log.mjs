import BlackFlagChatMessage from "../documents/chat-message.mjs";

export default class BlackFlagChatLog extends ChatLog {
	/** @inheritDoc */
	async updateMessage(message, notify = false) {
		const element = this.element[0].querySelector(`.message[data-message-id="${message.id}"]`);
		if (element)
			message._trayStates = new Map(
				Array.from(element.querySelectorAll(BlackFlagChatMessage.TRAY_TYPES.join(", "))).map(t => [t.tagName, t.open])
			);

		await super.updateMessage(message, notify);
	}
}
