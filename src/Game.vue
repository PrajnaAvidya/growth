<template>
    <v-app>
        <v-container fluid="fluid">
            <div>
                <h5>You have <strong>{{ stuff | currency }}</strong> stuff.</h5>
                <h6>You are gaining {{ stuffPerSecond | currency }} stuff per second.</h6>
                <v-btn @click.native="upgradeTickSpeed()" :disabled="stuff.lt(tickCost)">Cost: {{ tickCost | round }}</v-btn>
                <h6>Tickspeed: {{ tickSpeedDisplayed }}</h6>
            </div>
            <hr />
            <v-layout v-for="(order, orderIndex) in orders" :key="orderIndex" v-show="orderIndex==1 || (orderIndex <= maxOrder && orders[orderIndex-1].owned > 0)">
                <v-flex sm4>
                    <h4>{{ order.name }} Order x{{ order.multiplier | currency }}</h4>
                </v-flex>
                <v-flex sm2>
                    <div>{{ order.owned | round }} ({{ order.bought }}) (+{{ order.increasePercentage }}%/s)</div>
                </v-flex>
                <v-flex sm2>
                    <v-btn @click.natve="buyOrder(order)" :disabled="stuff.lt(order.cost)">
                        Cost: {{ order.cost | round }}
                    </v-btn>
                </v-flex>
                <v-flex sm2>
                    <v-btn @click.natve="buyMax(order)" :disabled="stuff.lt(order.costToMultiplier)">
                        Until 10, Cost: {{ order.costToMultiplier | round }}
                    </v-btn>
                </v-flex>
            </v-layout>
            <v-btn @click.native="reset()" :disabled="!canReset()">Reset ({{ resetCount }})</v-btn> Start a new game with a higher multiplier (Requires {{ resetAmount }} of order {{ resetOrder }})
        </v-container>
    </v-app>
</template>

<script>
import Big from "big.js";
import Utils from "./modules/utils.js";

function defaultData() {
    return {
        stuff: Big('1E1000'),
        stuffPerSecond: Big(0),
        tickSpeed: Big(1),
        tickSpeedDisplayed: "1000",
        tickCost: Big(1000),
        maxOrder: 4,
        resetCount: 0,
        lastFrame: null,
        highestOrder: 8,
        resetOrder: 4,
        resetAmount: 20,
        orders: {
            1: {
                name: 'First',
                multiplier: Big(1),
                cost: Big(10),
                costMultiplier: Big(1000),
                costToMultiplier: Big(100),
                owned: Big(0),
                bought: 0,
                increasePercentage: 0.00,
            },
            2: {
                name: 'Second',
                multiplier: Big(1),
                cost: Big(100),
                costMultiplier: Big(10000),
                costToMultiplier: Big(1000),
                owned: Big(0),
                bought: 0,
                increasePercentage: 0.00,
            },
            3: {
                name: 'Third',
                multiplier: Big(1),
                cost: Big(10000),
                costMultiplier: Big(100000),
                costToMultiplier: Big(100000),
                owned: Big(0),
                bought: 0,
                increasePercentage: 0.00,
            },
            4: {
                name: 'Fourth',
                multiplier: Big(1),
                cost: Big(1E6),
                costMultiplier: Big(1E6),
                costToMultiplier: Big(1E7),
                owned: Big(0),
                bought: 0,
                increasePercentage: 0.00,
            },
            5: {
                name: 'Fifth',
                multiplier: Big(1),
                cost: Big(1E9),
                costMultiplier: Big(1E6),
                costToMultiplier: Big(1E10),
                owned: Big(0),
                bought: 0,
                increasePercentage: 0.00,
            },
            6: {
                name: 'Sixth',
                multiplier: Big(1),
                cost: Big(10E12),
                costMultiplier: Big(10E9),
                costToMultiplier: Big(1E13),
                owned: Big(0),
                bought: 0,
                increasePercentage: 0.00,
            },
            7: {
                name: 'Seventh',
                multiplier: Big(1),
                cost: Big(1E18),
                costMultiplier: Big(1E12),
                costToMultiplier: Big(1E16),
                owned: Big(0),
                bought: 0,
                increasePercentage: 0.00,
            },
            8: {
                name: 'Eighth',
                multiplier: Big(1),
                cost: Big(1E24),
                costMultiplier: Big(1E15),
                costToMultiplier: Big(1E25),
                owned: Big(0),
                bought: 0,
                increasePercentage: 0.00,
            },
        }
    }
}

