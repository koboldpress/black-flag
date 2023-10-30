import ConditionSheet from "../../applications/item/condition-sheet.mjs";
import { numberFormat } from "../../utils/_module.mjs";
import ItemDataModel from "../abstract/item-data-model.mjs";
import { IdentifierField } from "../fields/_module.mjs";

const { HTMLField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Condition items.
 */
export default class ConditionData extends ItemDataModel {
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "condition",
			category: "meta",
			localization: "BF.Item.Type.Condition",
			icon: "fa-solid fa-explosion",
			sheet: {
				application: ConditionSheet,
				label: "BF.Sheet.Default.Condition"
			},
			register: {
				cache: true
			}
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	static defineSchema() {
		return this.mergeSchema(super.defineSchema(), {
			description: new SchemaField({
				value: new HTMLField({label: "BF.Item.Description.Label", hint: "BF.Item.Description.Hint"}),
				source: new StringField({label: "BF.Item.Source.Label", hint: "BF.Item.Source.Hint"})
			}),
			identifier: new SchemaField({
				value: new IdentifierField()
			})
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Effect ordered by level.
	 * @type {{ level: number, effect: BlackFlagActiveEffect }}
	 */
	get levels() {
		const flagKey = "flags.black-flag.condition.level";
		return this.parent.effects.contents
			.map(effect => ({
				level: foundry.utils.getProperty(effect, flagKey),
				effect
			}))
			.sort((lhs, rhs) => lhs.level - rhs.level);
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a new Active Effect for a level.
	 * @returns {Promise<ActiveEffect>}
	 */
	async addLevel() {
		const levels = this.levels;
		const appendLevel = levels.length > 0;
		const newLevel = (levels.pop()?.level ?? 0) + 1;
		const data = {
			name: this._effectName(newLevel, appendLevel),
			icon: this.parent.img,
			"flags.black-flag.condition": {
				level: newLevel
			},
			statuses: [this.parent.identifier]
		};
		if ( this.parent.effects.size === 1 ) {
			await this.parent.updateEmbeddedDocuments("ActiveEffect", this.parent.effects.contents.map(e => {
				const level = foundry.utils.getProperty(e, "flags.black-flag.condition.level");
				return { _id: e.id, name: this._effectName(level, true) };
			}));
		}
		return await this.parent.createEmbeddedDocuments("ActiveEffect", [data])[0];
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Remove an level effect.
	 * @param {string} effectId - ID of the effect to remove.
	 * @returns {Promise}
	 */
	async removeLevel(effectId) {
		await this.parent.deleteEmbeddedDocuments("ActiveEffect", [effectId]);
		if ( this.parent.effects.size === 1 ) {
			await this.parent.updateEmbeddedDocuments("ActiveEffect", this.parent.effects.contents.map(e => {
				const level = foundry.utils.getProperty(e, "flags.black-flag.condition.level");
				return { _id: e.id, name: this._effectName(level, false) };
			}));
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	_effectName(level, appendLevel) {
		if ( !appendLevel ) return this.parent.name;
		return `${this.parent.name} (${game.i18n.format(
			"BF.Level.Specific", { level: numberFormat(level, { spellOut: true }) }
		)})`;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*        Socket Event Handlers        */
	/* <><><><> <><><><> <><><><> <><><><> */

	async _onUpdateDetails(changed, options, userId) {
		if ( userId !== game.user.id ) return;
		const newName = foundry.utils.getProperty(changed, "name");
		const newImg = foundry.utils.getProperty(changed, "img");
		const newIdentifier = foundry.utils.getProperty(changed, "identifier");
		if ( newName || newImg || newIdentifier ) {
			this.parent.updateEmbeddedDocuments("ActiveEffect", this.parent.effects.contents.map(e => {
				const level = foundry.utils.getProperty(e, "flags.black-flag.condition.level");
				return {
					_id: e.id,
					name: this._effectName(level, this.parent.effects.size > 1),
					icon: newImg ?? e.icon,
					statuses: [newIdentifier ?? this.parent.identifier]
				};
			}));
		}
	}
}
