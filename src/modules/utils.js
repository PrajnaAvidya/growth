import Big from "big.js";

export default {
    round(value, decimal=false) {
        if (isNaN(value)) {
            return 0;
        }
        value = Big(value);

        if (decimal && value < 100) {
            return value.toFixed(1);
        }
        
        if (value <= 999) {
            return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        
        if (value.lt("1E36")) {
            let suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dec"];
            let suffix = suffixes[Math.floor((value.e) / 3)];
            let sigFig = (value.e % 3);
            value.e = 3 + sigFig;
            return value.div(1000).toPrecision(4 + sigFig) + ' ' + suffix;
        }
        
        if (value.lt("1E303")) {
            // TODO
            let bigSuffixes = ["Dec","Vig","Tri","Qua","Qui","Sex","Sep","Oct","Non"];
            let littleSuffixes = ["U","D","T","Qa","Qi","Sx","Sp","Oc","No", ""];

            let bigIndex = Math.floor((value.e-33)/30);
            let littleIndex = (Math.floor((value.e-33)/3)-1) % 10;
            let suffix = littleSuffixes[littleIndex] + bigSuffixes[bigIndex];

            let sigFig = value.e % 3;
            value.e = 3 + sigFig;
            
            return value.div(1000).toPrecision(4 + sigFig) + ' ' + suffix;
        }

        return "∞";
    },

    convertObjectToBig(objectData) {
        let bigData = {};
        for (let key in objectData) {
            if (isNaN(objectData[key])) {
                bigData[key] = objectData[key];
            } else {
                bigData[key] = Big(objectData[key]);
            }
        }
        return bigData;
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    },

    addLineBreaks(input, len = 100) {
        let curr = len, prev = 0, output = [];
        
        while (input[curr]) {
            if (input[curr++] == ' ') {
                output.push(input.substring(prev,curr));
                prev = curr;
                curr += len;
            }
        }
        output.push(input.substr(prev));
        
        return output.join("<br />");
    },

    unixTimestamp() {
        return Math.round((new Date()).getTime() / 1000);
    },
};
