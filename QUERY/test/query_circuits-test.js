require('dotenv').config();
let fs = require('fs');
let path = require('path');
const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');


const queryStringToJSON = function queryStringToJSON(queryString) {
    if(queryString.indexOf('?') > -1){
        queryString = queryString.split('?')[1];
    }
    var pairs = queryString.split('&');
    var result = {};
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
    });
    return result;
}

const cc = function isEquivalent(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}

describe('Circuits Query', function (done) {

    it('it should return all circuits matching a single filter', function (done) {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_response.json')).toString());
        const queryParams = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter.json'))).queryStringParameters;

        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryCircuits: async (query, range, projection, sort, page, pageSize, security) => {
                    return response;
                }
            }
        });

        const handler = lambda.handler;
        handler(event, event, (error, res1) => {
            try {
                let data = JSON.parse(res1.body).data;
                expect(data._items.length).to.equals(1);
                let hateoasLinkQueryParam = JSON.stringify(queryStringToJSON(data._links.self.href.split('?')[1]))
                let queryParamsString = JSON.stringify(queryParams);
                expect(hateoasLinkQueryParam).to.equal(queryParamsString);
                for (let i in data._items) {
                    expect(['user1', 'user2', 'user3'].indexOf(data._items[i].createdByUser)).to.greaterThan(-1);
                }
                done()
            }catch (e) {
                done(e);
            }

        });
    });

    it('it should return all circuits matching a single filter and full text search', function (done) {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_and_text_search.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_response.json')).toString());
        const queryParams = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter.json'))).queryStringParameters;

        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryCircuits: async (query, range, projection, sort, page, pageSize, security) => {
                    return response;
                }
            }
        });

        const handler = lambda.handler;
        handler(event, event, (error, res1) => {
            try {
                let data = JSON.parse(res1.body).data;
                expect(data._items.length).to.equals(1);
                let hateoasLinkQueryParam = JSON.stringify(queryStringToJSON(data._links.self.href.split('?')[1]));
                expect(hateoasLinkQueryParam.indexOf('text_search')).to.greaterThan(-1);
                for (let i in data._items) {
                    expect(['user1', 'user2', 'user3'].indexOf(data._items[i].createdByUser)).to.greaterThan(-1);
                }
                done()
            }catch (e) {
                done(e);
            }

        });
    });



    it('it should fail due to security not present', function (done) {
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_bad_credentials.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_response.json')).toString());

        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryTasks: async (query, range, projection, sort, page, pageSize, security) => {
                    return response;
                }
            }
        });

        const handler = lambda.handler;
        try {
            handler(event, event, (error, res1) => {
                let data = JSON.parse(res1.body);
                expect(res1.statusCode).to.equals(401);
                expect(data._items[0]._issues.code).to.equal('USER_IS_NOT_AUTHORIZED_TO_ACCESS_THIS_RESOURCE');
                done()
            });
        } catch (err) {
            done(err);
        }
    });

    it('it should return all circuits matching a single filter with defined projection', function (done) {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_and_valid_projection.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_and_valid_projection_response.json')).toString());

        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryCircuits: async (query, range, projection, sort, page, pageSize, security) => {
                    return response;
                }
            }
        });

        const handler = lambda.handler;
        handler(event, event, (error, res) => {
            try {
                let data= JSON.parse(res.body).data;
                //the asserts checks that the result returns the 20 created tasks
                expect(data._items.length).to.equals(1);
                // just in case we check each task to match its statu
                for (let i in data._items) {
                    expect(data._items[i]).to.have.property('createdByUser');
                    expect(data._items[i]).to.have.property('createdAt');
                    expect(data._items[i]).to.not.have.property('circuitId');
                }
                done()
            } catch (e) {
                done(e);
            }
        });
    });

    it('it should return the amount of circuits set in the max_results param ', function (done) {
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_and_limit.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_response_5.json')).toString());

        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryCircuits: async (query, range, projection, sort, page, pageSize, security) => {
                    return response;
                }
            }
        });

        const handler = lambda.handler;
        handler(event, event, (error, res) => {

            try {
                let data = JSON.parse(res.body).data;
                expect(data._items.length).to.equal(5);
                // just in case we check each task to match its statu
                for (let i in data._items) {
                    expect(data._items[i]).to.have.property('createdByUser');
                    expect(data._items[i]).to.have.property('createdAt');
                }
                done();
            } catch (e) {
                done(e);
            }
        });
    });

    it('it should return the amount of circuits set in the max_results params and paginate ', function (done) {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_limit_and_pagination.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_response_10.json')).toString());

        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryCircuits: async (query, range, projection, sort, page, pageSize, security) => {
                    return response.slice(0, pageSize)
                }
            }
        });
        const handler = lambda.handler;

        handler(event, event, (error, res) => {
            try {
                let data = JSON.parse(res.body).data;
                expect(data._items.length).to.equal(5);
                // just in case we check each task to match its statu
                for (let i in data._items) {
                    expect(data._items[i]).to.have.property('currentStatus');
                    expect(data._items[i]).to.have.property('createdAt');
                }
                done()
            }catch (err) {
                done(err);
            }
        });
    });

    it('it should filter by range and sort by createdAt date', function (done) {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_and_range.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_response_10.json')).toString());

        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryCircuits: async (query, range, projection, sort, page, pageSize, security) => {
                    return response.slice(0, pageSize)
                }
            }
        });
        const handler = lambda.handler;

        handler(event, event, (error, res) => {
            try {
                let data = JSON.parse(res.body).data;
                expect(data._items.length).to.equal(10);
                // just in case we check each task to match its statu
                for (let i in data._items) {
                    expect(data._items[i]).to.have.property('currentStatus');
                    expect(data._items[i]).to.have.property('createdAt');
                }
                done()
            }catch (err) {
                done(err);
            }
        });
    });

    it('it should fail due to an error in the call to the library ', function (done) {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_limit_and_pagination.json')).toString());

        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryCircuits: async (query, range, projection, sort, page, pageSize, security) => {
                    throw new Error();
                }
            }
        });
        const handler = lambda.handler;

        handler(event, event, (error, res) => {
            try {
                let data = JSON.parse(res.body);
                expect(res.statusCode).to.equal(500);
                done()
            }catch (err) {
                done(err);
            }
        });
    });

    it('it should fail due to an invalid parameter ', function (done) {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_and_invalid_parameter.json')).toString());
        let lambda = proxyquire('../query', {

        });
        const handler = lambda.handler;

        handler(event, event, (error, res) => {
            try {
                let data = JSON.parse(res.body);
                expect(res.statusCode).to.equal(500);
                expect(data._error).to.equals('UNIDENTIFIED_ERROR_IN_API');
                done()
            }catch (err) {
                done(err);
            }
        });
    });

    it('it should not return  a non whitelisted param in projection  ', function (done) {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_and_invalid_projection.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_response_10.json')).toString());


        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryCircuits: async (query, range, projection, sort, page, pageSize, security) => {
                    return response.slice(0, pageSize)
                }
            }
        });
        const handler = lambda.handler;

        handler(event, event, (error, res) => {
            try {
                let data = JSON.parse(res.body).data;
                expect(data._items.length).to.equal(10);
                // just in case we check each task to match its statu
                for (let i in data._items) {
                    expect(data._items[i]).to.have.property('currentStatus');
                    expect(data._items[i]).to.have.property('createdAt');
                    expect(data._items[i]).to.not.have.property('nonWhitelistedParam');
                }
                done()
            }catch (err) {
                done(err);
            }
        });
    });

    it('it should not filter a non whitelisted param in where  ', function (done) {
        this.timeout(5000);
        const event = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_and_invalid_where.json')).toString());
        const response = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/event_single_filter_response_10.json')).toString());


        let lambda = proxyquire('../query', {
            'circuits-engine': {
                queryCircuits: async (query, range, projection, sort, page, pageSize, security) => {
                    return response.slice(0, pageSize)
                }
            }
        });
        const handler = lambda.handler;

        handler(event, event, (error, res) => {
            try {
                let data = JSON.parse(res.body).data;
                expect(data._items.length).to.equal(10);
                // just in case we check each task to match its statu
                for (let i in data._items) {
                    expect(data._items[i]).to.have.property('currentStatus');
                    expect(data._items[i]).to.have.property('createdAt');
                    expect(data._items[i]).to.not.have.property('nonWhitelistedParam');

                }
                done()
            }catch (err) {
                done(err);
            }
        });
    });

});

