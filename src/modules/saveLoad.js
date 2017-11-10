import Big from "big.js";
import Orders from "./orders.js";

function getSaveVersion() {
    return '1';
}

export default {
    save(data) {
        let saveData = {
            version: getSaveVersion(),
            data: data,
        };

        localStorage.setItem("SaveGame", JSON.stringify(saveData));
    },

    load() {
        // load save data
        let saveDataRaw = JSON.parse(localStorage.getItem("SaveGame"));

        // TODO deal with version number

        let saveData = saveDataRaw.data;

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
            stuff: Big(saveData.stuff),
            stuffPerSecond: Big(saveData.stuffPerSecond),
            tickSpeed: Big(saveData.tickSpeed),
            tickSpeedDisplayed: saveData.tickSpeedDisplayed,
            tickSpeedMultiplier: saveData.tickSpeedMultiplier,
            tickSpeedCost: Big(saveData.tickSpeedCost),
            maxOrder: saveData.maxOrder,
            resetCount: saveData.resetCount,
            lastFrame: null,
            highestOrder: saveData.highestOrder,
            resetOrder: saveData.resetOrder,
            resetAmount: saveData.resetAmount,
            orders: orders,
        };
        return gameData;
    },
};
