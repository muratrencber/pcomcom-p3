import { COMMAND_TYPE } from "../event/command-event.js";
import { LOG_CONTEXT } from "../event/console-event.js";
import { TransportProtocol } from "./interface.js";

export const TCP_STATES = {
    LISTEN: "LISTEN",
    SYN_RECEIVED: "SYN_RECEIVED",
    SYN_SENT: "SYN_SENT",
    CLOSED: "CLOSED",
    ESTABLISHED: "ESTABLISHED",
    FIN_WAIT_1: "FIN_WAIT_1",
    FIN_WAIT_2: "FIN_WAIT_2",
    CLOSING: "CLOSING",
    TIME_WAIT: "TIME_WAIT",
    CLOSE_WAIT: "CLOSE_WAIT",
    LAST_ACK: "LAST_ACK"
}

const SYN_TIMEOUT = 10000;
const ACK_WAIT = 500;

class TCPTimer
{
    constructor(timeoutDuration)
    {
        this.timeoutDuration = timeoutDuration;
        this.currentDuration = 0;
        this.callback = null;
    }

    set(callback)
    {
        this.currentDuration = this.timeoutDuration;
        this.callback = callback ?? this.callback;
    }

    stop()
    {
        this.currentDuration = 0;
    }

    update(deltaTime)
    {
        if(this.currentDuration <= 0) return;
        this.currentDuration -= deltaTime;
        if(this.currentDuration <= 0)
        {
            this.currentDuration = 0;
            if(this.callback)
                this.callback();
        }
    }

    get running()
    {
        return this.currentDuration > 0;
    }
}

export class TCPProtocol extends TransportProtocol
{
    constructor(isSender)
    {
        super(isSender);
        this.setInitialValues();
    }

    start()
    {
        if(this.isSender)
        {
            this.sendMessage(undefined, false, true);
            this.changeState(TCP_STATES.SYN_SENT);
        }
    }

    /**
     * 
     * @param {string | undefined} message
     * @param {boolean} ACK
     * @param {boolean} SYN
     * @param {boolean} [setTimeout=true]   
     */
    sendMessage(message, ACK, SYN, setTimeout = true)
    {
        const messageLength = message ? message.length : 0;
        const sanitizedMessage = message ?? "";
        let headers = {SeqNum: this.nextSequenceNumber, AckNum: this.expectedSequenceNumber, Length: messageLength};
        if(ACK)
            headers.ACK = true;
        if(SYN)
            headers.SYN = true;
        const packet = this.createPacket(sanitizedMessage, headers);
        this.nextSequenceNumber += messageLength;
        if(setTimeout)
        {
            if(!this.timeoutTimer.running)
                this.timeoutTimer.set(() => this.retransmitEarliestPacket());
            this.unAckedPackets.push(packet);
            this.unAckedPackets.sort((a,b) => a.headers.SeqNum > b.headers.SeqNum);
        }
        this.log(`Sending packet. Data: "${packet.data}, ACK: ${packet.headers.ACK}, SeqNum: ${packet.headers.SeqNum}, AckNum: ${packet.headers.AckNum}"`, LOG_CONTEXT.SENT_PACKET);
        this.sendPacketToNetworkLayer(packet);
    }

    sendAck()
    {
        this.ackQueue = [];
        this.sendMessage(undefined, true, false, false);
    }

    retransmitEarliestPacket()
    {
        if(this.unAckedPackets.length == 0)
            return;
        const earliestPacket = this.unAckedPackets[0];
        this.retransmitPacket(earliestPacket);
    }

    retransmitPacket(packet)
    {
        this.sendPacketToNetworkLayer(packet);
        if(!this.timeoutTimer.running)
            this.timeoutTimer.set(() => this.retransmitEarliestPacket());
    }

