/**
 * Register the system fonts with Foundry.
 */
export function _configureFonts() {
	Object.assign(CONFIG.fontDefinitions, {
		"Open Sans": {
			editor: true,
			fonts: [
				{ urls: ["systems/black-flag/fonts/Open_Sans/OpenSans-VariableFont_wdth,wght.ttf"] },
				{ urls: ["systems/black-flag/fonts/Open_Sans/OpenSans-Italic-VariableFont_wdth,wght.ttf"], style: "italic" }
			]
		},
		Oswald: {
			editor: true,
			fonts: [{ urls: ["systems/black-flag/fonts/Oswald/Oswald-VariableFont_wght.ttf"] }]
		}
	});
}
