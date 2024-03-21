const { ArrayField, SetField, StringField } = foundry.data.fields;

/**
 * Field for storing proficiency.
 * @param {object} fields - Additional fields to add, or set a value to `false` to remove a default fields.
 * @param {object} options - Options that will be merged with default options.
 */
export default class CreatureTypeField extends foundry.data.fields.SchemaField {
	constructor(fields={}, options={}) {
		fields = {
			value: new StringField({initial: "humanoid", label: "BF.CreatureType.Type.Label"}),
			tags: new SetField(new StringField(), {label: "BF.CreatureType.Tag.Label"}),
			custom: new ArrayField(new StringField(), {label: "BF.CreatureType.Custom.Label"}),
			swarm: new StringField({label: "BF.CreatureType.Swarm.Label", hint: "BF.CreatureType.Swarm.Hint"}),
			...fields
		};
		Object.entries(fields).forEach(([k, v]) => !v ? delete fields[k] : null);
		super(fields, { label: "BF.CreatureType.Label", ...options });
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
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
				const tags = [
					...Array.from(this.tags).map(t => CONFIG.BlackFlag.creatureTags.localized[t]),
					...this.custom
				].filter(t => t).map(t => t.toLowerCase());
				if ( tags.length ) type += ` (${game.i18n.getListFormatter({ style: "short" }).format(tags)})`;
				return type;
			},
			enumerable: false
		});

		return obj;
	}
}
