import { SIMULATION_EVENT_TYPE } from "../../event/simulation-event.js";
import { RDT1Sender } from "../../transport/rdt1.js";
import { RDT2Sender } from "../../transport/rdt2.js";
import { RDT3Sender } from "../../transport/rdt3.js";
import { TCPProtocol } from "../../transport/tcp.js";
import { UIInterface } from "../interface.js";
import { UIContext } from "../uicontext.js";

export class FSMTogglesUI extends UIInterface
{
    /**
     * 
     * @param {UIContext} context 
     */
    setup(context)
    {
        this.fsm_map = [
            [RDT1Sender, document.getElementById("rdt1-fsm-container")],
            [RDT2Sender, document.getElementById("rdt2-fsm-container")],
            [RDT3Sender, document.getElementById("rdt3-fsm-container")],
            [TCPProtocol, document.getElementById("tcp-fsm-container")],
        ];

        this.parent = document.getElementById("fsm-containers-container");
        const buttonParent = this.parent.querySelector(".toggles");
        this.bothToggleButton = buttonParent.querySelector(".toggle.both");
        this.senderToggleButton = buttonParent.querySelector(".toggle.sender");
        this.receiverToggleButton = buttonParent.querySelector(".toggle.receiver");

        this.bothToggleButton.addEventListener("click", () => this.showBoth());
        this.senderToggleButton.addEventListener("click", () => this.showSender());
        this.receiverToggleButton.addEventListener("click", () => this.showReceiver());

        this.simulation = context.simulation;

        context.simulation.simulationEvent.addListener(d => {
            if(d.type == SIMULATION_EVENT_TYPE.TRANSPORT_PROTOCOL_CHANGED)
            {
                this.refreshActiveFSM();
            }
        })

        this.showingSender = false;
        this.showingReceiver = false;
        this.showBoth();
    }

    refresh()
    {
        this.refreshActiveFSM();
    }

    refreshActiveFSM()
    {
        for(const [type, container] of this.fsm_map)
        {
            let isActive = this.simulation.senderTransportProtocol instanceof type;
            if(isActive && container.classList.contains("hidden"))
                container.classList.remove("hidden");
            else if(!isActive && !container.classList.contains("hidden"))
                container.classList.add("hidden");
        }
        this.show(this.showingSender, this.showingReceiver);
    }

    show(showSender, showReceiver)
    {
        this.showingSender = showSender;
        this.showingReceiver = showReceiver;
        const [sender, receiver] = this.findFSMs();
        if(showSender)
            sender.classList.remove("hidden");
        else
            sender.classList.add("hidden");
        if(showReceiver)
            receiver.classList.remove("hidden");
        else
            receiver.classList.add("hidden");
        this.bothToggleButton.classList.remove("selected");
        this.senderToggleButton.classList.remove("selected");
        this.receiverToggleButton.classList.remove("selected");
        if(showSender && showReceiver)
            this.bothToggleButton.classList.add("selected");
        else if(showSender)
            this.senderToggleButton.classList.add("selected");
        else if(showReceiver)
            this.receiverToggleButton.classList.add("selected");
    }

    showBoth()
    {
        this.show(true, true);
    }

    showSender()
    {
        this.show(true, false);
    }

    showReceiver()
    {
        this.show(false, true);
    }

    /**
     * @returns {[Element, Element]}
     */
    findFSMs()
    {
        const parent = this.parent.querySelector(".fsm-container:not(.hidden)");
        return [parent.querySelector(".fsm-sender"), parent.querySelector(".fsm-receiver")];
    }
}