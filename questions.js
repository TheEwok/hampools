'use strict';

const path = require('path');
const fs = require('fs');
const split = require('split');
const through = require('through2');

const EXTRA_POOL = path.join(__dirname,'resources','Extra_Class_Pool.txt');
const in_file = fs.createReadStream(EXTRA_POOL, 'utf8');

let in_question = false;
let pool = "";
let question_num = /E[0-9]{1}[A-H]{1}[0-9]{2}/g
let start = true;


function filter(chunk_raw, enc, done) {
  let chunk = chunk_raw.toString('utf8');

  if(in_question) {
    if(chunk.includes('~~')) {
      in_question = false;
      this.push("\n");
      return done();
    } 
    
    //
    if(chunk.match(question_num)) {
      //Some questions are missing terminators
      this.push("CEPTION");
      this.push("\n" + chunk + "\n");
      return done();
    }

    chunk.split('\n').join(' ');
    
    if(chunk.match(/^[A-D]\. /)) {
      chunk = "\n" + chunk;  
    }
    this.push(chunk);
    return done();
  }

  if(chunk.match(question_num)) {
    in_question = true;
    this.push(chunk + "\n");
    return done();
  }

  return done();
}

in_file.pipe(split()).pipe(through(filter)).pipe(process.stdout);
