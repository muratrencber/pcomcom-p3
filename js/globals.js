
export let networkLinkDelayProperties = [4000, 0, 0.5, 0.5];
export let hostTransportDelayProperties = [100, 0, 1, 0];
export const OPSEQ_TIMESTAMP_MULTIPLIER = 0.02;

export function setDelayProperties(packetLossEnabled, packetCorruptionEnabled)
{
    if(packetLossEnabled || packetCorruptionEnabled)
        networkLinkDelayProperties[2] = 0.9;
    else
    {
        networkLinkDelayProperties[2] = 1;
        networkLinkDelayProperties[3] = 0;
    }
    if(packetLossEnabled && packetCorruptionEnabled)
        networkLinkDelayProperties[3] = 0.3;
    else if(packetLossEnabled && !packetCorruptionEnabled)
        networkLinkDelayProperties[3] = 0;
    else if(!packetLossEnabled && packetCorruptionEnabled)
        networkLinkDelayProperties[3] = 1;
}