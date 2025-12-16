 import moment from 'moment-timezone';


describe('moment', function () {
  it('test moment js', function () {
    let myMoment: moment.Moment = moment('2020-02-15T08:45:00Z');
    expect(myMoment.utc().format()).toBe('2020-02-15T08:45:00Z');
    expect(myMoment.tz('Europe/Brussels').format()).toBe('2020-02-15T09:45:00+01:00');
    expect(myMoment.tz('Europe/Brussels').format('H:mm')).toBe('9:45');

    myMoment = moment('2020-02-15T13:10:00Z');
    expect(myMoment.utc().format()).toBe('2020-02-15T13:10:00Z');
    expect(myMoment.tz('Europe/Brussels').format()).toBe('2020-02-15T14:10:00+01:00');
    expect(myMoment.tz('Europe/Brussels').format('H:mm')).toBe('14:10');
  });
});
