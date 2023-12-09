import {AnnuntiaWcif} from '../test/annuntia';
import {ActivityHelper} from './activity';
import {GroupService} from './group';
import {Helpers} from './helpers';
import {StaffPerson, Wcif} from './classes';

describe('test', function() {

  it('test competesBeforeJudging', function() {
    const wcif: Wcif = {
      persons: [
        {name: 'Foo', sq1: {group: '1;J2'}},
        {name: 'Foo2', sq1: {group: '2;R1;J3'}},
        {name: 'Foo3', sq1: {group: '4;S1;S2;S3;J5'}},
        {name: 'Bar', sq1: {group: '5;J1;S2;R6'}},
        {name: 'Bar2', sq1: {group: '3;J2'}}
      ]
    };

    expect(Helpers.competesBeforeJudging(wcif.persons[0], 'sq1')).toBe( true);
    expect(Helpers.competesBeforeJudging(wcif.persons[1], 'sq1')).toBe( true);
    expect(Helpers.competesBeforeJudging(wcif.persons[2], 'sq1')).toBe( true);
    expect(Helpers.competesBeforeJudging(wcif.persons[3], 'sq1')).toBe( false);
    expect(Helpers.competesBeforeJudging(wcif.persons[4], 'sq1')).toBe( false);
  });

  it('test getStageName', function() {
    const group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();

    group.wcif.schedule.venues[0].rooms.push({activities: [], color: '', extensions: [], id: 0, name: 'Second room'});

    expect(Helpers.getStageName(group.wcif, Helpers.getEvent('333', group.wcif), 1)).toBe( 'Main room');
    expect(Helpers.getStageName(group.wcif, Helpers.getEvent('333', group.wcif), 2)).toBe( 'Main room');
    expect(Helpers.getStageName(group.wcif, Helpers.getEvent('333', group.wcif), 3)).toBe( 'Main room');
    expect(Helpers.getStageName(group.wcif, Helpers.getEvent('sq1', group.wcif), 1)).toBe( 'Main room');
    expect(Helpers.getStageName(group.wcif, Helpers.getEvent('sq1', group.wcif), 15)).toBeNull();
  });

  it('test sortCompetitorsBySpeedInEvent', function() {
    const wcif: Wcif = {
      persons: [
        {name: 'Foo', personalBests: [{eventId: '333', worldRanking: 1}, {eventId: '444', worldRanking: 4}]},
        {name: 'Bar', personalBests: [{eventId: '333', worldRanking: 100}, {eventId: '444', worldRanking: 2}]}
      ]
    };

    Helpers.sortCompetitorsBySpeedInEvent(wcif, '333', false);
    expect(wcif.persons[0].name).toBe('Foo');
    expect(wcif.persons[1].name).toBe('Bar');

    Helpers.sortCompetitorsBySpeedInEvent(wcif, '444', false);
    expect(wcif.persons[0].name).toBe('Bar');
    expect(wcif.persons[1].name).toBe('Foo');
  });

  it('test sortCompetitorsByName', function() {
    const wcif: Wcif = {
      persons: [
        {name: 'Foo'},
        {name: 'Foo2'},
        {name: 'Bar'},
        {name: 'Bar2'}
      ]
    };

    Helpers.sortCompetitorsByName(wcif);
    expect(wcif.persons[0].name).toBe('Bar');
    expect(wcif.persons[1].name).toBe('Bar2');
    expect(wcif.persons[2].name).toBe('Foo');
    expect(wcif.persons[3].name).toBe('Foo2');
  });

  it('test getEvent', function() {
    const wcif: Wcif = {
      events: [
        {id: '333'},
        {id: '333bf'},
        {id: '444'},
        {id: 'pyra'}
      ]
    };

    expect(Helpers.getEvent('333', wcif)).toBe( wcif.events[0]);
    expect(Helpers.getEvent('333bf', wcif)).toBe( wcif.events[1]);
    expect(Helpers.getEvent('444', wcif)).toBe( wcif.events[2]);
    expect(Helpers.getEvent('pyra', wcif)).toBe( wcif.events[3]);
  });

  it('test notAssignedToAnythingYetInGroup', function() {
    expect(Helpers.notAssignedToAnythingYetInGroup('1', {configuration: {stages: 1}}, 3)).toBe( true);
    expect(Helpers.notAssignedToAnythingYetInGroup('J1', {configuration: {stages: 1}}, 3)).toBe( true);
    expect(Helpers.notAssignedToAnythingYetInGroup('R1', {configuration: {stages: 1}}, 3)).toBe( true);
    expect(Helpers.notAssignedToAnythingYetInGroup('S1', {configuration: {stages: 1}}, 3)).toBe( true);
    expect(Helpers.notAssignedToAnythingYetInGroup('3', {configuration: {stages: 1}}, 3)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('J3', {configuration: {stages: 1}}, 3)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('R3', {configuration: {stages: 1}}, 3)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('S3', {configuration: {stages: 1}}, 3)).toBe( false);

    expect(Helpers.notAssignedToAnythingYetInGroup('1;R2;J4', {configuration: {stages: 1}}, 1)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;R2;J4', {configuration: {stages: 1}}, 2)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;R2;J4', {configuration: {stages: 1}}, 3)).toBe( true);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;R2;J4', {configuration: {stages: 1}}, 4)).toBe( false);

    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 1)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 2)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 3)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 4)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 5)).toBe( true);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 2}}, 6)).toBe( true);

    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 1)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 2)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 3)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 4)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 5)).toBe( false);
    expect(Helpers.notAssignedToAnythingYetInGroup('1;J4', {configuration: {stages: 3}}, 6)).toBe( false);
  });

  it('test sortCompetitorsByGroupInEvent', function() {
    const wcif: Wcif = {
      persons: [
        {name: 'Foo', sq1: {group: '12'}},
        {name: 'Foo2', sq1: {group: '3;R1;R2'}},
        {name: 'Foo3', sq1: {group: '1'}},
        {name: 'Bar', sq1: {group: '12;R3'}},
        {name: 'Bar2', sq1: {group: '1'}}
      ]
    };

    Helpers.sortCompetitorsByGroupInEvent(wcif, 'sq1');
    expect(wcif.persons[0].name).toBe( 'Bar2');
    expect(wcif.persons[1].name).toBe( 'Foo3');
    expect(wcif.persons[2].name).toBe( 'Foo2');
    expect(wcif.persons[3].name).toBe( 'Bar');
    expect(wcif.persons[4].name).toBe( 'Foo');
  });

  it('test startsWithANumber', function() {
    expect(Helpers.startsWithANumber('2')).toBeTruthy();
    expect(Helpers.startsWithANumber('2;R1')).toBeTruthy();
    expect(Helpers.startsWithANumber('1;R2;S3')).toBeTruthy();

    expect(Helpers.startsWithANumber('J2')).toBeFalsy();
    expect(Helpers.startsWithANumber('J1;R2')).toBeFalsy();
    expect(Helpers.startsWithANumber('')).toBeFalsy();
  });

  it('test sortRunnersByRunningAssigned', function() {
    const wcif: Wcif = {
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
    expect(wcif.persons[0].name).toBe( 'Foo');
    expect(wcif.persons[1].name).toBe( 'Bar2');
    expect(wcif.persons[2].name).toBe( 'Bar');
    expect(wcif.persons[3].name).toBe( 'Foo2');
    expect(wcif.persons[4].name).toBe( 'Foo3');
  });

  it('test sortByCompetingToTaskRatio', function() {
    const wcif: Wcif = {
      persons: [
        {
          name: 'Foo',
          sq1: {competing: true, group: '3'},
          '777': {competing: true, group: '1;S2;J3'}
        }, // 2/2
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

    Helpers.sortByCompetingToTaskRatio(wcif, 'sq1', wcif.persons);
    expect(wcif.persons[0].name).toBe( 'Foo3');
    expect(wcif.persons[1].name).toBe( 'Bar2');
    expect(wcif.persons[2].name).toBe( 'Foo');
    expect(wcif.persons[3].name).toBe( 'Bar');
    expect(wcif.persons[4].name).toBe( 'Foo2');
    Helpers.sortByCompetingToTaskRatio(wcif, '777', wcif.persons);
    expect(wcif.persons[0].name).toBe( 'Foo3');
    expect(wcif.persons[1].name).toBe( 'Bar2');
    expect(wcif.persons[2].name).toBe( 'Bar');
    expect(wcif.persons[3].name).toBe( 'Foo2');
    expect(wcif.persons[4].name).toBe( 'Foo');
  });

  it('test countGroupsForEvent', function() {
    const wcif: Wcif = {
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

    expect(Helpers.countGroupsForEvent(wcif, Helpers.getEvent('777', wcif))).toBe( 2);
    expect(Helpers.countGroupsForEvent(wcif, Helpers.getEvent('sq1', wcif))).toBe( 12);
  });

  it('test assignExtraJudge', function() {
    const wcif: Wcif = {
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
    expect(wcif.persons[0]['777'].group).toBe( '2;J1;S3');
  });

  it('test process and import wcif of Annuntia', function() {
    const group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();
    group.importAssignmentsFromWcif();

    Helpers.countCJRSForEvent(group.wcif, '333', 3);
    expect(Helpers.getEvent('333', group.wcif).numberOfRegistrations).toBe( 90);
    expect(Helpers.getEvent('333', group.wcif).groupCounters.length).toBe( 3);
    expect(Helpers.getEvent('333', group.wcif).groupCounters[0]).toBe( '31|16|2|3');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[1]).toBe( '29|16|2|3');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[2]).toBe( '30|15|2|3');
    expect(group.wcif.persons[0]['333'].competing).toBe( true);
    expect(group.wcif.persons[0]['333'].group).toBe( '3;R1');
  });

  it('test findFirstEventOfPerson', function() {
    const group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();
    Helpers.sortCompetitorsByName(group.wcif);

    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[0]).id).toBe( '333');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[1]).id).toBe( '333oh');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[2]).id).toBe( '333');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[3]).id).toBe( '333oh');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[4]).id).toBe( 'sq1');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[5]).id).toBe( 'sq1');
  });

  it('test findFirstEventOfPerson', function() {
    const group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();
    Helpers.sortCompetitorsByName(group.wcif);

    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[0]).id).toBe( '333');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[1]).id).toBe( '333oh');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[2]).id).toBe( '333');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[3]).id).toBe( '333oh');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[4]).id).toBe( 'sq1');
    expect(Helpers.findFirstEventOfPerson(group.wcif, group.wcif.persons[5]).id).toBe( 'sq1');
  });

  it('test generateStaffBasedOnPersonalBests', function() {
    const group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();
    const staff: StaffPerson[] = Helpers.generateStaffBasedOnPersonalBests(group.wcif);

    expect(group.wcif.persons.filter(p => p['555'].competing).length).toBe(50);
    expect(staff.filter(s => s.isAllowedTo.includes('555')).length).toBe(13);
  });

});
