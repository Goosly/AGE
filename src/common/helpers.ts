import {Assignment, StaffPerson, Wcif} from './classes';
import {Event, EventId, Person} from '@wca/helpers';
import {environment} from '../environments/environment';

export class Helpers {

  static sortCompetitorsByGroupInEvent(wcif: Wcif, eventId: string) {
    wcif.persons = wcif.persons.sort(function(a, b) {
      const textA = a[eventId].group;
      const textB = b[eventId].group;
      if (textA === '') {
        return 1;
      }
      if (textB === '') {
        return -1;
      }
      if (this.startsWithANumber(textA) && this.startsWithANumber(textB)) {
        return (parseInt(textA) < parseInt(textB)) ? -1 : (parseInt(textA) > parseInt(textB)) ? 1 : 0;
      }
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    }.bind(this));
  }

  static startsWithANumber(s: string) {
    return new RegExp('[0-9]+').test(s);
  }

  static sortCompetitorsBySpeedInEvent(wcif: Wcif, eventId: EventId, reverse: boolean) {
    wcif.persons = this.sortBySpeed(wcif, eventId);
    if (reverse) {
      wcif.persons = wcif.persons.reverse();
    }
  }

  static getTopCompetitorsBySpeedInEvent(wcif: Wcif, eventId: EventId): Person[] {
    const peopleCompetingInEvent = this.sortBySpeed(wcif, eventId).filter(p => p[eventId].competing);
    const slice = peopleCompetingInEvent.slice(0, Math.floor(Math.max(5, peopleCompetingInEvent.length / 10)));
    if (environment.testMode) {
      console.log('top ' + slice.length + ' of ' + eventId + ': ' + slice.map(p => p.name).join(', '));
    }
    return slice;
  }

  private static sortBySpeed(wcif: Wcif, eventId: EventId): Person[] {
    return wcif.persons.sort(function (a: Person, b: Person) {
      const wrA = this.worldRankingOfPersonInEvent(a, eventId);
      const wrB = this.worldRankingOfPersonInEvent(b, eventId);
      if (isNaN(wrA)) {
        return 1;
      }
      if (isNaN(wrB)) {
        return -1;
      }
      return (wrA < wrB) ? -1 : (wrA > wrB) ? 1 : 0;
    }.bind(this));
  }

  private static worldRankingOfPersonInEvent(person: Person, eventId: EventId): number {
    if (person.personalBests === null || ! person.personalBests.map(pb => pb.eventId).includes(eventId)) {
      return NaN;
    }
    return Math.min(...person.personalBests.filter(pb => pb.eventId === eventId).map(pb => pb.worldRanking));
  }

