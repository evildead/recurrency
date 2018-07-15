const xml2js = require('xml2js');   // require xml2js

// User model
const Rates = require('../models/rates.model');

const getYearMonthDayFromDateObject = require('../utilities').getYearMonthDayFromDateObject;
const getDateOfToday = require('../utilities').getDateOfToday;
const dateComparedWithToday = require('../utilities').dateComparedWithToday;
const getEuroFxRef = require('../utilities').getEuroFxRef;
const stdResponse = require('../utilities').stdResponse;

module.exports = {
    getLatestRates: getLatestRates
};

function returnFilteredRates(ratesInJson, req, res) {
    if( (req.query.base) && (req.query.base in ratesInJson) ) {
        return stdResponse(null, ratesInJson[req.query.base], req, res);
    }
    else {
        return stdResponse(null, ratesInJson, req, res);
    }
}

/**
 * function getLatestRates
 * @param {*} req 
 * @param {*} res 
 */
function getLatestRates(req, res) {
    getLatestRatesFromDB((err, rates) => {
        if(err) {
            return stdResponse(err, null, req, res);
        }
        else {
            if((rates != null) && (dateComparedWithToday(rates.dateStr) == 0)) {
                console.log("data from database");
                returnFilteredRates(JSON.parse(rates.ratesMap), req, res);    // return filtered data
            }
            else {
                console.log("data from web");
                getEuroFxRef()  // download xml from European Central Bank
                .then((rawXml) => {
                    return fromRawXmlToJsonRates(rawXml);   // get JSON data rates
                })
                .then((jsonRates) => {
                    return saveRatesToDB(jsonRates);   // save JSON data rates to database
                })
                .then((ratesModelObj) => {
                    returnFilteredRates(JSON.parse(ratesModelObj.ratesMap), req, res);   // return filtered data
                })
                .catch((err) => {
                    stdResponse(err, null, req, res);
                });
            }
        }
    });
}

/**
 * function fromRawXmlToJsonRates
 * 
 * @param {*} rawXml 
 * @param {*} callback(err, ratesInJson) can be null
 * 
 * It returns a promise
 */
function fromRawXmlToJsonRates(rawXml, callback = null) {
    var innerPromise = new Promise((resolve, reject) => {
        // parse xml to get the rates in json
        xml2js.parseString(rawXml, function (err, result) {
            if(err) {
                if(callback != null) {
                    callback(err, null);
                }
                reject(err);
            }
            else {
                // the big rates structure
                let theFinalRates = {};

                // time
                let currencyTime = result["gesmes:Envelope"].Cube[0].Cube[0].$.time;
                
                // build the rates for EUR currency
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

                // build the rates for all the other currencies
                for(let currName of Object.keys(eurRatesList)) {
                    let tmpRatesList = {};
                    
                    let numEurRate = 1/eurRatesList[currName];
                    tmpRatesList["EUR"] = numEurRate.toFixed(4);
                    for(let tmpCurrName of Object.keys(eurRatesList)) {
                        if(tmpCurrName != currName) {
                            // we calculate the rate between any couple of currencies by using the rates with EUR
                            let numRate = eurRatesList[tmpCurrName] / eurRatesList[currName];
                            tmpRatesList[tmpCurrName] = numRate.toFixed(4);
                        }
                    }
                    
                    let tmpRates = {
                        "base": currName,
                        "date": currencyTime,
                        "rates": tmpRatesList
                    };
                    theFinalRates[currName] = tmpRates;
                }
                
                if(callback != null) {
                    callback(null, theFinalRates);
                }
                resolve(theFinalRates);
            }
        });
    });

    return innerPromise;
}

/**
 * function getLatestRatesFromDB
 * @param {*} callback (err, rates) where rates can be null if no record exists
 *                     callback can be null
 * 
 * it returns a promise
 */
function getLatestRatesFromDB(callback = null) {
    return Rates.findOne({})
        .sort({'createdOn': 'desc'})
        .exec((err, rates) => {
            if(err) {
                if(callback != null) {
                    callback(err, null);
                }
            }
            else {
                if(callback != null) {
                    callback(null, rates);
                }
            }
        })
        .catch((err) => {
            //error, its handled now!
        });
}

/**
 * function saveRatesToDB
 * 
 * @param {*} ratesInJson 
 * @param {*} rawXml 
 * @param {*} callback(err, rates)
 *                    callback can be null 
 * 
 * It returns a promise
 */
function saveRatesToDB(ratesInJson, rawXml, callback = null) {
    const newRates = new Rates();
    newRates.dateStr = getDateOfToday();
    newRates.rawXml = rawXml;
    newRates.ratesMap = JSON.stringify(ratesInJson);

    var innerPromise = new Promise((resolve, reject) => {
        newRates.save((err) => {
            if(err) {
                if(callback != null) {
                    callback(err, null);
                }
                reject(err);
            }
            else {
                if(callback != null) {
                    callback(null, newRates);
                }
                resolve(newRates);
            }
        });
    });

    return innerPromise;
}
