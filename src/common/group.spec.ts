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

  it('test getContentForStaffExample for Annuntia', function() {
    const exportService = new ExportService();
    const staffExample = exportService.getContentForStaffExample(AnnuntiaWcif.wcif);
    const lines = staffExample.split('\r\n');
    expect(lines[0]).toBe('name,wcaId,run,222,333,444,555,666,777,333bf,333oh,clock,minx,pyram,skewb,sq1,444bf,555bf,333mbf');
    expect(lines[2]).toBe('Adrien Schumacker,2016SCHU02,x,x,x,x,x,,x,,x,,,x,,,,,');
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

  it('test similarTasksAs', function() {
    expect(Assignment.fromString('1;J2').similarTasksAs('1;J2')).toBe( true);
    expect(Assignment.fromString('1;J2').similarTasksAs('2;J1')).toBe( true);
    expect(Assignment.fromString('1;R2').similarTasksAs('2;R1')).toBe( true);

    expect(Assignment.fromString('1;J2').similarTasksAs('2;R1')).toBe( false);
    expect(Assignment.fromString('1;S2').similarTasksAs('2;R1')).toBe( false);
  });

});
