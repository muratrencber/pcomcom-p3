import { getTimestampString } from "../timeutils.js";
import { UIInterface } from "./interface.js";
import { UIContext } from "./uicontext.js";

/**
 * @implements {UIInterface}
 */
export class TimerUI extends UIInterface
{
    /**
     * 
     * @param {UIContext} context 
     */
    setup(context)
    {
        this.timer = context.timerManager;
        this.timestampElement = document.getElementById("timestamp");
    }

    update()
    {
        this.timestampElement.innerText = getTimestampString(this.timer.timestampGetter());
    }
}