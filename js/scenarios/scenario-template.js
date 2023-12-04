export const TRANSPORT_SIDE = {
    SENDER: "SENDER",
    RECEIVER: "RECEIVER"
}

export class ScenarioTemplate
{
    /**
     * 
     * @param {keyof TRANSPORT_SIDE} transportSide 
     * @param {number} index 
     */
    getNetworkLinkDelayFor(transportSide, index) { 
        return undefined;
    }
}