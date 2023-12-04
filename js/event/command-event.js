import { GenericEvent } from "./generic-event.js";

export const COMMAND_TYPE = {
    RDT_RECV: "RDT_RECV",
    RDT_SEND: "RDT_SEND",
    UDT_SEND: "UDT_SEND",
    DELIVER_DATA: "DELIVER_DATA",
    CHANGE_STATE: "CHANGE_STATE",


    RDT2_SENDER_SENT: "RDT2_SENDER_SENT",
    RDT2_SENDER_NAK: "RDT2_SENDER_NAK",
    RDT2_SENDER_ACK: "RDT2_SENDER_ACK",

    RDT2_RECEIVER_ACK: "RDT2_RECEIVER_ACK",
    RDT2_RECEIVER_NAK: "RDT2_RECEIVER_NAK",


    RDT3_SENDER_SENT0: "RDT3_SENDER_SENT0",
    RDT3_SENDER_RCVW0: "RDT3_SENDER_RCVW0",
    RDT3_SENDER_CORRUPTACK0: "RDT3_SENDER_CORRUPTACK0",
    RDT3_SENDER_TIMEOUT0: "RDT3_SENDER_TIMEOUT0",
    RDT3_SENDER_OOOACK1: "RDT3_SENDER_OOOACK1",
    RDT3_SENDER_RCVACK0: "RDT3_SENDER_RCVACK0",
    RDT3_SENDER_SENT1: "RDT3_SENDER_SENT1",
    RDT3_SENDER_RCVW1: "RDT3_SENDER_RCVW1",
    RDT3_SENDER_CORRUPTACK1: "RDT3_SENDER_CORRUPTACK1",
    RDT3_SENDER_TIMEOUT1: "RDT3_SENDER_TIMEOUT1",
    RDT3_SENDER_OOOACK0: "RDT3_SENDER_OOOACK0",
    RDT3_SENDER_RCVACK1: "RDT3_SENDER_RCVACK1",

    RDT3_RECEIVER_CORRUPT0: "RDT3_RECEIVER_CORRUPT0",
    RDT3_RECEIVER_CORRUPT1: "RDT3_RECEIVER_CORRUPT1",
    RDT3_RECEIVER_OOO1: "RDT3_RECEIVER_OOO1",
    RDT3_RECEIVER_OOO0: "RDT3_RECEIVER_OOO0",
    RDT3_RECEIVER_SENTACK0: "RDT3_RECEIVER_SENTACK0",
    RDT3_RECEIVER_SENTACK1: "RDT3_RECEIVER_SENTACK1",

    HOST_FINISHED: "HOST_FINISHED",
    HOST_STARTED: "HOST_STARTED"
}

/**
 * @typedef {Object} CommandEventData
 * @property {keyof COMMAND_TYPE} type
 * @property {string} value
 */

/**
 * @extends {GenericEvent<CommandEventData>}
 */
export class CommandEvent extends GenericEvent {}