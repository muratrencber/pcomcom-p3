import { COMMAND_TYPE, CommandEvent } from "../event/command-event.js";
import { ConsoleEvent, LOG_CONTEXT } from "../event/console-event.js";
import { getNetworkLayerLinkDelay } from "../scenarios/scenario-manager.js";
import { TRANSPORT_SIDE } from "../scenarios/scenario-template.js";
import { PacketProcessor } from "./packet-process.js";

/**
 * @interface
 */
export class TransportProtocol
{
    constructor(isSender)
    {
        this.commandEvent = new CommandEvent();
        this.packetProcessor = new PacketProcessor(1000);
        this.currentState = null;
        this.isSender = isSender ?? true;
        this.consoleEvent = new ConsoleEvent();
    }

    getName() {return undefined;}
    /**
     * 
     * @param {string} msg 
     * @param {keyof LOG_CONTEXT} context 
     */
    log(msg, context = undefined) {this.consoleEvent.invoke({sender: this.getName() ?? "Transport Protocol", message: msg, context: context});}

    start() {}
    finish() {}

    setLinks(senderToHost, senderToNetworkLayer)
    {
        this.senderToHost = senderToHost;
        this.senderToNetworkLayer = senderToNetworkLayer;
    }

    changeState(state)
    {
        this.log(`Changing state from ${this.currentState} -> ${state}`, LOG_CONTEXT.CHANGE_STATE);
        this.currentState = state;
        this.commandEvent.invoke({type: COMMAND_TYPE.CHANGE_STATE, value: this.currentState});
        this.onStateChanged();
    }

    onStateChanged()
    {

    }
    
    canReceiveFromHost()
    {
        return true;
    }
    canReceiveFromNetworkLayer()
    {
        return true;
    }
    onPacketFromNetworkLayerReceived(packet, isCorrupted) {
        this.commandEvent.invoke({type: COMMAND_TYPE.RDT_RECV});
     }
    /**
     * 
     * @param {string} message
     * @returns {boolean} 
     */
    onMessageFromHostReceived(message) { }

    /**
     * 
     * @param {any} message 
     * @returns {boolean}
     */
    sendMessageToHost(message)
    {
        this.commandEvent.invoke({type: COMMAND_TYPE.DELIVER_DATA});
        return this.senderToHost(message);
    }

    /**
     * 
     * @param {any} packet
     * @returns {boolean}
     */
    sendPacketToNetworkLayer(packet)
    {
        let transportSide = this.isSender ? TRANSPORT_SIDE.SENDER : TRANSPORT_SIDE.RECEIVER;
        let delay = getNetworkLayerLinkDelay(transportSide);
        this.commandEvent.invoke({type: COMMAND_TYPE.UDT_SEND});
        return this.senderToNetworkLayer(packet, delay);
    }

    reset()
    {
        this.packetProcessor.reset();
    }

    update(deltaTime)
    {
        this.packetProcessor.update(deltaTime);
    }
}
