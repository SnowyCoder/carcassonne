import {Phase} from "./phase";
import {channel, stage} from "../index";

import RoomComponent from "../ui/room/room.vue";

import Vue from "vue";
import {RoomStartPhase} from "./roomStartPhase";
import {P2pConnection} from "../network/p2pConnection";

/**
 * RoomPhase logic is handled in there.
 */
export class RoomPhase extends Phase {
    roomId: string;
    me: PlayerObject;
    playersById: {[id: string]: PlayerObject} = {};

    constructor(roomId: string, me: PlayerObject, players: PlayerObject[]) {
        super("room");

        this.roomId = roomId;
        this.me = me;
        players.forEach(player => this.addPlayer(player));
    }

    addPlayer(player: PlayerObject) {
        Vue.set(this.playersById, player.id, player);
    }

    removePlayer(playerId: string, newHost?: string) {
        Vue.delete(this.playersById, playerId);

        if (newHost !== undefined) {
            this.playersById[newHost].isHost = true;
            this.vue.$forceUpdate();
        }
    }

    ui() {
        const self = this;
        return new RoomComponent({
            data() {
                return {
                    roomId: self.roomId,
                    me: self.me,
                    playersById: self.playersById
                }
            }
        });
    }

    enable() {
        super.enable();

        channel.rejectNewcomers = false;
        channel.enableForwarding = false;

        channel.eventEmitter.on("event_player_joined", this.onPlayerJoin, this);
        channel.eventEmitter.on("event_player_left", this.onPlayerLeft, this);

        if (channel.isMaster) {
            channel.eventEmitter.on("login", this.onLogin, this);
            channel.eventEmitter.on("#connection_close", this.onConnectionClose, this);
            this.uiEventEmitter.on("start", this.onStart, this);
        } else {
            channel.eventEmitter.on("event_room_start_req", this.onStart, this);
        }
    }

    disable() {
        super.disable();

        channel.eventEmitter.off("event_player_joined", this.onPlayerJoin, this);
        channel.eventEmitter.off("event_player_left", this.onPlayerLeft, this);

        if (channel.isMaster) {
            channel.eventEmitter.off("login", this.onLogin, this);
            channel.eventEmitter.off("#connection_close", this.onConnectionClose, this);
            this.uiEventEmitter.off("start", this.onStart, this);
        } else {
            channel.eventEmitter.off("event_room_start_req", this.onStart, this);
        }
    }

    onPlayerJoin(packet: EventPlayerJoin) {
        const player = packet.player;
        this.addPlayer(player);
    }

    onPlayerLeft(packet: EventPlayerLeft) {
        const playerId = packet.player;
        this.removePlayer(playerId, packet.newHost);
    }

    onLogin(packet: Login, sender: string) {
        if (sender in this.playersById) return;// Already registered

        packet.details.isHost = false;// Override
        packet.details.id = sender;

        console.log("Adding: " + sender);
        this.addPlayer(packet.details);

        // Create and send response
        let players = [];
        for (let pid in this.playersById) {
            players.push(this.playersById[pid]);
        }

        channel.send({
            type: "login_response",
            requestId: packet.id,
            result: "ok",
            players: players,
        } as LoginResponse, sender);
    }

    onConnectionClose(conn: P2pConnection) {
        if (conn.getId() in this.playersById) {
            this.removePlayer(conn.getId());
        }
    }

    onStart() {
        stage.setPhase(new RoomStartPhase(this.roomId, this.me, this.playersById));
    }
}
