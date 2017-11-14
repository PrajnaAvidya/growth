<template>
    <v-app>
        <v-container fluid="fluid">
            <div>
                <h5>You have <strong>{{ stuff | stuff }}</strong> stuff.</h5>
                <h6>You are gaining {{ stuffPerSecond | stuff }} stuff per second.</h6>
                <hr />
                <div>Reduce tickspeed by {{ tickSpeedReductionPercent }} percent.</div>
                <v-btn v-on:click="upgradeTickSpeed()" :disabled="stuff.lt(tickSpeedCost)">Cost: {{ tickSpeedCost | whole }}</v-btn>
                <v-btn v-on:click="upgradeTickSpeedMax()" :disabled="stuff.lt(tickSpeedCost)">Buy Max</v-btn>
                <h6>Tickspeed: {{ tickSpeedDisplayed }}</h6>
            </div>
            <hr />
            <v-layout v-for="(order, orderIndex) in orders" :key="orderIndex" v-show="orderIndex==1 || (orderIndex <= resetOrder && orders[orderIndex-1].owned > 0)">
                <v-flex sm4>
                    <h4>{{ order.name }} Power x{{ order.multiplier | multiplier }}</h4>
                </v-flex>
                <v-flex sm2>
                    <div>{{ order.owned | whole }} ({{ order.bought }}) (+{{ order.increasePercentage }}%/s)</div>
                </v-flex>
                <v-flex sm2>
                    <v-btn v-on:click="buyOrder(order)" :disabled="stuff.lt(order.cost)">
                        Cost: {{ order.cost | whole }}
                    </v-btn>
                </v-flex>
                <v-flex sm2>
                    <v-btn v-on:click="buyMax(order)" :disabled="stuff.lt(order.costToMultiplier)">
                        Until 10, Cost: {{ order.costToMultiplier | whole }}
                    </v-btn>
                </v-flex>
            </v-layout>

            <div v-show="orders[resetOrder].owned > 0">
                <div v-show="!canReset()">
                    Once you reach {{ resetAmount }} owned of {{ orders[resetOrder].name }} Power you can reset with a boost.
                </div>
                <v-btn v-on:click="showReset = !showReset" :disabled="!canReset()" >Toggle Reset <span v-show="resetCurrency > 0">({{ resetCurrency }})</span></v-btn>
                <div v-show="showReset">
                    Reset currency stored: {{ resetCurrency }} <br />
                    <v-btn v-on:click="reset('none')">Reset with no bonus (save reset currency)</v-btn>
                    <br />
                    <v-btn v-show="resetOrder < highestOrder" v-on:click="reset('power')" :disabled="resetCurrency < resetCostPower">Add another Power (Cost: {{ resetCostPower }})</v-btn>
                    <v-btn v-show="tickSpeedReductionPercent < 99" v-on:click="reset('tickspeed')" :disabled="resetCurrency < resetCostTickSpeed">Increase Tickspeed multiplier (Cost: {{ resetCostTickSpeed  }})</v-btn>
                    <v-btn v-on:click="reset('multiplier')" :disabled="resetCurrency < resetCostMultiplier">Increase Power multipliers (Cost: {{ resetCostMultiplier }})</v-btn>
                </div>
            </div>

            <div v-show="cheatMode">
                Cheat Mode: <v-btn v-on:click="stuff = stuff.times(1E3)">Add Stuff</v-btn>
            </div>
            
        </v-container>
    </v-app>
</template>

<script>
import Big from "big.js";
import Utils from "./modules/utils.js";
import Orders from "./modules/orders.js";
import SaveLoad from "./modules/saveLoad.js";

function defaultData() {
    // generate orders from data
    let orders = {};
    let orderNumber = 1;
    Orders.forEach(function (orderData) {
        orders[orderNumber] = {
            name: orderData.name,
            multiplier: Big(1),
            cost: Big(orderData.cost),
            costMultiplier: Big(orderData.costMultiplier),
            costToMultiplier: Big(orderData.cost).times(10),
            owned: Big(0),
            bought: 0,
            increasePercentage: 0.00,
        };

        orderNumber ++;
    });

    return {
        // debug flags
        disableAutoSave: false,
        disableAutoLoad: false,
        startingCurrency: Big(0),
        cheatMode: false,

        stuff: Big(10),
        stuffPerSecond: Big(0),
        tickSpeed: Big(1),
        tickSpeedDisplayed: "1000",
        tickSpeedReductionPercent: 10,
        tickSpeedCost: Big(1000),
        multiplierLevel: 0,

        lastFrame: null,
        highestOrder: 8,

        showReset: false,
        resetCount: 0,
        resetCountPower: 0,
        resetCountTickSpeed: 0,
        resetCountMultiplier: 0,
        resetCostPower: 1,
        resetCostTickSpeed: 1,
        resetCostMultiplier: 1,
        resetOrder: 4,
        resetAmount: 20,
        resetCurrency: 0,
        resetCurrencyUnlockedThisRun: false,
        
        orders: orders,
    }
}

