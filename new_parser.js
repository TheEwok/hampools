const readline = require('readline');
const fs = require('fs');

const INFILE = 'resources/extra/Extra_Class_Pool.txt';

const SUBELEMENT_PATTERN = /SUBELEMENT [TGE]\d /;
const GROUP_PATTERN = /[TGE]\d[A-Z] /;
const ITEM_PATTERN = /[TGE]\d[A-Z]\d\d \([A-D]\)/;
const OPTION_PATTERN = /[A-D]\. \w+/;
const TERMINATION_PATTERN = /~~/;
const END_PATTERN = /~~~~End of question pool text~~~~/;

var Parser = function() {
  this.item = null;
  this.option = null;
  this.group = null;
  this.subelement = null;
  this.subelements = {};
  this.finished = false;
  this.next = function(token) {
    if (this.finished) { 
      return; 
    } else if (token.match(END_PATTERN)) {
        this._store_subelement();
        this.finished = true;
        return;
    } else if (!this.item) {
      // we are outside an item
      if (token.match(ITEM_PATTERN)) {
        this.item = new Item(token);
      } else if (token.match(GROUP_PATTERN)) {
        this._store_group();
        this.group = new Group(token);
      } else if (token.match(SUBELEMENT_PATTERN)) {
        this._store_subelement();
        this.subelement = new Subelement(token);
      } else if (token) {
        if (this.group) {
          this.group.text = this.group.text.concat(' ', token.trim());
        } else if (this.subelement) {
          this.subelement.text = this.subelement.text.concat(' ', token.trim());
        }
      }
    } else if (token.match(OPTION_PATTERN)) {
      this._store_option();
      this.option = new Option(token);
    } else if (token.match(TERMINATION_PATTERN)) {
      this._store_item();
    } else if (token) {
      // line continuation
      if (this.option) {
        this.option.text = this.option.text.concat(' ', token.trim());
      } else if (this.item) {
        this.item.text = this.item.text.concat(' ', token.trim());
      }
    }
  }
  this._store_option = function() {
    if (this.option) {
      this.item.options[this.option.letter] = this.option.text;
      this.option = null;
    }
  }
  this._store_item = function() {
    this._store_option();
    if (this.item) {
      this.group.items[this.item.number] = this.item;
      this.item = null;
    }
  }
  this._store_group = function() {
    this._store_item();
    if (this.group) {
      this.subelement.groups[this.group.id] = this.group;
      this.group = null;
    }
  }
  this._store_subelement = function() {
    this._store_group();
    if (this.subelement) {
      this.subelements[this.subelement.id] = this.subelement;
      this.subelement = null;
    }
  }
}

var Subelement = function(s) {
  if (!s.match(SUBELEMENT_PATTERN)) {
    throw Error("pattern didn't match");
  }
  this.groups = {};
  this.text = s.substring(16,s.length);
  this.id = s.substring(11,13);
}

var Group = function(s) {
  if (!s.match(GROUP_PATTERN)) {
    throw Error("pattern didn't match");
  }
  this.items = {};
  this.text = s.substring(4,s.length);
  this.subelement = s.substring(0,2);
  this.id = s.substring(2,3);
}

var Item = function(s) {
  if (!s.match(ITEM_PATTERN)) {
    throw Error("pattern didn't match");
  }
  this.options = {};
  this.text = '';
  this.key = s.match(/\([A-D]\)/)[0].substring(1,2);
  this.subelement = s.substring(0,2);
  this.group = s.substring(2,3);
  this.number = s.substring(3,5);
}

var Option = function(s) {
  if (!s.match(OPTION_PATTERN)) {
    throw Error("pattern didn't match");
  }
  this.letter = s.substring(0,1);
  this.text = s.substring(3, s.length);
}

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

