'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const syllabus = require('./resources/syllabus');

const DIST_DIR = path.join(__dirname, "dist");
const SYLLABUS_MD = path.join(DIST_DIR,"syllabus.md");

function errExit(message, err_level) {
  console.log(chalk.red(`** ${message}\nExiting`));
  process.exit(err_level || 1);
}

function backupFile(file, done) {
  let file_parsed = path.parse(file);
  
  //Take parse response, update name and delete
  //'base' attrib.
  //Let's us generate a backup name easily
  delete file_parsed.base;
  file_parsed.name += "_" + Date.now();

  let file_timestamp = path.format(file_parsed);

  fs.rename(file,file_timestamp, (err) => {
    if(err) {
      return errExit(err.message);
    }
    done();  
  });
}

function mkBackup() {
  fs.stat(SYLLABUS_MD, (err, file_stat) => {
    if(err && err.code === 'ENOENT') {
      return parseSyllabusJson();
    }
    if(err) {   
      return errExit(err.message);
    }
    return backupFile(SYLLABUS_MD, parseSyllabusJson);
  });
}

function mkDist(done) {
  fs.mkdir(DIST_DIR, (err) => {
    if(err) {
      return errExit(err.message);
    }
    done();
  });
}

function generateSyllabusMarkdown() {
  fs.stat(DIST_DIR, (err,file_stat) => {
    if(err && err.code === 'ENOENT') {
      //Create Dist
      return mkDist(mkBackup);
    }
    if(file_stat.isFile()) {
      errExit("'dist' is file, not dir.");
    }
    return mkBackup();    
  });
}

function parseSyllabusJson() {
  let elements = Object.keys(syllabus);
  let md_string = '** Syllabus\n';

  elements.forEach((element) => {
    console.log(syllabus[element]);
    md_string += '# ' + element + ' - ' + syllabus[element].name + '\n';
    md_string += '_[' + syllabus[element].exam_questions + ' Exam Questions - ';
    md_string += syllabus[element].groups + ' Groups]_\n';
    Object.keys(syllabus[element].subelements).forEach((subelement) => {
      md_string += '**' + element + subelement + '**';
      md_string += ' ' + syllabus[element].subelements[subelement] + '\n';
    });
    md_string += '\n';
  });

  fs.createWriteStream(SYLLABUS_MD,'utf8').end(md_string);
  console.log("Written");
}

generateSyllabusMarkdown();
