import V2Mixin from "./mixin.mjs";

const { ApplicationV2 } = foundry.applications.api;

/**
 * Base application from which all Black Flag applications should be based.
 */
export default class BFApplication extends V2Mixin(ApplicationV2) {}
