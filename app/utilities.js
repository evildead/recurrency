const request = require('request');  // require request
const uniqid = require('uniqid'); // require uniqueid

module.exports = {
    stdResponse: stdResponse,
    getDateOfToday: getDateOfToday,
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
 * Date of today in format: yyyy-mm-dd
 */
function getDateOfToday() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd < 10) {
        dd = '0' + dd;
    } 
    if(mm < 10) {
        mm = '0' + mm;
    }

    return( yyyy + '-' + mm + '-' + dd );
}


/**
 * function getEuroFxRef
 * 
 * Get XML data from the European Central Bank
 * @param {*} callback(err, data): if err is not null then data will contain the xml of the currency echange rates
 */
function getEuroFxRef(callback) {
    let uri = 'http://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml?' + uniqid();

    let r = request.defaults({
        'strictSSL': false
    });
    r.get(uri, (err, res, body) => {
        if(err) {
            return callback(err, null);
        }

        return callback(null, body);
    });
}
