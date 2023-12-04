import { PACKET_STATE } from "../link.js"

const DEFAULT_SCENARIO = {
}
const SUCCESSFUL_SCENARIO = {
    "sender": {
        default: {
            fullDelay: 3000,
            actualDelay: 3000,
            finalState: PACKET_STATE.REACHED
        }
    },
    "receiver": {
        default: {
            fullDelay: 3000,
            actualDelay: 3000,
            finalState: PACKET_STATE.REACHED
        }
    }
}
/**
 * @type {import("./specific-scenario").ScenarioSheet}
 */
const DROP_SCENARIO = {
    "sender": {
        1: {
            fullDelay: 3000,
            actualDelay: 1000,
            finalState: PACKET_STATE.DROPPED
        },
        default: {
            fullDelay: 3000,
            actualDelay: 3000,
            finalState: PACKET_STATE.REACHED
        }
    },
    "receiver": {
        default: {
            fullDelay: 3000,
            actualDelay: 3000,
            finalState: PACKET_STATE.REACHED
        }
    }
}

export const SCENARIO_TYPE = {
    "DEFAULT_SCENARIO": "DEFAULT_SCENARIO",
    "SUCCESSFUL_SCENARIO": "SUCCESSFUL_SCENARIO",
    "DROP_SCENARIO": "DROP_SCENARIO"
}

export const SHEETS = {
    [SCENARIO_TYPE.DEFAULT_SCENARIO]: DEFAULT_SCENARIO,
    [SCENARIO_TYPE.SUCCESSFUL_SCENARIO]: SUCCESSFUL_SCENARIO,
    [SCENARIO_TYPE.DROP_SCENARIO]: DROP_SCENARIO
}