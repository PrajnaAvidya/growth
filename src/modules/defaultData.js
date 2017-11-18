import Big from "big.js";
import Orders from "./orders.js";

export default {
    data() {
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
            disableAutoLoad: true,
            startingCurrency: Big(0),
            cheatMode: true,
    
            // ui
            showLoading: true,
    
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
        };
    },
};
