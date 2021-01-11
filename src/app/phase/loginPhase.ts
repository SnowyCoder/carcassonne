import {Phase} from "./phase";
import {channel, stage} from "../index"

import LoginComponent from "../ui/login/login.vue";
import {RoomPhase} from "./roomPhase";

export class LoginPhase extends Phase {
    form: any;

    constructor() {
        super("login");
    }

    ui() {
        return new LoginComponent();
    }

    enable() {
        super.enable();

        this.form = this.vue.$refs.form;

        this.uiEventEmitter.on('submit', this.requestLogin, this);
    }

    disable() {
        super.disable();

        this.uiEventEmitter.off('submit', this.requestLogin, this);
    }

    requestLogin(details: PlayerObject) {
        if (channel.isMaster) {
            details.id = channel.peer.id;
            details.isHost = true;
            this.goToRoom([details])
        } else {
            channel.eventEmitter.once("login_response", (packet: LoginResponse) => {
                if (packet.result !== "ok") {
                    this.form.errorMessage = packet.result;
                    return;
                }
                this.goToRoom(packet.players);
            });
            channel.send({
                type: "login",
                details: details
            } as Login);
        }
    }

    goToRoom(players: PlayerObject[]) {
        const roomId = window.location.hash.substr(1);
        const myId = channel.peer.id;
        const me = players.find(player => player.id === myId);
        if (!me) {
            console.error("Your ID couldn't be found within the room's player list.");
            return;
        }
        stage.setPhase(new RoomPhase(roomId, me, players));
    }
}
