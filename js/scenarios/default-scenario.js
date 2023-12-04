import { ScenarioTemplate } from "./scenario-template.js";

export class DefaultScenario extends ScenarioTemplate
{
    /**
     * 
     * @param {keyof TRANSPORT_SIDE} transportSide 
     * @param {number} index
     */
    getNetworkLinkDelayFor(transportSide, index)
    {
        return undefined;
    }
}