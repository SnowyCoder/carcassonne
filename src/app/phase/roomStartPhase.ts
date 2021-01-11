import {Phase} from "./phase";
import {channel, stage} from "../index";
import {GamePhase} from "./gamePhase";
import LoadingComponent from "../ui/loading/loading.vue";

/**
 * Transition phase
 */
export class RoomStartPhase extends Phase {
    roomId: string;
    me: PlayerObject;
    playersById: {[id: string]: PlayerObject};
    readySet = new Set();
    playerCount: number = 0;


    constructor(roomId: string, me: PlayerObject, playersById: {[id: string]: PlayerObject}) {
        super("roomStart");
        this.roomId = roomId;
        this.me = me;
        this.playersById = playersById;
    }

    enable() {
        super.enable();

        if (channel.isMaster) {
            channel.rejectNewcomers = true;
            // Kick players that aren't logged in
            for (let conn of channel.connections) {
                if (!(conn.getId() in this.playersById)) {
                    console.log("Kicking: " + conn.getId());
                    conn.close();
                }
            }

            this.playerCount = -1;
            for (let c in this.playersById) {
                this.playerCount += 1;
            }

            channel.eventEmitter.on('event_room_start_ack', this.roomStartAck, this);

            channel.send({
                type: "event_room_start_req",
            } as EventRoomStartRequest);
        } else {
            channel.eventEmitter.on('event_room_start_confirm', this.moveOn, this);

            channel.send({
                type: "event_room_start_ack",
            } as EventRoomStartAck);
        }
    }

    disable() {
        super.disable();

        if (channel.isMaster) {
            channel.eventEmitter.off('event_room_start_ack', this.roomStartAck, this);
        } else {
            channel.eventEmitter.off('event_room_start_confirm', this.moveOn, this);
        }
    }

    roomStartAck(pkt: EventRoomStartAck, sender: string) {
        if (this.readySet.has(sender)) return;
        this.readySet.add(sender);
        console.log(this.readySet.size + "/" + this.playerCount);
        if (this.readySet.size === this.playerCount) {
            channel.send({
                type: "event_room_start_confirm"
            } as EventRoomStartConfirm);
            channel.enableForwarding = true;
            this.moveOn();
        }
    }

    moveOn() {
        stage.setPhase(new GamePhase(this.roomId, this.me, this.playersById));
    }

    ui() {
        return new LoadingComponent();
    }
}