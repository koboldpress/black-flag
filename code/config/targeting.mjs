import { localizeConfig } from "../utils/_module.mjs";

/**
 * Information needed to represent different area of effect target types.
 *
 * @typedef {LocalizedConfiguration} AreaTargetDefinition
 * @property {string} template - Type of `MeasuredTemplate` create for this target type.
 * @property {string[]} sizes - Sizes that can be configured for this template. Can be any of "length", "width",
 *                              "height", or "radius".
 */

/**
 * Types of area of effect targeting.
 * @enum {AreaOfEffectConfiguration}
 */
export const areaOfEffectTypes = {
	cone: {
		localization: "BF.AreaOfEffect.Type.Cone.Label",
		template: "cone",
		sizes: ["length"]
	},
	cube: {
		localization: "BF.AreaOfEffect.Type.Cube.Label",
		template: "ray",
		sizes: ["width"]
	},
	cylinder: {
		localization: "BF.AreaOfEffect.Type.Cylinder.Label",
		template: "circle",
		sizes: ["radius", "height"]
	},
	line: {
		localization: "BF.AreaOfEffect.Type.Line.Label",
		template: "ray",
		sizes: ["length", "width"]
	},
	radius: {
		localization: "BF.AreaOfEffect.Type.Radius.Label",
		template: "circle",
		sizes: ["radius"]
	},
	sphere: {
		localization: "BF.AreaOfEffect.Type.Sphere.Label",
		template: "circle",
		sizes: ["radius"]
	},
	square: {
		localization: "BF.AreaOfEffect.Type.Square.Label",
		template: "rect"
	}
	// TODO: Consider adding wall
};
localizeConfig(areaOfEffectTypes);

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Types of ranges that can be defined on items.
 * @enum {LabeledConfiguration}
 */
export const rangeTypes = {
	self: {
		label: "BF.Range.Type.Self.Label"
	},
	touch: {
		label: "BF.Range.Type.Touch.Label"
	},
	special: {
		label: "BF.Range.Type.Special.Label"
	},
	any: {
		label: "BF.Range.Type.Any.Label"
	}
};

/* <><><><> <><><><> <><><><> <><><><> <><><><> <><><><> */

/**
 * Types of targets that can be affected by a spell or feature.
 * @enum {LocalizedConfiguration}
 */
export const targetTypes = {
	creature: {
		localization: "BF.Target.Type.Creature.Label"
	},
	ally: {
		localization: "BF.Target.Type.Ally.Label"
	},
	enemy: {
		localization: "BF.Target.Type.Enemy.Label"
	},
	willing: {
		localization: "BF.Target.Type.WillingCreature.Label"
	},
	creatureObject: {
		localization: "BF.Target.Type.CreatureObject.Label"
	},
	object: {
		localization: "BF.Target.Type.Object.Label"
	},
	objectNotWorn: {
		localization: "BF.Target.Type.ObjectNotWorn.Label"
	},
	special: {
		label: "BF.Target.Type.Special.Label"
	}
};
localizeConfig(targetTypes, { sort: false });
