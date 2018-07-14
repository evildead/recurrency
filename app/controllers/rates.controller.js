const xml2js = require('xml2js');   // require xml2js

// User model
const Rates = require('../models/rates.model');

const getDateOfToday = require('../utilities').getDateOfToday;
const getEuroFxRef = require('../utilities').getEuroFxRef;
const stdResponse = require('../utilities').stdResponse;

module.exports = {
    getLatestRates: getLatestRates
};

/**
 * function getLatestRates
 * @param {*} req 
 * @param {*} res 
 */
function getLatestRates(req, res) {
    getEuroFxRef((err, data) => {
        if(err) {
            return stdResponse(err, null, req, res);
        }
        else {
            fromRawXmlToJsonRates(data, (result) => {
                return stdResponse(null, result, req, res);
            });
        }
        /*
        const rates = new Rates();
        rates.rawdata = data;
        rates.save((err) => {
            if(err) {
                return stdResponse(err, null, req, res);
            }
            return stdResponse(null, data, req, res);
        });
        */
    });
}

/**
 * function fromRawXmlToJsonRates
 * @param {*} rawXml 
 * @param {*} callback(result) 
 */
function fromRawXmlToJsonRates(rawXml, callback) {
    // parse xml to get the rates in json
    xml2js.parseString(rawXml, function (err, result) {
        if(err) {
            throw(err);
        }
        else {
            // time
            let theFinalRates = {};
            let currencyTime = result["gesmes:Envelope"].Cube[0].Cube[0].$.time;
            
            // EUR
            let eurRatesList = {};
            let cubeCurrencies = result["gesmes:Envelope"].Cube[0].Cube[0].Cube;
            for(let i = 0; i < cubeCurrencies.length; i++) {
                eurRatesList[cubeCurrencies[i].$.currency] = cubeCurrencies[i].$.rate;
            }
            let eurRates = {
                "base": "EUR",
                "date": currencyTime,
                "rates": eurRatesList
            };
            theFinalRates["EUR"] = eurRates;

            // The other currencies
            for(let currName of Object.keys(eurRatesList)) {
                let tmpRatesList = {};
                let numEurRate = 1/eurRatesList[currName];
                tmpRatesList["EUR"] = numEurRate.toFixed(3);
                for(let tmpCurrName of Object.keys(eurRatesList)) {
                    if(tmpCurrName != currName) {
                        let numRate = eurRatesList[tmpCurrName] / eurRatesList[currName];
                        tmpRatesList[tmpCurrName] = numRate.toFixed(3);
                    }
                }
                let tmpRates = {
                    "base": currName,
                    "date": currencyTime,
                    "rates": tmpRatesList
                };

                theFinalRates[currName] = tmpRates;
            }
            
            return callback(theFinalRates);
        }
    });
}
