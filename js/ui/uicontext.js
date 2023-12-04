import { Host } from "../host.js";
import { Simulation } from "../simulation.js";
import { TimerManager } from "../timer.js";

export class UIContext
{
    constructor()
    {
        /**
         * @type {Simulation}
         */
        this.simulation = null;
        /**
         * @type {TimerManager}
         */
        this.timerManager = null;
        /**
         * @type {Host}
         */
        this.senderHost = null;
        /**
         * @type {Host}
         */
        this.receiverHost = null;
    }
}
