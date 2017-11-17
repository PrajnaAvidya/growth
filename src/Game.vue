<template>
    <v-app>
        <v-container fluid="fluid">
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
                    <h6>{{ order.name }} = {{ order.owned | whole }} (+{{ order.increasePercentage }}%/s) <small>(bought {{ order.bought }}/10 for multiplier)</small></h6>
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
                    Once you reach {{ resetAmount }} owned of {{ orders[resetOrder].name }} Power you can reset with a boost.
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

        // for tick function
        lastFrame: null,

        // stuff/tickspeed
        stuff: Big(10),
        stuffPerSecond: Big(0),
        tickSpeed: Big(1),
        tickSpeedDisplayed: "100%",
        tickSpeedReductionPercent: 10,
        tickSpeedCost: Big(100),

        // orders/multiplier
        multiplierLevel: 0,
        highestOrder: 8,
        highestOrderAllowed: 4,
        addOrderResetsRequired: 2,
        addOrderCost: 1,

        // reset/prestige
        showReset: false,
        resetOrder: 4,
        resetAmount: 20,
        resetCount: 0,
        resetCountTickSpeed: 0,
        resetCountMultiplier: 0,
        resetCostTickSpeed: 1,
        resetCostMultiplier: 1,
        resetCurrency: 0,
        resetCurrencySpent: 0,
        resetCurrencyReward: 1,
        resetCurrencyUnlockedThisRun: false,
        
        // order data
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

            // load default data
            let newData = defaultData();
            
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
            newData.resetCostTickSpeed = Math.pow(2, newData.resetCountTickSpeed);
            newData.resetCostMultiplier = Math.pow(2, newData.resetCountMultiplier);
            
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
                this.resetCurrency = this.resetCurrency + this.resetCurrencyReward;
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
