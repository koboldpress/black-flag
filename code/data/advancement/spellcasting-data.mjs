import FilterField from "../fields/filter-field.mjs";
import FormulaField from "../fields/formula-field.mjs";

const { BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Configuration data for the Spellcasting advancement.
 */
export class SpellcastingConfigurationData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			type: new StringField({initial: "leveled", label: "BF.Spellcasting.Type.Label"}),
			progression: new StringField({
				label: "BF.Spellcasting.Progression.Label", hint: "BF.Spellcasting.Progression.Hint"
			}),
			circle: new StringField({label: "BF.Spell.Circle.Label"}),
			focus: new StringField(),
			cantrips: new SchemaField({
				formula: new FormulaField({deterministic: true})
			}, {label: "BF.Spellcasting.CantripsKnown.Label", hint: "BF.Spellcasting.CantripsKnown.Hint"}),
			rituals: new SchemaField({
				formula: new FormulaField({deterministic: true})
			}, {label: "BF.Spellcasting.RitualsKnown.Label", hint: "BF.Spellcasting.RitualsKnown.Hint"}),
			spells: new SchemaField({
				formula: new FormulaField({deterministic: true}),
				mode: new StringField({
					label: "BF.Spellcasting.Learning.Mode.Label", hint: "BF.Spellcasting.Learning.Mode.Hint"
				}),
				replacement: new BooleanField({
					initial: true, label: "BF.Spellcasting.Learning.Replacement.Label",
					hint: "BF.Spellcasting.Learning.Replacement.Hint"
				}),
				restriction: new FilterField({
					label: "BF.Spellcasting.Restriction.Label", hint: "BF.Spellcasting.Restriction.Hint"
				}),
				spellbook: new SchemaField({
					firstLevel: new NumberField({integer: true, min: 0, label: "BF.Spellbook.FreeSpells.FirstLevel"}),
					otherLevels: new NumberField({integer: true, min: 0, label: "BF.Spellbook.FreeSpells.OtherLevels"})
				}, {label: "BF.Spellbook.FreeSpells.Label", hint: "BF.Spellbook.FreeSpells.Hint"})
			}, {label: "BF.Spellcasting.SpellsKnown.Label", hint: "BF.Spellcasting.SpellsKnown.Hint"})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Properties             */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * The ability used for spellcasting.
	 * @type {string|null}
	 */
	get ability() {
		const keyAbility = this.parent.item?.system.advancement.byType("keyAbility")[0];
		return keyAbility?.value?.selected ?? null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Summary label for this spellcasting configuration.
	 * @type {string}
	 */
	get label() {
		const circle = CONFIG.BlackFlag.spellCircles[this.circle]?.label;
		const prepared = this.preparation ? "BF.Spellcasting.Preparation.Trait" : null;
		const typeConfig = CONFIG.BlackFlag.spellcastingTypes[this.type];
		const progression = typeConfig?.progression?.[this.progression]?.trait ?? typeConfig?.trait;
		return game.i18n.format("BF.Spellcasting.Trait.Display", {
			circle: circle ? game.i18n.localize(circle) : "",
			prepared: prepared ? game.i18n.localize(prepared) : "",
			progression: progression ? game.i18n.localize(progression) : ""
		}).trim();
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	prepareData() {
		const regex = /@scale\.(?:[a-z0-9_-]+)\.([a-z0-9_-]+)/i;
		const scaleValues = this.parent.item.system?.advancement.byType("scaleValue") ?? [];

		const prepareScale = obj => {
			const matches = (obj.formula ?? "").match(regex) ?? [];
			Object.defineProperty(obj, "scaleValue", {
				get() {
					return scaleValues?.find(s => s.identifier === matches[1]);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(obj, "displayFormula", {
				get() {
					if ( !obj.formula ) return false;
					if ( obj.formula.trim() !== matches[0] ) return true;
					return !this.scaleValue;
				},
				configurable: true,
				enumerable: false
			});
		};

		prepareScale(this.cantrips);
		prepareScale(this.rituals);
		prepareScale(this.spells);
	}
}
