import { GenericEvent } from "./generic-event.js";

export const LINK_EVENT_TYPE = {
    ADDED_PACKET: "ADDED_PACKET",
}

/**
 * @typedef {Object} LinkEventData
 * @property {keyof LINK_EVENT_TYPE} type
 * @property {LinkPacket} packet
 */

/**
 * @extends {GenericEvent<LinkEventData>}
 */
export class LinkEvent extends GenericEvent {}