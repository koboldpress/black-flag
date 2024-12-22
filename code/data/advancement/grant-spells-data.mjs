import AdvancementDataModel from "../abstract/advancement-data-model.mjs";
import FormulaField from "../fields/formula-field.mjs";
import LocalDocumentField from "../fields/local-document-field.mjs";
import IdentifierField from "../fields/identifier-field.mjs";

const { ArrayField, BooleanField, DocumentUUIDField, EmbeddedDataField, SchemaField, SetField, StringField } =
	foundry.data.fields;

/**
 * Configuration data for the Grant Spells advancement.
 *
 * @property {SpellConfigurationData} spell - Configuration data for granted spells.
 */
export class GrantSpellsConfigurationData extends AdvancementDataModel {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*         Model Configuration         */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	static LOCALIZATION_PREFIXES = ["BF.Advancement.SpellConfig", "BF.Advancement.GrantSpells"];

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			pool: new ArrayField(new SchemaField({ uuid: new DocumentUUIDField() })),
			spell: new EmbeddedDataField(SpellConfigurationData)
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Value data for granted spells.
 *
 * @typedef {GrantedFeatureData} GrantedSpellData
 * @property {boolean} modified - Was an existing item on the actor modified rather than a new one created?
 */

/**
 * Value data for the Grant Spells advancement.
 *
 * @property {string} ability - Ability to assign if applicable.
 * @property {GrantedSpellData[]} added - Spells added or updated.
 */
export class GrantSpellsValueData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new StringField(),
			added: new ArrayField(
				new SchemaField({
					document: new LocalDocumentField(foundry.documents.BaseItem),
					modified: new BooleanField(),
					uuid: new DocumentUUIDField()
				}),
				{ required: false, initial: undefined }
			)
		};
	}
}

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Configuration data for spells that can be granted.
 *
 * @property {Set<string>} ability - One or more abilities that will be used for the provided spell.
 * @property {boolean} alwaysPrepared - Should this spell be always prepared?
 * @property {string} mode - Spell preparation mode to set.
 * @property {string} origin - Identifier of a class or subclass to associated with these spells.
 * @property {string} source - Source the granted spell will be treated as, regardless of original source.
 * @property {object} uses
 * @property {number} uses.max - Limited usage to apply to the spell.
 * @property {string} uses.period - Recovery period for applied limited uses.
 * @property {boolean} uses.requireSlot - Is a spell slot required even when using the limited uses?
 */
export class SpellConfigurationData extends foundry.abstract.DataModel {
	/** @inheritDoc */
	static defineSchema() {
		return {
			ability: new SetField(new StringField()),
			alwaysPrepared: new BooleanField(),
			mode: new StringField({ initial: "standard" }),
			origin: new IdentifierField(),
			source: new StringField(),
			uses: new SchemaField({
				max: new FormulaField({ deterministic: true }),
				period: new StringField({ initial: "longRest" }),
				requireSlot: new BooleanField()
			})
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*               Helpers               */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Apply spell
	 * @param {object} spell - Spell data to modify.
	 * @param {object} [data={}] - Data from the advancement process.
	 * @returns {object}
	 */
	applyChanges(spell, data = {}) {
		foundry.utils.setProperty(spell, "flags.black-flag.relationship.mode", this.mode);
		foundry.utils.setProperty(spell, "flags.black-flag.relationship.alwaysPrepared", this.alwaysPrepared);
		if (this.ability.size)
			foundry.utils.setProperty(
				spell,
				"flags.black-flag.relationship.origin.ability",
				this.ability.has(data.ability) ? data.ability : this.ability.first()
			);
		if (this.origin) foundry.utils.setProperty(spell, "flags.black-flag.relationship.origin.identifier", this.origin);
		if (this.source) foundry.utils.setProperty(spell, "flags.black-flag.relationship.origin.source", this.source);

		if (this.uses.max) {
			foundry.utils.setProperty(spell, "system.uses.max", this.uses.max);
			spell.system.uses.recovery ??= [];
			spell.system.uses.recovery.push({ period: this.uses.period, type: "recoverAll" });

			const preparationConfig =
				CONFIG.BlackFlag.spellPreparationModes[foundry.utils.getProperty(spell, "flags.black-flag.relationship.mode")];
			const createForwardActivity = preparationConfig?.scalable && !this.uses.requireSlot;

			for (const activity of Object.values(spell.system.activities ?? {})) {
				if (!activity.activation?.primary) continue;

				// Create a forward activity
				if (createForwardActivity) {
					const newActivity = {
						_id: foundry.utils.randomID(),
						consumption: {
							targets: [{ type: "item", target: "", value: "1" }]
						},
						flags: {
							[game.system.id]: {
								fromAdvancement: true
							}
						},
						name: `${
							activity.name ?? game.i18n.localize(CONFIG.Activity.types[activity.type]?.documentClass.metadata.title)
						} (${game.i18n.localize("BF.Advancement.SpellConfig.FreeCasting").toLowerCase()})`,
						sort: (activity.sort ?? 0) + 1,
						system: {
							linked: {
								id: activity._id
							}
						},
						type: "forward"
					};
					foundry.utils.setProperty(spell, `system.activities.${newActivity._id}`, newActivity);
				}

				// Modify existing activity
				else {
					const activityData = foundry.utils.deepClone(activity);
					activityData.consumption.targets ??= [];
					activityData.consumption.targets.push({ type: "item", target: "", value: "1" });
					foundry.utils.setProperty(spell, `system.activities.${activityData._id}`, activityData);
				}
			}
		}

		return spell;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Changes needed to reverse a modification to an existing spell.
	 * @param {BlackFlagItem} spell - The existing spell to reverse changes upon.
	 * @param {object} [data={}] - Data from the advancement process.
	 * @returns {object}
	 */
	getReverseChanges(spell, data = {}) {
		const updates = {};
		if (this.alwaysPrepared) updates["flags.black-flag.relationship.alwaysPrepared"] = false;
		if (this.ability.size) updates["flags.black-flag.relationship.origin.-=ability"] = null;
		if (this.origin) updates["flags.black-flag.relationship.origin.-=identifier"] = null;
		if (this.source) updates["flags.black-flag.relationship.origin.-=source"] = null;

		if (this.uses.max) {
			updates["system.uses.max"] = "";
			updates["system.uses.recovery"] = spell.system.uses.recovery.filter(r => r.period !== this.uses.period);

			const preparationConfig =
				CONFIG.BlackFlag.spellPreparationModes[foundry.utils.getProperty(spell, "flags.black-flag.relationship.mode")];
			const deleteForwardActivity = preparationConfig?.scalable && !this.uses.requireSlot;

			for (const activity of spell.system.activities) {
				if (deleteForwardActivity) {
					if (activity.flags[game.system.id]?.fromAdvancement) updates[`system.activities.-=${activity.id}`] = null;
				} else if (activity.activation?.primary) {
					updates[`system.activities.${activity.id}.consumption.targets`] = activity.consumption.targets.filter(
						t => t.type !== "item"
					);
				}
			}
		}

		return updates;
	}
}
