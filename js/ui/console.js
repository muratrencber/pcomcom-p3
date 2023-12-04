import { LOG_CONTEXT } from "../event/console-event.js";
import { SIMULATION_EVENT_TYPE } from "../event/simulation-event.js";
import { UIInterface } from "./interface.js";
import { UIContext } from "./uicontext.js";

export class ConsoleUI extends UIInterface
{
    /**
     * 
     * @param {string} targetId 
     * @param {boolean} forSender 
     */
    constructor(targetId, forSender)
    {
        super();
        /**
         * @type {Element}
         */
        this.element = document.getElementById(targetId).querySelector(".console");
        this.indicator = this.element.querySelector(".console-indicator");
        /**
         * @type {boolean}
         */
        this.forHost = forSender;
    }

    /**
     * 
     * @param {UIContext} context 
     */
    setup(context)
    {
        if(this.forHost)
        {
            context.senderHost.consoleEvent.addListener((data) => this.logToConsole(data.sender, data.message));
        }
        else
        {
            context.receiverHost.consoleEvent.addListener((data) => this.logToConsole(data.sender, data.message));
        }
        context.simulation.simulationEvent.addListener((data) => {
            if(data.type == SIMULATION_EVENT_TYPE.SIMULATION_STOPPED)
                this.clear();
            if(data.type == SIMULATION_EVENT_TYPE.TRANSPORT_PROTOCOL_CHANGED)
            {
                if(this.forHost)
                {
                    this.sender?.consoleEvent.removeListener(this.transportLogger);
                    this.sender = context.simulation.senderTransportProtocol;
                    this.transportLogger = (data) => {
                        this.logToConsole(data.sender, data.message, "#FF5500");
                    };
                    context.simulation.senderTransportProtocol.consoleEvent.addListener(this.transportLogger);
                }
                else
                {
                    this.receiver?.consoleEvent.removeListener(this.transportLogger);
                    this.receiver = context.simulation.receiverTransportProtocol;
                    this.transportLogger = (data) => {
                        let color = undefined;
                        switch(data.context)
                        {
                            case LOG_CONTEXT.CHANGE_STATE:
                                color = "#FF5500";
                                break;
                            case LOG_CONTEXT.RECEIVED_PACKET:
                                color = "#0055FF";
                                break;
                            case LOG_CONTEXT.SENT_PACKET:
                                color = "#22FF22";
                                break;
                            case LOG_CONTEXT.OUTPUT:
                                color = "#FFFFFF";
                                break;
                        }
                        this.logToConsole(data.sender, data.message, color);
                    };
                    context.simulation.receiverTransportProtocol.consoleEvent.addListener(this.transportLogger);
                }
            }
        })
    }

    /**
     * 
     * @param {string} sender 
     * @param {string} message 
     */
    logToConsole(sender, message, color = undefined)
    {
        const line = document.createElement("div");
        line.className = "console-line";
        if(color)
            line.style.color = color;
        let lineText = "";
        if(sender.trim() != "")
        {
            lineText += `[${sender}]: `;
        }
        lineText += message;
        line.innerText = lineText;
        this.element.insertBefore(line, this.indicator);
        this.indicator.scrollIntoView();
    }

    clear()
    {
        this.element.innerHTML = "";
        this.element.appendChild(this.indicator);
    }
}