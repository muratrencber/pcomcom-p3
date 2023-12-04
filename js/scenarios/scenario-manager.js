import { LinkDelay } from "../link.js";
import { DefaultScenario } from "./default-scenario.js";
import { SCENARIO_TYPE, SHEETS } from "./scenario-sheets.js";
import { TRANSPORT_SIDE } from "./scenario-template.js";
import { SpecificScenario } from "./specific-scenario.js";

let currentScenario = new DefaultScenario();
let senderIndex = 0;
let receiverIndex = 0;
/**
 * 
 * @param {keyof SCENARIO_TYPE} type 
 */
export function changeScenario(type)
{
    const sheet = SHEETS[type];
    if(sheet)
    {
        currentScenario = new SpecificScenario(sheet);
        return true;
    }
    else
    {
        currentScenario = new DefaultScenario();
        return false;
    }
}
/**
 * 
 * @param {keyof TRANSPORT_SIDE} transportSide 
 * @returns {LinkDelay | undefined}
 */
export function getNetworkLayerLinkDelay(transportSide)
{
    let index = transportSide == TRANSPORT_SIDE.SENDER ? senderIndex : receiverIndex;
    const result = currentScenario.getNetworkLinkDelayFor(transportSide, index);
    if(transportSide == TRANSPORT_SIDE.SENDER)
        senderIndex++;
    else
        receiverIndex++;
    return result;
}

export function resetScenarioProgress()
{
    senderIndex = 0;
    receiverIndex = 0;
}