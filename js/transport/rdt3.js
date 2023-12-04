import { COMMAND_TYPE } from "../event/command-event.js";
import { TransportProtocol } from "./interface.js";

export const RDT3_STATES = {
    WAIT_0_ABOVE: "WAIT_0_ABOVE",
    WAIT_ACK_0: "WAIT_ACK_0",
    WAIT_1_ABOVE: "WAIT_1_ABOVE",
    WAIT_ACK_1: "WAIT_ACK_1",
    WAIT_0_BELOW: "WAIT_0_BELOW",
    WAIT_1_BELOW: "WAIT_1_BELOW",
}

export class RDT3Sender extends TransportProtocol
{
    constructor()
    {
        super();
        this.currentState = RDT3_STATES.WAIT_0_ABOVE;
        this.currentPacket = null;
        this.packetProcessor.processTime = 9000;
    }
    canReceiveFromHost() { return this.currentState == RDT3_STATES.WAIT_0_ABOVE || this.currentState == RDT3_STATES.WAIT_1_ABOVE; }
    canReceiveFromNetworkLayer() { return true; }
    onPacketFromNetworkLayerReceived(packet, corrupted)
    { 
        if(this.currentState == RDT3_STATES.WAIT_0_ABOVE || this.currentState == RDT3_STATES.WAIT_1_ABOVE)
        {
            let command = COMMAND_TYPE.RDT3_SENDER_RCVW0;
            if(this.currentState == RDT3_STATES.WAIT_1_ABOVE)
                command = COMMAND_TYPE.RDT3_SENDER_RCVW1;
            this.commandEvent.invoke({type: command});
            return;
        }
        if(corrupted)
        {
            let command = COMMAND_TYPE.RDT3_SENDER_CORRUPTACK0;
            if(this.currentState == RDT3_STATES.WAIT_ACK_1)
                command = COMMAND_TYPE.RDT3_SENDER_CORRUPTACK1;
            this.commandEvent.invoke({type: command});
            return;
        }
        let targetACK = "ACK0";
        if(this.currentState == RDT3_STATES.WAIT_ACK_1)
            targetACK = "ACK1";
        if(packet.data == targetACK)
        {
            let command = COMMAND_TYPE.RDT3_SENDER_RCVACK0;
            if(this.currentState == RDT3_STATES.WAIT_ACK_1)
                command = COMMAND_TYPE.RDT3_SENDER_RCVACK1;
            this.commandEvent.invoke({type: command});
            this.packetProcessor.packets = [];
            if(this.currentState == RDT3_STATES.WAIT_ACK_0)
                this.changeState(RDT3_STATES.WAIT_1_ABOVE);
            else
                this.changeState(RDT3_STATES.WAIT_0_ABOVE);
        }
        else
        {
            let command = COMMAND_TYPE.RDT3_SENDER_OOOACK1;
            if(this.currentState == RDT3_STATES.WAIT_ACK_1)
                command = COMMAND_TYPE.RDT3_SENDER_OOOACK0;
            this.commandEvent.invoke({type: command});
        }
    }
    onMessageFromHostReceived(message) {
        this.packetProcessor.addPacket(message, _ => this.onTimeoutOccurred());
        this.currentPacket = this.createPacket(message)
        this.sendPacketToNetworkLayer(this.currentPacket);
        if(this.currentState == RDT3_STATES.WAIT_0_ABOVE)
        {
            this.commandEvent.invoke({type: COMMAND_TYPE.RDT3_SENDER_SENT0});
            this.changeState(RDT3_STATES.WAIT_ACK_0);
        }
        else
        {
            this.commandEvent.invoke({type: COMMAND_TYPE.RDT3_SENDER_SENT1});
            this.changeState(RDT3_STATES.WAIT_ACK_1);
        }
        return true;
    }
    onTimeoutOccurred()
    {
        let command = COMMAND_TYPE.RDT3_SENDER_TIMEOUT0;
        if(this.currentState == RDT3_STATES.WAIT_ACK_1)
            command = COMMAND_TYPE.RDT3_SENDER_TIMEOUT1;
        this.commandEvent.invoke({type: command});
        this.packetProcessor.addPacket(this.currentPacket.data, _ => this.onTimeoutOccurred());
        this.sendPacketToNetworkLayer(this.currentPacket);
    }
    createPacket(msg)
    {
        let seqnum = 0;
        if(this.currentState == RDT3_STATES.WAIT_1_ABOVE)
            seqnum = 1;
        return {
            data: msg,
            headers: {
                "Protocol": "RDT 3.0",
                "SequenceNumber": seqnum,
                "Description": `data="${msg}", seqnum=${seqnum}`
            }
        };
    }
    reset()
    {
        this.packetProcessor.packets = [];
        this.currentPacket = null;
        this.currentState = RDT3_STATES.WAIT_0_ABOVE;
    }
    getName() {return "RDT 3.0 Sender"}
}

export class RDT3Receiver extends TransportProtocol
{
    constructor()
    {
        super();
        this.currentState = RDT3_STATES.WAIT_0_BELOW;
    }
    getName() {return "RDT 3.0 Receiver"}
    canReceiveFromHost() { return false; }
    canReceiveFromNetworkLayer() { return true; }
    onPacketFromNetworkLayerReceived(packet, corrupted) {
        super.onPacketFromNetworkLayerReceived(packet, corrupted);
        if(corrupted)
        {
            let command = COMMAND_TYPE.RDT3_RECEIVER_CORRUPT0;
            if(this.currentState == RDT3_STATES.WAIT_1_BELOW)
                command = COMMAND_TYPE.RDT3_RECEIVER_CORRUPT1;
            this.commandEvent.invoke({type: command});
            this.sendACK(true);
            return;
        }
        let expectedSeqnum = 0;
        if(this.currentState == RDT3_STATES.WAIT_1_BELOW)
            expectedSeqnum = 1;
        if(packet.headers["SequenceNumber"] == expectedSeqnum)
        {
            let command = COMMAND_TYPE.RDT3_RECEIVER_SENTACK0;
            if(this.currentState == RDT3_STATES.WAIT_1_BELOW)
                command = COMMAND_TYPE.RDT3_RECEIVER_SENTACK1;
            this.commandEvent.invoke({type: command});
            this.sendACK();
            if(this.currentState == RDT3_STATES.WAIT_0_BELOW)
                this.changeState(RDT3_STATES.WAIT_1_BELOW);
            else
                this.changeState(RDT3_STATES.WAIT_0_BELOW);
            this.sendMessageToHost(packet.data);
        }
        else
        {
            let command = COMMAND_TYPE.RDT3_RECEIVER_OOO1;
            if(this.currentState == RDT3_STATES.WAIT_1_BELOW)
                command = COMMAND_TYPE.RDT3_RECEIVER_OOO0;
            this.commandEvent.invoke({type: command});
            this.sendACK(true);
        }
    }
    sendACK(isFailure = false)
    {
        let seqnum = 0;
        if(this.currentState == RDT3_STATES.WAIT_1_BELOW)
            seqnum = 1;
        if(isFailure)
            seqnum = 1 - seqnum;
        this.sendPacketToNetworkLayer({data: "ACK"+seqnum, headers: {"Protocol": "RDT 3.0", "Description": `ACK${seqnum}`}});
    }
    onMessageFromHostReceived(message) { }
    reset()
    {
        this.currentState = RDT3_STATES.WAIT_0_BELOW;
    }
}