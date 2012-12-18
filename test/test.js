var cl10n = require("../"),
    should = require("should");
var c = new cl10n('en_GB', '../../server/vendor/locales');

describe("cl10n module", function() {

  it("should load locale data", function() {
    c.localeData.should.be.a('object');
  });

  it("formatCurrency() should return a correctly formatted currency string", function() {
    var result = c.formatCurrency( 12345678.99, "EUR" );
    result.should.equal( "€12,345,678.99" );
  });

});
