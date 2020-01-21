// import * as moment from 'moment';

var assert = require('assert');
var moment = require('moment-timezone');

describe('moment', function() {
  describe('moment', function() {
    it('test moment js', function() {
      let myMoment: moment.Moment = moment('2020-02-15T08:45:00Z');
      assert.equal(myMoment.utc().format(), '2020-02-15T08:45:00Z');
      assert.equal(myMoment.tz("Europe/Brussels").format(), '2020-02-15T09:45:00+01:00');
      assert.equal(myMoment.tz("Europe/Brussels").format('H:mm'), '9:45');

      myMoment = moment('2020-02-15T13:10:00Z');
      assert.equal(myMoment.utc().format(), '2020-02-15T13:10:00Z');
      assert.equal(myMoment.tz("Europe/Brussels").format(), '2020-02-15T14:10:00+01:00');
      assert.equal(myMoment.tz("Europe/Brussels").format('H:mm'), '14:10');
    });
  });
});
