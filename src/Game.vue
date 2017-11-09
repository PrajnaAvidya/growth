<template>
    <v-app>
        <v-container fluid="fluid">
            <div>
                <h5>You have <strong>{{ stuff | currency }}</strong> stuff.</h5>
                <h6>You are gaining {{ stuffPerSecond | currency }} stuff per second.</h6>
                <v-btn @click.native="upgradeTickSpeed()" :disabled="stuff.lt(tickCost)">Cost: {{ tickCost | round }}</v-btn>
                <h6>Tickspeed: {{ tickSpeedDisplayed | round }}</h6>
            </div>
            <hr />
            <v-layout v-for="(order, orderIndex) in orders" :key="orderIndex" v-show="orderIndex==1 || orders[orderIndex-1].owned > 0">
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
        </v-container>
    </v-app>
</template>

<script>
import Big from "big.js";
import Utils from "./modules/utils.js";

function defaultData() {
    return {
        stuff: Big(100000),
        stuffPerSecond: Big(0),
        tickSpeed: Big(1),
        tickSpeedDisplayed: 1000,
        tickCost: Big(1000),
        lastFrame: null,
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

            order.costToMultiplier = (10 - order.bought) * order.cost;

            if (order.bought == 10) {
                this.upgradeOrder(order);
            }
        },
        buyMax(order) {
            if (this.stuff.lt(order.costToMultiplier)) {
                return;
            }

            let buyAmount = 10 - order.bought;
            this.stuff = this.stuff.minus(order.cost * buyAmount);
            order.owned = order.owned.plus(buyAmount);

            this.upgradeOrder(order);
        },
        upgradeTickSpeed() {
            if (this.stuff.lt(this.tickCost)) {
                return;
            }

            this.tickCost = this.tickCost.times(10);
            this.tickSpeed = this.tickSpeed.times(0.89);
            this.tickSpeedDisplayed = this.tickSpeed.times(1000);
        },

        upgradeOrder(order) {
            order.bought = 0;

            order.multiplier = order.multiplier.times(2 );
            order.cost = order.cost.times(order.costMultiplier);
            order.costToMultiplier = (10 - order.bought) * order.cost;
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
                    let orderIncrement = this.orders[key].owned.div(10 * division).times(this.orders[key].multiplier);
                    this.orders[key-1].owned = this.orders[key-1].owned.plus(orderIncrement);

                    // set increase percentage
                    this.orders[key-1].increasePercentage = this.orders[key].owned.div(this.orders[key-1].owned).times(10).div(this.tickSpeed).toFixed(2);
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
