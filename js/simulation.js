import { COMMAND_TYPE } from "./event/command-event.js";
import { SIMULATION_EVENT_TYPE, SimulationEvent } from "./event/simulation-event.js";
import { hostTransportDelayProperties, networkLinkDelayProperties } from "./globals.js";
import { Host } from "./host.js";
import { Link } from "./link.js";
import { resetScenarioProgress } from "./scenarios/scenario-manager.js";
import { TransportProtocol } from "./transport/interface.js";

const playStates = {
    "PLAYING": "PLAYING",
    "PAUSED": "PAUSED",
    "STOPPED": "STOPPED"
};


export class Simulation
{
    /**
     * 
     * @param {Host} sender 
     * @param {Host} receiver 
     */
    constructor(sender, receiver)
    {
        /**
         * @type {keyof playStates}
         */
        this.playState = playStates.STOPPED;
        /**
         * @type {TransportProtocol}
         */
        this.senderTransportProtocol = null;
        /**
         * @type {TransportProtocol}
         */
        this.receiverTransportProtocol = null;
        /**
         * @type {number}
         * @private
         */
        this.timestamp = 0;
        /**
         * @type {number}
         */
        this.lastDateCheckTime = Date.now();
        /**
         * @type {Host}
         */
        this.sender = sender;
        /**
         * @type {Host}
         */
        this.receiver = receiver;

        this.senderTransportLink = null;
        this.receiverTransportLink = null;
        this.networkLayerLink = new Link(networkLinkDelayProperties);

        this.simulationEvent = new SimulationEvent();
        this.simulationSpeed = 1;

        this.sender.commandEvent.addListener(d => {
            if(d.type == COMMAND_TYPE.HOST_STARTED)
                this.senderTransportProtocol?.start();
            else if(d.type == COMMAND_TYPE.HOST_FINISHED)
                this.senderTransportProtocol?.finish();
        });
        this.receiver.commandEvent.addListener(d => {
            if(d.type == COMMAND_TYPE.HOST_STARTED)
                this.receiverTransportProtocol?.start();
            else if(d.type == COMMAND_TYPE.HOST_FINISHED)
                this.receiverTransportProtocol?.finish();
        });
    }

    update()
    {
        if(this.playState != playStates.PLAYING) return 0;
        const deltaTime = (Date.now() - this.lastDateCheckTime) * this.simulationSpeed;
        this.timestamp += deltaTime;
        this.lastDateCheckTime = Date.now();
        this.senderTransportLink.update(deltaTime);
        this.receiverTransportLink.update(deltaTime);
        this.networkLayerLink.update(deltaTime);
        this.sender.trySendMessages();

        this.senderTransportProtocol?.update(deltaTime);
        this.receiverTransportProtocol?.update(deltaTime);

        return deltaTime;
    }

    restart()
    {
        this.stop();
        this.play();
    }

    play()
    {
        let willInvokeRestartEvent = false;
        if(this.playState == playStates.PLAYING) return;
        if(this.playState == playStates.STOPPED)
        {
            this.timestamp = 0;
            willInvokeRestartEvent = true;
        }
        this.lastDateCheckTime = Date.now();
        this.playState = playStates.PLAYING;
        if(willInvokeRestartEvent)
        {
            this.simulationEvent.invoke({type: SIMULATION_EVENT_TYPE.SIMULATION_RESTARTED});
        }
    }

    stop()
    {
        this.sender.reset();
        this.receiver.reset();
        this.senderTransportProtocol.reset();
        this.receiverTransportProtocol.reset();
        this.networkLayerLink.reset();
        this.senderTransportLink.reset();
        this.receiverTransportLink.reset();
        resetScenarioProgress();
        this.simulationEvent.invoke({type: SIMULATION_EVENT_TYPE.SIMULATION_STOPPED});
        this.timestamp = 0;
        this.playState = playStates.STOPPED;
    }

    pause()
    {
        this.playState = playStates.PAUSED;
    }

    get isPlaying()
    {
        return this.playState == playStates.PLAYING;
    }

    /**
     * @returns {number}
     */
    getTimestamp()
    {
        return this.timestamp;
    }
    /**
     * 
     * @param {typeof TransportProtocol} senderProtocol 
     * @param {typeof TransportProtocol} receiverProtocol 
     */
    setTransportProtocol(senderProtocol, receiverProtocol)
    {
        this.senderTransportProtocol = new senderProtocol(true);
        this.receiverTransportProtocol = new receiverProtocol(false);

        this.senderTransportLink = new Link(hostTransportDelayProperties, 1);
        this.receiverTransportLink = new Link(hostTransportDelayProperties, 1);

        this.sender.linkSender = this.senderTransportLink.subscribeToLink(this.sender.onMessageReceivedFromTransport.bind(this.sender), () => true);
        this.receiver.linkSender = this.receiverTransportLink.subscribeToLink(this.receiver.onMessageReceivedFromTransport.bind(this.receiver), () => true);

        const transportToSender = this.senderTransportLink.subscribeToLink(
            this.senderTransportProtocol.onMessageFromHostReceived.bind(this.senderTransportProtocol),
            this.senderTransportProtocol.canReceiveFromHost.bind(this.senderTransportProtocol)
        );
        const transportToReceiver = this.receiverTransportLink.subscribeToLink(
            this.receiverTransportProtocol.onMessageFromHostReceived.bind(this.receiverTransportProtocol),
            this.receiverTransportProtocol.canReceiveFromHost.bind(this.receiverTransportProtocol)
        );
        
        this.networkLayerLink.resetLinks();
        const senderTransportToReceiverTransport = this.networkLayerLink.subscribeToLink(
            this.senderTransportProtocol.onPacketFromNetworkLayerReceived.bind(this.senderTransportProtocol),
            this.senderTransportProtocol.canReceiveFromNetworkLayer.bind(this.senderTransportProtocol)
        );
        const receiverTransportToSenderTransport = this.networkLayerLink.subscribeToLink(
            this.receiverTransportProtocol.onPacketFromNetworkLayerReceived.bind(this.receiverTransportProtocol),
            this.receiverTransportProtocol.canReceiveFromNetworkLayer.bind(this.receiverTransportProtocol)
        );

        this.senderTransportProtocol.setLinks(transportToSender, senderTransportToReceiverTransport);
        this.receiverTransportProtocol.setLinks(transportToReceiver, receiverTransportToSenderTransport);

        this.simulationEvent.invoke({type: SIMULATION_EVENT_TYPE.TRANSPORT_PROTOCOL_CHANGED});
    }
}