/**
 * Extended version of `CombatTracker` class to support the initiative dialog.
 */
export default class BlackFlagCombatTracker extends (foundry.applications?.sidebar?.tabs?.CombatTracker ??
	CombatTracker) {
	async _onCombatantControl(event, target) {
		const button = target ?? event.target;
		const combatantId = button.closest("[data-combatant-id]").dataset.combatantId;
		const combatant = this.viewed.combatants.get(combatantId);
		const action = button.dataset.control || button.dataset.action;
		if (action === "rollInitiative" && combatant?.actor) {
			return combatant.actor.configureInitiativeRoll({ event });
		}
		return super._onCombatantControl(event);
	}
}
