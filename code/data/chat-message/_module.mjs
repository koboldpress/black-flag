import ActivationMessageData from "./activation-message-data.mjs";
import RestMessageData from "./rest-message-data.mjs";
import TurnMessageData from "./turn-message-data.mjs";

export { ActivationMessageData, RestMessageData, TurnMessageData };
export * as fields from "./fields/_module.mjs";

export const config = {
	activation: ActivationMessageData,
	rest: RestMessageData,
	turn: TurnMessageData
};
