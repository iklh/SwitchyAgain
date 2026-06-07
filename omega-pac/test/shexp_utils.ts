let chai, should;

chai = require('chai');

should = chai.should();

describe('ShexpUtils', function() {
  let ShexpUtils;
  ShexpUtils = require('../build-ts/shexp_utils');
  describe('#escapeSlash', function() {
    it('should escape all forward slashes', function() {
      let regex;
      regex = ShexpUtils.escapeSlash('/test/');
      return regex.should.equal('\\/test\\/');
    });
    it('should not escape slashes that are already escaped', function() {
      let regex;
      regex = ShexpUtils.escapeSlash('\\/test\\/');
      return regex.should.equal('\\/test\\/');
    });
    return it('should know the difference between escaped and unescaped slashes', function() {
      let regex;
      regex = ShexpUtils.escapeSlash('\\\\/\\/test\\/');
      return regex.should.equal('\\\\\\/\\/test\\/');
    });
  });
  return describe('#shExp2RegExp', function() {
    return it('should escape regex meta chars and back slashes', function() {
      let regex;
      regex = ShexpUtils.shExp2RegExp('this.is|a\\test+');
      return regex.should.equal('^this\\.is\\|a\\\\test\\+$');
    });
  });
});
