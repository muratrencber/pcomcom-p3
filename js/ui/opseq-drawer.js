import { LINK_EVENT_TYPE } from "../event/link-event.js";
import { LINK_PACKET_EVENT_TYPE } from "../event/link-packet-event.js";
import { SIMULATION_EVENT_TYPE } from "../event/simulation-event.js";
import { OPSEQ_TIMESTAMP_MULTIPLIER } from "../globals.js";
import { LINK_DIRECTION, LinkPacket } from "../link.js";
import { UIInterface } from "./interface.js";
import { showPacketPopup } from "./popup.js";
import { UIContext } from "./uicontext.js";

const ARROW_DEGREE = 8;

class OseqElement
{
    /**
     * 
     * @param {LinkPacket} targetPacket 
     */
    constructor(targetPacket, offset)
    {
        /**
         * @type {LinkPacket}
         */
        this.targetPacket = targetPacket;
        this.offset = offset;
        this.isReverse = targetPacket.direction == LINK_DIRECTION.B_TO_A;
        this.createDOMElement();
        /**
         * @type {Element}
         */
        this.indicatorElement = null;
        this.targetPacket.packetEvent.addListener((e) => {
            if(e.type == LINK_PACKET_EVENT_TYPE.DROPPED)
            {
                this.onPacketDropped();
            }
            else if(e.type == LINK_PACKET_EVENT_TYPE.CORRUPTED)
            {
                this.onPacketCorrupted();
            }
            else if(e.type == LINK_PACKET_EVENT_TYPE.DELIVERED)
            {
                this.onPacketDelivered();
            }
        });
    }

    createDOMElement()
    {
        this.parent = document.createElement("div");
        this.parent.className = "opseq-diagram-element";
        this.element = document.createElement("div");
        this.element.className = "opseq-diagram-arrow";
        this.element.style.rotate = ARROW_DEGREE + "deg";
        this.arrowTipElement = document.createElement("div");
        this.arrowTipElement.className = "opseq-diagram-arrow-tip";
        this.arrowTipElement.style.rotate = ARROW_DEGREE + "deg";

        if(this.isReverse)
        {
            this.parent.className += " reverse";
            this.element.style.rotate = -ARROW_DEGREE + "deg";
            this.arrowTipElement.style.rotate = (180 - ARROW_DEGREE) + "deg";
        }
        if(this.targetPacket.packet.headers["Description"])
        {
            const desc = document.createElement("div");
            desc.className = "short-description";
            desc.innerText = this.targetPacket.packet.headers["Description"];
            this.parent.appendChild(desc);
        }

        this.parent.appendChild(this.element);
        this.parent.appendChild(this.arrowTipElement);
    }

    updatePassive()
    {
        let parentWidth = this.parent.parentElement.clientWidth;
        let targetWidth = parentWidth / Math.cos(ARROW_DEGREE * Math.PI / 180);
        if(this.targetPacket)
        {
            this.lastRatio = this.targetPacket.normalizedPosition;
        }
        if(!this.isReverse)
        {
            targetWidth -= 11;
        }
        else
        {
            targetWidth -= 4;
        }
        let currentWidth = targetWidth * this.lastRatio;
        this.element.style.width = Math.round(currentWidth) + "px";
        let tipX = currentWidth * Math.cos(ARROW_DEGREE * Math.PI / 180);
        let tipY = currentWidth * Math.sin(ARROW_DEGREE * Math.PI / 180);
        if(this.isReverse)
        {
            tipX = parentWidth - tipX;
        }
        this.arrowTipElement.style.left = Math.round(tipX) + "px";
        this.arrowTipElement.style.top = Math.round(tipY) + "px";
        if(this.indicatorElement)
        {
            this.indicatorElement.style.left = Math.round(tipX) + "px";
            this.indicatorElement.style.top = Math.round(tipY) + "px";
        }
    }

    onPacketDropped()
    {
        this.indicatorElement = document.createElement("div");
        this.indicatorElement.className = "opseq-diagram-dropped-indicator";
        this.parent.appendChild(this.indicatorElement);
        this.targetPacket = null;
    }

    onPacketCorrupted()
    {
        this.parent.classList.add("corrupted");
    }

    onPacketDelivered()
    {
        this.targetPacket = null;
    }

}

export class OpSeqDrawer extends UIInterface
{
    constructor()
    {
        super();
        this.parent = document.querySelector(".opseq-diagram");
        /**
         * @type {OseqElement[]}
         */
        this.elements = [];
    }
    /**
     * 
     * @param {UIContext} context 
     */
    setup(context)
    {
        context.simulation.networkLayerLink.linkEvent.addListener(e => {
            if(e.type == LINK_EVENT_TYPE.ADDED_PACKET)
            {
                let offset = Math.round(context.simulation.getTimestamp() * OPSEQ_TIMESTAMP_MULTIPLIER);
                const elem = new OseqElement(e.packet, offset);
                const listener = () => {
                    showPacketPopup(e.packet.packet);
                };
                elem.parent.style.top = offset +"px";
                elem.arrowTipElement.addEventListener("click", listener);
                elem.element.addEventListener("click", listener);
                this.elements.push(elem);
                this.parent.appendChild(elem.parent);
                elem.element.scrollIntoView();
            }
        });
        context.simulation.simulationEvent.addListener(e => {
            if(e.type == SIMULATION_EVENT_TYPE.SIMULATION_STOPPED)
            {
                this.elements = [];
                this.parent.innerHTML = "";
            }
        })
    }

    update(deltaTime)
    {
        this.elements.forEach(e => e.updatePassive());
    }
}