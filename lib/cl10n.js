var fs = require("fs");

function str_pad (input, pad_length, pad_string, pad_type) {
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // + namespaced by: Michael White (http://getsprink.com)
  // +      input by: Marco van Oort
  // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
  // *     example 1: str_pad('Kevin van Zonneveld', 30, '-=', 'STR_PAD_LEFT');
  // *     returns 1: '-=-=-=-=-=-Kevin van Zonneveld'
  // *     example 2: str_pad('Kevin van Zonneveld', 30, '-', 'STR_PAD_BOTH');
  // *     returns 2: '------Kevin van Zonneveld-----'
  var half = '',
    pad_to_go;

  var str_pad_repeater = function (s, len) {
    var collect = '',
      i;

    while (collect.length < len) {
      collect += s;
    }
    collect = collect.substr(0, len);

    return collect;
  };

  input += '';
  pad_string = pad_string !== undefined ? pad_string : ' ';

  if (pad_type != 'STR_PAD_LEFT' && pad_type != 'STR_PAD_RIGHT' && pad_type != 'STR_PAD_BOTH') {
    pad_type = 'STR_PAD_RIGHT';
  }
  if ((pad_to_go = pad_length - input.length) > 0) {
    if (pad_type == 'STR_PAD_LEFT') {
      input = str_pad_repeater(pad_string, pad_to_go) + input;
    } else if (pad_type == 'STR_PAD_RIGHT') {
      input = input + str_pad_repeater(pad_string, pad_to_go);
    } else if (pad_type == 'STR_PAD_BOTH') {
      half = str_pad_repeater(pad_string, Math.ceil(pad_to_go / 2));
      input = half + input + half;
      input = input.substr(0, pad_length);
    }
  }

  return input;
}

function str_split (string, split_length) {
  // http://kevin.vanzonneveld.net
  // +     original by: Martijn Wieringa
  // +     improved by: Brett Zamir (http://brett-zamir.me)
  // +     bugfixed by: Onno Marsman
  // +      revised by: Theriault
  // +        input by: Bjorn Roesbeke (http://www.bjornroesbeke.be/)
  // +      revised by: Rafał Kukawski (http://blog.kukawski.pl/)
  // *       example 1: str_split('Hello Friend', 3);
  // *       returns 1: ['Hel', 'lo ', 'Fri', 'end']
  if (split_length === null) {
    split_length = 1;
  }
  if (string === null || split_length < 1) {
    return false;
  }
  string += '';
  var chunks = [],
    pos = 0,
    len = string.length;
  while (pos < len) {
    chunks.push(string.slice(pos, pos += split_length));
  }

  return chunks;
}

function ltrim (str, charlist) {
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: Erkekjetter
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Onno Marsman
  // *     example 1: ltrim('    Kevin van Zonneveld    ');
  // *     returns 1: 'Kevin van Zonneveld    '
  charlist = !charlist ? ' \\s\u00A0' : (charlist + '').replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
  var re = new RegExp('^[' + charlist + ']+', 'g');
  return (str + '').replace(re, '');
}

// Internal memoization-cache
var localeCache = {};

var loadLocale = function( localeName, path ) {
  if ( localeCache[localeName] ) {
    return localeCache[localeName];
  } else {
    var data = JSON.parse( fs.readFileSync( path + "/" + localeName + ".json" ) );
    localeCache[localeName] = data;
    return data;
  }
};

