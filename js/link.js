import { LINK_EVENT_TYPE, LinkEvent } from "./event/link-event.js";
import { LINK_PACKET_EVENT_TYPE, LinkPacketEvent } from "./event/link-packet-event.js";

export const LINK_DIRECTION = {
    "A_TO_B": "A_TO_B",
    "B_TO_A": "B_TO_A",
}

export const PACKET_STATE = {
    "ON_WAY": "ON_WAY",
    "ON_WAY_CORRUPTED": "ON_WAY_CORRUPTED",
    "DROPPED": "DROPPED",
    "CORRUPTED": "CORRUPTED",
    "REACHED": "REACHED",
}

export class LinkDelay
{
    constructor(delay, minMaxDeviation, successReliabilityRate, corruptReliabilityRate)
    {
        this.delay = delay;
        this.minMaxDeviation = minMaxDeviation;
        this.finalState = PACKET_STATE.REACHED;
        this.successReliabilityRate = successReliabilityRate;
        this.corruptReliabilityRate = corruptReliabilityRate;
        this.calculateDelay();
    }

    calculateDelay()
    {
        this.fullDelay = this.delay + (Math.random() * this.minMaxDeviation * 2 - this.minMaxDeviation);
        this.actualDelay = this.fullDelay;
        if(this.successReliabilityRate < 1 && Math.random() > this.successReliabilityRate)
        {
            if(this.corruptReliabilityRate > 0 && Math.random() <= this.corruptReliabilityRate)
                this.finalState = PACKET_STATE.CORRUPTED;
            else
                this.finalState = PACKET_STATE.DROPPED;
            this.actualDelay = Math.random() * this.fullDelay;
        }
    }
}

export class LinkPacket
{
    /**
     * 
     * @param {any} packet 
     * @param {keyof LINK_DIRECTION} direction 
     * @param {LinkDelay} delayData 
     */
    constructor(packet, direction, delayData)
    {
        this.packet = JSON.parse(JSON.stringify(packet));
        this.direction = direction;
        /**
         * @type {LinkDelay}
         */
        this.delayData = delayData;
        this.timer = 0;
        /**
         * @type {keyof PACKET_STATE}
         */
        this.state = PACKET_STATE.ON_WAY;
        this.stateChangedThisUpdate = false;
        this.packetEvent = new LinkPacketEvent();
    }

    get normalizedPosition()
    {
        let pos = this.timer / this.delayData.fullDelay;
        if(pos < 0)
            return 0;
        if(pos > 1)
            return 1;
        return pos;
    }

    /**
     * 
     * @param {string} string 
     */
    corruptString(string)
    {
        if(string == undefined) return string;
        for(let i = 0; i < string.length; i++)
        {
            let code = string.charCodeAt(i);
            code += Math.round(Math.random() * 500 - 250);
            let newChar = String.fromCharCode(code);
            if(i < string.length - 1)
                string = string.substring(0,i) + newChar + string.substring(i + 1);
            else
                string = string.substring(0,i) + newChar;
        }
        return string;
    }

    corruptPacket()
    {
        this.packet.data = this.corruptString(this.packet.data);
        for(let i = 0; i < this.packet.headers.length; i++)
        {
            this.packet.headers[i] = this.corruptString(this.packet.headers[i]);
        }
    }

    /**
     * 
     * @param {number} deltaTime
     */
    update(deltaTime)
    {
        if(this.state != PACKET_STATE.ON_WAY && this.state != PACKET_STATE.ON_WAY_CORRUPTED) return;
        this.timer += deltaTime;
        if(this.state != PACKET_STATE.ON_WAY_CORRUPTED
            && this.delayData.finalState != PACKET_STATE.REACHED 
                && this.timer >= this.delayData.actualDelay)
        {
            if(this.delayData.finalState == PACKET_STATE.DROPPED)
            {
                this.state = PACKET_STATE.DROPPED;
                this.stateChangedThisUpdate = true;
                this.packetEvent.invoke({type: LINK_PACKET_EVENT_TYPE.DROPPED});
                return;
            }
            else
            {
                this.corruptPacket();
                this.state = PACKET_STATE.ON_WAY_CORRUPTED;
                this.stateChangedThisUpdate = true;
                this.packetEvent.invoke({type: LINK_PACKET_EVENT_TYPE.CORRUPTED});
            }
        }
        else if(this.timer >= this.delayData.fullDelay)
        {
            this.timer = this.delayData.fullDelay;
            this.state = this.delayData.finalState;
            this.stateChangedThisUpdate = true;
            if(this.state == PACKET_STATE.REACHED)
                this.packetEvent.invoke({type: LINK_PACKET_EVENT_TYPE.DELIVERED});
        }
    }
}

