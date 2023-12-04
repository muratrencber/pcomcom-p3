import { Simulation } from "../simulation.js";
import { UIInterface } from "./interface.js";
import { UIContext } from "./uicontext.js";

export class SimulationButtonsUI extends UIInterface
{
    /**
     * 
     * @param {UIContext} context 
     */
    setup(context)
    {
        const playPauseButtonContainer = document.getElementById("play-pause-button");
        this.playButton = playPauseButtonContainer.querySelector(".button.play");
        this.pauseButton = playPauseButtonContainer.querySelector(".button.pause");
        this.stopButton = document.getElementById("stop-button");
        /**
         * @type {Simulation}
         */
        this.simulation = context.simulation;

        this.playButton.addEventListener("click", () => {
            this.simulation.play();
            this.refresh();
        });
        this.pauseButton.addEventListener("click", () => {
            this.simulation.pause();
            this.refresh();
        });
        this.stopButton.addEventListener("click", () => {
            this.simulation.stop();
            this.refresh();
        });
    }

    refresh()
    {
        if(this.simulation.isPlaying)
        {
            this.playButton.style.display = "none";
            this.pauseButton.style.display = "";
        }
        else
        {
            this.playButton.style.display = "";
            this.pauseButton.style.display = "none";
        }
    }
}