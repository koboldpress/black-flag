/**
 * Ensure the provided string contains only the characters allowed in identifiers.
 * @param {string} identifier - Identifier to verify.
 * @returns {boolean}
 */
export function isValidIdentifier(identifier) {
	return /^([a-z0-9_-]+)$/i.test(identifier);
}
