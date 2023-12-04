export class HighlightManager
{
    /**
     * 
     * @param {HTMLImageElement} sourceMaskImage 
     * @param {Object.<string,string>} stateMapper 
     * @param {Array<string>} nonTimeoutStates 
     * @param {number} timeoutDuration 
     */
    constructor(sourceMaskImage, stateMapper, nonTimeoutStates, timeoutDuration)
    {
        /**
         * @type {HTMLImageElement}
         */
        this.sourceMaskImage = sourceMaskImage;
        /**
         * @type {Object.<string,string>}
         */
        this.stateMapper = stateMapper;
        /**
         * @type {Array<string>}
         */
        this.nonTimeoutStates = nonTimeoutStates;
        /**
         * @type {number}
         */
        this.timeoutDuration = timeoutDuration;
        /**
         * @type {Object.<string, HTMLImageElement>}
         */
        this.maskedImages = {};
        /**
         * @type {{command: keyof string, timeoutID: number}[]}
         */
        this.currentlyHighlightedStates = [];
        this.createMaskedElements();
    }

    createMaskedElements()
    {
        for(const stateKey in this.stateMapper)
        {
            const stateUrl = this.stateMapper[stateKey];
            const img = document.createElement("img");
            img.src = this.sourceMaskImage.src;
            img.style.webkitMaskImage = `url(${stateUrl})`;
            img.className = "masked-image hidden";
            img.style.webkitMaskSize = "cover";
            this.sourceMaskImage.insertAdjacentElement("afterend", img);
            this.maskedImages[stateKey] = img;
        }
    }
    
    /**
     * 
     * @param {string} commandType 
     */
    addCommandToHighlighted(commandType)
    {
        if(commandType == undefined || commandType == null || this.stateMapper[commandType] == undefined)
            return;
        let reanimIndex = this.currentlyHighlightedStates.findIndex(v => v.command == commandType);
        let isPermanent = this.nonTimeoutStates.includes(commandType);
        let timeoutID = -1;
        if(!isPermanent)
            timeoutID = setTimeout(() => this.removeCommandFromHighlighted(commandType), this.timeoutDuration);
        if(reanimIndex >= 0 && !isPermanent)
        {
            clearTimeout(this.currentlyHighlightedStates[reanimIndex].timeoutID);
            this.currentlyHighlightedStates[reanimIndex].timeoutID = timeoutID;
        }
        else if(reanimIndex < 0)
        {
            this.currentlyHighlightedStates.push({
                command: commandType,
                timeoutID: timeoutID,
            });
            this.applyHighlights();
        }
    }

    selectNonTimeoutCommand(commandType)
    {
        if(!commandType)
            return;
        if(!this.nonTimeoutStates.includes(commandType))
            return;
        this.currentlyHighlightedStates = this.currentlyHighlightedStates.filter(s => {
            if(s.command == commandType || !this.nonTimeoutStates.includes(s.command))
                return true;
            return false;
        });
        this.addCommandToHighlighted(commandType);
    }

    removeCommandFromHighlighted(commandType)
    {
        this.currentlyHighlightedStates.splice(this.currentlyHighlightedStates.findIndex(t => t.command == commandType), 1);
        this.applyHighlights();
    }

    removeAllHighlights()
    {
        this.currentlyHighlightedStates.forEach(v => clearTimeout(v.timeoutID));
        this.currentlyHighlightedStates = [];
        this.applyHighlights();
    }

    applyHighlights()
    {
        for(const com in this.stateMapper)
        {
            const isHidden = this.currentlyHighlightedStates.findIndex(v => v.command == com) < 0;
            const img = this.maskedImages[com];
            if(isHidden)
                img.classList.add("hidden");
            else
            {
                img.classList.remove("hidden");
            }
        }
    }
}