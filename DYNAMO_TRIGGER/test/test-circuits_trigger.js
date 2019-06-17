require('dotenv').config();
let chai = require('chai');
const expect = chai.expect; // we are using the 'expect' style of Chai
const env = Object.assign({}, process.env);
let uuid = require('uuid');

let fs = require('fs');
let path = require('path');
const proxyquire = require('proxyquire');


before(function (done) {
    done();
});

describe('Payloads Tests', function (done) {
    it('it should create a circuit in elastic search', async () => {
        this.timeout(15000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/insert_event.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/insert_response.json')).toString());

        event.Records[0].dynamodb.NewImage.circuitId.S = uuid.v4();
        let lambda = proxyquire('../circuits_trigger', {
            'circuits-engine': {
                insertAnalytics: async (entity, element, elementId) => {
                    return response;
                }
            }
        });
        let handler = lambda.handler;

        const data = await handler(event, event);
        expect(data[0]._index).to.equals('circuits');
        expect(data[0].result).to.equals('created');
        return data
    });

    it('it should process multiple circuits in elastic search', async () => {
        this.timeout(5000);

        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/big_event.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/insert_response.json')).toString());
        const modifyResponse = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/modify_response.json')).toString());

        event.Records[0].dynamodb.NewImage.circuitId.S = uuid.v4();
        let lambda = proxyquire('../circuits_trigger', {
            'circuits-engine': {
                insertAnalytics: async (entity, element, elementId) => {
                    return response;
                },
                updateAnalytics: async (entity, element, elementId) => {
                    return modifyResponse;
                }
            }
        });

        let handler = lambda.handler;

        const data = await handler(event, event);

        expect(data.length).to.equals(2);
    });

    it('it should update a circuit in elastic search', async () => {
        this.timeout(5000);

        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/insert_event.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/insert_response.json')).toString());
        const modifyResponse = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/modify_response.json')).toString());
        const updateEvent = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/modify_event.json')).toString());
        const circuitId = uuid.v4();
        event.Records[0].dynamodb.NewImage.circuitId.S = circuitId;
        updateEvent.Records[0].dynamodb.NewImage.circuitId.S = circuitId;

        let lambda = proxyquire('../circuits_trigger', {
            'circuits-engine': {
                insertAnalytics: async (entity, elementIdKey, inserts) => {
                        return response;
                },
                updateAnalytics: async (entity, elements, elementId) => {
                    return modifyResponse;
                }
            }
        });
        let handler = lambda.handler;

        const data = await handler(updateEvent, event);

        expect(data[0]._index).to.equals('circuits');
        let handler1 = lambda.handler;
        const data1 = await handler1(updateEvent, event)
        expect(data1[0]._index).to.equals('circuits');
        expect(data1[0].result).to.equals('updated');
    });

    it('it should fail due to an unmarshaling error', async () => {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/insert_event_invalid.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/insert_response.json')).toString());

        event.Records[0].dynamodb.NewImage.circuitId.S = uuid.v4();
        let lambda = proxyquire('../circuits_trigger', {
            'circuits-engine': {
                insertAnalytics: async (entity, element, elementId) => {
                    return response;
                }
            },
            'aws-sdk' : {
                'DynamoDB': {
                    'Converter': {
                        unmarshall: (element) =>{
                            throw  new Error();
                        }
                    }
                }
            }
        });

        let handler = lambda.handler;

        const data = await handler(event, event);

        expect(data.length).to.equals(0);
    });

    it('it should fail due to an error while performing operations on elasticsearch', async () => {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/insert_event_invalid.json')).toString());

        event.Records[0].dynamodb.NewImage.circuitId.S = uuid.v4();
        let lambda = proxyquire('../circuits_trigger', {
            'circuits-engine': {
                insertAnalytics: async (entity, element, elementId) => {
                    throw new Error({
                        'ERR_CODE': 'UNKNOWN_ERROR_WHILE_CALLING_ELASTICSEARCH',
                        'ERR_TYPE': 'SERVER',
                        'ERR_MESSAGE': ''
                    })
                }
            }
        });

        let handler = lambda.handler;
        try {
            const data = await handler(event, event);
        } catch (err){
            expect(err).to.not.equals(null);
        }

    });

    it('it should fail due to a conflict in elasticsearch', async () => {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/insert_event.json')).toString());

        event.Records[0].dynamodb.NewImage.circuitId.S = uuid.v4();
        let lambda = proxyquire('../circuits_trigger', {
            'circuits-engine': {
                insertAnalytics: async (entity, element, elementId) => {
                    throw new Error({'detail':{
                        'ERR_CODE': 'CONFLICT_ERROR_WHILE_CALLING_ELASTICSEARCH',
                        'ERR_TYPE': 'VALIDATION',
                        'ERR_MESSAGE': {}
                    }})
                }
            }
        });

        let handler = lambda.handler;

        const resp = await handler(event, event)
        expect(resp.length).to.equals(0);

    });
});