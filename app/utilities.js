const request = require('request');  // require request
const uniqid = require('uniqid'); // require uniqueid

module.exports = {
    stdResponse: stdResponse,
    getDateOfToday: getDateOfToday,
    getYearMonthDayFromDateObject: getYearMonthDayFromDateObject,
    dateComparedWithToday: dateComparedWithToday,
    getEuroFxRef: getEuroFxRef
};


/**
 * function stdResponse
 * @param {*} err 
 * @param {*} data 
 * @param {*} req 
 * @param {*} res 
 */
function stdResponse(err, data, req, res) {
    if(req.query.callback) {
        res.jsonp({
            'err': err,
            'data': data
        });
    }
    else {
        res.json({
            'err': err,
            'data': data
        });
    }
}


/**
 * function getYearMonthDayFromDateObject
 * 
 * @param {*} dateObj must be a Date object. The default is the date of today
 * 
 * returns null if dateObj is not an instance of Date, or a string with this format: yyyy-mm-dd
 */
function getYearMonthDayFromDateObject(dateObj = new Date()) {
    if(dateObj instanceof Date) {
        var dd = dateObj.getDate();
        var mm = dateObj.getMonth() + 1; //January is 0!
        var yyyy = dateObj.getFullYear();

        if(dd < 10) {
            dd = '0' + dd;
        } 
        if(mm < 10) {
            mm = '0' + mm;
        }

        return( yyyy + '-' + mm + '-' + dd );
    }
    else {
        return null;
    }
}


/**
 * Date of today in format: yyyy-mm-dd
 */
function getDateOfToday() {
    return getYearMonthDayFromDateObject();
}

/**
 * function dateComparedWithToday
 * 
 * @param {*} dateStr a string with format yyyy-mm-dd
 * 
 * return  0: if dateStr is today
 *        -1: if dateStr is in the past
 *         1: if dateStr is in the future
 */
function dateComparedWithToday(dateStr) {
    let dateStrToday = getDateOfToday();

    if(dateStr == dateStrToday) {
        return 0;
    }
    else if(dateStr < dateStrToday) {
        return -1;
    }
    else {
        return 1;
    }
}


/**
 * function getEuroFxRef
 * 
 * Get XML data from the European Central Bank
 * @param {*} callback(err, data): if err is not null then data will contain the xml of the currency echange rates
 *                                 the callback can be null
 * 
 * It returns a promise
 */
function getEuroFxRef(callback = null) {
    var innerPromise = new Promise((resolve, reject) => {
        let uri = 'http://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml?' + uniqid();

        let r = request.defaults({
            'strictSSL': false
        });
        r.get(uri, (err, res, body) => {
            if(err) {
                if(callback != null) {
                    callback(err, null);
                }
                reject(err);
            }
            else {
                if(callback != null) {
                    callback(null, body);
                }
                resolve(body);
            }
        });
    });

    return innerPromise;
}
