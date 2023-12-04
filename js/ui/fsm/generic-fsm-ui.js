import { COMMAND_TYPE } from "../../event/command-event.js";
import { SIMULATION_EVENT_TYPE } from "../../event/simulation-event.js";
import { Simulation } from "../../simulation.js";
import { HighlightManager } from "../highlight-manager.js";
import { UIInterface } from "../interface.js";

export class GenericTransportFSMUI extends UIInterface
{
    constructor(targetClass, isSender, sourceMaskId, stateMaps, transitionMaps, duration)
    {
        super();
        this.isSender = isSender;
        this.sourceMaskImage = document.getElementById(sourceMaskId);
        this.targetClass = targetClass;
        this.stateMaps = stateMaps;
        this.transitionMaps = transitionMaps;
        this.highlightManager = new HighlightManager(this.sourceMaskImage, {...stateMaps, ...transitionMaps}, Object.keys(stateMaps), duration);
        this.isCurrentTransport = false;
    }

    setup(context)
    {
        /**
         * @type {Simulation}
         */
        this.simulation = context.simulation;
        this.simulation.simulationEvent.addListener((data) => {
            if(data.type == SIMULATION_EVENT_TYPE.SIMULATION_STOPPED)
            {
                this.highlightManager.removeAllHighlights();
                this.isCurrentTransport = false;
            }
            else if(data.type == SIMULATION_EVENT_TYPE.SIMULATION_RESTARTED)
            {
                this.checkListeners();
            }
            else if(data.type == SIMULATION_EVENT_TYPE.TRANSPORT_PROTOCOL_CHANGED)
            {
                this.checkListeners();
            }
        });
        if(this.simulation.isPlaying)
            this.checkListeners();
    }

    checkListeners()
    {
        let result = false;
        if(this.isSender && this.simulation.senderTransportProtocol instanceof this.targetClass)
            result = true;
        else if(!this.isSender && this.simulation.receiverTransportProtocol instanceof this.targetClass)
            result = true;
        if(result == this.isCurrentTransport)
            return;
        if(this.targetTransport)
        {
            this.targetTransport.commandEvent.removeListener(this.listener);
            this.listener = null;
            this.targetTransport = null;
        }
        if(result)
        {
            this.targetTransport = this.isSender ? this.simulation.senderTransportProtocol : this.simulation.receiverTransportProtocol;
            /**
             * 
             * @param {CommandEventData} data 
             */
            this.listener = (data) => {
                if(data.type == COMMAND_TYPE.CHANGE_STATE)
                    this.highlightManager.selectNonTimeoutCommand(data.value);
                else
                    this.highlightManager.addCommandToHighlighted(data.type);
            }
            this.targetTransport.commandEvent.addListener(this.listener);
            this.highlightManager.selectNonTimeoutCommand(this.targetTransport.currentState);
        }
    }
}