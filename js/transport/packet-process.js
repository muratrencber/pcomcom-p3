class Packet
{
    constructor(data, processTime, callback)
    {
        this.timer = processTime;
        this.data = data;
        this.processed = false;
        this.callback = callback;
    }

    update(deltaTime)
    {
        if(this.processed) return;
        this.timer -= deltaTime;
        if(this.timer <= 0)
        {
            this.processed = true;
        }
    }
}

export class PacketProcessor
{
    /**
     * 
     * @param {number} processTime 
     */
    constructor(processTime)
    {
        /**
         * @type {Packet[]}
         */
        this.packets = [];
        this.isProcessing = false;
        this.processTime = processTime;
    }

    update(deltaTime)
    {
        if(this.packets.length == 0) return;
        const p = this.packets[0];
        p.update(deltaTime);
        if(p.processed)
        {
            this.packets.shift();
            p.callback(p.data);
        }
    }

    /**
     * 
     * @param {any} packet 
     * @param {(data:any)=>} callback 
     * @param {number|undefined} processTime
     */
    addPacket(packet, callback, processTime)
    {
        const procTime = processTime ?? this.processTime;
        this.packets.push(new Packet(packet, procTime, callback));
        this.updateIsProcessing();
    }

    finishProcessForOne()
    {
        this.packets.shift();
        this.updateIsProcessing();
    }

    updateIsProcessing()
    {
        this.isProcessing = this.packets.length > 0;
    }

    reset()
    {
        this.isProcessing = false;
        this.packets = [];
    }
}