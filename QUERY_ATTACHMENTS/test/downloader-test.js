require('dotenv').config();
let fs = require('fs');
let path = require('path');
const chai = require('chai');
const expect = chai.expect;
let mock = require('mock-require');

let AWS = require('aws-sdk-mock');
let AWS_SDK = require('aws-sdk');
AWS.setSDKInstance(AWS_SDK);

describe('Files uploader', (done) => {

    it('it should return a png image ', async function () {
        process.env.FILES_BUCKET = 'asd';
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_ok_png.json')).toString());
        const s3Response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/response_ok.json')).toString());
        const lambda = require('../downloader');

        AWS.mock('S3', 'getObject', function (params, callback) {
            callback(null, s3Response);
        });

        return await lambda.handler(event, event, (error, res1) => {
            try {
                let data = JSON.parse(res1.body);
                expect(res1.statusCode).to.equal(200);
                expect(res1.headers['content-type']).to.equals('image/png');
            } catch (e) {
                expect.fail()
            }
        });
    });

    it('it should fail due to a non existing file', async function () {
        process.env.FILES_BUCKET = 'asd';
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_ok_png.json')).toString());
        const s3Response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/response_err.json')).toString());
        const lambda = require('../downloader');

        AWS.mock('S3', 'getObject', function (params, callback) {
            callback(null, s3Response);
        });

        return await lambda.handler(event, event, (error, res1) => {
            try {
                let data = JSON.parse(res1.body);
                expect(res1.statusCode).to.equal(500);
                expect(res1.headers['Access-Control-Allow-Origin']).to.equals('*');
            } catch (e) {
                expect.fail()
            }
        });

    });

});