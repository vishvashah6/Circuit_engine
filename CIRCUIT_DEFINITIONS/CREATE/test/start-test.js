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
    it('it should create the circuit instance as the payload is valid', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event.json')).toString());
        const validResponse = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/valid_response.json')).toString());

        mock('circuits-engine', {
            createCircuit: function() {
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
                expect(data.statusCode).to.equals(201);
                expect(response.executionArn).to.not.equals(null);
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stopAll();
            }
        });


    });

    it('it should not create the circuit instance as the payload is invalid', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_invalid.json')).toString());

        mock('circuits-engine', {
            createCircuit: function() {
                return new Promise((resolve, reject) => {
                    reject({
                        "ok": [],
                        "errors": {
                            "ERR_CODE": "PAYLOAD_VALIDATION_ERROR",
                            "ERR_TYPE": "VALIDATION",
                            "ERR_DETAIL": {
                                "datos_de_comercio": [
                                    {
                                        "keyword": "required",
                                        "dataPath": "",
                                        "schemaPath": "#/properties/documents/select",
                                        "params": {
                                            "missingProperty": ".D4"
                                        },
                                        "message": "should have required property '.D4'"
                                    }
                                ]
                            }
                        },
                        "requestCompleted": false
                    });
                });
            }
        });

        const lambda = mock.reRequire('../start');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(400);
                expect(response._items[0]._issues.issues.datos_de_comercio[0].message).to.equals('should have required property \'.D4\'');
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stop('circuits-engine');
            }
        });


    });

    it('it should not create the circuit instance as the payload schema is invalid and a single error is returned', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_invalid.json')).toString());

        mock('circuits-engine', {
            createCircuit: function() {
                return new Promise((resolve, reject) => {
                    reject({
                        "ERR_CODE": "CIRCUIT_DEFINITION_PAYLOAD_SCHEMA_IS_INVALID",
                        "ERR_TYPE": "CONFIG"
                    });
                });
            }
        });

        const lambda = mock.reRequire('../start');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(400);
                expect(response._items[0]._issues.code).to.equals('CIRCUIT_DEFINITION_PAYLOAD_SCHEMA_IS_INVALID');
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stop('circuits-engine');
            }
        });


    });

    it('it should not create the circuit instance as the payload is invalid and a server error is returned', function (done) {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_invalid.json')).toString());

        mock('circuits-engine', {
            createCircuit: function() {
                return new Promise((resolve, reject) => {
                    reject({
                        "ERR_CODE": "COULD_NOT_SAVE_CIRCUIT",
                        "ERR_TYPE": "SERVER"
                    });
                });
            }
        });

        const lambda = mock.reRequire('../start');
        let handler = lambda.handler;

        handler(event, event, (err, data) => {
            try {
                const response = JSON.parse(data.body);
                expect(data.statusCode).to.equals(500);
                expect(response._items[0]._issues.code).to.equals('COULD_NOT_SAVE_CIRCUIT');
                done();
            } catch (err) {
                done(err);
            } finally {
                mock.stop('circuits-engine');
            }
        });


    });
});