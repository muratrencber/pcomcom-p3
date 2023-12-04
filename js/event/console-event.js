import { GenericEvent } from "./generic-event.js";

export const LOG_CONTEXT = {
    OUTPUT: "OUTPUT",
    CHANGE_STATE: "CHANGE_STATE",
    RECEIVED_PACKET: "RECEIVED_PACKET",
    SENT_PACKET: "SENT_PACKET"
}

/**
 * @typedef {Object} ConsoleEventData
 * @property {string} message
 * @property {string} sender
 * @property {keyof LOG_CONTEXT} context
 */

/**
 * @extends {GenericEvent<ConsoleEventData>}
 */
export class ConsoleEvent extends GenericEvent{}
