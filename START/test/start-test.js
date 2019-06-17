require('dotenv').config();
let chai = require('chai');
const expect = chai.expect; // we are using the 'expect' style of Chai
const env = Object.assign({}, process.env);
let mock = require('mock-require');

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

describe('Payloads Tests', function (done) {
    it('it should launch a circuit as the payload is valid', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event.json')).toString());
        const validResponse = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/valid_response.json')).toString());

        mock('circuits-engine', {
            launchCircuit: function() {
                return new Promise((resolve, reject) => {
                    resolve(validResponse);
                });
            }
        });

        const lambda = require('../start');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            mock.stopAll();
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(200);
                expect(response.executionArn).to.not.equals(null);
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stopAll();
            }
        });


    });

    it('it should not update the circuit instance as the circuitId does not exists', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event.json')).toString());

        mock('circuits-engine', {
            launchCircuit: function() {
                return new Promise((resolve, reject) => {
                    reject({
                        "ERR_CODE": "CIRCUIT_NOT_FOUND",
                        "ERR_TYPE": "TARGET_OBJECT_NOT_FOUND"
                    });
                });
            }
        });

        const lambda = mock.reRequire('../start');
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
            }
        });


    });

   it('it should not create the circuit instance as the payload is invalid and a single error is returned', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event.json')).toString());

        mock('circuits-engine', {
            launchCircuit: function() {
                return new Promise((resolve, reject) => {
                    reject({'ERR_CODE': 'COULD_NOT_UPDATE_CIRCUIT_AS_REQUEST_IS_NOT_COMPLETE', 'ERR_TYPE': 'VALIDATION'});
                });
            }
        });

        const lambda = mock.reRequire('../start');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(400);
                expect(response._items[0]._issues.code).to.equals('COULD_NOT_UPDATE_CIRCUIT_AS_REQUEST_IS_NOT_COMPLETE');
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stop('circuits-engine');
            }
        });


    });

});