export default {
    data: function() {
        return defaultData();
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
                this.tickSpeedDisplayed = this.tickSpeed.times(1000).toFixed(0);
            } else if (this.tickSpeed.gt(0.01)) {
                this.tickSpeedDisplayed = this.tickSpeed.times(1000).toFixed(1);
            } else if (this.tickSpeed.gt(0.001)) {
                this.tickSpeedDisplayed = this.tickSpeed.times(1000).toFixed(2);
            } else {
                this.tickSpeedDisplayed = this.tickSpeed.times(1000).toExponential(2);
            }

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
        canReset(resetType=null) {
            if (!resetType || resetType == 'none') {
                return this.orders[this.resetOrder].owned.gte(this.resetAmount);
            }
            
            if (resetType == 'power' && this.resetOrder < this.highestOrder) {
                return this.resetCurrency >= this.resetCostPower;
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

            // load default data
            let newData = defaultData();
            
            // load prestige data
            newData.resetCount = this.resetCount + 1;
            newData.resetOrder = this.resetOrder;
            newData.tickSpeedReductionPercent = this.tickSpeedReductionPercent;
            newData.multiplierLevel = this.multiplierLevel;
            newData.resetAmount = this.resetAmount;
            newData.resetCountPower = this.resetCountPower;
            newData.resetCountTickSpeed = this.resetCountTickSpeed;
            newData.resetCountMultiplier = this.resetCountMultiplier;
            newData.resetCurrency = this.resetCurrency;
            newData.resetCurrencyUnlockedThisRun = false;

            // upgrade by reset type
            if (resetType == 'power' && this.resetOrder < this.highestOrder) {
                newData.resetOrder = this.resetOrder + 1;
                newData.resetCountPower = this.resetCountPower + 1;
                newData.resetCurrency = this.resetCurrency - this.resetCostPower;
            } else if (resetType == 'tickspeed') {
                newData.tickSpeedReductionPercent = this.tickSpeedReductionPercent + 1;
                newData.resetCountTickSpeed = this.resetCountTickSpeed + 1;
                newData.resetCurrency = this.resetCurrency - this.resetCostTickSpeed;
            } else if (resetType == 'multiplier') {
                newData.multiplierLevel = this.multiplierLevel + 1;
                newData.resetCountMultiplier = this.resetCountMultiplier + 1;
                newData.resetCurrency = this.resetCurrency - this.resetCostMultiplier;
            } else if (resetType != 'none') {
                console.log("Invalid reset type: " + resetType);
            }

            // check if at highest order so increment order amount
            if (this.resetOrder == this.highestOrder) {
                newData.resetAmount = this.resetAmount + 20;
            }

            // apply multipliers
            for (let multiplier = 1; multiplier <= newData.multiplierLevel; multiplier ++) {
                for (let currentOrder = 1; currentOrder <= multiplier && currentOrder <= this.highestOrder; currentOrder ++) {
                    newData.orders[currentOrder].multiplier = newData.orders[currentOrder].multiplier.times(2);
                }
            }

            // recalculate new reset costs
            newData.resetCostPower = newData.resetCountPower + 1;
            newData.resetCostTickSpeed = Math.pow(2, newData.resetCountTickSpeed);
            newData.resetCostMultiplier = Math.ceil(Math.log(newData.resetCountMultiplier + 1)) + 1;
            
            // replace data
            Object.assign(this.$data, newData);

            // add starting currency if defined
            if (this.startingCurrency.gt(0)) {
                this.stuff = this.startingCurrency;
            }
        },
        saveGame() {
            SaveLoad.save(this.$data);
            console.log("Saved");
        },
        tick(timestamp) {
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
                this.resetCurrency = this.resetCurrency + 1;
                this.resetCurrencyUnlockedThisRun = true;
            }

            window.requestAnimationFrame(this.tick);
        },
    },

    mounted() {
        if (!this.disableAutoLoad && localStorage.getItem("SaveGame") != null) {
            let saveData = SaveLoad.load();
            Object.assign(this.$data, saveData);
            console.log("Loaded");
        } else {
            console.log("New");
            if (this.startingCurrency.gt(0)) {
                this.stuff = this.startingCurrency;
            }
        }

        window.requestAnimationFrame(this.tick);

        // auto save
        setInterval(function () {
            if (!this.disableAutoSave) {
                this.saveGame();
            }
        }.bind(this), 5000);
    }
}
</script>

<style>

</style>
