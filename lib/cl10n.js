module.exports = function() {

  // Public functions
  return {
    parseNFormat: function(pattern) {
      var format, matches, p, pat, patterns, pos, pos2, pos3;
      format = {};
      patterns = pattern.split(';');
      format['positivePrefix'] = format['positiveSuffix'] = format['negativePrefix'] = format['negativeSuffix'] = '';
      if (matches = patterns[0].match(/^(.*?)[#,\.0]+(.*?)$/)) {
        format['positivePrefix'] = matches[1];
        format['positiveSuffix'] = matches[2];
      }
      if (patterns[1] && patterns[1].match(/^(.*?)[#,\.0]+(.*?)$/)) {
        format['negativePrefix'] = matches[1];
        format['negativeSuffix'] = matches[2];
      } else {
        format['negativePrefix'] = bootstrap.Locales[this.app.settings.get('locale')].numberSymbols.minusSign + format['positivePrefix'];
        format['negativeSuffix'] = format['positiveSuffix'];
      }
      pat = patterns[0];
      if (pat.indexOf('%') !== -1) {
        format['multiplier'] = 100;
      } else if (pat.indexOf('‰') !== -1) {
        format['multiplier'] = 1000;
      } else {
        format['multiplier'] = 1;
      }
      if ((pos = pat.indexOf('.')) !== -1) {
        if ((pos2 = pat.lastIndexOf('0')) > pos) {
          format['decimalDigits'] = pos2 - pos;
        } else {
          format['decimalDigits'] = 0;
        }
        if ((pos3 = pat.lastIndexOf('#') >= pos2)) {
          format['maxDecimalDigits'] = pos3 - pos;
        } else {
          format['maxDecimalDigits'] = format['decimalDigits'];
        }
        pat = pat.substr(0, pos);
      } else {
        format['decimalDigits'] = 0;
        format['maxDecimalDigits'] = 0;
      }
      p = pat.replace(/,/g, '');
      if ((pos = p.indexOf('0')) !== -1) {
        format['integerDigits'] = p.lastIndexOf('0') - pos + 1;
      } else {
        format['integerDigits'] = 0;
      }
      p = pat.replace(/#/g, '0');
      if ((pos = pat.lastIndexOf(',')) !== -1) {
        format['groupSize1'] = p.lastIndexOf('0') - pos;
        if ((pos2 = p.substr(0, pos).lastIndexOf(',')) !== -1) {
          format['groupSize2'] = pos - pos2 - 1;
        } else {
          format['groupSize2'] = 0;
        }
      } else {
        format['groupSize1'] = format['groupSize2'] = 0;
      }
      return format;
    },
    formatNumber: function(format, value) {
      var decimal, integer, negative, number, pos, size, str1, str2;
      negative = value < 0;
      value = Math.abs(value * format['multiplier']);
      if (format['maxDecimalDigits'] >= 0) {
        value = this.roundNumber(value, format['maxDecimalDigits']);
      }
      value = "" + value;
      if ((pos = value.lastIndexOf('.')) !== -1) {
        integer = value.substr(0, pos);
        decimal = value.substr(pos + 1);
      } else {
        integer = value;
        decimal = '';
      }
      if (format['decimalDigits'] > decimal.length) {
        decimal = str_pad(decimal, format['decimalDigits'], '0');
      }
      if (decimal.length > 0) {
        decimal = bootstrap.Locales[this.app.settings.get('locale')].numberSymbols.decimal + decimal;
      }
      integer = str_pad(integer, format['integerDigits'], '0', 'STR_PAD_LEFT');
      if (format['groupSize1'] > 0 && integer.length > format['groupSize1']) {
        str1 = integer.slice(0, -format['groupSize1']);
        str2 = integer.slice(-format['groupSize1']);
        size = format['groupSize2'] > 0 ? format['groupSize2'] : format['groupSize1'];
        str1 = str_pad(str1, parseInt((str1.length + size - 1) / size) * size, ' ', 'STR_PAD_LEFT');
        integer = ltrim(str_split(str1, size).join(bootstrap.Locales[this.app.settings.get('locale')].numberSymbols.group)) + bootstrap.Locales[this.app.settings.get('locale')].numberSymbols.group + str2;
      }
      if (negative) {
        number = format['negativePrefix'] + integer + decimal + format['negativeSuffix'];
      } else {
        number = format['positivePrefix'] + integer + decimal + format['positiveSuffix'];
      }
      number.replace(/%/g, bootstrap.Locales[this.app.settings.get('locale')].numberSymbols.percentSign);
      number.replace(/‰/g, bootstrap.Locales[this.app.settings.get('locale')].numberSymbols.perMille);
      return number;
    },
    format: function(pattern, value, currency) {
      var format, result, symbol;
      if (!currency) {
        currency = null;
      }
      format = this.parseNFormat(pattern);
      result = this.formatNumber(format, value);
      if (currency === null) {
        return result;
      } else if (!(symbol = bootstrap.Locales[this.app.settings.get('locale')].currencySymbols[currency])) {
        symbol = currency;
      }
      return result.replace(/\u00a4/g, symbol);
    },
    formatCurrency: function(value, currency) {
      return this.format(bootstrap.Locales[this.app.settings.get('locale')].currencyFormat, value, currency);
    }
  }
}