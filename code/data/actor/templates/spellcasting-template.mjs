import { MappingField } from "../../fields/_module.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * Data definition template for actors with spellcasting.
 */
export default class SpellcastingTemplate extends foundry.abstract.DataModel {

	static defineSchema() {
		return {
			spellcasting: new SchemaField({
				rings: new MappingField(new SchemaField({
					spent: new NumberField({nullable: false, min: 0, initial: 0, integer: true}),
					override: new NumberField({integer: true, min: 0})
				}))
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contribute to the actor's spellcasting progression.
	 * @param {object} progression - Spellcasting progression data. *Will be mutated.*
	 * @param {BlackFlagItem} cls - Class for which this progression is being computed.
	 * @param {object} [config={}]
	 * @param {BlackFlagActor} [config.actor] - Actor for whom the data is being prepared.
	 * @param {number} [config.levels=1] - Number of levels for the class.
	 * @param {SpellcastingConfigurationData} [config.spellcasting] - Spellcasting descriptive object.
	 * @param {number} [config.count=1] - Number of classes with this type of spellcasting.
	 */
	static computeClassProgression(progression, cls, { actor, levels=1, spellcasting, count=1 }={}) {
		spellcasting = spellcasting ?? cls.system.spellcasting;
		const type = spellcasting.type;

		/**
		 * A hook event that fires while computing the spellcasting progression for each class on each actor.
		 * The actual hook names include the spellcasting type (e.g. `blackFlag.computeLeveledProgression`).
		 * @param {object} progression - Spellcasting progression data. *Will be mutated.*
		 * @param {BlackFlagItem} cls - Class for whom this progression is being computed.
		 * @param {object} config
		 * @param {BlackFlagActor} [config.actor] - Actor for whom the data is being prepared.
		 * @param {number} config.levels - Number of levels for the class.
		 * @param {SpellcastingConfigurationData} config.spellcasting - Spellcasting descriptive object.
		 * @param {number} [config.count] - Number of classes with this type of spellcasting.
		 * @returns {boolean}  Explicitly return false to prevent default progression from being calculated.
		 * @function blackFlag.computeSpellcastingProgression
		 * @memberof hookEvents
		 */
		const allowed = Hooks.call(
			`blackFlag.compute${type.capitalize()}Progression`, progression, cls, { actor, levels, spellcasting, count }
		);

		if ( allowed && (type === "leveled") ) {
			this.computeLeveledProgression(progression, cls, { actor, levels, spellcasting, count });
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contribute to the actor's spellcasting progression for a class with leveled spellcasting.
	 * @param {object} progression - Spellcasting progression data. *Will be mutated.*
	 * @param {BlackFlagItem} cls - Class for whom this progression is being computed.
	 * @param {object} config
	 * @param {BlackFlagActor} [config.actor] - Actor for whom the data is being prepared.
	 * @param {number} [config.levels=1] - Number of levels for the class.
	 * @param {SpellcastingConfigurationData} config.spellcasting - Spellcasting descriptive object.
	 * @param {number} [config.count=1] - Number of classes with this type of spellcasting.
	 */
	static computeLeveledProgression(progression, cls, { actor, levels=1, spellcasting, count=1 }) {
		const prog = CONFIG.BlackFlag.spellcastingTypes.leveled.progression[spellcasting.progression];
		if ( !prog ) return;

		const rounding = (count === 1) || prog.roundUp ? Math.ceil : Math.floor;
		progression.leveled += rounding(levels / (prog.divisor ?? 1));
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare actor's spell slots using progression data.
	 * @param {object} spells - The `system.spellcasting.rings` object within actor's data. *Will be mutated.*
	 * @param {string} type - Type of spellcasting slots being prepared.
	 * @param {object} progression - Spellcasting progression data.
	 * @param {object} [config]
	 * @param {BlackFlagActor} [config.actor] - Actor for whom the data is being prepared.
	 */
	static prepareSpellcastingSlots(spells, type, progression, { actor }={}) {
		/**
		 * A hook event that fires to convert the provided spellcasting progression into spell slots.
		 * The actual hook names include the spellcasting type (e.g. `blackFlag.prepareLeveledSlots`).
		 * @param {object} spells - The `system.spells` object within actor's data. *Will be mutated.*
		 * @param {object} progression - Spellcasting progression data.
		 * @param {object} config
		 * @param {BlackFlagActor} [config.actor] - Actor for whom the data is being prepared.
		 * @returns {boolean} - Explicitly return false to prevent default preparation from being performed.
		 * @function blackFlag.prepareSpellcastingSlots
		 * @memberof hookEvents
		 */
		const allowed = Hooks.call(`blackFlag.prepare${type.capitalize()}Slots`, spells, progression, { actor });

		if ( allowed && (type === "leveled") ) this.prepareLeveledSlots(spells, progression, { actor });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare leveled spell slots using progression data.
	 * @param {object} spells - The `system.spellcasting.rings` object within actor's data. *Will be mutated.*
	 * @param {object} progression - Spellcasting progression data.
	 * @param {object} config
	 * @param {BlackFlagActor} [config.actor] - Actor for whom the data is being prepared.
	 */
	static prepareLeveledSlots(spells, progression, { actor }) {
		// Prepare cantrips
		const cantrips = spells.cantrip ??= { spent: 0 };
		cantrips.max = Infinity;
		Object.defineProperty(cantrips, "level", { value: 0, enumerable: false, writable: false });
		Object.defineProperty(cantrips, "label", {
			value: CONFIG.BlackFlag.spellRings(true)[0] ?? "", enumerable: false
		});
		// TODO: Only add cantrips if at least one class can cast them (no need on Paladins)

		const levels = Math.clamped(progression.leveled, 0, CONFIG.BlackFlag.maxLevel);
		const slots = CONFIG.BlackFlag.spellSlotTable[Math.min(levels, CONFIG.BlackFlag.spellSlotTable.length)] ?? [];
		for ( const level of Array.fromRange(CONFIG.BlackFlag.maxSpellRing, 1) ) {
			const slot = spells[`ring-${level}`] ??= { spent: 0 };
			slot.max = Number.isNumeric(slot.override) ? Math.max(parseInt(slot.override), 0) : slots[level] ?? 0;
			Object.defineProperty(slot, "level", { value: level, enumerable: false, writable: false });
			Object.defineProperty(slot, "label", {
				value: CONFIG.BlackFlag.spellRings(true)[level] ?? "", enumerable: false
			});
		}
	}
}