    receivePacket(packet)
    {
        const packSeqNum = packet.headers.SeqNum;
        const isDuplicate = this.receivedPackets.findIndex(p => p.headers.SeqNum == packSeqNum) != -1;
        if(isDuplicate || packSeqNum < this.expectedSequenceNumber)
        {
            this.log("Packet has already been received!", LOG_CONTEXT.RECEIVED_PACKET);
            this.sendAck();
            return;
        }
        const maxSeqNum = this.receivedPackets.length > 0 ? this.receivedPackets[this.receivedPackets.length - 1].headers.SeqNum : this.expectedSequenceNumber;
        const expectedPacket = packSeqNum == this.expectedSequenceNumber;
        const fillsGap = !expectedPacket && packSeqNum >= this.expectedSequenceNumber && packSeqNum < maxSeqNum;
        const outOfOrder = !expectedPacket && !fillsGap && packSeqNum >= maxSeqNum;
        this.receivedPackets.push(packet);
        this.receivedPackets.sort((p1, p2) => p1.headers.SeqNum > p2.headers.SeqNum);
        this.findExpectedSequenceNumberAndSendPackets();
        if(expectedPacket)
        {
            this.log("Received the expected packet.", LOG_CONTEXT.RECEIVED_PACKET);
            this.ackQueue.push(0);
            if(this.ackQueue.length > 1)
            {
                this.log("Sending ACK immediately", LOG_CONTEXT.SENT_PACKET);
                this.sendAck();
            }
            else
            {
                this.log("Waiting for secondary ACK or timeout", LOG_CONTEXT.SENT_PACKET);
                this.ackTimer.set(() => this.trySendAck());
            }
        }
        else if(fillsGap || outOfOrder)
        {
            if(fillsGap)
                this.log("Some part of the gap filled. Sending ACK", LOG_CONTEXT.SENT_PACKET);
            else
                this.log("Gap detected, sending duplicate ACK", LOG_CONTEXT.SENT_PACKET);
            this.sendAck();
        }
    }

    findExpectedSequenceNumberAndSendPackets()
    {
        let lastValidIndex = undefined;
        for(let i = 0; i < this.receivedPackets.length; i++)
        {
            const pack = this.receivedPackets[i];
            const seqNum = pack.headers.SeqNum;
            this.log(`Expected SeqNum: ${this.expectedSequenceNumber}, Packet SeqNum: ${seqNum}`, LOG_CONTEXT.RECEIVED_PACKET);
            if(seqNum == this.expectedSequenceNumber)
            {
                this.expectedSequenceNumber = seqNum + pack.headers.Length;
                this.log(`New SeqNum: ${this.expectedSequenceNumber}, Packet SeqNum: ${seqNum}`, LOG_CONTEXT.RECEIVED_PACKET);
                this.toHostBuffer.push(pack.data);
                lastValidIndex = i;
            }
            else if(seqNum < this.expectedSequenceNumber)
            {
                this.log("Already sent...", LOG_CONTEXT.RECEIVED_PACKET);
                lastValidIndex = i;
            }
            else
            {
                this.log("Out of order!", LOG_CONTEXT.RECEIVED_PACKET);
                break;
            }
        }
        if(lastValidIndex)
            this.receivedPackets.splice(0, lastValidIndex);
        return lastValidIndex;
    }

    refreshUnAckedPackets(filterFunc)
    {
        this.unAckedPackets = this.unAckedPackets.filter(filterFunc);
        if(this.unAckedPackets.length > 0)
            this.timeoutTimer.set(() => this.retransmitEarliestPacket());
        else
            this.timeoutTimer.stop();
    }

    receiveAckOnHandshake(packet)
    {
        this.refreshUnAckedPackets(p => !p.headers.SYN || !p.headers.ACK);
        this.expectedSequenceNumber += packet.headers.Length;
    }

    receiveSynAck(packet)
    {
        this.refreshUnAckedPackets(p => !p.headers.SYN);
        this.expectedSequenceNumber = packet.headers.SeqNum + packet.headers.Length;
    }

    receiveSyn(packet)
    {
        this.expectedSequenceNumber = packet.headers.SeqNum + packet.headers.Length;
    }

    receiveAck(packet)
    {
        const y = packet.headers.AckNum;
        if(y > this.sequenceBase)
        {
            this.sequenceBase = y;
            this.unAckedPackets = this.unAckedPackets.filter(p => p.headers.SeqNum + p.headers.Length > this.sequenceBase);
            if(this.unAckedPackets.length > 0)
                this.timeoutTimer.set(() => this.retransmitEarliestPacket());
            else
                this.timeoutTimer.stop();
        }
        else
        {
            this.duplicateAcks[y] = this.duplicateAcks[y] + 1;
            if(this.duplicateAcks[y] == 3)
            {
                this.duplicateAcks[y] = 0;
                const targetPacket = this.unAckedPackets.find(p => p.headers.SeqNum == y);
                if(targetPacket)
                    this.retransmitPacket(targetPacket);
            }
        }
    }