export default {
    data: function() {
        return defaultData();
    },

    filters: {
        currency(value) {
            return Utils.currency(value);
        },
        round(value) {
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
            if (this.stuff.lt(this.tickCost)) {
                return;
            }
            this.stuff = this.stuff.minus(this.tickCost);
            this.tickCost = this.tickCost.times(10);
            this.tickSpeed = this.tickSpeed.times(0.89);
            if (this.tickSpeed.gt(0.1)) {
                this.tickSpeedDisplayed = this.tickSpeed.times(1000).toFixed(0);
            } else if (this.tickSpeed.gt(0.01)) {
                this.tickSpeedDisplayed = this.tickSpeed.times(1000).toFixed(1);
            } else if (this.tickSpeed.gt(0.001)) {
                this.tickSpeedDisplayed = this.tickSpeed.times(1000).toFixed(2);
            } else {
                this.tickSpeedDisplayed = this.tickSpeed.times(1000).toExponential(2);
            }
        },
        upgradeOrder(order) {
            order.bought = 0;

            order.multiplier = order.multiplier.times(2);
            order.cost = order.cost.times(order.costMultiplier);
            order.costToMultiplier = Big(10).minus(order.bought).times(order.cost);
        },
        canReset() {
            return this.orders[this.resetOrder].owned.gte(this.resetAmount);
        },
        reset() {
            if (!this.canReset()) {
                return;
            }

            // load default data
            let newData = defaultData();

            // upgrade max order
            newData.maxOrder = this.maxOrder + 1;
            newData.resetCount = this.resetCount + 1;

            // upgrade reset requirements
            if (this.resetOrder < this.highestOrder) {
                newData.resetOrder = this.resetOrder + 1;
            } else {
                newData.resetOrder = this.highestOrder;
                newData.resetAmount = this.resetAmount + 20;
            }

            // upgrade multipliers
            for (let maxOrder = 1; maxOrder <= newData.resetCount; maxOrder ++) {
                for (let currentOrder = 1; currentOrder <= maxOrder && currentOrder <= this.highestOrder; currentOrder ++) {
                    newData.orders[currentOrder].multiplier = newData.orders[currentOrder].multiplier.times(2);
                }
            }
            
            // replace data
            Object.assign(this.$data, newData);
        },
        tick(timestamp) {
            // get time since last frame
            let progress = timestamp - this.lastFrame;
            this.lastFrame = timestamp;

            // how much to update current frame (factoring in tickspeed)
            let division = Big(1000).times(this.tickSpeed).div(progress);

            // increment orders
            for (let key in this.orders) {
                if (key == 1) {
                    continue;
                }

                if (this.orders[key].owned.gt(0)) {
                    let orderIncrement = this.orders[key].owned.div(division.times(10)).times(this.orders[key].multiplier);
                    this.orders[key-1].owned = this.orders[key-1].owned.plus(orderIncrement);

                    // set increase percentage
                    this.orders[key-1].increasePercentage = this.orders[key].owned.times(this.orders[key].multiplier).div(this.orders[key-1].owned).times(10).div(this.tickSpeed).toFixed(2);
                }
            }

            // increment stuff
            let stuffIncrement = this.stuffPerSecond.div(division);
            this.stuff = this.stuff.plus(stuffIncrement);

            // recalculate stuff per second
            this.stuffPerSecond = this.orders[1].multiplier.times(Math.floor(this.orders[1].owned)).div(this.tickSpeed);

            window.requestAnimationFrame(this.tick);
        },
    },

    mounted() {
        window.requestAnimationFrame(this.tick);    
    }
}
</script>

<style>

</style>
