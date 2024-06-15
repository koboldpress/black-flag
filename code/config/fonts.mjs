/**
 * Register the system fonts with Foundry.
 */
export function _configureFonts() {
	Object.assign(CONFIG.fontDefinitions, {
		"Open Sans": {
			editor: true,
			fonts: [
				{ urls: ["systems/black-flag/fonts/Open_Sans/Open_Sans.woff2"] },
				{ urls: ["systems/black-flag/fonts/Open_Sans/Open_Sans_i.woff2"], style: "italic" }
			]
		},
		Oswald: {
			editor: true,
			fonts: [{ urls: ["systems/black-flag/fonts/Oswald/Oswald.woff2"] }]
		}
	});
}
