import { convertDistance } from "../utils/_module.mjs";
import BasePlacement from "./api/base-placement.mjs";

/**
 * @typedef {BasePlacementConfiguration} TemplatePlacementConfiguration
 * @property {number} color - Color to use when creating the template.
 * @property {TokenDocument} [origin] - Token that is the origin point of the placement.
 * @property {TemplatePlacementShapeConfiguration[]} shapes - Configuration data for individual placements.
 */

/**
 * @typedef TemplatePlacementShapeConfiguration
 * @property {string} type - Shape type to use as the basis for the template.
 * @property {number} size - Primary dimension of the template, converted into unit used for scene.
 * @property {number} [width] - Width of the shape if relevant to shape type.
 * @property {number} [height] - Height of the shape if relevant to shape type.
 */

/**
 * @typedef {BaseShapeData} TemplatePlacementData
 * @property {string} [token]  ID of attached token.
 */

/**
 * Class responsible for placing templates onto the scene.
 * @extends BasePlacement<TemplatePlacementConfiguration, TemplatePlacementData>
 */
export default class TemplatePlacement extends BasePlacement {
	/* <><><><> <><><><> <><><><> <><><><> */
	/*              Placement              */
	/* <><><><> <><><><> <><><><> <><><><> */

	/** @override */
	async _place() {
		const results = [];
		const attachToToken = this.config.shapes.some(s => s.type === "emanation");
		await canvas.regions.placeRegions(
			this.config.shapes.map(s => ({
				name: RegionDocument.implementation.defaultName({ parent: canvas.scene }),
				color: this.config.color,
				displayMeasurements: true,
				highlightMode: "coverage",
				shapes: [this.#createShapeData(s)],
				"flags.core.MeasuredTemplate": true
			})),
			{
				attachToToken,
				create: false,
				preConfirm: ({ document, index }) => {
					const obj = document.toObject();
					results.push({ ...obj.shapes.at(-1), token: obj.attachment.token });
				}
			}
		);
		return results;
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create data for each shape using the standard config.
	 * @param {TemplatePlacementShapeConfiguration} configuration
	 * @returns {Partial<BaseShapeData>}
	 */
	#createShapeData({ type, ...baseSizes }) {
		const gridMultiplier = canvas.scene.grid.size / canvas.scene.grid.distance;
		const size = baseSizes.size * gridMultiplier;
		const width = baseSizes.width * gridMultiplier;
		const data = { x: 0, y: 0, rotation: 0, type };
		switch (type) {
			case "circle":
				return { ...data, radius: size };
			case "cone":
				return { ...data, angle: CONFIG.MeasuredTemplate.defaults.angle, radius: size };
			case "emanation":
				return {
					base: { ...data, width: 1, height: 1, shape: 4, type: "token" },
					radius: size,
					type: "emanation"
				};
			case "ray":
			case "line":
				return { ...data, length: size, width, type: "line" };
			case "rect":
			case "rectangle":
				return { ...data, width: size, height: size, type: "rectangle" };
			case "ring":
				return { ...data, radius: size, outerWidth: width };
		}
	}

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Factory Methods           */
	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * A factory method to create and place templates using provided data from an Activity instance.
	 * @param {Activity} activity - The Activity for which to construct the templates.
	 * @param {object} [options={}]
	 * @param {object} [options.createData={}] - Data to modify the template creation data.
	 * @param {object} [options.placementConfig={}] - Modification to the placement configuration.
	 * @returns {RegionDocument[]|null} - The template region documents, or null if activity doesn't have any defined.
	 */
	static async fromActivity(activity, { createData = {}, placementConfig = {} } = {}) {
		const target = activity.target?.template ?? {};
		const templateShape = CONFIG.BlackFlag.areaOfEffectTypes[target.type]?.template;
		if (!templateShape) return null;

		const templateData = {
			type: templateShape,
			size: target.size
				? convertDistance(target.size, target.unit, canvas.scene.grid.units, { strict: false })?.value
				: undefined,
			width: target.width
				? convertDistance(target.width, target.unit, canvas.scene.grid.units, { strict: false })?.value
				: undefined,
			height: target.height
				? convertDistance(target.height, target.unit, canvas.scene.grid.units, { strict: false })?.value
				: undefined
		};

		const config = foundry.utils.mergeObject(
			{
				color: game.user.color,
				shapes: Array.fromRange(target.count || 1).map(() => foundry.utils.deepClone(templateData))
			},
			placementConfig
		);

		/**
		 * A hook event that fires before player is prompted for template placement.
		 * @function blackFlag.preCreateMeasuredTemplate
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity for which the template is being placed.
		 * @param {TemplatePlacementConfiguration} placementConfig - Configuration that drives template placement.
		 * @returns {boolean} - Return `false` to prevent template placement.
		 */
		if (Hooks.call("blackFlag.preCreateMeasuredTemplate", activity, config) === false) return null;

		const placements = await TemplatePlacement.place(config);
		if (!placements?.length) return null;

		const combinedShapes = [];
		const splitShapes = [];
		for (const placement of placements) {
			if (placement.token) {
				const { x, y, width, height, shape } = canvas.scene.tokens.get(placement.token);
				Object.assign(placement.base, { x, y, width, height, shape });
			}
			if (!placement.token || target.stationary) combinedShapes.push(placement);
			else splitShapes.push([placement]);
		}

		const rollData = activity.getRollData();
		const regionData = [combinedShapes, ...splitShapes]
			.map(shapes =>
				shapes.length
					? foundry.utils.mergeObject(
							{
								name: `${activity.item.name} [${game.user.name}]`,
								color: game.user.color,
								shapes: shapes.map(({ index, token, ...data }) => data),
								levels: [canvas.level.id],
								restriction: {
									enabled: true,
									type: "move"
								},
								attachment: {
									token: target.stationary ? undefined : shapes[0].token
								},
								visibility: CONST.REGION_VISIBILITY.ALWAYS,
								highlightMode: "coverage",
								flags: {
									[game.system.id]: {
										dimensions: {
											size: templateData.size,
											width: templateData.width,
											height: templateData.height,
											unit: canvas.scene.grid.units
										},
										item: activity.item.uuid,
										origin: activity.uuid,
										spellLevel: rollData.item?.circle?.value
									}
								}
							},
							createData
						)
					: null
			)
			.filter(_ => _);

		/**
		 * A hook event that fires after templates have been placed by the player but before they have been created.
		 * @function blackFlag.createMeasuredTemplate
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity for which the template is being placed.
		 * @param {object[]} templateData - Data for the regions to be created.
		 * @returns {boolean} - Return `false` to prevent template creation.
		 */
		if (Hooks.call("blackFlag.createMeasuredTemplate", activity, regionData) === false) return null;

		const created = canvas.scene.createEmbeddedDocuments("Region", regionData);

		/**
		 * A hook event that fires after a template are created for an Activity.
		 * @function blackFlag.postCreateMeasuredTemplate
		 * @memberof hookEvents
		 * @param {Activity} activity - Activity for which the template is being placed.
		 * @param {RegionDocument[]} templates - The regions that were created.
		 */
		Hooks.callAll("blackFlag.postCreateMeasuredTemplate", activity, created);

		return created;
	}
}
