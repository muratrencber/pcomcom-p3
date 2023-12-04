export class Timer
{
    /**
     * 
     * @param {number} startTimestamp 
     * @param {number} duration 
     * @param {()=>} callback 
     */
    constructor(startTimestamp, duration, callback)
    {
        this.endTimestamp = startTimestamp + duration;
        this.duration = duration;
        this.callback = callback;
        this.executed = false;
    }

    check(currentTimestamp)
    {
        if(this.executed) return;
        if(currentTimestamp >= this.endTimestamp)
        {
            this.callback();
            this.executed = true;
        }
    }
}

export class TimerManager
{
    /**
     * 
     * @param {()=>number} timestampGetter 
     */
    constructor(timestampGetter)
    {
        /**
         * @type {Timer[]}
         */
        this.timers = [];
        /**
         * @type {()=>number}
         */
        this.timestampGetter = timestampGetter;
    }

    /**
     * 
     * @param {number} duration 
     * @param {()=>} callback
     * @returns {Timer}
     */
    addTimer(duration, callback)
    {
        const timestamp = this.timestampGetter();
        const timer = new Timer(timestamp, duration, callback);
        this.timers.push(timer);
        return timer;
    }

    /**
     * @param {Timer} timer 
     */
    removeTimer(timer)
    {
        const timerIndex = this.timers.indexOf(timer);
        this.timers.splice(timerIndex, 1);
    }

    check()
    {
        const timestamp = this.timestampGetter();
        for(const timer of this.timers)
        {
            timer.check(timestamp);
        }
        this.clearFinished();
    }

    clearAll()
    {
        this.timers = [];
    }

    clearFinished()
    {
        this.timers = this.timers.filter(timer => !timer.executed);
    }
    
}