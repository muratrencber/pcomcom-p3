import { COMMAND_TYPE } from "../event/command-event.js";
import { SIMULATION_EVENT_TYPE } from "../event/simulation-event.js";
import { HighlightManager } from "./highlight-manager.js";
import { ImageDOMMapper } from "./image-dom-mapper.js";
import { UIInterface } from "./interface.js";
import { SMPacketDrawerUI } from "./sm-packet-drawer.js";
import { UIContext } from "./uicontext.js";

const COMMAND_TO_MASK_URL = {
    "UDT_SEND": "./media/rdt_svm_masks/udt_send.png",
    "RDT_RECV": "./media/rdt_svm_masks/rdt_rcv.png",
    "RDT_SEND": "./media/rdt_svm_masks/rdt_send.png",
    "DELIVER_DATA": "./media/rdt_svm_masks/deliver.png",
}

const HIGHLIGHT_DURATION = 1 * 1000; //ms
const RDTServiceMapper = new ImageDOMMapper(455, 470, document.getElementById("rdt-model-mask"));

export class ServiceModelUI extends UIInterface
{
    /**
     * 
     * @param {UIContext} context 
     */
    setup(context)
    {
        this.maskedImage = document.getElementById("rdt-model-mask");
        this.highlightManager = new HighlightManager(this.maskedImage, COMMAND_TO_MASK_URL, [], HIGHLIGHT_DURATION);
        this.simulation = context.simulation;
        this.senderLinkDrawer = new SMPacketDrawerUI(this.simulation.senderTransportLink, document.getElementById("packet-container"), RDTServiceMapper, [{x:143,y:175},{x:143,y:215}]);
        this.receiverLinkDrawer = new SMPacketDrawerUI(this.simulation.receiverTransportLink, document.getElementById("packet-container"), RDTServiceMapper, [{x:373,y:175},{x:373,y:215}]);
        this.networkLinkDrawer = new SMPacketDrawerUI(this.simulation.networkLayerLink, document.getElementById("packet-container"), RDTServiceMapper, [{x:143,y:320},{x:143,y:400},{x:373,y:400},{x:373,y:320}]);
        
        this.senderLinkDrawer.setup(context);
        this.receiverLinkDrawer.setup(context);
        this.networkLinkDrawer.setup(context);

        context.senderHost.commandEvent.addListener((data) => {
            this.highlightManager.addCommandToHighlighted(data.type);
        });
        context.receiverHost.commandEvent.addListener((data) => {
            this.highlightManager.addCommandToHighlighted(data.type);
        });
        this.setupTransportListeners(this.simulation);
        context.simulation.simulationEvent.addListener((data) => {
            if(data.type == SIMULATION_EVENT_TYPE.TRANSPORT_PROTOCOL_CHANGED)
            {
                this.removeTransportListeners();
                this.setupTransportListeners(this.simulation);
            }
            else if(data.type == SIMULATION_EVENT_TYPE.SIMULATION_STOPPED)
            {
                this.highlightManager.removeAllHighlights();
            }
        });
            }

    removeTransportListeners()
    {
        this.receiverEvent?.removeListener(this.transportListener);
        this.senderEvent?.removeListener(this.transportListener);
    }

    setupTransportListeners(simulation)
    {
        this.receiverEvent = simulation.receiverTransportProtocol.commandEvent;
        this.senderEvent = simulation.senderTransportProtocol.commandEvent;

        this.transportListener = (data) => this.highlightManager.addCommandToHighlighted(data.type);

        this.receiverEvent.addListener(this.transportListener);
        this.senderEvent.addListener(this.transportListener);

        this.senderLinkDrawer.targetLink = this.simulation.senderTransportLink;
        this.receiverLinkDrawer.targetLink = this.simulation.receiverTransportLink;
    }

    update(deltaTime)
    {
        this.networkLinkDrawer.update(deltaTime);
        this.senderLinkDrawer.update(deltaTime);
        this.receiverLinkDrawer.update(deltaTime);
    }
}