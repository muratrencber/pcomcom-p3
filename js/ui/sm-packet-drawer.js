import { SIMULATION_EVENT_TYPE } from "../event/simulation-event.js";
import { LINK_DIRECTION, Link, LinkPacket, PACKET_STATE } from "../link.js";
import { ImageDOMMapper } from "./image-dom-mapper.js";
import { UIInterface } from "./interface.js";
import { showPacketPopup } from "./popup.js";
import { UIContext } from "./uicontext.js";

const DIRECTION = {
    LEFT: "LEFT",
    RIGHT: "RIGHT",
    UP: "UP",
    DOWN: "DOWN",
}

const OPACITY_DURATION = 0.1;

export class SMPacketDrawerUI extends UIInterface
{
    /**
     * 
     * @param {Link} targetLink 
     * @param {Element} parentElement
     * @param {ImageDOMMapper} domMapper
     * @param {Array<{x: number, y: number}} aToBPoints 
     */
    constructor(targetLink, parentElement, domMapper, aToBPoints)
    {
        super();
        /**
         * @type {Element}
         */
        this.parentElement = parentElement;
        /**
         * @type {Link}
         */
        this.targetLink = targetLink;
        /**
         * @type {ImageDOMMapper}
         */
        this.domMapper = domMapper;
        /**
         * @type {Array<{x: number, y: number}}
         */
        this.aToBPoints = aToBPoints;
        /**
         * @type {Array<HTMLImageElement>}
         */
        this.packetAssets = [];
        /**
         * @type {Array<{targetLink: LinkPacket, element: HTMLImageElement, remainingDuration: number, fullDuration: number, x: number, y: number}>}
         */
        this.indicatorAssets = [];
    }

    createPacketAsset()
    {
        const packetElement = document.createElement("img");
        packetElement.className = "packet-asset";
        packetElement.style.opacity = 0;
        this.parentElement.appendChild(packetElement);
        this.packetAssets.push(packetElement);
        return packetElement;
    }

    /**
     * 
     * @param {LinkPacket} linkPacket 
     * @param {HTMLImageElement} packetElement 
     */
    adjustPacketAsset(linkPacket, packetElement)
    {
        let ratio = linkPacket.normalizedPosition;
        let totalLength = 0;
        let array = [...this.aToBPoints];
        if(linkPacket.direction == LINK_DIRECTION.B_TO_A)
            array = array.reverse();
        for(let i = 0; i < array.length - 1; i++)
        {
            const pointA = array[i];
            const pointB = array[i + 1];
            const x = (pointB.x - pointA.x);
            const y = (pointB.y - pointA.y);
            const len = Math.sqrt(x * x + y * y);
            totalLength += len;
        }
        let currentLength = 0;
        let newPoint = array[0];
        let direction = DIRECTION.RIGHT;
        for(let i = 0; i < array.length - 1; i++)
        {
            const pointA = array[i];
            const pointB = array[i + 1];
            const x = (pointB.x - pointA.x);
            const y = (pointB.y - pointA.y);
            const len = Math.sqrt(x * x + y * y);
            const currentRatio = currentLength / totalLength;
            currentLength += len;
            const newRatio = currentLength / totalLength;
            if(ratio >= currentRatio && ratio <= newRatio)
            {
                const segmentRatio = (ratio - currentRatio) / (newRatio - currentRatio);
                const newX = pointA.x + x * segmentRatio;
                const newY = pointA.y + y * segmentRatio;
                newPoint = { x: newX, y: newY };
                if(x > 0)
                    direction = DIRECTION.RIGHT;
                else if(x < 0)
                    direction = DIRECTION.LEFT;
                else if(y > 0)
                    direction = DIRECTION.DOWN;
                else if(y < 0)
                    direction = DIRECTION.UP;
                break;
            }
        }
        switch(direction)
        {
            case DIRECTION.RIGHT:
                packetElement.src = "./media/packet/packet_right.png";
                break;
            case DIRECTION.LEFT:
                packetElement.src = "./media/packet/packet_left.png";
                break;
            case DIRECTION.UP:
                packetElement.src = "./media/packet/packet_up.png";
                break;
            case DIRECTION.DOWN:
                packetElement.src = "./media/packet/packet_down.png";
                break;
        }
        const domPosition = this.domMapper.imageToDOMPosition(newPoint.x, newPoint.y);
        this.positionPacketRect(domPosition, packetElement);
        if(ratio <= OPACITY_DURATION)
        {
            const opacity = ratio / OPACITY_DURATION;
            packetElement.style.opacity = opacity;
        }
        else if(ratio >= 1 - OPACITY_DURATION)
        {
            const opacity = (1 - ratio) / OPACITY_DURATION;
            packetElement.style.opacity = opacity;
        }
        else
        {
            packetElement.style.opacity = 1;
        }
        if(linkPacket.state == PACKET_STATE.DROPPED)
        {
            let indicatorElement = this.indicatorAssets.find(indicator => indicator.targetLink == linkPacket)?.element;
            if(!indicatorElement)
            {
                indicatorElement = document.createElement("div");
                indicatorElement.className = "packet-asset dropped";
                indicatorElement.style.opacity = 0;
                this.parentElement.appendChild(indicatorElement);
                this.indicatorAssets.push({
                    targetLink: linkPacket,
                    element: indicatorElement,
                    remainingDuration: 1000,
                    fullDuration: 1000,
                    x: newPoint.x,
                    y: newPoint.y
                });
            }
        }
        else
        {
            if(linkPacket.state == PACKET_STATE.ON_WAY_CORRUPTED && !packetElement.classList.contains("corrupt"))
            {
                packetElement.classList.add("corrupt");
            }
            else if(linkPacket.state == PACKET_STATE.ON_WAY && packetElement.classList.contains("corrupt"))
            {
                packetElement.classList.remove("corrupt");
            }
        }
    }

