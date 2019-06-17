require('dotenv').config();
let fs = require('fs');
let path = require('path');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
let mock = require('mock-require');

describe('Circuits Comments tests', (done) => {

    it('it should return the circuit commented', async () => {
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_circuit_ok.json')).toString());
        const sampleCircuit = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/sample_circuit.json')).toString());
        const security = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/security.json')).toString());

        const circuitId = event.pathParameters.circuitId;
        mock('circuits-engine', {
            updateCircuitComments: async (circuitId, comment, security) => {
                sampleCircuit.comments = {
                    'comment': comment,
                    'createdAt': new Date().getTime(),
                    'createdByUser': security.user
                };
                return sampleCircuit;
            }
        });
        const lambda = require('../comments');
        try {
            const res1 = await lambda.handler(event, event);
            let data = JSON.parse(res1.body);
            expect(res1.statusCode).to.equal(200);
            expect(data.comments.comment).to.equals('Hello');
            expect(data.comments.createdByUser).to.equals(security.user);
        } catch (e) {
            expect(true).to.equal(false);
        }
    });

    it('it should fail due to an unidentified error', async function () {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_circuit_ok.json')).toString());

        mock('circuits-engine', {
            updateCircuitComments: async (circuitId) => {
                throw new Error();
            }
        });
        const lambda = mock.reRequire('../comments');

        const lambdaHandler = await lambda.handler(event, event, (error, res1) => {
            try {
                let data = JSON.parse(res1.body);
                expect(res1.statusCode).to.equal(500);
                expect(data._error).to.equal('UNKOWN_ERROR');
            }
            catch (err) {
                expect.fail();
            } finally {
                return;
            }
        });

        return lambdaHandler;

    });

});