export * from "./activity-field.mjs";
export * from "./advancement-field.mjs";
export { default as DocumentUUIDField } from "./document-uuid-field.mjs";
export { default as FilterField } from "./filter-field.mjs";
export { default as FormulaField } from "./formula-field.mjs";
export { default as IdentifierField } from "./identifier-field.mjs";
export { default as LocalDocumentField } from "./local-document-field.mjs";
export { default as MappingField } from "./mapping-field.mjs";
export { default as ModifierField } from "./modifier-field.mjs";
export { default as ProficiencyField } from "./proficiency-field.mjs";
export { default as RollField } from "./roll-field.mjs";
export { default as TimeField } from "./time-field.mjs";
export { default as TypeField } from "./type-field.mjs";

export { default as ActivationField } from "./shared/activation-field.mjs";
export { default as DamageField, SimpleDamageData, ExtendedDamageData } from "./shared/damage-field.mjs";
export { default as DurationField } from "./shared/duration-field.mjs";
export { default as RangeField } from "./shared/range-field.mjs";
export { default as SourceField } from "./shared/source-field.mjs";
export { default as TargetField } from "./shared/target-field.mjs";
export { default as UsesField } from "./shared/uses-field.mjs";

import { default as AdvancementValueField_ } from "../actor/fields/advancement-value-field.mjs";
import { default as CreatureTypeField_ } from "../actor/fields/creature-type-field.mjs";

export class AdvancementValueField extends AdvancementValueField_ {
	constructor(...args) {
		foundry.utils.logCompatibilityWarning(
			"`AdvancementValueField` has moved from `BlackFlag.data.fields` to `BlackFlag.data.actor`.",
			{ since: "Black Flag 3.0", until: "Black Flag 4.0" }
		);
		super(...args);
	}
}

export class CreatureTypeField extends CreatureTypeField_ {
	constructor(...args) {
		foundry.utils.logCompatibilityWarning(
			"`CreatureTypeField` has moved from `BlackFlag.data.fields` to `BlackFlag.data.actor`.",
			{ since: "Black Flag 3.0", until: "Black Flag 4.0" }
		);
		super(...args);
	}
}
