import { COMMAND_TYPE } from "../event/command-event.js";
import { TransportProtocol } from "./interface.js";

export const RDT2_STATES = {
    WAIT_FROM_ABOVE: "WAIT_FROM_ABOVE",
    WAIT_FOR_ACK_OR_NAK: "WAIT_FOR_ACK_OR_NAK",
    WAIT_FROM_BELOW: "WAIT_FROM_BELOW",
}

export class RDT2Sender extends TransportProtocol
{
    constructor()
    {
        super();
        this.currentState = RDT2_STATES.WAIT_FROM_ABOVE;
        this.lastSentPacket = null;
        this.buffer = [];
        this.isSender = true;
    }
    canReceiveFromHost() { return this.currentState == RDT2_STATES.WAIT_FROM_ABOVE; }
    canReceiveFromNetworkLayer() { return this.currentState == RDT2_STATES.WAIT_FOR_ACK_OR_NAK; }
    onPacketFromNetworkLayerReceived(packet) {
        if(packet.data == "ACK")
        {
            this.lastSentPacket = null;
            this.changeState(RDT2_STATES.WAIT_FROM_ABOVE);
            this.commandEvent.invoke({type: COMMAND_TYPE.RDT2_SENDER_ACK});
        }
        else if(packet.data == "NAK")
        {
            this.sendPacketToNetworkLayer(this.lastSentPacket);
            this.commandEvent.invoke({type: COMMAND_TYPE.RDT2_SENDER_NAK});
        }
    }
    onStateChanged()
    {
        if(this.currentState == RDT2_STATES.WAIT_FROM_ABOVE)
        {
            if(this.buffer.length > 0)
            {
                const msg = this.buffer.shift();
                this.lastSentPacket = this.createPacket(msg);
                this.sendPacketToNetworkLayer(this.lastSentPacket);
                this.commandEvent.invoke({type: COMMAND_TYPE.RDT2_SENDER_SENT});
                this.changeState(RDT2_STATES.WAIT_FOR_ACK_OR_NAK);
            }
        }
    }
    onMessageFromHostReceived(message) {
        if(this.lastSentPacket != null)
        {
            this.buffer.push(message);
            return;
        }
        this.lastSentPacket = this.createPacket(message);
        this.sendPacketToNetworkLayer(this.lastSentPacket);
        this.commandEvent.invoke({type: COMMAND_TYPE.RDT2_SENDER_SENT});
        this.changeState(RDT2_STATES.WAIT_FOR_ACK_OR_NAK);
        return true;
    }
    createPacket(message)
    {
        return {data: message, headers: {
            "Protocol": "RDT 2.0"
        }};
    }
    reset()
    {
        super.reset();
        this.currentState = RDT2_STATES.WAIT_FROM_ABOVE;
        this.lastSentPacket = null;
        this.buffer = [];
    }
    getName() {return "RDT 2.0 Sender"}
}

export class RDT2Receiver extends TransportProtocol
{
    constructor()
    {
        super();
        this.currentState = RDT2_STATES.WAIT_FROM_BELOW;
        this.isSender = false;
    }
    getName() {return "RDT 2.0 Receiver"}
    canReceiveFromHost() { return false; }
    canReceiveFromNetworkLayer() { return true; }
    onPacketFromNetworkLayerReceived(packet, corrupted) {
        super.onPacketFromNetworkLayerReceived(packet, corrupted);
        if(corrupted)
        {
            this.sendPacketToNetworkLayer({data: "NAK", headers: {"Protocol": "RDT 2.0"}});
            this.commandEvent.invoke({type: COMMAND_TYPE.RDT2_RECEIVER_NAK});
        }
        else
        {
            this.sendMessageToHost(packet.data);
            this.sendPacketToNetworkLayer({data: "ACK", headers: {"Protocol": "RDT 2.0"}});
            this.commandEvent.invoke({type: COMMAND_TYPE.RDT2_RECEIVER_ACK});
        }
    }
    onMessageFromHostReceived(message) { }
}