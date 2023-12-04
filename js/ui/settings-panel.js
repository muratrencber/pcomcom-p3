import { setDelayProperties } from "../globals.js";
import { changeScenario } from "../scenarios/scenario-manager.js";
import { SCENARIO_TYPE } from "../scenarios/scenario-sheets.js";
import { Simulation } from "../simulation.js";
import { RDT1Receiver, RDT1Sender } from "../transport/rdt1.js";
import { RDT2Receiver, RDT2Sender } from "../transport/rdt2.js";
import { RDT3Receiver, RDT3Sender } from "../transport/rdt3.js";
import { TCPProtocol } from "../transport/tcp.js";
import { UIInterface } from "./interface.js";

export class SettingsPanelUI extends UIInterface
{
    /**
     * 
     * @param {import("./uicontext").UIContext} context 
     */
    setup(context)
    {
        /**
         * @type {Simulation}
         */
        this.simulation = context.simulation;
        this.panel = document.getElementById("settings-panel");
        this.background = this.panel.querySelector(".settings-background");
        this.button = document.getElementById("settings-button");
        this.closeButton = document.getElementById("close-settings-button");

        this.closeButton.addEventListener("click", this.hide_panel.bind(this));
        this.button.addEventListener("click", this.show_panel.bind(this));
        this.background.addEventListener("click", this.hide_panel.bind(this));

        this.transportProtocolSelection = document.getElementById("transport-protocol");
        this.transportProtocolSelection.addEventListener("change", () => {
            this.applyTransportSelection();
        });
        this.simSpeed = document.getElementById("simulation-speed");
        this.simSpeed.addEventListener("input", () => {
            this.applySimSpeed();
        })
        this.scenarioSelection = document.getElementById("scenario-selection");
        this.scenarioSelection.addEventListener("change", () => {
            this.applyScenarioSelection();
        });

        this.packetLossCheckbox = document.getElementById("packet-loss-enabled");
        this.packetCorruptionCheckbox = document.getElementById("packet-corruption-enabled");

        this.packetLossCheckbox.addEventListener("change", () => { this.applyDelayProperties(); });
        this.packetCorruptionCheckbox.addEventListener("change", () => { this.applyDelayProperties(); });
    }

    applySimSpeed()
    {
        const [start, end] = [0.2,10];
        const dist = end - start;
        let normalized = this.simSpeed.value / this.simSpeed.max;
        const newSpeed = start + dist * normalized;
        this.simSpeed.parentElement.querySelector("div").innerText = newSpeed.toFixed(2)+"x";
        this.simulation.simulationSpeed = newSpeed;
    }

    applyTransportSelection()
    {
        const MAP = {
            "rdt1": [RDT1Sender, RDT1Receiver],
            "rdt2": [RDT2Sender, RDT2Receiver],
            "rdt3": [RDT3Sender, RDT3Receiver],
            "tcp": [TCPProtocol, TCPProtocol]
        };
        const [sender, receiver] = MAP[this.transportProtocolSelection.value];
        if(this.simulation.senderTransportProtocol instanceof sender && this.simulation.receiverTransportProtocol instanceof receiver)
            return;
        this.simulation.setTransportProtocol(sender, receiver);
        this.simulation.stop();
    }

    applyScenarioSelection()
    {
        const networkAdjustableKeys = [SCENARIO_TYPE.DEFAULT_SCENARIO, SCENARIO_TYPE.SUCCESSFULL_SCENARIO];
        let key = this.scenarioSelection.value;
        const result = changeScenario(key);
        if(!result)
        {
            key = SCENARIO_TYPE.DEFAULT_SCENARIO;
            this.scenarioSelection.value = SCENARIO_TYPE.DEFAULT_SCENARIO;
            changeScenario(SCENARIO_TYPE.DEFAULT_SCENARIO);
        }
        let canAdjust = networkAdjustableKeys.includes(key);
        this.packetLossCheckbox.disabled = !canAdjust;
        this.packetCorruptionCheckbox.disabled = !canAdjust;
    }

    applyDelayProperties()
    {
        const packetLossEnabled = this.packetLossCheckbox.checked;
        const packetCorruptionEnabled = this.packetCorruptionCheckbox.checked;
        setDelayProperties(packetLossEnabled, packetCorruptionEnabled);
    }

    hide_panel()
    {
        if(this.panel.classList.contains("hidden"))
            return;
        this.panel.classList.add("hidden");
        if(this.willContinueSimulation)
            this.simulation.play();
    }

    show_panel()
    {
        if(!this.panel.classList.contains("hidden"))
            return;
        this.panel.classList.remove("hidden");
        this.willContinueSimulation = this.simulation.isPlaying;
        if(this.willContinueSimulation)
            this.simulation.pause();
    }

    refresh()
    {
        this.applySimSpeed();
        this.applyTransportSelection();
        this.applyScenarioSelection();
        this.applyDelayProperties();
    }
}