// load mongoose
var mongoose = require('mongoose');

// The Rates schema
var ratesSchema = new mongoose.Schema({
    createdOn: {
        type: Date,
        default: Date.now,
        index: true
    },
    rawdata: {
        type: String,
        default: ''
    },
    ratesMap: {
        type: String,
        default: ''
    }
});

// add index
ratesSchema.index({ createdOn: 1}, {unique: true});

// create the model for rates and expose it to our app
module.exports = mongoose.model('Rates', ratesSchema);
