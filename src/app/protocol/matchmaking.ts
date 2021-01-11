
interface Login {
    id: number,
    type: "login",
    details: PlayerObject,
}

interface LoginResponse {
    id: number,
    type: "login_response",
    requestId: number,
    result: string,
    players?: PlayerObject[]
}

interface EventPlayerJoin {
    id: number,
    type: "event_player_joined",
    player: PlayerObject
}

interface EventPlayerLeft {
    id: number,
    type: "event_player_left",
    player: string,
    newHost?: string,
}

interface EventRoomStartRequest {
    id?: number,
    type: "event_room_start_req",
}

interface EventRoomStartAck {
    id?: number,
    type: "event_room_start_ack",
    requestId: number
}

interface EventRoomStartConfirm {
    id?: number,
    type: "event_room_start_confirm",
}
