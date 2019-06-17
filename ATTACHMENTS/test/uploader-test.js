require('dotenv').config();
let fs = require('fs');
let path = require('path');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
let AWS = require('aws-sdk');
let mock = require('mock-require');

const S3ConnectionError = require('../../../../libs/circuits-engine/files-management/storage_client').S3ConnectionError;
describe('Files uploader', (done) => {

    it('it should return a link to an image uploaded by the user ', async function () {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_ok(multiparsepng).json')).toString());
        const sampleCircuit = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/sample_circuit.json')).toString());
        const circuitId = event.pathParameters.circuitId;
        mock('circuits-engine', {
            uploadFile: async () => {
                return {
                    'files': [
                        'https://s3.amazonaws.com/12312312-123123123/diskette.png'
                    ]
                }
            },
            getCircuitDetail: async (circuitId) => {
                return sampleCircuit
            },
            updateCircuitAttachments: async () => {
                return sampleCircuit
            }
        });


        const lambda = require('../uploader');

        return await lambda.handler(event, event, (error, res1) => {
            try {
                let data = JSON.parse(res1.body);
                expect(res1.statusCode).to.equal(200);
                expect(data._links.self.href).to.contains("/circuit_engine/circuits/" + circuitId + '/attachments');
            } catch (e) {
                expect(true).to.equal(false);
            }
        });
    });

    it('it should fail due to a networking error ', async function () {
        this.timeout(10000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_ok(multiparsepng).json')).toString());

        mock('circuits-engine', {
            uploadFile: async () => {
                throw new S3ConnectionError({
                    'ERR_CODE': 'UNABLE_TO_CONNECT_TO_S3',
                    'ERR_TYPE': 'NETWORKING',
                    'ERR_MESSAGE': '',
                    'ERR_SUGGESTIONS': ['Check S3 status at https://status.aws.amazon.com/']
                })
            }
        });
        const lambda = mock.reRequire('../uploader');

        return await lambda.handler(event, event, (error, res1) => {
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

    });

});