const expect = require('chai').expect;
const LambdaTester = require('lambda-tester');
const lambda = require('../.webpack/create.js').handler;
const mlog = require('mocha-logger');


describe('Name should be Eric', () => {
    it('test callback( null, result )',() => {
        return LambdaTester(lambda)
            .event({ name: 'Eric' })
            .expectResult((result) => {
                expect(result.valid).to.be.true;
            });
    });
})
