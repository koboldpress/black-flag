const { ArrayField, StringField } = foundry.data.fields;

/**
 * Field for storing proficiency.
 */
export default class CreatureTypeField extends foundry.data.fields.SchemaField {
	constructor(fields={}, options={}) {
		fields = {
			value: new StringField({initial: "humanoid", label: "BF.CreatureType.Label"}),
			tags: new ArrayField(new StringField(), {label: "BF.CreatureType.Tag.Label"}),
			swarm: new StringField({label: "BF.CreatureType.Swarm.Label", hint: "BF.CreatureType.Swarm.Hint"}),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => !v ? delete fields[k] : null);
		super(fields, { label: "BF.CreatureType.Label", ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	initialize(value, model, options={}) {
		const obj = super.initialize(value, model, options);

		Object.defineProperty(obj, "label", {
			get() {
				if ( !this.value ) return game.i18n.localize("None");
				const key = CONFIG.BlackFlag.creatureTypes[this.value]?.localization;
				let type = game.i18n.localize(`${key}[${this.swarm ? "other" : "one"}]`);
				if ( this.swarm ) type = game.i18n.format("BF.CreatureType.Swarm.Phrase", {
					size: game.i18n.localize(CONFIG.BlackFlag.sizes[this.swarm].label), type
				});
				if ( this.tags.length ) {
					// TODO: Add tags
				}
				return type;
			},
			enumerable: false
		});

		return obj;
	}
}
