import {Stage} from "./phase/stage";
import {LoadingPhase} from "./phase/loadingPhase";
import {Channel} from "./network/channel";
import * as PIXI from "pixi.js";

import {LoginPhase} from "./phase/loginPhase";

import {EventEmitterWrapper} from "./util/eventEmitterWrapper";

import * as AssetsLoader from "./assetsLoader";

// ================================================================================================ Public

import "Public/style.css";

export const windowEventEmitter = new EventEmitterWrapper((event, emitter) => {
    window.addEventListener(event, data => {
        emitter.emit(event, data);
    });
});

// PIXI
export let app: PIXI.Application;
export let channel: Channel;

// Main
export const stage = new Stage("main");

(async function () {
    app = new PIXI.Application({
        resizeTo: window,
        transparent: true
    });
    // The app.view (canvas) is only appended when the game-phase starts.

    stage.setPhase(new LoadingPhase());

    app.view.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    await AssetsLoader.load();

    channel = new Channel(window.location.hash.substr(1));

    stage.setPhase(new LoginPhase());

    window.onhashchange = function (e: HashChangeEvent) {
        console.log("Hash change" + e.newURL);

        if (!window.location.hash) {
            channel.masterReset();
        } else {
            channel.resetToRoom(window.location.hash.substr(2));
        }
    }
})();
