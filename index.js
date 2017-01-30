'use strict';

const readline = require('readline');
const fs = require('fs');

const Parser = require('./lib/parser').Parser;

const INFILE = 'resources/extra/Extra_Class_Pool.txt';

var p = new Parser();

readline.createInterface({
  input: fs.createReadStream(INFILE),
  terminal: false
}).on('line',
  function(line) {
    p.next(line);
}).on('close',
  function () {
    console.log(JSON.stringify(p, null, 4));
});
