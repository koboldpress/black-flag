/**
 * Extended version of ChatMessage to highlight critical damage, support luck modifications, and other system features.
 */
export default class BlackFlagChatMessage extends ChatMessage {
	async getHTML() {
		const jQuery = await super.getHTML();
		if ( !this.isContentVisible ) return jQuery;
		const html = jQuery[0];

		if ( this.isRoll ) {
			this._highlightRollResults(html);
		}

		return jQuery;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Add classes to roll results to indicate successes and failures.
	 * @param {HTMLElement} html - Chat message HTML.
	 */
	_highlightRollResults(html) {
		const rollResults = html.querySelectorAll(".dice-roll");
		for ( const [index, roll] of this.rolls.entries() ) {
			const result = rollResults[index];
			if ( !result ) return;
			if ( roll.isCriticalSuccess ) result.classList.add("critical-success");
			else if ( roll.isCriticalFailure ) result.classList.add("critical-failure");
			if ( roll.isSuccess ) result.classList.add("success");
			else if ( roll.isFailure ) result.classList.add("failure");
		}
	}
}
