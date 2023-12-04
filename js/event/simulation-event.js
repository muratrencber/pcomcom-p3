import { GenericEvent } from "./generic-event.js";

export const SIMULATION_EVENT_TYPE = {
    TRANSPORT_PROTOCOL_CHANGED: "TRANSPORT_PROTOCOL_CHANGED",
    SIMULATION_STOPPED: "SIMULATION_STOPPED",
    SIMULATION_RESTARTED: "SIMULATION_RESTARTED",
}

/**
 * @typedef {Object} SimulationEventData
 * @property {keyof SIMULATION_EVENT_TYPE} type
 */

/**
 * @extends {GenericEvent<SimulationEventData>}
 */
export class SimulationEvent extends GenericEvent {}