module.exports = function (localeName, localePath) {

  // Default values
  this.locale = localeName || 'en_GB';
  this.path = localePath || process.cwd();

  // Load locale data
  this.localeData = loadLocale( this.locale, this.path );

  this.parseNFormat = function(pattern) {
    var format, matches, p, pat, patterns, pos, pos2, pos3;
    format = {};
    patterns = pattern.split(';');
    format.positivePrefix = format.positiveSuffix = format.negativePrefix = format.negativeSuffix = '';
    if (matches = patterns[0].match(/^(.*?)[#,\.0]+(.*?)$/)) {
      format.positivePrefix = matches[1];
      format.positiveSuffix = matches[2];
    }
    if (patterns[1] && patterns[1].match(/^(.*?)[#,\.0]+(.*?)$/)) {
      format.negativePrefix = matches[1];
      format.negativeSuffix = matches[2];
    } else {
      format.negativePrefix = this.localeData.numbers.symbols.minusSign + format.positivePrefix;
      format.negativeSuffix = format.positiveSuffix;
    }
    pat = patterns[0];
    if (pat.indexOf('%') !== -1) {
      format.multiplier = 100;
    } else if (pat.indexOf('‰') !== -1) {
      format.multiplier = 1000;
    } else {
      format.multiplier = 1;
    }
    if ((pos = pat.indexOf('.')) !== -1) {
      if ((pos2 = pat.lastIndexOf('0')) > pos) {
        format.decimalDigits = pos2 - pos;
      } else {
        format.decimalDigits = 0;
      }
      if ((pos3 = pat.lastIndexOf('#') >= pos2)) {
        format.maxDecimalDigits = pos3 - pos;
      } else {
        format.maxDecimalDigits = format.decimalDigits;
      }
      pat = pat.substr(0, pos);
    } else {
      format.decimalDigits = 0;
      format.maxDecimalDigits = 0;
    }
    p = pat.replace(/,/g, '');
    if ((pos = p.indexOf('0')) !== -1) {
      format.integerDigits = p.lastIndexOf('0') - pos + 1;
    } else {
      format.integerDigits = 0;
    }
    p = pat.replace(/#/g, '0');
    if ((pos = pat.lastIndexOf(',')) !== -1) {
      format.groupSize1 = p.lastIndexOf('0') - pos;
      if ((pos2 = p.substr(0, pos).lastIndexOf(',')) !== -1) {
        format.groupSize2 = pos - pos2 - 1;
      } else {
        format.groupSize2 = 0;
      }
    } else {
      format.groupSize1 = format.groupSize2 = 0;
    }
    return format;
  };
  
  this.formatNumber =  function (format, value) {
    var decimal, integer, negative, number, pos, size, str1, str2;
    negative = value < 0;
    value = Math.abs(value * format.multiplier);
    if (format.maxDecimalDigits >= 0) {
      value = value.toFixed( format.maxDecimalDigits );
    }
    value = "" + value;
    if ((pos = value.lastIndexOf('.')) !== -1) {
      integer = value.substr(0, pos);
      decimal = value.substr(pos + 1);
    } else {
      integer = value;
      decimal = '';
    }
    if (format.decimalDigits > decimal.length) {
      decimal = str_pad(decimal, format.decimalDigits, '0');
    }
    if (decimal.length > 0) {
      decimal = this.localeData.numbers.symbols.decimal + decimal;
    }
    integer = str_pad(integer, format.integerDigits, '0', 'STR_PAD_LEFT');
    if (format.groupSize1 > 0 && integer.length > format.groupSize1) {
      str1 = integer.slice(0, -format.groupSize1);
      str2 = integer.slice(-format.groupSize1);
      size = format.groupSize2 > 0 ? format.groupSize2 : format.groupSize1;
      str1 = str_pad(str1, parseInt((str1.length + size - 1) / size) * size, ' ', 'STR_PAD_LEFT');
      integer = ltrim(str_split(str1, size).join(this.localeData.numbers.symbols.group)) + this.localeData.numbers.symbols.group + str2;
    }
    if (negative) {
      number = format.negativePrefix + integer + decimal + format.negativeSuffix;
    } else {
      number = format.positivePrefix + integer + decimal + format.positiveSuffix;
    }
    number.replace(/%/g, this.localeData.numbers.symbols.percentSign);
    number.replace(/‰/g, this.localeData.numbers.symbols.perMille);
    return number;
  };
  
  this.format = function (pattern, value, currency) {
    var format, result, symbol;
    if (!currency) {
      currency = null;
    }
    format = this.parseNFormat(pattern);
    result = this.formatNumber(format, value);
    if (currency === null) {
      return result;
    } else if ( !( symbol = this.localeData.numbers.currencies[ currency ].symbol ) ) {
      symbol = currency;
    }
    return result.replace(/\u00a4/g, symbol);
  };
  
  this.formatCurrency = function (value, currency) {
    return this.format( this.localeData.numbers.currencyFormat.standard.currencyFormat.pattern, value, currency );
  };

}