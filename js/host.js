import { COMMAND_TYPE, CommandEvent } from "./event/command-event.js";
import { ConsoleEvent } from "./event/console-event.js";

const HOST_STATE = {
    IDLE: "IDLE",
    STARTED: "STARTED",
    FINISHED: "FINISHED"
}

/**
 * @typedef {"RECEIVER"|"SENDER"} hostType
 */
/**
 * @interface
 */
export class Host
{
    /**
     * @param {string[]} messages 
     * @param {hostType} type
     */
    constructor(messages, type)
    {
        /**
         * @type {string[]}
         */
        this.messages = messages;
        /**
         * @type {function(string):boolean}
         */
        this.linkSender = null;
        /**
         * @type {hostType}
         */
        this.type = type;
        this.consoleEvent = new ConsoleEvent();
        this.commandEvent = new CommandEvent();
        this.originalMessages = [...messages];
        this.receivedMessage = "";
        /**
         * @type {keyof HOST_STATE}
         */
        this.state = HOST_STATE.IDLE;
    }

    onMessageReceivedFromTransport(message)
    {
        this.receivedMessage += message;
        this.consoleEvent.invoke({sender: "", message: this.receivedMessage});
    }

    trySendMessages()
    {
        if(this.messages.length == 0)
        {
            if(this.state == HOST_STATE.STARTED)
            {
                this.state == HOST_STATE.FINISHED;
                this.commandEvent.invoke({type: COMMAND_TYPE.HOST_FINISHED});
            }
            return;
        }
        if(this.state == HOST_STATE.IDLE)
        {
            this.state = HOST_STATE.STARTED;
            this.commandEvent.invoke({type: COMMAND_TYPE.HOST_STARTED});
        }
        while(this.messages.length > 0)
        {
            const message = this.messages[0];
            if(message == null || message == undefined)
            {
                this.messages.shift();
                continue;
            }
            const sendResult = this.linkSender(message);
            if(sendResult)
            {
                this.commandEvent.invoke({type: COMMAND_TYPE.RDT_SEND});
                this.messages.shift();
            }
            else
            {
                break;
            }
        }
    }

    reset()
    {
        this.messages = [...this.originalMessages];
        this.receivedMessage = "";
        this.state = HOST_STATE.IDLE;
    }
}