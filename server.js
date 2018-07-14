// load environment variables
require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 8080
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// use cors for Cross-Origin Resource Sharing
app.use(cors());

// use bodyParser to grab info from a json
app.use(bodyParser.json({limit: '50mb'}));
// use bodyParser to grab info from a form
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// connect to the database
//mongoose.connect(process.env.DB_URI);

app.use(require('./app/routes'));

app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`);
});
