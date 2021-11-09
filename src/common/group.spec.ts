import {GroupService} from './group';
import {Helpers} from './helpers';
import {Wcif} from './classes';
import {AnnuntiaWcif} from '../test/annuntia';
import {BelgianOpenWcif} from '../test/belgian-open';

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

  it('test parseInt match', function() {
    assert.equal(parseInt("2".match(/[0-9]+/)[0]), 2);
    assert.equal(parseInt("J2".match(/[0-9]+/)[0]), 2);
    assert.equal(parseInt("R10".match(/[0-9]+/)[0]), 10);
    assert.equal(parseInt("S12".match(/[0-9]+/)[0]), 12);
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

  it('test notAssignedToAnythingYetInGroup', function() {
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1', {configuration: {stages: 1}}, 3), true);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('J1', {configuration: {stages: 1}}, 3), true);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('R1', {configuration: {stages: 1}}, 3), true);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('S1', {configuration: {stages: 1}}, 3), true);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('3', {configuration: {stages: 1}}, 3), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('J3', {configuration: {stages: 1}}, 3), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('R3', {configuration: {stages: 1}}, 3), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('S3', {configuration: {stages: 1}}, 3), false);

    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;R2;J4', {configuration: {stages: 1}}, 1), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;R2;J4', {configuration: {stages: 1}}, 2), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;R2;J4', {configuration: {stages: 1}}, 3), true);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;R2;J4', {configuration: {stages: 1}}, 4), false);

    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 1), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 2), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 3), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 4), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 5), true);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 6), true);

    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 1), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 2), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 3), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 4), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 5), false);
    assert.equal(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 6), false);
  });

  it('test sortCompetitorsByGroupInEvent', function() {
    let wcif: Wcif = {
      persons: [
        {name: 'Foo', sq1: {group: '2'}},
        {name: 'Foo2', sq1: {group: '1;R1;R2'}},
        {name: 'Foo3', sq1: {group: '1'}},
        {name: 'Bar', sq1: {group: '2;R3'}},
        {name: 'Bar2', sq1: {group: '1'}}
      ]
    };

    Helpers.sortCompetitorsByGroupInEvent(wcif, 'sq1');
    assert.equal(wcif.persons[0].name, 'Foo3');
    assert.equal(wcif.persons[1].name, 'Bar2');
    assert.equal(wcif.persons[2].name, 'Foo2');
    assert.equal(wcif.persons[3].name, 'Foo');
    assert.equal(wcif.persons[4].name, 'Bar');
  });

  it('test sortRunnersByRunningAssigned', function() {
    let wcif: Wcif = {
      persons: [
        {name: 'Foo', roles: [], sq1: {group: '3'}},
        {name: 'Foo2', roles: [], sq1: {group: '1;R1;R2'}},
        {name: 'Foo3', roles: ['organizer'], sq1: {group: '2'}},
        {name: 'Bar', roles: [], sq1: {group: '2;R3'}},
        {name: 'Bar2', roles: [], sq1: {group: '1'}}
      ],
      events: [
        {id: 'sq1'}
      ]
    };

    Helpers.sortRunnersByRunningAssigned(wcif, wcif.persons);
    assert.equal(wcif.persons[0].name, 'Foo');
    assert.equal(wcif.persons[1].name, 'Bar2');
    assert.equal(wcif.persons[2].name, 'Bar');
    assert.equal(wcif.persons[3].name, 'Foo2');
    assert.equal(wcif.persons[4].name, 'Foo3');
  });

  it('test sortByCompetingToTaskRatio', function() {
    let wcif: Wcif = {
      persons: [
        {
          name: 'Foo',
          sq1: {competing: true, group: '3'},
          '777': {competing: true, group: '1;S2'}
        }, // 2/1
        {
          name: 'Foo2',
          sq1: {competing: true, group: '1;R1;R2'},
          '777': {competing: true, group: '1;R2'}
        }, // 2/3
        {
          name: 'Foo3',
          sq1: {competing: true, group: '1'},
          '777': {competing: false, group: ''}
        }, // 1/0
        {
          name: 'Bar',
          sq1: {competing: true, group: '2;R3'},
          '777': {competing: true, group: '2;J1'}
        }, // 2/2
        {
          name: 'Bar2',
          sq1: {competing: false, group: ''},
          '777': {competing: true, group: '2'}
        } // 1/0
      ],
      events: [
        {id: 'sq1'},
        {id: '777'}
      ]
    };

    Helpers.sortByCompetingToTaskRatio(wcif, wcif.persons);
    assert.equal(wcif.persons[0].name, 'Foo3');
    assert.equal(wcif.persons[1].name, 'Bar2');
    assert.equal(wcif.persons[2].name, 'Foo');
    assert.equal(wcif.persons[3].name, 'Bar');
    assert.equal(wcif.persons[4].name, 'Foo2');
  });

  it('test countGroupsForEvent', function() {
    let wcif: Wcif = {
      persons: [
        {
          name: 'Foo',
          sq1: {competing: true, group: '3'},
          '777': {competing: true, group: '1;S2'}
        }, // 2/1
        {
          name: 'Foo2',
          sq1: {competing: true, group: '12;R1;R10'},
          '777': {competing: true, group: '1;R2'}
        }, // 2/3
        {
          name: 'Foo3',
          sq1: {competing: true, group: '1'},
          '777': {competing: false, group: ''}
        }, // 1/0
        {
          name: 'Bar',
          sq1: {competing: true, group: '2;R3'},
          '777': {competing: true, group: '2;J1'}
        }, // 2/2
        {
          name: 'Bar2',
          sq1: {competing: false, group: ''},
          '777': {competing: true, group: '2'}
        } // 1/0
      ],
      events: [
        {id: 'sq1'},
        {id: '777'}
      ]
    };

    assert.equal(Helpers.countGroupsForEvent(wcif, Helpers.getEvent('777', wcif)), 2);
    assert.equal(Helpers.countGroupsForEvent(wcif, Helpers.getEvent('sq1', wcif)), 12);
  });

  it('test sortByCompetingToTaskRatio', function() {
    let wcif: Wcif = {
      persons: [
        {
          name: 'Foo',
          '777': {competing: true, group: '2;S3'}
        }
      ],
      events: [
        {id: '777'}
      ]
    };

    Helpers.assignExtraJudge(wcif.persons[0], '777', 1);
    assert.equal(wcif.persons[0]['777'].group, '2;J1;S3');
  });

  it('test process and import wcif of Annuntia', function() {
    let group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();
    group.importAssignmentsFromWcif();

    Helpers.countCJRSForEvent(group.wcif, '333', 3);
    assert.equal(Helpers.getEvent('333', group.wcif).numberOfRegistrations, 90);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters.length, 3);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[0], '31|16|2|3');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[1], '29|16|2|3');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[2], '30|15|2|3');
    assert.equal(group.wcif.persons[0]['333'].competing, true);
    assert.equal(group.wcif.persons[0]['333'].group, '3;R1');
  });

  it('test generate basic grouping of Belgian Open', function() {
    let group: GroupService = new GroupService();
    group.wcif = BelgianOpenWcif.wcif;
    group.processWcif();
    group.importAssignmentsFromWcif();

    Helpers.countCJRSForEvent(group.wcif, '333', 3);
    assert.equal(Helpers.getEvent('333', group.wcif).numberOfRegistrations, 94);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters.length, 3);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[0], '0|0|0|0');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[1], '0|0|0|0');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[2], '0|0|0|0');
    assert.equal(group.wcif.persons[0]['333'].competing, true);
    assert.equal(group.wcif.persons[0]['333'].group, '');

    group.generateGrouping('333');
    group.generateGrouping('444');
    group.wcif.persons.forEach(p => {
      if (p['333'].competing) {
        assert.equal(p['333'].group >= '1', true);
        assert.equal(p['333'].group <= '3', true);
      } else {
        assert.equal(p['333'].group, '');
      }
      if (p['444'].competing) {
        assert.equal(p['444'].group >= '1', true);
        assert.equal(p['444'].group <= '2', true);
      } else {
        assert.equal(p['444'].group, '');
      }
    });

    Helpers.getEvent('444bf', group.wcif).configuration.skip = false;
    group.generateGrouping('444bf');
    group.wcif.persons.forEach(p => {
      if (p['444bf'].competing) {
        assert.equal(p['444bf'].group, '1');
      } else {
        assert.equal(p['444bf'].group, '');
      }
    });
  });

  it('test generate advanced grouping wcif of Annuntia', function() {
    let group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();

    group.wcif.persons.forEach(p => {
      for (let e of group.wcif.events) {
        if (p[e.id].competing) {
          assert.equal(p[e.id].group, '1');
        } else {
          assert.equal(p[e.id].group, '');
        }
      }
    });

    group.configuration.groupStrategy = 'advanced';
    group.configuration.everyoneCanScrambleAndRun = true;

    group.generateGrouping('333');
    Helpers.countCJRSForEvent(group.wcif, '333', 3);
    assert.equal(Helpers.getEvent('333', group.wcif).numberOfRegistrations, 90);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters.length, 3);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[0], '30|16|2|2');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[1], '30|16|2|2');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[2], '30|16|2|2');
    group.wcif.persons.forEach(p => {
      if (p['333'].competing) {
        assert.equal(p['333'].group >= '1', true);
        assert.equal(p['333'].group < '4', true); // Example: '3;R2' is smaller than '4'
      } else {
        assert.equal(p['333'].group, '');
      }
    });

    group.configuration.fixedSeating = true;
    group.wcif.events.forEach(e => {
      e.configuration.stages = 2;
      e.configuration.timers = group.configuration.totalNumberOfTimers / 2;
    });

    group.generateGrouping('333');
    Helpers.countCJRSForEvent(group.wcif, '333', 6);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters.length, 6);
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[0], '15|15|2|2');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[1], '15|15|2|2');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[2], '15|15|2|2');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[3], '15|15|2|2');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[4], '15|15|2|2');
    assert.equal(Helpers.getEvent('333', group.wcif).groupCounters[5], '15|15|2|2');
    group.wcif.persons.forEach(p => {
      if (p['333'].competing) {
        assert.equal(p['333'].group >= '1', true);
        assert.equal(p['333'].group < '7', true); // Example: '6;R2' is smaller than '7'
      } else {
        assert.equal(p['333'].group, '');
      }
    });
  });
});
