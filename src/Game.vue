<template>
    <v-app>
        <v-dialog v-model="showLoading" persistent>
            <v-card>
                <v-card-title class="headline">Loading game assets</v-card-title>
                <v-card-text>Please wait a moment, game is loading...</v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="wonGame" fullscreen>
            <v-card>
                <v-card-title class="headline">You Won!</v-card-title>
                <v-card-text>Holy shit you actually won!</v-card-text>
                <v-card-text>Time Played: {{ getStat('timePlayed') }} seconds</v-card-text>
                <v-card-text>Times Prestiged: {{ getStat('timesPrestiged') }}</v-card-text>
            </v-card>>
        </v-dialog>

        <v-container fluid="fluid" v-bind:class="{ hide: showLoading }">
            <div>
                <h5>You have <strong>{{ stuff | stuff }}</strong> stuff.</h5>
                <h6>You are gaining {{ stuffPerSecond | stuff }} stuff per second.</h6>
                <div>(Goal: get to <strong>∞</strong> stuff)</div>
                <hr />
                <div>Slow down time by {{ tickSpeedReductionPercent }}%</div>
                <v-btn v-on:click="upgradeTickSpeed()" :disabled="stuff.lt(tickSpeedCost)">Cost: {{ tickSpeedCost | whole }}</v-btn>
                <v-btn v-on:click="upgradeTickSpeedMax()" :disabled="stuff.lt(tickSpeedCost)">Buy Max</v-btn>
                <h6>Time speed: {{ tickSpeedDisplayed }}</h6>
            </div>
            <hr />
            <v-layout v-for="(order, orderIndex) in orders" :key="orderIndex" v-show="orderIndex==1 || (orderIndex <= resetOrder && orders[orderIndex-1].owned > 0)">
                <v-flex sm4>
                    <h4 v-if="orderIndex==1">Stuff/s = {{ order.name }} * {{ order.multiplier | multiplier }}</h4>
                    <h4 v-else>{{ orders[orderIndex-1].name }}/s = {{ order.name }} * {{ order.multiplier/10 | multiplier }}</h4>
                </v-flex>
                <v-flex sm4>
                    <h6>{{ order.name }} = {{ order.owned | whole }} (+{{ order.increasePercentage }}%/s) <small>(buy {{ 10-order.bought }} multiplier)</small></h6>
                </v-flex>
                <v-flex sm4>
                    <v-btn v-on:click="buyOrder(order)" :disabled="stuff.lt(order.cost)">
                        Buy (Cost: {{ order.cost | whole }})
                    </v-btn>
                    <v-btn v-on:click="buyMax(order)" :disabled="stuff.lt(order.costToMultiplier)">
                        Buy {{ 10 - order.bought }} (Cost: {{ order.costToMultiplier| whole }})
                    </v-btn>
                </v-flex>
            </v-layout>

            <div v-show="orders[resetOrder].owned > 0">
                <div v-show="!canReset()">
                    Once you reach {{ resetAmount }} owned of {{ orders[resetOrder].name }} you can reset with a boost.
                </div>
                <v-btn v-on:click="showReset = !showReset" :disabled="!canReset()" >Toggle Reset</v-btn>

                <v-tooltip top v-if="resetCount < addOrderResetsRequired">
                    <v-btn v-show="resetOrder < highestOrder" slot="activator" disabled>Add another Power (Cost: {{ addOrderCost }} & no reset)</v-btn>
                    <span>Must reset {{ addOrderResetsRequired }} times at highest power to unlock</span>
                </v-tooltip>

                <v-btn v-show="resetOrder < highestOrder" v-on:click="addOrder()" :disabled="!canReset() || !canAddOrder()" v-else>Add another Power (Cost: {{ addOrderCost }} & no reset)</v-btn>

                <div v-show="showReset">
                    Resets (at highest power): {{ resetCount }} <br />
                    Reset currency stored: {{ resetCurrency }} <br />
                    Reset currency spent: {{ resetCurrencySpent }} <br />

                    <v-btn v-on:click="reset('none')">Reset with no bonus (save reset currency)</v-btn>

                    <br />

                    <v-btn v-show="tickSpeedReductionPercent < 99" v-on:click="reset('tickspeed')" :disabled="!canReset('tickspeed')">Increase Tickspeed multiplier (Cost: {{ resetCostTickSpeed  }})</v-btn>
                    <v-btn v-on:click="reset('multiplier')" :disabled="!canReset('multiplier')">Increase Power multipliers (Cost: {{ resetCostMultiplier }})</v-btn>
                </div>
            </div>

            <div v-show="cheatMode">
                Cheat Mode: <v-btn v-on:click="stuff = stuff.times(1E3)">Add Stuff</v-btn>
            </div>
            
        </v-container>

        <v-footer class="pa-3">
            <div>{{ gameVersion() }}</div>
            <v-spacer></v-spacer>
            <GameMenu></GameMenu>
            
        </v-footer>
    </v-app>
