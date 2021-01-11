import * as EventEmitter from "eventemitter3"
import Peer, {DataConnection} from "peerjs";
import {P2pConnection} from "./p2pConnection";
import {stage} from "../index";
import {PeerError} from "../util/peerJs";
import {LoginPhase} from "../phase/loginPhase";

export class Channel {
    readonly peer: Peer;
    isMaster: boolean;
    private roomId: string = '';
    connections: Array<P2pConnection> = [];
    private connectionsById = new Map<string, P2pConnection>();
    packetId: number = 0;

    enableForwarding: boolean = false;
    rejectNewcomers: boolean = false;

    eventEmitter: EventEmitter = new EventEmitter();

    constructor(connectId?: string) {
        this.peer = new Peer(undefined, {
            host: process.env.PEERJS_HOST,
            secure: true,
            debug: 2
        });
        this.peer.on('open', this.serverConnect.bind(this));
        this.peer.on('connection', this.onConnection.bind(this));
        this.peer.on('error', this.serverError.bind(this));

        this.isMaster = this.initConnection(connectId);
        this.roomId = this.isMaster ? '' : connectId;
    }

    masterReset() {
        this.resetToRoom(this.peer.id, true);
    }

    resetToRoom(roomId: string, force: boolean = false) {
        if (this.roomId === roomId && !force) return;

        for (let conn of this.connections) {
            conn.close();
        }
        this.isMaster = this.peer.id === roomId;
        this.roomId = roomId;
        if (!this.isMaster) {
            new P2pConnection(this.peer.connect(this.roomId), this);
        }
        this.packetId = 0;
        this.setWindowHash();
    }

    private initConnection(connectId?: string): boolean {
        if (connectId === undefined) return true;

        if (!connectId.startsWith('p')) {
            console.error("Unsupported connection: " + connectId);
            return true;
        }
        this.roomId = connectId;
        return false;
    }

    private serverConnect() {
        if (this.isMaster) {
            // Set the hash of the window
            this.roomId = this.peer.id;
            this.setWindowHash();
        } else {
            console.log("Initializing connection to ", this.roomId);
            new P2pConnection(this.peer.connect(this.roomId.substr(1)), this);
        }
    }

    private setWindowHash() {
        history.replaceState(null, null, '#p' + this.roomId);
    }

    private serverError(err: PeerError) {
        console.error("Fatal server error: ", err);
        alert("Fatal server error: " + err);
        if (err.type === 'peer-unavailable') {
            this.masterReset();
            stage.setPhase(new LoginPhase());
        }
    }

    private onConnection(conn: DataConnection) {
        if (this.rejectNewcomers) {
            conn.close();
        }
        // It will call registerConnection when ready
        new P2pConnection(conn, this);
    }

    registerConnection(conn: P2pConnection) {
        this.connections.push(conn);
        this.connectionsById.set(conn.getId(), conn);
        this.eventEmitter.emit("#connection_open", conn);
    }

    unregisterConnection(conn: P2pConnection) {
        const i = this.connections.indexOf(conn);
        if (i < 0) return;
        this.connections.splice(i, 1);
        this.connectionsById.delete(conn.getId());
        this.eventEmitter.emit("#connection_close", conn);
    }

    onDataReceived(data: any, sender: string) {
        if (this.isMaster) {
            data.sender = sender;
        }
        if (this.isMaster && this.enableForwarding) {
            for (let c of this.connections) {
                if (c.getId() === sender) continue;
                c.sendData(data);
            }
        }
        this.handleMessage(data, sender);
    }

    private handleMessage(packet: any, sender: string) {
        let packetType = packet.type as string;
        if (typeof packetType !== 'string' || packetType.startsWith('#')) {
            return;// reject message
        }

        if (process.env.VERBOSE_CHANNEL !== 'false') {
            console.log("Read", packet);
        }
        this.eventEmitter.emit("any", packet, sender);
        this.eventEmitter.emit(packetType, packet, sender);
    }

    send(packet: any, receiver?: string) {
        const wrapped = {
            id: this.packetId,
            ...packet
        };
        if (this.isMaster) {
            wrapped.sender = this.peer.id;
        }
        if (process.env.VERBOSE_CHANNEL !== 'false') {
            console.log("Sent", wrapped);
        }
        this.packetId++;

        if (receiver !== undefined) {
            this.connectionsById.get(receiver).sendData(wrapped);
        } else {
            for (let c of this.connections) {
                c.sendData(wrapped);
            }
        }
    }
}