  static sortCompetitorsByName(wcif: Wcif) {
    wcif.persons = wcif.persons.sort(function(a, b) {
      const textA = a.name.toUpperCase();
      const textB = b.name.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
  }

  static getEvent(eventId: string, wcif: Wcif) {
    return wcif.events.filter(e => e.id === eventId)[0];
  }

  static countCJRSForEvent(wcif: Wcif, eventId: string, numberOfGroups?: number) {
    const event: any = Helpers.getEvent(eventId, wcif);
    if (!numberOfGroups) {
      numberOfGroups = event.configuration.scrambleGroups * event.configuration.stages;
    }

    event.groupCounters = [];
    let group = 1;
    while (group <= numberOfGroups) {
      let groupCounter: string = this.countCompetitors(wcif, eventId, group) + '|';
      groupCounter += this.countJudges(wcif, eventId, group) + '|';
      groupCounter += this.countRunners(wcif, eventId, group) + '|';
      groupCounter += this.countScramblers(wcif, eventId, group).length;
      event.groupCounters.push(groupCounter);
      group++;
    }
  }

  public static countScramblers(wcif: Wcif, eventId: string, group: number) {
    return wcif.persons
      .filter(p => p[eventId].group.split(';').indexOf('S' + group) > -1);
  }

  public static countRunners(wcif: Wcif, eventId: string, group: number) {
    return wcif.persons
      .filter(p => p[eventId].group.split(';').indexOf('R' + group) > -1).length;
  }

  public static countJudges(wcif: Wcif, eventId: string, group: number) {
    return wcif.persons
      .filter(p => p[eventId].group.split(';').indexOf('J' + group) > -1).length;
  }

  public static countCompetitors(wcif: Wcif, eventId: string, group: number) {
    return wcif.persons
      .filter(p => p[eventId].group.split(';').indexOf(group.toString()) > -1).length;
  }

  public static sortScramblersByScramblingAssigned(wcif: Wcif, persons: any) {
    return this.sortByAssignedTaskOfType(wcif, persons, 'S');
  }

  public static sortRunnersByRunningAssigned(wcif: Wcif, persons: any) {
    return this.sortByAssignedTaskOfType(wcif, persons, 'R');
  }

  private static sortByAssignedTaskOfType(wcif: Wcif, persons: any, taskType: string) {
    const allEventIds = this.allEventIds(wcif);
    return persons.sort(function (a: Person, b: Person) {
      if (this.isOrganizerOrDelegate(b)) {
        return -1;
      }
      if (this.isOrganizerOrDelegate(a)) {
        return 1;
      }
      const countA = this.countTasks(a, allEventIds, taskType);
      const countB = this.countTasks(b, allEventIds, taskType);
      return (countA < countB) ? -1 : (countA > countB) ? 1 : 0;
    }.bind(this));
  }

  public static sortByCompetingToTaskRatio(wcif: Wcif, eventId: string, persons: any[]) {
    const allEventIds = this.allEventIds(wcif);
    return persons.sort(function (a: Person, b: Person) {
      const groupsOfAInEvent = a[eventId].group.split(';').length;
      const groupsOfBInEvent = b[eventId].group.split(';').length;
      if (groupsOfAInEvent != groupsOfBInEvent) {
        return groupsOfAInEvent < groupsOfBInEvent ? -1 : 1;
      }

      const countTaskA = this.countTasks(a, allEventIds);
      const countCompetingA = allEventIds.filter(e => a[e].competing).length;
      const countTaskB = this.countTasks(b, allEventIds);
      const countCompetingB = allEventIds.filter(e => b[e].competing).length;
      const countA = countTaskA / countCompetingA;
      const countB = countTaskB / countCompetingB;
      return (countA < countB) ? -1 : (countA > countB) ? 1 : 0;
    }.bind(this));
  }

  private static countTasks(p: Person, allEventIds: string[], taskType?: string): number {
    const tasksPerEvent = allEventIds.map(e => {
      const assignments = p[e].group.split(';');
      return assignments.filter(a => {
        if (!!taskType) {
          return a.startsWith(taskType);
        }
        return a.startsWith('J') || a.startsWith('R') || a.startsWith('S');
      }).length;
    });
    return this.sum(tasksPerEvent);
  }

  private static sum(tasksPerEvent: number[]) {
    let sum = 0;
    for (let i = 0; i < tasksPerEvent.length; i++) {
      sum += tasksPerEvent[i];
    }
    return sum;
  }

  private static allEventIds(wcif: Wcif): string[] {
    return wcif.events.map(e => e.id);
  }

  public static notAssignedToAnythingYetInGroup(assignment: string, event: any, group: number): boolean {
    return assignment.split(';').filter(a => Helpers.matchesGroup(a, event, group)).length === 0;
  }

  private static matchesGroup(assignment: string, event: any, group: number) {
    const g = parseInt(assignment.match(/[0-9]+/)[0]);
    const stages = event.configuration.stages;
    return ((g - 1) - ((g - 1) % stages)) === ((group - 1) - ((group - 1) % stages));
  }

  public static isOrganizerOrDelegate(person) {
    return person.roles.includes('delegate')
      || person.roles.includes('trainee-delegate')
      || person.roles.includes('organizer');
  }

  public static assignExtraJudge(person: any, eventId: string, group: number) {
    person[eventId].group += (';J' + group);
    person[eventId].group = person[eventId].group.split(';').sort((a: string, b: string) => {
      if (!a.match(/^[JRS]/)) {
        return -1;
      }
      if (!b.match(/^[JRS]/)) {
        return 1;
      }
      const groupA = parseInt(a.match(/[0-9]+/)[0]);
      const groupB = parseInt(b.match(/[0-9]+/)[0]);
      return (groupA < groupB) ? -1 : (groupA > groupB) ? 1 : 0;
    }).join(';');
  }

  static countGroupsForEvent(wcif: any, event: Event): number {
    return Math.max(...(wcif.persons.filter(p => p[event.id].competing)
      .map(p => {
        const assignments = p[event.id].group.split(';');
        return !!assignments[0] ? parseInt(assignments[0].match(/[0-9]+/)[0]) : 0;
      })));
  }

  static generateStaffBasedOnPersonalBests(wcif: Wcif) {
    const staff: StaffPerson[] = this.getInitialStaff(wcif);
    for (const e of wcif.events) {
      Helpers.sortCompetitorsBySpeedInEvent(wcif, e.id, false);
      wcif.persons.forEach((p, i, array) => {
        if (i < array.length / 2 && !!p.wcaId) {
          const staffPerson: StaffPerson = this.findInStaff(p, staff);
          staffPerson.isAllowedTo.push(e.id);
        }
      });
    }
    return staff;
  }

  private static findInStaff(p, staff: StaffPerson[]) {
    return staff.find(staffPerson => staffPerson.wcaId === p.wcaId);
  }

  private static getInitialStaff(wcif: Wcif) {
    Helpers.sortCompetitorsByName(wcif);
    return wcif.persons.filter(p => !!p.wcaId).map(p => {
      const staffPerson: StaffPerson = new StaffPerson();
      staffPerson.name = p.name;
      staffPerson.wcaId = p.wcaId;
      staffPerson.isAllowedTo = ['run'];
      return staffPerson;
    });
  }

  public static findFirstEventOfPerson(wcif: Wcif, p: Person) {
    for (const event of wcif.events) {
      if (p[event.id].competing) {
        return event;
      }
    }
    return null;
  }

  public static competesBeforeJudging(p: Person, eventId: string): boolean {
    return Assignment.fromString(p[eventId].group).competesBeforeJudging();
  }

}
