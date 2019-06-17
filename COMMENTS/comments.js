let circuitEngine = require('circuits-engine');
let apiHelper = require('circuits-engine-api-helper');
const feature = {
    resource : 'circuit_engine:/circuits/*/comments',
    action: 'POST'
};

exports.handler = async (event, context, callback) => {

    try {
        const comment = JSON.parse(event.body)
        const security = apiHelper.getSecurity(feature, event);
        const data = await circuitEngine.updateCircuitComments(event.pathParameters.circuitId, comment.comment, security);
        return apiHelper.okResponse(data, event, '/circuits/' + data.circuitId);
    } catch (err){
       return apiHelper.errorResponse(err);
    }
};

