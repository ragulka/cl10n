#!/usr/bin/env node

var extractor = require("../lib/extractor");

var args = process.argv.slice(2);
var options = {};
options.outputPath = args[0] || process.cwd();
options.url = args[1] || 'http://www.unicode.org/repos/cldr-aux/json/22.1/main';

extractor.fetchLocales( options.url, options.outputPath );