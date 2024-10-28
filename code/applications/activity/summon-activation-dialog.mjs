import { formatCR, simplifyBonus, simplifyFormula } from "../../utils/_module.mjs";
import ActivityActivationDialog from "./activity-activation-dialog.mjs";

const { BooleanField, StringField } = foundry.data.fields;

/**
 * Dialog for configuring the activation of the Summon activity.
 */
export default class SummonActivationDialog extends ActivityActivationDialog {
	/** @inheritDoc */
	static PARTS = {
		...super.PARTS,
		creation: {
			template: "systems/black-flag/templates/activity/summon-activation-creation.hbs"
		}
	};

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _prepareCreationContext(context, options) {
		context = await super._prepareCreationContext(context, options);

		const profiles = this.activity.system.availableProfiles;
		if (
			this._shouldDisplay("create.summons") &&
			(profiles.length || this.activity.system.creatureSizes.size > 1 || this.activity.system.creatureTypes.size > 1) &&
			canvas.scene
		) {
			context.hasCreation = true;
			context.summonsFields = [];

			if (!foundry.utils.hasProperty(this.options.display, "create.summons"))
				context.summonsFields.push({
					field: new BooleanField({ label: game.i18n.localize("BF.SUMMON.Action.Place") }),
					name: "create.summons",
					value: this.config.create?.summons
				});

			if (this.config.create?.summons) {
				const rollData = this.activity.getRollData();
				if (profiles.length > 1) {
					let options = profiles.map(profile => ({
						value: profile._id,
						label: this.getProfileLabel(profile, rollData)
					}));
					if (options.every(o => o.label.startsWith("1 × "))) {
						options = options.map(({ value, label }) => ({ value, label: label.replace("1 × ", "") }));
					}
					context.summonsFields.push({
						field: new StringField({ label: game.i18n.localize("BF.SUMMON.Profile.Label") }),
						name: "summons.profile",
						value: this.config.summons?.profile,
						options
					});
				} else context.summonsProfile = profiles[0]._id;

				if (this.activity.system.creatureSizes.size > 1)
					context.summonsFields.push({
						field: new StringField({ label: game.i18n.localize("BF.Size.Label") }),
						name: "summons.creatureSize",
						value: this.config.summons?.creatureSize,
						options: Array.from(this.activity.system.creatureSizes)
							.map(value => ({ value, label: CONFIG.BlackFlag.sizes.localized[value] }))
							.filter(k => k)
					});

				if (this.activity.system.creatureTypes.size > 1)
					context.summonsFields.push({
						field: new StringField({ label: game.i18n.localize("BF.CreatureType.Label") }),
						name: "summons.creatureType",
						value: this.config.summons?.creatureType,
						options: Array.from(this.activity.system.creatureTypes)
							.map(value => ({ value, label: CONFIG.BlackFlag.creatureTypes.localized[value] }))
							.filter(k => k)
					});
			}
		}

		return context;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Determine the label for a profile in the ability use dialog.
	 * @param {SummonsProfile} profile - Profile for which to generate the label.
	 * @param {object} rollData - Roll data used to prepare the count.
	 * @returns {string}
	 */
	getProfileLabel(profile, rollData) {
		let label;
		if (profile.name) label = profile.name;
		else {
			switch (this.activity.system.summon.mode) {
				case "cr":
					const cr = simplifyBonus(profile.cr, rollData);
					label = game.i18n.format("BF.SUMMON.Profile.ChallengeRatingLabel", { cr: formatCR(cr) });
					break;
				default:
					const doc = fromUuidSync(profile.uuid);
					if (doc) label = doc.name;
					break;
			}
		}
		label ??= "—";

		let count = simplifyFormula(Roll.replaceFormulaData(profile.count ?? "1", rollData));
		if (Number.isNumeric(count)) count = parseInt(count);
		if (count) label = `${count} × ${label}`;

		return label;
	}
}