/**
 * @template T
 */
export class Link
{
    constructor(delayValues, maxPacketCount = 0)
    {
        /**
         * @type {(T)=>}
         */
        this.receiverFuncA = undefined;
        /**
         * @type {(T)=>}
         */
        this.receiverFuncB = undefined;
        /**
         * @type {()=>boolean}
         */
        this.availabilityCheckA = undefined;
        /**
         * @type {()=>boolean}
         */
        this.availabilityCheckB = undefined;
        /**
         * @type {LinkPacket[]}
         */
        this.packets = [];
        /**
         * @type {keyof LINK_DIRECTION}
         */
        this.direction = LINK_DIRECTION.A_TO_B;
        this.delayValues = delayValues;
        this.maxPacketCount = maxPacketCount;
        this.linkEvent = new LinkEvent();
    }

    /**
     * 
     * @param {number} deltaTime 
     */
    update(deltaTime)
    {
        this.packets.forEach(p => {
            p.stateChangedThisUpdate = false;
            if(p.state != PACKET_STATE.ON_WAY && p.state != PACKET_STATE.ON_WAY_CORRUPTED) return;
            p.update(deltaTime);
            if(p.state == PACKET_STATE.REACHED || p.state == PACKET_STATE.CORRUPTED)
            {
                if(p.direction == LINK_DIRECTION.A_TO_B)
                    this.receiverFuncB(p.packet, p.state == PACKET_STATE.CORRUPTED);
                else
                    this.receiverFuncA(p.packet, p.state == PACKET_STATE.CORRUPTED);
            }
        });
        this.packets = this.packets.filter(p => {
            if(p.stateChangedThisUpdate)
                return true;
            if(p.state == PACKET_STATE.ON_WAY || p.state == PACKET_STATE.ON_WAY_CORRUPTED)
                return true;
            return false;
        });
    }

    /**
     * 
     * @param {T} message
     * @param {LinkDelay} delaySeed
     * @param {keyof LINK_DIRECTION} direction 
     */
    sendMessage(message, delayData = undefined, direction)
    {
        if(this.maxPacketCount > 0 && this.packets.length >= this.maxPacketCount) return false;
        if(direction == LINK_DIRECTION.A_TO_B && (!this.availabilityCheckB || !this.availabilityCheckB()))
            return false;
        if(direction == LINK_DIRECTION.B_TO_A && (!this.availabilityCheckA || !this.availabilityCheckA()))
            return false;
        if(!delayData)
        {
            const [delay, deviation, reliabilityRate, corruptionRate] = this.delayValues;
            delayData = new LinkDelay(delay, deviation, reliabilityRate, corruptionRate);
        }
        const packet = new LinkPacket(message, direction, delayData);
        this.packets.push(packet);
        this.linkEvent.invoke({type: LINK_EVENT_TYPE.ADDED_PACKET, packet: packet});
        return true;
    }

    /**
     * 
     * @param {(T)=>} receiverFunc 
     * @param {()=>boolean} availabilityCheckFunc
     * @returns {(T, LinkDelay)=>boolean} 
     */
    subscribeToLink(receiverFunc, availabilityCheckFunc)
    {
        if(this.receiverFuncA != undefined)
        {
            this.receiverFuncB = receiverFunc;
            this.availabilityCheckB = availabilityCheckFunc;
            return (m, d = undefined) => this.sendMessage(m,d,LINK_DIRECTION.B_TO_A);
        }
        else
        {
            this.receiverFuncA = receiverFunc;
            this.availabilityCheckA = availabilityCheckFunc;
            return (m, d = undefined) => this.sendMessage(m,d,LINK_DIRECTION.A_TO_B);
        }
    }

    resetLinks()
    {
        this.receiverFuncA = undefined;
        this.receiverFuncB = undefined;
        this.availabilityCheckA = undefined;
        this.availabilityCheckB = undefined;
        this.reset();
    }

    reset()
    {
        this.packets = [];
    }
}