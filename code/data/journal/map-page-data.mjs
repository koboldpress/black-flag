import MapLocationPageSheet from "../../applications/journal/map-page-sheet.mjs";
import BaseDataModel from "../abstract/base-data-model.mjs";

const { StringField } = foundry.data.fields;

/**
 * Data definition for Map Location journal entry pages.
 *
 * @property {string} code - Code for the location marker displayed on the map.
 */
export default class MapLocationJournalPageData extends BaseDataModel {
	/** @inheritDoc */
	static get metadata() {
		return {
			type: "map",
			localization: "BF.JournalPage.Type.Map",
			sheet: {
				application: MapLocationPageSheet,
				label: "BF.Sheet.Default.RulePage"
			}
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/** @inheritDoc */
	static defineSchema() {
		return {
			code: new StringField()
		};
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Adjust the number of this entry in the table of contents.
	 * @param {number} number - Current position number.
	 * @returns {{ number: string, adjustment: number }|void}
	 */
	adjustTOCNumbering(number) {
		if (!this.code) return;
		return { number: this.code, adjustment: -1 };
	}

	/* <><><><> <><><><> <><><><> <><><><> */

	/**
	 * Create a control icon for rendering this page on a scene.
	 * @param {object} options - Options passed through to ControlIcon construction.
	 * @returns {PIXI.Container|void}
	 */
	getControlIcon(options) {
		if (!this.code) return;
		const { icon: IconClass, ...style } = foundry.utils.mergeObject(
			CONFIG.BlackFlag.mapLocationMarkerStyle.default,
			CONFIG.BlackFlag.mapLocationMarkerStyle[this.parent.getFlag("black-flag", "mapMarkerStyle")] ?? {},
			{ inplace: false }
		);
		return new IconClass({ code: this.code, ...options, ...style });
	}
}
