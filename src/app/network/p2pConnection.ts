import {Channel} from "./channel";
import {DataConnection} from "peerjs";


export class P2pConnection {
    private parent: Channel;
    private connection: DataConnection;

    constructor(conn: DataConnection, parent: Channel) {
        this.parent = parent;
        this.connection = conn;

        conn.on('open', this.onOpen.bind(this));
        conn.on('data', this.onData.bind(this));
        conn.on('close', this.onClose.bind(this));
        conn.on('error', this.onError.bind(this));
    }

    getId(): string {
        return this.connection.peer;
    }

    sendData(data: any) {
        this.connection.send(data);
    }

    private onOpen() {
        this.parent.registerConnection(this);
    }

    private onData(data: any) {
        this.parent.onDataReceived(data, this.connection.peer);
    }

    private onClose() {
        this.parent.unregisterConnection(this);
    }

    private onError(err: any) {
        console.log("Connection error", err);
    }

    close() {
        this.connection.close();
    }
}