import { GenericEvent } from "./generic-event.js";

export const LINK_PACKET_EVENT_TYPE = {
    DROPPED: "DROPPED",
    CORRUPTED: "CORRUPTED",
    DELIVERED: "DELIIVERED",
}

/**
 * @typedef {Object} LinkPacketEventData
 * @property {keyof LINK_PACKET_EVENT_TYPE} type
 */

/**
 * @extends {GenericEvent<LinkPacketEventData>}
 */
export class LinkPacketEvent extends GenericEvent {}