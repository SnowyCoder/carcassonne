
<template>
    <div class="game">
        <!------------------------------------------------------------------------------------------------ player-bar -->
        <player-bar-component class="player-bar" :players="this.players"></player-bar-component>

        <!------------------------------------------------------------------------------------------------ hint-bar -->
        <div class="hint-bar" v-html="getRoundStateHint()"></div>

        <!------------------------------------------------------------------------------------------------ game-bar -->
        <game-bar-component
                class="game-bar"

                :game-phase="this.gamePhase"
                :pawns="this.myPlayer.pawns"
                :player="this.myPlayer"
        >
        </game-bar-component>


        <!------------------------------------------------------------------------------------------------ scoreboard -->
        <div class="scoreboard"
            :style="{display: this.gamePhase.isScoreBoardVisible ? 'block' : 'none'}"
        >
            <div v-if="isGameEnd()" class="end">
                <h2 class="winner">The winner is: <span :style="{color: this.gamePhase.winner.details.color}">{{ this.gamePhase.winner.details.username }}</span>!</h2>
                <h6 class="description">Congrats! ฅ^•ﻌ•^ฅ</h6>
                <br>
                <h6 class="countdown">Returning to lobby in: {{ this.gamePhase.lobbyCountdown }} seconds.</h6>
            </div>

            <table>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                </tr>
                <tr v-for="(player, rank) in this.gamePhase.getScoreBoard()">
                    <th :style="getRankColor(rank + 1)">
                        {{ rank + 1 }}.
                    </th>
                    <td class="username">
                        {{ player.username }}
                    </td>
                    <td>{{ player.score }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    import PlayerBarComponent from "./playerBar.vue";
    import GameBarComponent from "./gameBar.vue";
    import {RoundState} from "../../phase/gamePhase";

    export default Vue.extend({
        /* Passed on initialization.
        data() {
            return {
                gamePhase,
                myPlayer,
                players,
            }
        },
         */
        components: {
            PlayerBarComponent,
            GameBarComponent
        },
        methods: {
            colorToStr(color: number) {
                return `
                    rgb(
                        ${(color >> 16) & 0xff},
                        ${(color >> 8) & 0xff},
                        ${color & 0xff}
                    )
                `;
            },

            getRankColor(rank: number) {
                switch (rank) {
                    case 1:
                        return {color: "#fdd835"};
                    case 2:
                        return {color: "#bdbdbd"};
                    case 3:
                        return {color: "#a30000"};
                    default:
                        return {color: "white"};
                }
            },

            getRoundStateHint() {
                if (this.gamePhase.isMyRound()) {
                    switch (this.gamePhase.roundState) {
                        case RoundState.CardDraw:
                            return `<h4 style="color: yellow">Yo! It's your turn, <u>draw a card</u>.</h4>`;
                        case RoundState.CardPlace:
                            return `<h4 style="color: yellow"><u>Place the card</u> on the board.</h4>`;
                        case RoundState.PawnPick:
                            return `<h4 style="color: yellow"><u>Skip</u> the round or <u>pick a pawn</u>.</h4>`;
                        case RoundState.PawnPlace:
                            return `<h4 style="color: yellow"><u>Place the pawn</u> within the card you've placed.</h4>`;
                        default:
                            return "";
                    }
                }
                const roundOf = this.gamePhase.roundOf;

                // roundOf can be undefined as soon as the game-phase starts.
                // However, the hint-bar is filled when the first nextRound() is called.
                if (roundOf !== undefined) {
                    const roundOfColor = this.colorToStr(roundOf.color);
                    if (roundOf.online) {
                        return `<h4 style="color: red">It's the turn of: <span style="color: ${roundOfColor}">${roundOf.username}</span>.</h4>`;
                    } else {
                        return `<h4 style="color: red">It should be the turn of <span style="color: ${roundOfColor}">${roundOf.username}</span>, but he passed to a better life. .·´¯\`(>▂<)´¯\`·.</h4>`;
                    }
                }

                return "";
            },

            isGameEnd() {
                return this.gamePhase.roundState === RoundState.GameEnd;
            }
        },
    });
</script>

<style scoped>
    .game {
        user-select: none;
    }

    .hint-bar {
        position: absolute;

        bottom: 80px;
        width: 100%;

        z-index: 10;

        pointer-events: none;

        text-align: center;
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px  1px 0 black, 1px  1px 0 black;
    }

    .game-bar {
        position: absolute;
        bottom: 0;
        width: 100%;
        z-index: 25;
    }

    .player-bar {
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 1;
    }

    .scoreboard {
        position: absolute;

        top: 35%;
        width: 100%;
        text-align: center;

        z-index: 50;

        pointer-events: none;
    }

    .scoreboard table {
        display: inline-block;

        padding: 25px;

        color: white;
        background-color: rgba(0, 10, 18, 0.7);

        border-radius: 15px;
        border: 1px solid #263238;

        pointer-events: none;
    }

    .scoreboard table tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        pointer-events: none;
    }

    .scoreboard table tr th {
        padding-left: 15px;
        padding-right: 15px;
    }

    .scoreboard .username {
    }

    .end {
        text-align: center;

        pointer-events: none;
    }

    .end .winner {
        color: gold;
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px  1px 0 black, 1px  1px 0 black;

        pointer-events: none;
    }

    .end .description {
        color: gold;
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px  1px 0 black, 1px  1px 0 black;

        pointer-events: none;
    }

    .end .countdown {
        color: white;
        text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px  1px 0 black, 1px  1px 0 black;

        pointer-events: none;
    }
</style>