'use strict';

const fs = require('fs');

const EXTRA_POOL = path.join(__dirname,'resources','Extra_Class_Pool.txt');
const in_file = fs.createReadStream(EXTRA_POOL, 'utf8');


in_file.pipe(split()).pipe(through(filter)).pipe(process.stdout);
