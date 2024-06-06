import MapLocationControlIcon from "../canvas/map-location-control-icon.mjs";

/**
 * Configuration data for a map marker style. Options not included will fall back to the value set in the `default`
 * style. Any additional styling options added will be passed into the custom marker class and be available for
 * rendering.
 *
 * @typedef {object} MapLocationMarkerStyle
 * @property {typeof PIXI.Container} [icon] - Map marker class used to render the icon.
 * @property {number} [backgroundColor] - Color of the background inside the circle.
 * @property {number} [borderColor] - Color of the border in normal state.
 * @property {number} [borderHoverColor] - Color of the border when hovering over the marker.
 * @property {string} [fontFamily] - Font used for rendering the code on the marker.
 * @property {number} [shadowColor] - Color of the shadow under the marker.
 * @property {number} [textColor] - Color of the text on the marker.
 */

/**
 * Styling profiles available for map markers. Default will be used as the basis and any other styles will be merged
 * on top of it if the `black-flag.mapMarkerStyle` flag is set to that style name on the journal page.
 * @enum {MapLocationMarkerStyle}
 */
export const mapLocationMarkerStyle = {
	default: {
		icon: MapLocationControlIcon,
		backgroundColor: 0xfbf8f5,
		borderColor: 0x000000,
		borderHoverColor: 0xff5500,
		fontFamily: "Open Sans",
		shadowColor: 0x000000,
		textColor: 0x000000
	}
};
