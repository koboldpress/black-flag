import { MappingField } from "../../fields/_module.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * Data definition template for actors with spellcasting.
 */
export default class SpellcastingTemplate extends foundry.abstract.DataModel {

	/** @override */
	static defineSchema() {
		return {
			spellcasting: new SchemaField({
				slots: new MappingField(new SchemaField({
					spent: new NumberField({nullable: false, min: 0, initial: 0, integer: true}),
					override: new NumberField({integer: true, min: 0})
				}))
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*            Data Migration           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Migrate spell rings to circles.
	 * Added in 0.9.023, updated in 0.9.037
	 * @param {object} source - Candidate source data to migrate.
	 */
	static migrateCircles(source) {
		if ( "spellcasting" in source ) {
			if ( "rings" in source.spellcasting ) source.spellcasting.slots = foundry.utils.mergeObject(
				source.spellcasting.slots ?? {}, source.spellcasting.rings
			);
			if ( "circles" in source.spellcasting ) source.spellcasting.slots = foundry.utils.mergeObject(
				source.spellcasting.slots ?? {}, source.spellcasting.circles
			);
		}
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
		if ( Hooks.call(
			`blackFlag.compute${type.capitalize()}Progression`, progression, cls, { actor, levels, spellcasting, count }
		) === false ) return;

		if ( type === "leveled" ) this.computeLeveledProgression(progression, cls, { actor, levels, spellcasting, count });
		else if ( type === "pact" ) this.computePactProgression(progression, cls, { actor, levels, spellcasting, count });
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
		if ( prog ) {
			const roundUp = prog.roundUp !== undefined ? prog.roundUp : count === 1;
			this._computeRoundedProgression(progression, levels, prog.divisor, roundUp);
			if ( spellcasting?.cantrips.formula ) progression.cantrips = true;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Contribute to the actor's spellcasting progression for a class with pact spellcasting.
	 * @param {object} progression - Spellcasting progression data. *Will be mutated.*
	 * @param {BlackFlagItem} cls - Class for whom this progression is being computed.
	 * @param {object} config
	 * @param {BlackFlagActor} [config.actor] - Actor for whom the data is being prepared.
	 * @param {number} [config.levels=1] - Number of levels for the class.
	 * @param {SpellcastingConfigurationData} config.spellcasting - Spellcasting descriptive object.
	 * @param {number} [config.count=1] - Number of classes with this type of spellcasting.
	 */
	static computePactProgression(progression, cls, { actor, levels=1, spellcasting, count=1 }) {
		this._computeRoundedProgression(progression, levels, 2);
		progression.pact ??= {};
		progression.pact.circle = Math.max(progression.pact.circle ?? -Infinity, spellcasting.maxCircle);
		progression.pact.slots = Math.max(
			progression.pact.slots ?? 0,
			spellcasting.slots.scaleValue?.valueForLevel(levels) ?? 0
		);
		if ( spellcasting?.cantrips.formula ) progression.cantrips = true;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Adjust the leveled count based on a divided and rounded levels value.
	 * @param {object} progression - Spellcasting progression data. *Will be mutated.*
	 * @param {number} levels - Number of levels for the class.
	 * @param {number} [divisor=1] - Amount by which to divide the levels.
	 * @param {boolean} [roundUp=false] - Should it be rounded up rather than down?
	 */
	static _computeRoundedProgression(progression, levels, divisor=1, roundUp=false) {
		const rounding = roundUp ? Math.ceil : Math.floor;
		progression.leveled += rounding(levels / divisor);
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare actor's spell slots using progression data.
	 * @param {object} spells - The `system.spellcasting.slots` object within actor's data. *Will be mutated.*
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
		if ( Hooks.call(`blackFlag.prepare${type.capitalize()}Slots`, spells, progression, { actor }) === false ) return;

		if ( type === "leveled" ) this.prepareLeveledSlots(spells, progression, { actor });
		else if ( type === "pact" ) this.preparePactSlots(spells, progression, { actor });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare leveled spell slots using progression data.
	 * @param {object} spells - The `system.spellcasting.slots` object within actor's data. *Will be mutated.*
	 * @param {object} progression - Spellcasting progression data.
	 * @param {object} config
	 * @param {BlackFlagActor} [config.actor] - Actor for whom the data is being prepared.
	 */
	static prepareLeveledSlots(spells, progression, { actor }) {
		// Prepare cantrips
		if ( progression.cantrips ) {
			const cantrips = spells.cantrip ??= { spent: 0 };
			cantrips.max = Infinity;
			Object.defineProperty(cantrips, "level", { value: 0, enumerable: false, writable: false });
			Object.defineProperty(cantrips, "label", {
				value: CONFIG.BlackFlag.spellCircles({ plural: true })[0] ?? "", enumerable: false
			});
		}

		const levels = Math.clamp(progression.leveled, 0, CONFIG.BlackFlag.maxLevel);
		const slots = CONFIG.BlackFlag.spellSlotTable[Math.min(levels, CONFIG.BlackFlag.spellSlotTable.length)] ?? [];
		for ( const level of Array.fromRange(CONFIG.BlackFlag.maxSpellCircle, 1) ) {
			const slot = spells[`circle-${level}`] ??= { spent: 0 };
			slot.allowOverride = true;
			slot.maxPlaceholder = slots[level] ?? 0;
			slot.max = Number.isNumeric(slot.override) ? Math.max(parseInt(slot.override), 0) : slot.maxPlaceholder;
			Object.defineProperty(slot, "type", { value: "leveled", enumerable: false, writable: false });
			Object.defineProperty(slot, "circle", { value: level, enumerable: false, writable: false });
			Object.defineProperty(slot, "label", {
				value: CONFIG.BlackFlag.spellCircles({ plural: true })[level] ?? "", enumerable: false
			});
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Prepare pact spell slots using progression data.
	 * @param {object} spells - The `system.spellcasting.slots` object within actor's data. *Will be mutated.*
	 * @param {object} progression - Spellcasting progression data.
	 * @param {object} config
	 * @param {BlackFlagActor} [config.actor] - Actor for whom the data is being prepared.
	 */
	static preparePactSlots(spells, progression, { actor }) {
		const slot = spells.pact ??= { spent: 0 };
		slot.allowOverride = true;
		slot.maxPlaceholder = progression.pact.slots ?? 0;
		slot.max = Number.isNumeric(slot.override) ? Math.max(parseInt(slot.override), 0) : slot.maxPlaceholder;
		Object.defineProperty(slot, "type", { value: "pact", enumerable: false, writable: false });
		Object.defineProperty(slot, "circle", { value: progression.pact.circle ?? 1, enumerable: false, writable: false });
		const circle = CONFIG.BlackFlag.spellCircles({ plural: true })[slot.circle];
		Object.defineProperty(slot, "label", {
			value: game.i18n.format("BF.Spellcasting.Type.Pact.Section", { circle, circleLowercase: circle.toLowerCase() }),
			enumerable: false
		});
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Resting               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Perform any spell slot recovery needed for this rest.
	 * @param {string} type - Type of spellcasting slots being recovered.
	 * @param {RestConfiguration} [config={}] - Configuration options for the rest.
	 * @param {RestResult} [result={}] - Rest result being constructed.
	 */
	getRestSpellcastingRecovery(type, config={}, result={}) {
		/**
		 * Perform any spell slot recovery needed for this rest.
		 * The actual hook names include the spellcasting type (e.g. `blackFlag.getRestLeveledRecovery`).
		 * @param {object} config
		 * @param {BlackFlagActor} config.actor - Actor being rested.
		 * @param {string} config.type - Type of spellcasting slots being recovered.
		 * @param {RestConfiguration} config.config - Configuration options for the rest.
		 * @param {RestResult} config.result - Rest result being constructed.
		 * @returns {boolean} - Explicitly return false to prevent default rest recovery from being performed.
		 * @function blackFlag.getRestRecovery
		 * @memberof hookEvents
		 */
		if ( Hooks.call(`blackFlag.getRest${type.capitalize()}Recovery`, {
			actor: this.parent, type, config, result
		}) === false ) return;

		for ( const [key, slot] of Object.entries(this.spellcasting.slots) ) {
			if ( slot.type !== type ) continue;
			result.actorUpdates[`system.spellcasting.slots.${key}.spent`] = 0;
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Calculate the cantrip scaling for a given level.
	 * @param {number} level - Player level or NPC challenge rating.
	 * @returns {number}
	 */
	static calculateCantripScale(level) {
		return Math.floor((level + 1) / 6);
	}
}
