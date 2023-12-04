import { COMMAND_TYPE } from "./event/command-event.js";
import { Host } from "./host.js";
import { changeScenario } from "./scenarios/scenario-manager.js";
import { Simulation } from "./simulation.js";
import { TimerManager } from "./timer.js";
import { RDT1Receiver, RDT1Sender, RDT1_STATES } from "./transport/rdt1.js";
import { ConsoleUI } from "./ui/console.js";
import { FSMTogglesUI } from "./ui/fsm/fsm-toggles.js";
import { GenericTransportFSMUI } from "./ui/fsm/generic-fsm-ui.js";
import { ImageDOMMapper } from "./ui/image-dom-mapper.js";
import { SMPacketDrawerUI } from "./ui/sm-packet-drawer.js";
import { ServiceModelUI } from "./ui/service-model.js";
import { SettingsPanelUI } from "./ui/settings-panel.js";
import { SimulationButtonsUI } from "./ui/simulation-buttons.js";
import { TimerUI } from "./ui/timer.js";
import { UIContext } from "./ui/uicontext.js";
import { OpSeqDrawer } from "./ui/opseq-drawer.js";
import { RDT2Receiver, RDT2Sender, RDT2_STATES } from "./transport/rdt2.js";
import { RDT3Receiver, RDT3Sender, RDT3_STATES } from "./transport/rdt3.js";
import { WindowResizer } from "./ui/window-resizer.js";
const text = `Kökü bende bir sarmaşık
Olmuş dünya sezmekteyim,
Mavi, masmavi bir ışık
Ortasında yüzmekteyim...`;
let message = [];
let i = 0;
while(i < text.length)
{
    let len = Math.min(8, text.length - i);
    message.push(text.substring(i, i+len));
    i += len;
}

let uiElements = [];
uiElements.push(new SettingsPanelUI());
uiElements.push(new TimerUI());
uiElements.push(new ConsoleUI("sender-console", true));
uiElements.push(new ConsoleUI("receiver-console", false));
uiElements.push(new SimulationButtonsUI());
uiElements.push(new ServiceModelUI());
uiElements.push(new FSMTogglesUI());
uiElements.push(new OpSeqDrawer());
uiElements.push(new WindowResizer(["popup-panel", "settings-panel"]));

