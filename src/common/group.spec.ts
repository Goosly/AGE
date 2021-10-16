import {GroupService} from './group';
import {Helpers} from './helpers';
import {Wcif} from './classes';
import {AnnuntiaWcif} from '../test/annuntia';

const assert = require('assert');

describe('test', function() {
  it('test decrement', function() {
    let event = {
      configuration: {stages: 2, scrambleGroups: 2}
    };
    let group: GroupService = new GroupService();

    assert.equal(group.decrement(3, event), 2);
    assert.equal(group.decrement(2, event), 1);
    assert.equal(group.decrement(1, event), 0);
    assert.equal(group.decrement(0, event), 3);
  });

  it('test sortCompetitorsBySpeedInEvent', function() {
    let wcif: Wcif = {
      persons: [
        {name: 'Foo', personalBests: [{eventId: '333', worldRanking: 1}, {eventId: '444', worldRanking: 4}]},
        {name: 'Bar', personalBests: [{eventId: '333', worldRanking: 100}, {eventId: '444', worldRanking: 2}]}
      ]
    };

    Helpers.sortCompetitorsBySpeedInEvent(wcif, '333', false);
    assert.equal(wcif.persons[0].name, 'Foo');
    assert.equal(wcif.persons[1].name, 'Bar');

    Helpers.sortCompetitorsBySpeedInEvent(wcif, '444', false);
    assert.equal(wcif.persons[0].name, 'Bar');
    assert.equal(wcif.persons[1].name, 'Foo');
  });

  it('test sortCompetitorsByName', function() {
    let wcif: Wcif = {
      persons: [
        {name: 'Foo'},
        {name: 'Foo2'},
        {name: 'Bar'},
        {name: 'Bar2'}
      ]
    };

    Helpers.sortCompetitorsByName(wcif);
    assert.equal(wcif.persons[0].name, 'Bar');
    assert.equal(wcif.persons[1].name, 'Bar2');
    assert.equal(wcif.persons[2].name, 'Foo');
    assert.equal(wcif.persons[3].name, 'Foo2');
  });

  it('test getEvent', function() {
    let wcif: Wcif = {
      events: [
        {id: '333'},
        {id: '333bf'},
        {id: '444'},
        {id: 'pyra'}
      ]
    };

    assert.equal(Helpers.getEvent('333', wcif), wcif.events[0]);
    assert.equal(Helpers.getEvent('333bf', wcif), wcif.events[1]);
    assert.equal(Helpers.getEvent('444', wcif), wcif.events[2]);
    assert.equal(Helpers.getEvent('pyra', wcif), wcif.events[3]);
  });

  it('test process and importwcif', function() {
    let group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();
    group.importAssignmentsFromWcif();

    Helpers.countCJRSForEvent(group.wcif, '333');
    assert.equal(Helpers.getEvent('333', group.wcif).numberOfRegistrations, 90);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters.length, 3);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[0], '31|16|2|3');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[1], '29|16|2|3');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[2], '30|15|2|3');
    assert.equal(group.wcif.persons[0]['333'].competing, true);
    assert.equal(group.wcif.persons[0]['333'].group, '3;R1');
  });
});
