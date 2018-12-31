const xml2js = require('xml2js');   // require xml2js

// Rates model
const Rates = require('../models/rates.model');

const getYearMonthDayFromDateObject = require('../utilities').getYearMonthDayFromDateObject;
const getDateOfToday = require('../utilities').getDateOfToday;
const dateComparedWithToday = require('../utilities').dateComparedWithToday;
const getEuroFxRef = require('../utilities').getEuroFxRef;
const stdResponse = require('../utilities').stdResponse;

const latestRatesCache = [];

module.exports = {
    getLatestRates: getLatestRates,
    getAvailableCurrencies: getAvailableCurrencies
};

// export these methods only in test mode
if((process.env.NODE_ENV) && (process.env.NODE_ENV == 'test')) {
    module.exports.fromRawXmlToJsonRates = fromRawXmlToJsonRates;
}

function returnFilteredRates(ratesInJson, req, res) {
    if( (req.query.base) &&
        (typeof(req.query.base) === "string" || req.query.base instanceof String) &&
        (req.query.base.toString().toUpperCase() in ratesInJson) ) {
        return stdResponse(null, ratesInJson[req.query.base.toString().toUpperCase()], req, res);
    }
    else {
        return stdResponse(null, ratesInJson, req, res);
    }
}

function returnAvailableCurrencies(ratesInJson, req, res) {
    return stdResponse(null, Object.keys(ratesInJson), req, res);
}

/**
 * function getAvailableCurrencies
 * @param {*} req 
 * @param {*} res 
 */
function getAvailableCurrencies(req, res) {
    innerGetLatestRatesModel((err, rates) => {
        if(err) {
            return stdResponse(err, null, req, res);
        }
        else {
            return returnAvailableCurrencies(JSON.parse(rates.ratesMap), req, res);    // return available currencies
        }
    });
}

/**
 * function getLatestRates
 * @param {*} req 
 * @param {*} res 
 */
function getLatestRates(req, res) {
    innerGetLatestRatesModel((err, rates) => {
        if(err) {
            return stdResponse(err, null, req, res);
        }
        else {
            return returnFilteredRates(JSON.parse(rates.ratesMap), req, res);    // return filtered data
        }
    });
}

/**
 * function innerGetLatestRatesModel
 * 
 * @param {*} callback(err, rates) where rates is an object of type ratesSchema 'Rates' 
 */
function innerGetLatestRatesModel(callback) {
    // Check cache first
    if((latestRatesCache.length > 0) && (dateComparedWithToday(latestRatesCache[0].dateStr) == 0)) {
        console.log('data from cache');
        return process.nextTick(callback.bind(null, null, latestRatesCache[0]));
    }
    // Then check the database
    getLatestRatesFromDB((err, rates) => {
        if(err) {
            return callback(err, null);
        }
        else {
            if((rates != null) && (dateComparedWithToday(rates.dateStr) == 0)) {
                console.log("data from database");
                
                // update cache
                latestRatesCache.splice(0, latestRatesCache.length);
                latestRatesCache.push(rates);

                return callback(null, rates);
            }
            else {
                console.log("data from web");
                getEuroFxRef()  // download xml from European Central Bank
                .then((rawXml) => {
                    return fromRawXmlToJsonRates(rawXml);   // get JSON data rates
                })
                .then(([jsonRates, rawXml]) => {
                    return saveRatesToDB(jsonRates, rawXml);   // save JSON data rates to database
                })
                .then((ratesModelObj) => {
                    return callback(null, ratesModelObj);
                })
                .catch((err) => {
                    return callback(err, null);
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
                    
                    let numEurRate = 1.0/eurRatesList[currName];
                    tmpRatesList["EUR"] = numEurRate/*.toFixed(4)*/;
                    for(let tmpCurrName of Object.keys(eurRatesList)) {
                        if(tmpCurrName != currName) {
                            // we calculate the rate between any couple of currencies by using the rates with EUR
                            let numRate = eurRatesList[tmpCurrName] / eurRatesList[currName];
                            tmpRatesList[tmpCurrName] = numRate/*.toFixed(4)*/;
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
                    callback(null, theFinalRates, rawXml);
                }
                resolve([theFinalRates, rawXml]);
            }
        });
    });

    return innerPromise;
}

/**
 * function getLatestRatesFromDB
 * @param {*} callback (err, rates) where rates can be null if no record exists
 *                     callback can be null
 */
function getLatestRatesFromDB(callback = null) {
    Rates.findOne({})
        .sort({'createdOn': 'desc'})
        .exec((err, rates) => {
            if(err) {
                if(callback != null) {
                    return callback(err, null);
                }
            }
            else {
                if(callback != null) {
                    return callback(null, rates);
                }
            }
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
    newRates.rawdata = rawXml;
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
                
                // update cache
                latestRatesCache.splice(0, latestRatesCache.length);
                latestRatesCache.push(newRates);

                resolve(newRates);
            }
        });
    });

    return innerPromise;
}
