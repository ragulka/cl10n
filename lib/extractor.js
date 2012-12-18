var http = require("http"),
	fs = require("fs"),
	jsdom = require("jsdom"),
	async = require("async"),
	_ = require("underscore")._;

module.exports = {
	/*
	 * Fetches locale data for a given locale and writes
	 * it to a file on local system.
	 * 
	 * Tries to fetch locale data from CLDR online JSON
	 * repository. If the HTTP request fails, attempts to 
	 * fetch again a maximum of 5 times.
	 *
	 * @return String localeName
	 */
	fetchLocaleData: function( url, localeName, outputPath, cb, attempt ) {
		var _this = this;
		if (!attempt) var attempt = 1;
		var maxAttempts = 5;
		
		http.get( url + "/" + localeName, function (res) {
			var body = '';

			res.on('data', function(chunk) {
				body += chunk;
			});

			res.on('end', function() {
				
				var data = {};
					res = JSON.parse( body ),
					defaultNumberingSystem = res.numbers.defaultNumberingSystem;

				data.identity = res.identity;
				
				data.localeDisplayNames = {};
				data.localeDisplayNames.territories = res.localeDisplayNames.territories;
				data.localeDisplayNames.languages = res.localeDisplayNames.languages;
				
				data.timeZoneNames = res.dates.calendars.timeZoneNames;
				
				data.units = res.units;

				data.numbers = {};
				data.numbers.currencies = res.numbers.currencies;
				data.numbers.currencyFormat = res.numbers[ "currencyFormats-numberSystem-" + defaultNumberingSystem ];
				data.numbers.symbols = res.numbers[ "symbols-numberSystem-" + defaultNumberingSystem ];
				data.numbers.decimalFormat = res.numbers[ "decimalFormats-numberSystem-" + defaultNumberingSystem ];
				data.numbers.percentFormat = res.numbers[ "percentFormats-numberSystem-" + defaultNumberingSystem ];

				var result = fs.writeFileSync( outputPath + "/" + localeName, JSON.stringify( data ), 'utf8' );

				console.log( "Fetched:" + localeName );

				cb( null, localeName );
				
			});

		}).on('error', function (err) {
			attempt++;
			if ( attempt <= maxAttempts ) {
				console.log( "Got error (" + err.message + ") while trying to fetch " + localeName + ". Trying again - attempt: " + attempt );
				_this.fetchLocaleData( url, localeName, outputPath, cb, attempt );
			} else {
				console.log( "Got error (" + err.message + ") while trying to fetch " + localeName + ". Max attempts tried. FAIL." );
				cb( err.message );
			}
		}); 
	},

	/*
	 * Fetch all locales and their data from CLDR
	 * 
	 * Extracts a list of locales from
	 * http://www.unicode.org/repos/cldr-aux/json/22.1/main
	 * Then fetches locale data for each locale.
	 */	
	fetchLocales: function ( url, outputPath ) {
		var _this = this;
		jsdom.env(
			url,
			function (errors, window) {
			
				var anchors = window.document.getElementsByTagName( 'a' ),
					locales = [],
					requests = [];
				
				for ( i = 0; i < anchors.length; i++ ) {
					var localeName = anchors[i].getAttribute('href');
					if ( localeName.indexOf('.json') !== -1 ) {
						locales.push( anchors[i].getAttribute('href') );
					}
				};
				
				_.each( locales, function ( localeName, index ) {
					requests.push( function (cb) {
						console.log( "Fetching: " + localeName );
						_this.fetchLocaleData( url, localeName, outputPath, cb );				
					});
				});

				async.parallel( requests, function (err, results) {
					if (err) throw err;
					console.log("Successfully fetched " + results.length + " locales");
				});

			}
		);
	}
}