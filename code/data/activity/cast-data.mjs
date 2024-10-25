import ActivityDataModel from "../abstract/activity-data-model.mjs";

const { BooleanField, DocumentUUIDField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Configuration data for the save activity.
 *
 * @property {object} spell
 * @property {object} spell.challenge
 * @property {number} spell.challenge.attack - Flat to hit bonus in place of the spell's normal attack bonus.
 * @property {number} spell.challenge.save - Flat DC to use in place of the spell's normal save DC.
 * @property {boolean} spell.challenge.override - Use custom attack bonus & DC rather than creature's.
 * @property {number} spell.circle - Base circle at which to cast the spell.
 * @property {Set<string>} spell.properties - Spell components & tags to ignore while casting.
 * @property {string} spell.uuid - UUID of the spell to cast.
 */
export class CastData extends ActivityDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.CAST"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			spell: new SchemaField({
				challenge: new SchemaField({
					attack: new NumberField(),
					save: new NumberField(),
					override: new BooleanField()
				}),
				circle: new NumberField(),
				properties: new SetField(new StringField(), { initial: ["verbal", "somatic", "material"] }),
				uuid: new DocumentUUIDField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*             Properties              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Return a string describing the result if the default ability is selected for this activity.
	 * @type {string|null}
	 */
	get defaultAbility() {
		return null;
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareData() {
		const spell = fromUuidSync(this.spell.uuid, { strict: false });
		if (spell) {
			if (!this.parent._source.name) this.parent.name = spell.name;
			if (!this.parent._source.img) this.parent.img = spell.img;
		}
		super.prepareData();
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	prepareFinalData() {
		super.prepareFinalData();

		for (const field of ["activation", "duration", "range", "target"]) {
			Object.defineProperty(this.parent[field], "canOverride", {
				value: true,
				configurable: true,
				enumerable: false
			});
		}
	}
}