</template>

<script>
import Big from "big.js";
import Version from "./modules/version.js";
import EventBus from './modules/eventBus.js';
import DefaultData from './modules/defaultData.js';
import Options from "./modules/options.js";
import Stats from "./modules/stats.js";
import Utils from "./modules/utils.js";
import Orders from "./modules/orders.js";
import GameMenu from "./components/GameMenu.vue";
import SaveLoad from "./modules/saveLoad.js";

export default {
    data: function() {
        return DefaultData.data();
    },

    filters: {
        stuff(value) {
            return Utils.round(value, true);
        },
        multiplier(value) {
            return Utils.round(value, true);
        },
        whole(value) {
            return Utils.round(value);
        }
    },

    methods: {
        gameVersion() {
            return Version.gameVersion;
        },
        getOption(option) {
            return Options.state[option];
        },
        getStat(stat) {
            return Stats.state[stat].toString();
        },

        buyOrder(order) {
            if (this.stuff.lt(order.cost)) {
                return;
            }

            this.stuff = this.stuff.minus(order.cost);
            order.owned = order.owned.plus(1);
            order.bought ++;

            order.costToMultiplier = Big(10).minus(order.bought).times(order.cost);

            if (order.bought == 10) {
                this.upgradeOrder(order);
            }
        },
        buyMax(order) {
            if (this.stuff.lt(order.costToMultiplier)) {
                return;
            }

            let buyAmount = 10 - order.bought;
            this.stuff = this.stuff.minus(order.cost.times(buyAmount));
            order.owned = order.owned.plus(buyAmount);

            this.upgradeOrder(order);
        },
        upgradeTickSpeed() {
            if (this.stuff.lt(this.tickSpeedCost)) {
                return false;
            }
            let tickSpeedMultiplier = (100-this.tickSpeedReductionPercent)/100;

            this.stuff = this.stuff.minus(this.tickSpeedCost);
            this.tickSpeedCost = this.tickSpeedCost.times(10);
            this.tickSpeed = this.tickSpeed.times(tickSpeedMultiplier);

            // set display tickspeed
            if (this.tickSpeed.gt(0.1)) {
                this.tickSpeedDisplayed = this.tickSpeed.times(100).toFixed(0);
            } else if (this.tickSpeed.gt(0.01)) {
                this.tickSpeedDisplayed = this.tickSpeed.times(100).toFixed(1);
            } else if (this.tickSpeed.gt(0.001)) {
                this.tickSpeedDisplayed = this.tickSpeed.times(100).toFixed(2);
            } else {
                this.tickSpeedDisplayed = this.tickSpeed.times(100).toExponential(2);
            }
            this.tickSpeedDisplayed = this.tickSpeedDisplayed + '%';

            return true;
        },
        upgradeTickSpeedMax() {
            while (this.upgradeTickSpeed());
        },
        upgradeOrder(order) {
            order.bought = 0;

            order.multiplier = order.multiplier.times(2);
            order.cost = order.cost.times(order.costMultiplier);
            order.costToMultiplier = Big(10).minus(order.bought).times(order.cost);
        },
        canAddOrder() {
            return this.resetOrder < this.highestOrder && this.resetOrder < this.highestOrderAllowed && this.resetCurrency >= this.addOrderCost;
        },
        addOrder() {
            if (!this.canAddOrder()) {
                return;
            }
            this.resetCurrency = this.resetCurrency - this.addOrderCost;
            this.resetCurrencySpent = this.resetCurrencySpent + this.addOrderCost;
            this.addOrderCost = this.addOrderCost * 2;
            this.addOrderResetsRequired = this.addOrderResetsRequired * 2;
            this.resetOrder = this.resetOrder + 1;
            this.resetCurrencyReward = this.resetCurrencyReward * 2;
            this.resetCurrencyUnlockedThisRun = false;
            this.showReset = false;
        },
        canReset(resetType=null) {
            if (!resetType || resetType == 'none') {
                return this.orders[this.resetOrder].owned.gte(this.resetAmount);
            }
            
            if (resetType == 'tickspeed') {
                return this.resetCurrency >= this.resetCostTickSpeed;
            }
            
            if (resetType == 'multiplier') {
                return this.resetCurrency >=this.resetCostMultiplier;
            }

            console.log("Invalid reset type: " + resetType);
            return false;
        },
        reset(resetType) {
            if (!this.canReset(resetType)) {
                return;
            }

            console.log("Prestige time: " + Stats.state.timePlayedThisPrestige.toString() + " seconds");
            Stats.commit('newPrestige');

            // load default data
            let newData = DefaultData.data();
            newData.showLoading = false;
            
            // load prestige data
            newData.resetOrder = 4;
            if (this.resetOrder == this.highestOrderAllowed || (this.resetOrder == this.highestOrderAllowed - 1 && this.resetCount < this.addOrderResetsRequired)) {
                newData.resetCount = this.resetCount + 1;
            } else {
                newData.resetCount = this.resetCount;
            }
            if (this.resetOrder == this.highestOrderAllowed) {
                newData.highestOrderAllowed = this.highestOrderAllowed + 1;
            } else {
                newData.highestOrderAllowed = this.highestOrderAllowed;
            }
            newData.tickSpeedReductionPercent = this.tickSpeedReductionPercent;
            newData.multiplierLevel = this.multiplierLevel;
            newData.resetAmount = this.resetAmount;
            newData.resetCountTickSpeed = this.resetCountTickSpeed;
            newData.resetCountMultiplier = this.resetCountMultiplier;
            newData.resetCurrency = this.resetCurrency;
            newData.resetCurrencySpent = this.resetCurrencySpent;
            newData.resetCurrencyUnlockedThisRun = false;

            // upgrade by reset type
            if (resetType == 'tickspeed') {
                newData.tickSpeedReductionPercent = this.tickSpeedReductionPercent + 1;
                newData.resetCountTickSpeed = this.resetCountTickSpeed + 1;
                newData.resetCurrency = this.resetCurrency - this.resetCostTickSpeed;
                newData.resetCurrencySpent = this.resetCurrencySpent + this.resetCostTickSpeed;
            } else if (resetType == 'multiplier') {
                newData.multiplierLevel = this.multiplierLevel + 1;
                newData.resetCountMultiplier = this.resetCountMultiplier + 1;
                newData.resetCurrency = this.resetCurrency - this.resetCostMultiplier;
                newData.resetCurrencySpent = this.resetCurrencySpent + this.resetCostMultiplier;
            } else if (resetType != 'none') {
                console.log("Invalid reset type: " + resetType);
                return;
            }

            // check if at highest order so increment order amount
            /*if (this.resetOrder == this.highestOrder) {
                newData.resetAmount = this.resetAmount + 20;
            }*/

            // apply multipliers
            for (let multiplier = 1; multiplier <= newData.multiplierLevel; multiplier ++) {
                for (let currentOrder = 1; currentOrder <= multiplier && currentOrder <= this.highestOrder; currentOrder ++) {
                    newData.orders[currentOrder].multiplier = newData.orders[currentOrder].multiplier.times(2);
                }
            }

            // recalculate new reset costs
            newData.resetCostTickSpeed = Math.pow(2, newData.resetCountTickSpeed);
            newData.resetCostMultiplier = Math.pow(2, newData.resetCountMultiplier);
            
            // replace data
            Object.assign(this.$data, newData);

            // add starting currency if defined
            if (this.startingCurrency.gt(0)) {
                this.stuff = this.startingCurrency;
            }  

            // save & update stats
            this.saveGame();
            EventBus.$emit('updateStats');
        },
        saveGame() {
            SaveLoad.save(this.$data);
            console.log("Game Saved");
        },
        tick(timestamp) {
            if (this.wonGame) {
                return;
            }

            // get time since last frame
            let progress = timestamp - this.lastFrame;
            this.lastFrame = timestamp;

            // how much to update current frame (factoring in tickspeed)
            let frameDivision = Big(1000).div(progress);
            let divisionTimesTickSpeed = frameDivision.times(this.tickSpeed);

            // increment orders
            for (let key in this.orders) {
                if (key == 1) {
                    continue;
                }

                if (this.orders[key].owned.gt(0)) {
                    let orderIncrement = this.orders[key].owned.div(divisionTimesTickSpeed.times(10)).times(this.orders[key].multiplier);
                    this.orders[key-1].owned = this.orders[key-1].owned.plus(orderIncrement);

                    // set increase percentage
                    this.orders[key-1].increasePercentage = this.orders[key].owned.times(this.orders[key].multiplier).div(this.orders[key-1].owned).times(10).div(this.tickSpeed).toFixed(2);
                }
            }

            // recalculate stuff per second
            this.stuffPerSecond = this.orders[1].multiplier.times(Math.floor(this.orders[1].owned)).div(this.tickSpeed);

            // increment stuff
            let stuffIncrement = this.stuffPerSecond.div(frameDivision);
            this.stuff = this.stuff.plus(stuffIncrement);

            if (!this.resetCurrencyUnlockedThisRun && this.canReset()) {
                this.resetCurrency = this.resetCurrency + this.resetCurrencyReward;
                this.resetCurrencyUnlockedThisRun = true;
            }

            // check if won
            if (Utils.round(this.stuff) == '∞') {
                this.wonGame = true;
            }

            // check for interval
            if (timestamp - this.lastInterval > 5000) {
                let interval = (timestamp - this.lastInterval)/1000;

                Stats.commit('addTime', interval);
                EventBus.$emit('updateStats');
                this.saveGame();

                this.lastInterval = timestamp;
            }

            window.requestAnimationFrame(this.tick);
        },
        async setupGame() {
            if (!this.disableAutoLoad && localStorage.getItem("SaveGame") != null) {
                await this.loadGame();
            } else {
                await this.newGame();
            }

            // update option/stats in menu
            EventBus.$emit('updateOptions');
            EventBus.$emit('updateStats');

            // add event listeners
            EventBus.$on('hardReset', this.hardReset);

            window.requestAnimationFrame(this.tick);
        },
        async newGame() {
            // load default data
            Object.assign(this.$data, DefaultData.data());

            // reset stats/options
            Stats.commit('resetState');
            Options.commit('resetState');

            EventBus.$emit('closeMenu');

            if (this.startingCurrency.gt(0)) {
                this.stuff = this.startingCurrency;
            }

            this.showLoading = false;
        },
        async loadGame() {
            Object.assign(this.$data, SaveLoad.load());

            this.showLoading = false;

            console.log("Game Loaded");
        },
        async hardReset() {
            // start new game
            await this.newGame();

            EventBus.$emit('updateOptions');
            EventBus.$emit('updateStats');

            // save game
            this.saveGame();

            this.showLoading = false;
        },
    },

    mounted() {
        this.setupGame();
    }
}
</script>

<style>

</style>
