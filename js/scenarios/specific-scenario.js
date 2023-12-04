import { LinkDelay, PACKET_STATE } from "../link.js";
import { ScenarioTemplate, TRANSPORT_SIDE } from "./scenario-template.js";

/**
 * @typedef {Object.<string, {fullDelay: number, actualDelay: number, finalState: keyof PACKET_STATE}>} LinkDelayScenario
 */

/**
 * @typedef {Object} ScenarioSheet
 * @property {LinkDelayScenario} sender
 * @property {LinkDelayScenario} receiver
 */


export class SpecificScenario extends ScenarioTemplate
{
    /**
     * 
     * @param {ScenarioSheet} ScenarioSheet 
     */
    constructor(scenarioSheet)
    {
        super();
        /**
         * @type {ScenarioSheet}
         */
        this.scenarioSheet = scenarioSheet;
    }

    getNetworkLinkDelayFor(transportSide, index)
    {
        let targetKey = transportSide == TRANSPORT_SIDE.SENDER ? "sender" : "receiver";
        if(this.scenarioSheet[targetKey]
            && (this.scenarioSheet[targetKey][index] || this.scenarioSheet[targetKey]["default"]))
        {
            let props = this.scenarioSheet[targetKey][index];
            if(!props)
                props = this.scenarioSheet[targetKey]["default"];
            let linkDelay = new LinkDelay(0,0,0,0);
            linkDelay.fullDelay = props.fullDelay;
            linkDelay.actualDelay = props.actualDelay;
            linkDelay.finalState = props.finalState;
            return linkDelay;
        }
        return undefined;
    }
}