    createPacket(data, headers = {})
    {
        let unsorted_headers = {
            Protocol: "TCP",
            ...headers
        }
        let shortDescription = "";
        if(headers.ACK && headers.SYN)
            shortDescription += "SYNACK, "
        else if(headers.ACK)
            shortDescription += "ACK, "
        else if(headers.SYN)
            shortDescription += "SYN, "
        if(headers.SeqNum)
            shortDescription += `SeqNum = ${headers.SeqNum}, `;
        if(headers.AckNum)
            shortDescription += `AckNum = ${headers.AckNum}, `;
        if(data != "")
            shortDescription += `"${data}"`
        unsorted_headers["Description"] = shortDescription;
        let sorted_headers = {}
        let header_keys = Object.keys(unsorted_headers);
        header_keys.sort();
        header_keys.forEach(hk => sorted_headers[hk] = unsorted_headers[hk]);
        const packet = {
            data: data,
            headers: unsorted_headers
        };
        return packet;
    }

    onPacketFromNetworkLayerReceived(packet, corrupted)
    {
        if(corrupted)
        {
            return;
        }
        if(this.currentState == TCP_STATES.LISTEN && packet.headers.SYN)
        {
            this.receiveSyn(packet);
            this.sendMessage(undefined, true, true);
            this.changeState(TCP_STATES.SYN_RECEIVED);
        }
        else if(this.currentState == TCP_STATES.SYN_SENT && packet.headers.SYN && packet.headers.ACK)
        {
            this.receiveSynAck(packet);
            this.sendAck();
            this.changeState(TCP_STATES.ESTABLISHED);
        }
        else if(this.currentState == TCP_STATES.SYN_RECEIVED && packet.headers.ACK)
        {
            this.receiveAckOnHandshake(packet);
            this.changeState(TCP_STATES.ESTABLISHED);
        }
        else if(this.currentState == TCP_STATES.ESTABLISHED)
        {
            if(packet.headers.SYN && packet.headers.ACK)
            {
                this.log("Other host still not established connection. Resending ACK...", LOG_CONTEXT.SENT_PACKET);
                this.sendAck();
            }
            else
            {
                this.log(`Received packet. Data: "${packet.data}, ACK: ${packet.headers.ACK}, SeqNum: ${packet.headers.SeqNum}, AckNum: ${packet.headers.AckNum}"`, LOG_CONTEXT.RECEIVED_PACKET);
                if(packet.headers.ACK)
                {
                    this.log("Received ACK.", LOG_CONTEXT.RECEIVED_PACKET);
                    this.receiveAck(packet);
                }
                if(packet.headers.Length > 0)
                    this.receivePacket(packet);
            }
        }
    }

    onStateChanged()
    {
        if(this.currentState == TCP_STATES.ESTABLISHED)
        {
            this.packetSendTimer.set(() => this.trySendFromBuffer());
        }
    }

    onMessageFromHostReceived(msg)
    {
        this.buffer.push(msg);
        this.trySendFromBuffer();
    }

    trySendFromBuffer()
    {
        if(this.currentState != TCP_STATES.ESTABLISHED)
            return;
        if(this.packetSendTimer.running)
            return;
        if(this.buffer.length == 0)
            return;
        const msg = this.buffer.shift();
        this.sendMessage(msg, false, false);
        this.packetSendTimer.set(() => this.trySendFromBuffer());
    }

    update(deltaTime)
    {
        super.update(deltaTime);
        this.timeoutTimer.update(deltaTime);
        this.ackTimer.update(deltaTime);
        this.packetSendTimer.update(deltaTime);

        if(this.toHostBuffer.length > 0)
        {
            if(this.sendMessageToHost(this.toHostBuffer[0]))
                this.toHostBuffer.shift();
        }
    }

    trySendAck()
    {
        if(this.ackQueue.length > 0)
        {
            this.sendAck();
        }
    }

    setInitialValues()
    {
        this.currentState = this.isSender ? TCP_STATES.CLOSED : TCP_STATES.LISTEN;
        this.timeoutTimer = new TCPTimer(SYN_TIMEOUT);
        this.ackTimer = new TCPTimer(ACK_WAIT);
        this.packetSendTimer = new TCPTimer(this.packetProcessor.processTime * 3);
        this.sequenceBase = Math.round(Math.random() * 500 + 1);
        this.nextSequenceNumber = this.sequenceBase;
        this.expectedSequenceNumber = -1;

        this.unAckedPackets = [];
        this.duplicateAcks = {};
        this.receivedPackets = [];
        this.buffer = [];
        this.toHostBuffer = [];
        this.ackQueue = [];
    }

    reset()
    {
        super.reset();
        this.setInitialValues();
    }
    getName() {return "TCP Reno";}
}