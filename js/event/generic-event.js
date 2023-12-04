/**
 * @template EventDataClass
 */
export class GenericEvent
{

    constructor()
    {
        /**
         * @type {(data:EventDataClass)=>void[]}
         */
        this.listeners = [];
    }

    /**
     * 
     * @param {EventDataClass} data 
     */
    invoke(data)
    {
        this.listeners.forEach(l => l(data));
    }

    /**
     * 
     * @param {(data:EventDataClass)=>void} listener 
     */
    addListener(listener)
    {
        if(this.listeners.includes(listener)) return;
        this.listeners.push(listener);
    }

    /**
     * 
     * @param {(data:EventDataClass)=>void} listener 
     */
    removeListener(listener)
    {
        const index = this.listeners.indexOf(listener);
        if(index < 0) return;
        this.listeners.splice(index, 1);
    }
}