uiElements.push(new GenericTransportFSMUI(RDT1Sender, true, "rdt1-sender-mask", {
    [RDT1_STATES.WAIT_FROM_ABOVE]: "./media/fsm/rdt1/mask/sender_state_init.png"
}, {
    [COMMAND_TYPE.RDT_SEND]: "./media/fsm/rdt1/mask/sender_send.png",
    [COMMAND_TYPE.UDT_SEND]: "./media/fsm/rdt1/mask/sender_send.png",
}, 1000));
uiElements.push(new GenericTransportFSMUI(RDT1Receiver, false, "rdt1-receiver-mask", {
    [RDT1_STATES.WAIT_FROM_BELOW]: "./media/fsm/rdt1/mask/receiver_state_init.png"
}, {
    [COMMAND_TYPE.RDT_RECV]: "./media/fsm/rdt1/mask/receiver_receive.png",
    [COMMAND_TYPE.DELIVER_DATA]: "./media/fsm/rdt1/mask/receiver_receive.png",
}, 1000));
uiElements.push(new GenericTransportFSMUI(RDT2Sender, true, "rdt2-sender-mask", {
    [RDT2_STATES.WAIT_FROM_ABOVE]: "./media/fsm/rdt2/mask/sender_wait_above.png",
    [RDT2_STATES.WAIT_FOR_ACK_OR_NAK]: "./media/fsm/rdt2/mask/sender_state_wait_ack_nak.png",
}, {
    [COMMAND_TYPE.RDT2_SENDER_SENT]: "./media/fsm/rdt2/mask/sender_transition_above_ack.png",
    [COMMAND_TYPE.RDT2_SENDER_ACK]: "./media/fsm/rdt2/mask/sender_transition_ack_above.png",
    [COMMAND_TYPE.RDT2_SENDER_NAK]: "./media/fsm/rdt2/mask/sender_transition_ack_ack.png",
}, 1000));
uiElements.push(new GenericTransportFSMUI(RDT2Receiver, false, "rdt2-receiver-mask", {
    [RDT2_STATES.WAIT_FROM_BELOW]: "./media/fsm/rdt2/mask/receiver_state_init.png",
}, {
    [COMMAND_TYPE.RDT2_RECEIVER_ACK]: "./media/fsm/rdt2/mask/receiver_transition_ack.png",
    [COMMAND_TYPE.RDT2_RECEIVER_NAK]: "./media/fsm/rdt2/mask/receiver_transition_nak.png",
}, 1000));
uiElements.push(new GenericTransportFSMUI(RDT3Sender, true, "rdt3-sender-mask", {
    [RDT3_STATES.WAIT_0_ABOVE]: "./media/fsm/rdt3/mask/sender_state_w0.png",
    [RDT3_STATES.WAIT_1_ABOVE]: "./media/fsm/rdt3/mask/sender_state_w1.png",
    [RDT3_STATES.WAIT_ACK_0]: "./media/fsm/rdt3/mask/sender_state_a0.png",
    [RDT3_STATES.WAIT_ACK_1]: "./media/fsm/rdt3/mask/sender_state_a1.png",
}, {
    [COMMAND_TYPE.RDT3_SENDER_CORRUPTACK0]: "./media/fsm/rdt3/mask/sender_transition_corrupta0.png",
    [COMMAND_TYPE.RDT3_SENDER_OOOACK1]: "./media/fsm/rdt3/mask/sender_transition_corrupta0.png",
    [COMMAND_TYPE.RDT3_SENDER_TIMEOUT0]: "./media/fsm/rdt3/mask/sender_transition_timeouta0.png",
    [COMMAND_TYPE.RDT3_SENDER_RCVACK0]: "./media/fsm/rdt3/mask/sender_transition_a0.png",
    [COMMAND_TYPE.RDT3_SENDER_SENT0]: "./media/fsm/rdt3/mask/sender_transition_sent0.png",
    [COMMAND_TYPE.RDT3_SENDER_RCVW0]: "./media/fsm/rdt3/mask/sender_transition_rcvw0.png",
    [COMMAND_TYPE.RDT3_SENDER_CORRUPTACK1]: "./media/fsm/rdt3/mask/sender_transition_corrupta1.png",
    [COMMAND_TYPE.RDT3_SENDER_OOOACK0]: "./media/fsm/rdt3/mask/sender_transition_corrupta1.png",
    [COMMAND_TYPE.RDT3_SENDER_TIMEOUT1]: "./media/fsm/rdt3/mask/sender_transition_timeouta1.png",
    [COMMAND_TYPE.RDT3_SENDER_RCVACK1]: "./media/fsm/rdt3/mask/sender_transition_a1.png",
    [COMMAND_TYPE.RDT3_SENDER_SENT1]: "./media/fsm/rdt3/mask/sender_transition_sent1.png",
    [COMMAND_TYPE.RDT3_SENDER_RCVW1]: "./media/fsm/rdt3/mask/sender_transition_rcvw1.png",
}, 1000));
uiElements.push(new GenericTransportFSMUI(RDT3Receiver, false, "rdt3-receiver-mask", {
    [RDT3_STATES.WAIT_0_BELOW]: "./media/fsm/rdt3/mask/receiver_state_w0.png",
    [RDT3_STATES.WAIT_1_BELOW]: "./media/fsm/rdt3/mask/receiver_state_w1.png",
}, {
    [COMMAND_TYPE.RDT3_RECEIVER_CORRUPT0]: "./media/fsm/rdt3/mask/receiver_transition_corrupt0.png",
    [COMMAND_TYPE.RDT3_RECEIVER_CORRUPT1]: "./media/fsm/rdt3/mask/receiver_transition_corrupt1.png",
    [COMMAND_TYPE.RDT3_RECEIVER_OOO1]: "./media/fsm/rdt3/mask/receiver_transition_corrupt0.png",
    [COMMAND_TYPE.RDT3_RECEIVER_OOO0]: "./media/fsm/rdt3/mask/receiver_transition_corrupt1.png",
    [COMMAND_TYPE.RDT3_RECEIVER_SENTACK0]: "./media/fsm/rdt3/mask/receiver_transition_rcvp0.png",
    [COMMAND_TYPE.RDT3_RECEIVER_SENTACK1]: "./media/fsm/rdt3/mask/receiver_transition_rcvp1.png",
},1000));


const sender = new Host(message);
const receiver = new Host([]);
const simulation = new Simulation(sender, receiver);
simulation.setTransportProtocol(RDT1Sender, RDT1Receiver);
const timerManager = new TimerManager(() => simulation.getTimestamp());

const uiContext = new UIContext();
uiContext.simulation = simulation;
uiContext.timerManager = timerManager;
uiContext.senderHost = sender;
uiContext.receiverHost = receiver;
uiElements.forEach(ui => ui.setup(uiContext));

uiElements.forEach(ui => ui.refresh());
update();


function update()
{
    let deltaTime = simulation.update();
    timerManager.check();
    uiElements.forEach(ui => ui.update(deltaTime));
    requestAnimationFrame(update);
}