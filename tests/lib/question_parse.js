'use strict';

const chai = require('chai');
const sinon = require('sinon');

const should = chai.should();
const expect = chai.expect;

const question_parse = require('../../lib/question_parse');

describe("Question Parser", (done) => {
  it('should return a function', (done) => {
    let test_filter = question_parse.getFilter();

    expect(test_filter).to.be.an.instanceof(Function);
    done();
  });
  it('should convert a buffer to utf8', (done) => {
    let test_filter = question_parse.getFilter();

    let test_array = [];
    test_filter.call(test_array,new Buffer.from("A. "),'utf8',() => {
      console.log(test_array);
      done();
    });
  });
});
