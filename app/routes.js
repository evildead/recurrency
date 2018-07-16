const express = require('express');
const router = express.Router();
const ratesController = require('./controllers/rates.controller');
const mainController = require('./controllers/main.controller');

// export router
module.exports = router;

router.get('/', mainController.getRecurrencyAPIDescription);

router.get('/latest', ratesController.getLatestRates);

router.get('/currencies', ratesController.getAvailableCurrencies);