    /**
     * 
     * @param {UIContext} context 
     */
    setup(context)
    {
        context.simulation.simulationEvent.addListener((event) => {
            if(event.type == SIMULATION_EVENT_TYPE.SIMULATION_STOPPED)
                this.indicatorAssets.forEach(i => i.remainingDuration = 0);
        });
    }

    /**
     * 
     * @param {{x: number, y: number}} domPosition 
     * @param {Element} packetElement 
     */
    positionPacketRect(domPosition, packetElement)
    {
        let domRect = packetElement.getBoundingClientRect();
        let offsetX = -domRect.width / 2;
        let offsetY = -domRect.height / 2;
        const posX = Math.round(domPosition.x + offsetX);
        const posY = Math.round(domPosition.y + offsetY);
        packetElement.style.left = `${posX}px`;
        packetElement.style.top = `${posY}px`;
    }

    update(deltaTime)
    {
        const packets = this.targetLink.packets;
        const neededPackets = packets.length - this.packetAssets.length;
        for(let i = 0; i < neededPackets; i++)
        {
            this.createPacketAsset();
        }
        const deleteCount = this.packetAssets.length - packets.length;
        for(let i = 0; i < deleteCount; i++)
        {
            const asset = this.packetAssets.pop();
            this.parentElement.removeChild(asset);
        }
        for(let i = 0; i < packets.length; i++)
        {
            const packet = packets[i];
            const packetElement = this.packetAssets[i];
            packetElement.onclick = (event) => {
                showPacketPopup(packet.packet);
            };
            this.adjustPacketAsset(packet, packetElement);
        }
        this.indicatorAssets.forEach(indicator => {
            indicator.remainingDuration -= deltaTime;
            if(indicator.remainingDuration < 0)
            {
                indicator.remainingDuration = 0;
                this.parentElement.removeChild(indicator.element);
                return;
            }
            let ratio = indicator.remainingDuration / indicator.fullDuration;
            ratio = 1 - ratio;
            if(ratio < OPACITY_DURATION)
                indicator.element.style.opacity = ratio / OPACITY_DURATION;
            else if (ratio > 1 - OPACITY_DURATION)
                indicator.element.style.opacity = (1 - ratio) / OPACITY_DURATION;
            else
                indicator.element.style.opacity = 1;
            let indicatorDOMPosition = this.domMapper.imageToDOMPosition(indicator.x, indicator.y);
            indicator.element.style.left = `${indicatorDOMPosition.x}px`;
            indicator.element.style.top = `${indicatorDOMPosition.y}px`;
        });
        this.indicatorAssets = this.indicatorAssets.filter(indicator => indicator.remainingDuration > 0);
    }
}