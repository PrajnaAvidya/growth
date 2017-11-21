import Big from "big.js";
import Version from "./version.js";
import Utils from "./utils.js";
import Options from './options.js';
import Stats from './stats.js';
import Orders from "./orders.js";

export default {
    save(data) {
        let saveData = {
            version: Version.saveVersion,
            data: data,
            options: Options.state,
            stats: Stats.state,
        };

        // update stuff stats on save
        Stats.commit('setStuff', saveData.data.stuff);
        Stats.commit('setStuffPerSecond', saveData.data.stuffPerSecond);

        localStorage.setItem("SaveGame", JSON.stringify(saveData));
    },

    load() {
        // load save data
        let saveDataRaw = JSON.parse(localStorage.getItem("SaveGame"));

        // deal with out of date save version
        if (saveDataRaw.version != Version.saveVersion) {
            console.log("Patching save file to latest version");
            if (saveDataRaw.version == '1') {
                saveDataRaw.data.resetAmount = 20;
            }
        }
        

        // load data/stats/options
        let saveData = saveDataRaw.data;
        Options.replaceState(saveDataRaw.options);
        Stats.replaceState(Utils.convertObjectToBig(saveDataRaw.stats));

        // parse big/orders data
        let orders = {};
        let orderNumber = 1;
        Orders.forEach(function (orderData) {
            orders[orderNumber] = {
                name: orderData.name,
                multiplier: Big(saveData.orders[orderNumber].multiplier),
                cost: Big(saveData.orders[orderNumber].cost),
                costMultiplier: Big(saveData.orders[orderNumber].costMultiplier),
                costToMultiplier: Big(saveData.orders[orderNumber].costToMultiplier),
                owned: Big(saveData.orders[orderNumber].owned),
                bought: saveData.orders[orderNumber].bought,
                increasePercentage: saveData.orders[orderNumber].increasePercentage,
            };
    
            orderNumber ++;
        });

        let gameData = {
            lastFrame: null,
            lastInterval: null,

            // stuff/tickspeed
            stuff: Big(saveData.stuff),
            stuffPerSecond: Big(saveData.stuffPerSecond),
            tickSpeed: Big(saveData.tickSpeed),
            tickSpeedDisplayed: saveData.tickSpeedDisplayed,
            tickSpeedReductionPercent: saveData.tickSpeedReductionPercent,
            tickSpeedCost: Big(saveData.tickSpeedCost),
            
            // orders/multiplier
            multiplierLevel: saveData.multiplierLevel,
            highestOrder: saveData.highestOrder,
            highestOrderAllowed: saveData.highestOrderAllowed,
            addOrderResetsRequired: saveData.addOrderResetsRequired,
            addOrderCost: saveData.addOrderCost,

            // reset/prestige
            showReset: false,
            resetOrder: saveData.resetOrder,
            resetAmount: saveData.resetAmount,
            resetCount: saveData.resetCount,
            resetCountTickSpeed: saveData.resetCountTickSpeed,
            resetCountMultiplier: saveData.resetCountMultiplier,
            resetCostTickSpeed: saveData.resetCostTickSpeed,
            resetCostMultiplier: saveData.resetCostMultiplier,
            resetCurrency: saveData.resetCurrency,
            resetCurrencySpent: saveData.resetCurrencySpent,
            resetCurrencyReward: saveData.resetCurrencyReward,
            resetCurrencyUnlockedThisRun: saveData.resetCurrencyUnlockedThisRun,

            // order data
            orders: orders,
        };
        return gameData;
    },
};
