export default class BlackFlagActor extends Actor {

	/* <><><><> <><><><> <><><><> <><><><> */
	/*           Data Preparation          */
	/* <><><><> <><><><> <><><><> <><><><> */

	applyActiveEffects() {
		this.system.prepareEmbeddedData?.();
		return super.applyActiveEffects();
	}
}
