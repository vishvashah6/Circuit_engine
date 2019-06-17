require('dotenv').config();
let chai = require('chai');
const expect = chai.expect; // we are using the 'expect' style of Chai
const env = Object.assign({}, process.env);
let mock = require('mock-require');
let AWS = require('aws-sdk');

let fs = require('fs');
let path = require('path');
const prefix = process.env.ENV;

after(function () {
    process.env = env;
});

before(function (done) {
    this.timeout(10000);
    done();
});

describe('Circuit Detail Tests', function (done) {
    it('it should return proper circuit search by Circuit Id', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_circuit_detail_ok.json')).toString());
        const validResponse = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/response.json')).toString());

        mock('circuits-engine', {
            getCircuitDetail: function() {
                return new Promise((resolve, reject) => {
                    resolve(validResponse);
                });
            }
        });
        const lambda = require('../detail');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            mock.stopAll();
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(200);
                expect(response.circuit_id).to.equals("00fff763-0bd0-4ad7-b2de-b91f4afa8474");
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stopAll();
            }
        });
    });

    it('it should not return due to permissions error', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_circuit_detail_no_credentials.json')).toString());
        const validResponse = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/response.json')).toString());


        const lambda = require('../detail');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            mock.stopAll();
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(401);
                expect(response._error).to.equals("USER_IS_NOT_AUTHORIZED_TO_ACCESS_THIS_RESOURCE");
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stopAll();
            }
        });

    });

    it('it should throw error as circuit not found', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_circuit_detail_ok.json')).toString());

        mock('circuits-engine', {
            getCircuitDetail: function() {
                return new Promise((resolve, reject) => {
                    reject({
                        'ERR_CODE': 'CIRCUIT_NOT_FOUND',
                        'ERR_TYPE': 'TARGET_OBJECT_NOT_FOUND'
                    });
                });
            }
        });

        const lambda = mock.reRequire('../detail');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(404);
                expect(response._items[0]._issues.code).to.equals('CIRCUIT_NOT_FOUND');
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stop('circuits-engine');
                mock.stopAll();
            }
        });


    });

    it('it should not fetch data as Circuit_id is missing', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_circuit_detail_ok.json')).toString());

        mock('circuits-engine', {
            getCircuitDetail: function() {
                return new Promise((resolve, reject) => {
                    reject({
                        'ERR_CODE': 'CIRCUIT_ID_NOT_FOUND',
                        'ERR_TYPE': 'TARGET_OBJECT_NOT_FOUND'
                    });
                });
            }
        });

        const lambda = mock.reRequire('../detail');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(404);
                expect(response._items[0]._issues.code).to.equals('CIRCUIT_ID_NOT_FOUND');
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stop('circuits-engine');
            }
        });


    });
});

describe('Securiy Detail Tests', function (done) {
    it('it should return proper circuit search by Circuit Id filtering accordig to security', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_circuit_detail_ok.json')).toString());
        const validResponse = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/response.json')).toString());

        mock.stopAll();
        mock('circuits-engine', {
            getCircuitDetail: (circuitId, security) => {
                return new Promise((resolve, reject) => {
                    resolve(validResponse);
                });
            }
        });

        const lambda = mock.reRequire('../detail');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            mock.stopAll();
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(200);
                expect(response.circuit_id).to.equals("00fff763-0bd0-4ad7-b2de-b91f4afa8474");
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stopAll();
            }
        });

    });
});
