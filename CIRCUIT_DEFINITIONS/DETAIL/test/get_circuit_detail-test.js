require('dotenv').config();
const lambda = require('../detail');
let fs = require('fs');
let path = require('path');
const prefix = process.env.ENV;
const chai = require('chai');
const expect = chai.expect; // we are using the 'expect' style of Chai
let AWS = require('aws-sdk');

let circuits = [];
let circuitKeys = [];

before(function () {
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_DEFAULT_REGION
    });
});


const createCircuitDefinition = () => {
    const promise = new Promise((resolve, reject) => {
        let documentClient = new AWS.DynamoDB.DocumentClient();
        const circuitDefinition = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/sample_circuit_definition.json')).toString());

        documentClient.put({
            TableName: prefix + 'CircuitsDefinitions',
            Item: circuitDefinition,
            ReturnValues: 'ALL_OLD'

        }, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            } else {
                resolve(circuitDefinition);
            }
        });
    });
    return promise;
};


describe('Circuits Definitions Details', function (done) {
    it('it should return a an existing circuit search by circuit Id', function (done) {
        this.timeout(60000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_valid_circuit_Id.json')).toString());
        createCircuitDefinition().then((circuitDefinition) => {
            const handler = lambda.handler;
            handler(event, event, (error, res1) => {
                let data = JSON.parse(res1.body).data;
                console.log(data);
                expect(data.circuitDefinitionId).to.equal('circuitId-123');
                done()
            });
        });
    });

    it('it should not return a non existing circuit', function (done) {
        this.timeout(60000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_invalid_circuit.json')).toString());
        createCircuitDefinition().then((circuitDefinition) => {
            const handler = lambda.handler;
            handler(event, event, (error,res1) => {
                let err = JSON.parse(res1.body);
                expect(res1.statusCode).to.equal(404);
                expect(err.ERR_CODE).to.equal('RESOURCE_NOT_FOUND');
                done()
            });
        });
    });

    it('it should not return circuit if queryString not provided', function (done) {
        this.timeout(60000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_without_circuit_data.json')).toString());
        createCircuitDefinition().then((circuitDefinition) => {
            const handler = lambda.handler;
            handler(event, event, (error,res1) => {
                let err = JSON.parse(res1.body);
                expect(res1.statusCode).to.equal(400);
                expect(err.ERR_CODE).to.equal('CIRCUIT_DEFINITION_IS_MISSING');
                done()
            });
        });
    });

});

