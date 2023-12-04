import { COMMAND_TYPE } from "../event/command-event.js";
import { TransportProtocol } from "./interface.js";

export const RDT1_STATES = {
    WAIT_FROM_ABOVE: "WAIT_FROM_ABOVE",
    WAIT_FROM_BELOW: "WAIT_FROM_BELOW",
}

export class RDT1Sender extends TransportProtocol
{
    constructor()
    {
        super();
        this.currentState = RDT1_STATES.WAIT_FROM_ABOVE;
    }
    getName() {return "RDT 1.0 Sender"}
    canReceiveFromHost() { return true; }
    canReceiveFromNetworkLayer() { return false; }
    onPacketFromNetworkLayerReceived(packet) { }
    onMessageFromHostReceived(message) {
        this.packetProcessor.addPacket(message, msg => {
            this.sendPacketToNetworkLayer({data: msg, headers: {"Protocol": "RDT 1.0"}});
        })
        return true;
    }
}

export class RDT1Receiver extends TransportProtocol
{
    constructor()
    {
        super();
        this.currentState = RDT1_STATES.WAIT_FROM_BELOW;
    }
    getName() {return "RDT 1.0 Receiver"}
    canReceiveFromHost() { return false; }
    canReceiveFromNetworkLayer() { return true; }
    onPacketFromNetworkLayerReceived(packet, corrupted) {
        super.onPacketFromNetworkLayerReceived(packet, corrupted);
        this.packetProcessor.addPacket(packet, packet => {
            this.sendMessageToHost(packet.data);
        });
    }
    onMessageFromHostReceived(message) { }
}