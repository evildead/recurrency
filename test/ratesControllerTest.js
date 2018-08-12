// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

const fs = require('fs');
const fsExtra = require('fs-extra');

//Require the dev-dependencies
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;

const fromRawXmlToJsonRates = require('../app/controllers/rates.controller').fromRawXmlToJsonRates;

//Our parent block
describe('Rates Controller', () => {
    it('fromRawXmlToJsonRates should parse xml in a proper way', (done) => {
        let testXml = `<?xml version="1.0" encoding="UTF-8"?>
            <gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
                <gesmes:subject>Reference rates</gesmes:subject>
                <gesmes:Sender>
                    <gesmes:name>European Central Bank</gesmes:name>
                </gesmes:Sender>
                <Cube>
                    <Cube time='2018-08-03'>
                        <Cube currency='USD' rate='1.1588'/>
                        <Cube currency='JPY' rate='129.30'/>
                        <Cube currency='BGN' rate='1.9558'/>
                        <Cube currency='CZK' rate='25.657'/>
                        <Cube currency='DKK' rate='7.4526'/>
                        <Cube currency='GBP' rate='0.89050'/>
                        <Cube currency='HUF' rate='320.75'/>
                        <Cube currency='PLN' rate='4.2612'/>
                        <Cube currency='RON' rate='4.6202'/>
                        <Cube currency='SEK' rate='10.3193'/>
                        <Cube currency='CHF' rate='1.1528'/>
                        <Cube currency='ISK' rate='123.60'/>
                        <Cube currency='NOK' rate='9.5410'/>
                        <Cube currency='HRK' rate='7.4068'/>
                        <Cube currency='RUB' rate='73.3448'/>
                        <Cube currency='TRY' rate='5.8958'/>
                        <Cube currency='AUD' rate='1.5689'/>
                        <Cube currency='BRL' rate='4.3394'/>
                        <Cube currency='CAD' rate='1.5085'/>
                        <Cube currency='CNY' rate='7.9195'/>
                        <Cube currency='HKD' rate='9.0955'/>
                        <Cube currency='IDR' rate='16760.07'/>
                        <Cube currency='ILS' rate='4.2798'/>
                        <Cube currency='INR' rate='79.5120'/>
                        <Cube currency='KRW' rate='1303.12'/>
                        <Cube currency='MXN' rate='21.6300'/>
                        <Cube currency='MYR' rate='4.7164'/>
                        <Cube currency='NZD' rate='1.7170'/>
                        <Cube currency='PHP' rate='61.503'/>
                        <Cube currency='SGD' rate='1.5838'/>
                        <Cube currency='THB' rate='38.547'/>
                        <Cube currency='ZAR' rate='15.4869'/>
                    </Cube>
                </Cube>
            </gesmes:Envelope>`;
        
        fromRawXmlToJsonRates(testXml)  // parse xml and generate rates
            .then(([jsonRates, rawXml]) => {
                assert.isObject(jsonRates);
                fsExtra.ensureDirSync('./logs');
                fs.writeFileSync('./logs/jsonRates_' + Date.now() + '.txt', JSON.stringify(jsonRates, null, 2));
                assert.isString(rawXml);
                done();
            })
            .catch((err) => {
                done(err);
            });
    });
});
