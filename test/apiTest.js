const port = process.env.PORT || 8080

const xml2js = require('xml2js');   // require xml2js

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;

chai.use(chaiHttp);

//Our parent block
describe('Recurrency API', () => {
    it('latest base EUR -> json', (done) => {
        chai.request('http://localhost:' + port)
            .get('/latest')
            .query({base: 'eur'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                res.body.data.should.be.an('object');
                done();
            });
    });

    it('latest base USD -> xml', (done) => {
        chai.request('http://localhost:' + port)
            .get('/latest')
            .query({base: 'usd', format: 'xml'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                xml2js.parseString(res.text, (error, result) => {
                    if(error) {
                        done(error);
                    }
                    else {
                        assert.isObject(result);
                        done();
                    }
                });
            });
    });

    it('currencies -> json', (done) => {
        chai.request('http://localhost:' + port)
            .get('/currencies')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                res.body.data.should.be.an('array');
                done();
            });
    });

    it('currencies -> xml', (done) => {
        chai.request('http://localhost:' + port)
            .get('/currencies')
            .query({format: 'xml'})
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                xml2js.parseString(res.text, (error, result) => {
                    if(error) {
                        done(error);
                    }
                    else {
                        assert.isObject(result);
                        done();
                    }
                });
            });
    });
});
