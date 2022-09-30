import {GroupService} from './group';
import {Helpers} from './helpers';
import {Assignment, StaffPerson, Wcif} from './classes';
import {AnnuntiaWcif} from '../test/annuntia';
import {BelgianOpenWcif} from '../test/belgian-open';
import {ExportService} from './export';

describe('test', function() {
  it('test decrement', function() {
    const event = {
      configuration: {stages: 2, scrambleGroups: 2}
    };
    const group: GroupService = new GroupService();

    expect(group.decrement(3, event)).toBe(2);
    expect(group.decrement(2, event)).toBe(1);
    expect(group.decrement(1, event)).toBe(0);
    expect(group.decrement(0, event)).toBe(3);
  });

  it('test parseInt match', function() {
    expect(parseInt('2'.match(/[0-9]+/)[0])).toBe(2);
    expect(parseInt('J2'.match(/[0-9]+/)[0])).toBe(2);
    expect(parseInt('R10'.match(/[0-9]+/)[0])).toBe(10);
    expect(parseInt('S12'.match(/[0-9]+/)[0])).toBe(12);
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
    expect(wcif.persons[0].name).toBe( 'Foo3');
    expect(wcif.persons[1].name).toBe( 'Bar2');
    expect(wcif.persons[2].name).toBe( 'Foo2');
    expect(wcif.persons[3].name).toBe( 'Foo');
    expect(wcif.persons[4].name).toBe( 'Bar');
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

  it('test generate basic grouping of Belgian Open', function() {
    const group: GroupService = new GroupService();
    group.wcif = BelgianOpenWcif.wcif;
    group.processWcif();
    group.importAssignmentsFromWcif();

    Helpers.countCJRSForEvent(group.wcif, '333', 3);
    expect(Helpers.getEvent('333', group.wcif).numberOfRegistrations).toBe( 94);
    expect(Helpers.getEvent('333', group.wcif).groupCounters.length).toBe( 3);
    expect(Helpers.getEvent('333', group.wcif).groupCounters[0]).toBe( '0|0|0|0');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[1]).toBe( '0|0|0|0');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[2]).toBe( '0|0|0|0');
    expect(group.wcif.persons[0]['333'].competing).toBe( true);
    expect(group.wcif.persons[0]['333'].group).toBe( '');

    group.generateGrouping('333');
    group.generateGrouping('444');
    group.wcif.persons.forEach(p => {
      if (p['333'].competing) {
        expect(p['333'].group >= '1').toBe( true);
        expect(p['333'].group <= '3').toBe( true);
      } else {
        expect(p['333'].group).toBe( '');
      }
      if (p['444'].competing) {
        expect(p['444'].group >= '1').toBe( true);
        expect(p['444'].group <= '2').toBe( true);
      } else {
        expect(p['444'].group).toBe( '');
      }
    });

    Helpers.getEvent('444bf', group.wcif).configuration.skip = false;
    group.generateGrouping('444bf');
    group.wcif.persons.forEach(p => {
      if (p['444bf'].competing) {
        expect(p['444bf'].group).toBe( '1');
      } else {
        expect(p['444bf'].group).toBe( '');
      }
    });
  });

  it('test generate advanced grouping wcif of Annuntia', function() {
    const group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();

    group.wcif.persons.forEach(p => {
      for (const e of group.wcif.events) {
        if (p[e.id].competing) {
          expect(p[e.id].group).toBe( '1');
        } else {
          expect(p[e.id].group).toBe( '');
        }
      }
    });

    group.configuration.groupStrategy = 'advanced';
    group.configuration.autoPickScramblersAndRunners = true;

    group.generateGrouping('333');

    Helpers.countCJRSForEvent(group.wcif, '333', 3);
    expect(Helpers.getEvent('333', group.wcif).numberOfRegistrations).toBe( 90);
    expect(Helpers.getEvent('333', group.wcif).groupCounters.length).toBe( 3);
    expect(Helpers.getEvent('333', group.wcif).groupCounters[0]).toBe( '30|16|2|2');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[1]).toBe( '30|16|2|2');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[2]).toBe( '30|16|2|2');
    group.wcif.persons.forEach(p => {
      if (p['333'].competing) {
        expect(p['333'].group >= '1').toBe( true);
        expect(p['333'].group < '4').toBe( true); // Example: '3;R2' is smaller than '4'
      } else {
        expect(p['333'].group).toBe( '');
      }
    });

    group.configuration.fixedSeating = true;
    group.wcif.events.forEach(e => {
      e.configuration.stages = 2;
      e.configuration.timers = group.configuration.totalNumberOfTimers / 2;
    });
  });

  it('test generate advanced grouping wcif of Annuntia with fixed seating', function() {
    const group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();

    group.configuration.groupStrategy = 'advanced';
    group.configuration.autoPickScramblersAndRunners = true;
    group.configuration.fixedSeating = true;
    group.wcif.events.forEach(e => {
      e.configuration.stages = 2;
      e.configuration.timers = group.configuration.totalNumberOfTimers / 2;
    });

    group.generateGrouping('333');

    Helpers.countCJRSForEvent(group.wcif, '333', 6);
    expect(Helpers.getEvent('333', group.wcif).groupCounters.length).toBe( 6);
    expect(Helpers.getEvent('333', group.wcif).groupCounters[0]).toBe( '15|15|2|2');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[1]).toBe( '15|15|2|2');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[2]).toBe( '15|15|2|2');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[3]).toBe( '15|15|2|2');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[4]).toBe( '15|15|2|2');
    expect(Helpers.getEvent('333', group.wcif).groupCounters[5]).toBe( '15|15|2|2');
    group.wcif.persons.forEach(p => {
      if (p['333'].competing) {
        expect(p['333'].group >= '1').toBe( true);
        expect(p['333'].group < '7').toBe( true); // Example: '6;R2' is smaller than '7'
      } else {
        expect(p['333'].group).toBe( '');
      }
    });
  });

  it('test generate advanced grouping wcif of Annuntia: new competitors compete first, then judge', function() {
    const group: GroupService = new GroupService();
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();

    group.configuration.groupStrategy = 'advanced';
    group.configuration.autoPickScramblersAndRunners = true;
    group.wcif.events.forEach(e => {
      e.configuration.stages = 2;
      e.configuration.timers = group.configuration.totalNumberOfTimers / 2;
    });

    group.wcif.events.forEach(e => group.generateGrouping(e.id));

    group.wcif.persons.forEach(p => {
      if (!p.wcaId) {
        const event = Helpers.findFirstEventOfPerson(group.wcif, p);
        expect(Helpers.competesBeforeJudging(p, event.id)).toBe( true);
      }
    });
  });

  it('test Assignment', function() {
    const assignment: Assignment = new Assignment();
    assignment.compete = 2;
    assignment.judge = [4, 5];
    assignment.scramble = [1];
    assignment.run = [3];

    expect(assignment.competing()).toBe( true);
    expect(assignment.toString()).toBe( '2;S1;R3;J4;J5');

    assignment.compete = null;
    expect(assignment.competing()).toBe( false);
    expect(assignment.toString()).toBe( 'S1;R3;J4;J5');
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

  it('test getContentForStaffExample for Annuntia', function() {
    const exportService = new ExportService();
    const staffExample = exportService.getContentForStaffExample(AnnuntiaWcif.wcif);
    const lines = staffExample.split('\r\n');
    expect(lines[0]).toBe('name,wcaId,run,222,333,444,555,666,777,333bf,333oh,clock,minx,pyram,skewb,sq1,444bf,555bf,333mbf');
    expect(lines[2]).toBe('Adrien Schumacker,2016SCHU02,x,x,x,x,x,,x,x,x,,x,x,x,x,,,');
    for (let i = 1; i < lines.length - 1; i++) {
      const split = lines[i].split(',');
      expect(split.length).toBe( 19);
      expect(split.includes('x')).toBe( true);
    }
    expect(lines[lines.length - 1]).toBe( '');
  });

  it('test getStaff', function() {
    const group: GroupService = new GroupService();

    const csv = 'name,wcaId,run,222,333,444,555,666,777,333bf,333oh,clock,minx,pyram,skewb,sq1,444bf,555bf,333mbf\r\nAdrien Schumacker,2016SCHU02,x,x,x,x,x,,x,x,x,,x,x,x,x,,,\r\n';
    const staff: StaffPerson[] = group.getStaff(csv);

    expect(staff[0].name).toBe( 'Adrien Schumacker');
    expect(staff[0].wcaId).toBe( '2016SCHU02');
    expect(staff[0].isAllowedTo.length).toBe( 12);
    expect(staff[0].isAllowedTo[0]).toBe( 'run');
    expect(staff[0].isAllowedTo[1]).toBe( '222');
    expect(staff[0].isAllowedTo[2]).toBe( '333');
    expect(staff[0].isAllowedTo[3]).toBe( '444');
    expect(staff[0].isAllowedTo[4]).toBe( '555');
    expect(staff[0].isAllowedTo[5]).toBe( '777');
    expect(staff[0].isAllowedTo[6]).toBe( '333bf');
    expect(staff[0].isAllowedTo[7]).toBe( '333oh');
    expect(staff[0].isAllowedTo[8]).toBe( 'minx');
    expect(staff[0].isAllowedTo[9]).toBe( 'pyram');
    expect(staff[0].isAllowedTo[10]).toBe( 'skewb');
    expect(staff[0].isAllowedTo[11]).toBe( 'sq1');
  });

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

  it('test similarTasksAs', function() {
    expect(Assignment.fromString('1;J2').similarTasksAs('1;J2')).toBe( true);
    expect(Assignment.fromString('1;J2').similarTasksAs('2;J1')).toBe( true);
    expect(Assignment.fromString('1;R2').similarTasksAs('2;R1')).toBe( true);

    expect(Assignment.fromString('1;J2').similarTasksAs('2;R1')).toBe( false);
    expect(Assignment.fromString('1;S2').similarTasksAs('2;R1')).toBe( false);
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

});
