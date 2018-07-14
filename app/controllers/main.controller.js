const stdResponse = require('../utilities').stdResponse;

module.exports = {
    getRecurrencyAPIDescription: getRecurrencyAPIDescription
};


function getRecurrencyAPIDescription(req, res) {
    let str = "Hello I am Danilo Carrabino! Welcome to my Currency Exchange Rates API :)";
    return stdResponse(null, str, req, res);
}
