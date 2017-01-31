'use strict';

const SUBELEMENT_PATTERN = /^SUBELEMENT [TGE]\d /;
const GROUP_PATTERN = /^[TGE]\d[A-Z] /;
const ITEM_PATTERN = /^[TGE]\d[A-Z]\d\d \([A-D]\)/;
const OPTION_PATTERN = /^[A-D]\. .+/;
const TERMINATION_PATTERN = /^~~/;
const END_PATTERN = /~~~~End of question pool text~~~~/;

exports.Parser = function() {
  this.item = null;
  this.option = null;
  this.group = null;
  this.subelement = null;
  this.subelements = {};
  this.finished = false;
  this.line = 0;
  this.next = function(token) {
    this.line++;
    try {
      this._next_token(token);
    } catch(e) {
      throw Error("Parser error on line "
                  + this.line
                  + ": "
                  + e.message);
    }
  }
  this._next_token = function(token) {
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
        // we will always hit this branch
        this.item.text = this.item.text.concat(' ', token.trim());
      }
    }
  }
  this._store_option = function() {
    if (this.option) {
      this.option.validate();
      this.item.options[this.option.letter] = this.option.text;
      this.option = null;
    }
  }
  this._store_item = function() {
    this._store_option();
    if (this.item) {
      this.item.validate();
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
    throw Error("Subelement pattern didn't match");
  }
  this.groups = {};
  this.text = s.substring(16,s.length);
  this.id = s.substring(11,13);
}

var Group = function(s) {
  if (!s.match(GROUP_PATTERN)) {
    throw Error("Group pattern didn't match");
  }
  this.items = {};
  this.text = s.substring(4,s.length);
  this.subelement = s.substring(0,2);
  this.id = s.substring(2,3);
}

var Item = function(s) {
  if (!s.match(ITEM_PATTERN)) {
    throw Error("Item pattern didn't match");
  }
  this.options = {};
  this.text = '';
  this.key = s.match(/\([A-D]\)/)[0].substring(1,2);
  this.subelement = s.substring(0,2);
  this.group = s.substring(2,3);
  this.number = s.substring(3,5);
  this.validate = function() {
    ['A', 'B', 'C', 'D'].forEach(function (letter) {
      if (this.options[letter] === undefined) {
        console.log(this);
        throw Error('Missing option "'
            + letter
            + '"');
      }
    }, this);
    if (this.text.length > 243) {
      // similar to the concern with options noted below, it is claimed that
      // item text will not exceed 210 characters, but 243 have been observed
      // in the corpus
      throw Error('Item text must not be more than 243 characters in length. "'
                  + this.text
                  + '" is '
                  + this.text.length);
    }
  }
}

var Option = function(s) {
  if (!s.match(OPTION_PATTERN)) {
    throw Error("Option pattern didn't match");
  }
  this.letter = s.substring(0,1);
  this.text = s.substring(3, s.length);
  this.validate = function() {
    if (!this.letter.match(/[A-D]/)) {
      throw Error("Invalid option identifier: " + this.letter);
    }
    if (this.text.length > 174) {
      // per http://www.ncvec.org/page.php?id=338, options are not supposed to
      // be longer than 140 characters.
      // In practice, we've observed options up to this length.
      // We'd like to retain some limit though, since a missing `~~` (which
      // we've also observed) results in subsequent lines getting snarfed
      // into here..
      throw Error('Option must not be more than 174 characters in length. "'
                  + this.text
                  + '" is '
                  + this.text.length);
    }
  }
}
