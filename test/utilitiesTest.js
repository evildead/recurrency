const xml2js = require('xml2js');   // require xml2js

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;

chai.use(chaiHttp);

const getEuroFxRef = require('../app/utilities').getEuroFxRef;

//Our parent block
describe('Utilities', () => {
    it('getEuroFxRef should return a valid xml object', (done) => {
        getEuroFxRef()  // download xml from European Central Bank
            .then((rawXml) => {
                xml2js.parseString(rawXml, function (err, result) {
                    if(err) {
                        done(err);
                    }
                    else {
                        assert.isObject(result);
                        done();
                    }
                });
            })
            .catch((err) => {
                done(err);
            });
    });
});
