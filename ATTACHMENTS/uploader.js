let multipart = require('aws-lambda-multipart-parser');
const fileType = require('file-type');
let circuitEngine = require('circuits-engine');
let responseHelper = require('circuits-engine-api-helper');
let uuid = require('uuid');
exports.handler = async (event, context, callback) => {
    try {
        console.log("Activity Start");
        const circuit_id = event.pathParameters.circuitId;
        const multiparsedata = multipart.parse(event, false);

        const byteArr = multiparsedata[Object.keys(multiparsedata)[0]].content;
        const eventFilename = uuid.v4();
        const filesData = fileType(byteArr);
        const result = await circuitEngine.uploadFile(circuit_id, eventFilename, filesData.ext, filesData.mime, byteArr);
        console.log("File Stored Successfully");

        const circuit = await circuitEngine.getCircuitDetail(circuit_id);
        const attachments = circuit.attachments || {};
        attachments[eventFilename] = result.files[0];
        circuit.attachments = attachments;
        const filename = eventFilename + '.' + filesData.ext;
        let filePath = {};
        filePath[eventFilename] = attachments[eventFilename];

        //temporarily store the file in the circuit
        circuit.filename = filename;
        const data = await circuitEngine.updateCircuitAttachments(circuit_id, circuit, 'test_tenant', 'test_user', 'test_role', filename);
        console.log("Circuit updated successfully");

        let okResponse = responseHelper.okResponse(filePath, event, '/circuits/' + data.circuitId + '/attachments/' + filename);

        return callback(null, okResponse);
    } catch (err) {
        let errorResponse1 = responseHelper.errorResponse(err);
        console.log("Error uploading: " + errorResponse1);
        return callback(null, errorResponse1);
    }
};

