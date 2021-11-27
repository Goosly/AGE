import {StaffPerson, Wcif} from './classes';
import {Event, EventId, Person} from '@wca/helpers';
import {environment} from '../environments/environment';

export class Helpers {

  static sortCompetitorsByGroupInEvent(wcif: Wcif, eventId: string) {
    wcif.persons = wcif.persons.sort(function(a, b) {
      var textA = a[eventId].group;
      var textB = b[eventId].group;
      if (textA === '') {
        return 1;
      }
      if (textB === '') {
        return -1;
      }
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
  }

  static sortCompetitorsBySpeedInEvent(wcif: Wcif, eventId: EventId, reverse: boolean) {
    wcif.persons = this.sortBySpeed(wcif, eventId);
    if (reverse) {
      wcif.persons = wcif.persons.reverse();
    }
  }

  static getTopCompetitorsBySpeedInEvent(wcif: Wcif, eventId: EventId): Person[] {
    let peopleCompetingInEvent = this.sortBySpeed(wcif, eventId).filter(p => p[eventId].competing);
    let slice = peopleCompetingInEvent.slice(0, Math.floor(Math.max(5, peopleCompetingInEvent.length / 10)));
    if (environment.testMode) {
      console.log('top ' + slice.length + ' of ' + eventId + ": " + slice.map(p => p.name).join(", "));
    }
    return slice;
  }

  private static sortBySpeed(wcif: Wcif, eventId: EventId): Person[] {
    return wcif.persons.sort(function (a: Person, b: Person) {
      var wrA = this.worldRankingOfPersonInEvent(a, eventId);
      var wrB = this.worldRankingOfPersonInEvent(b, eventId);
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
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
  }

  static getEvent(eventId: string, wcif: Wcif) {
    return wcif.events.filter(e => e.id === eventId)[0];
  }

  static countCJRSForEvent(wcif: Wcif, eventId: string, numberOfGroups?: number) {
    let event: any = Helpers.getEvent(eventId, wcif);
    if (!numberOfGroups) {
      numberOfGroups = event.configuration.scrambleGroups * event.configuration.stages;
    }

    event.groupCounters = [];
    let group: number = 1;
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
    let allEventIds = this.allEventIds(wcif);
    return persons.sort(function (a: Person, b: Person) {
      if (this.isOrganizerOrDelegate(b)) {
        return -1;
      }
      if (this.isOrganizerOrDelegate(a)) {
        return 1;
      }
      var countA = this.countTasks(a, allEventIds, taskType);
      var countB = this.countTasks(b, allEventIds, taskType);
      return (countA < countB) ? -1 : (countA > countB) ? 1 : 0;
    }.bind(this));
  }

  public static sortByCompetingToTaskRatio(wcif: Wcif, eventId: string, persons: any[]) {
    let allEventIds = this.allEventIds(wcif);
    return persons.sort(function (a: Person, b: Person) {
      var groupsOfAInEvent = a[eventId].group.split(';').length;
      var groupsOfBInEvent = b[eventId].group.split(';').length;
      if (groupsOfAInEvent != groupsOfBInEvent) {
        return groupsOfAInEvent < groupsOfBInEvent ? -1 : 1;
      }

      var countTaskA = this.countTasks(a, allEventIds);
      var countCompetingA = allEventIds.filter(e => a[e].competing).length;
      var countTaskB = this.countTasks(b, allEventIds);
      var countCompetingB = allEventIds.filter(e => b[e].competing).length;
      let countA = countTaskA / countCompetingA;
      let countB = countTaskB / countCompetingB;
      return (countA < countB) ? -1 : (countA > countB) ? 1 : 0;
    }.bind(this));
  }

  private static countTasks(p: Person, allEventIds: string[], taskType?: string): number {
    let tasksPerEvent = allEventIds.map(e => {
      let assignments = p[e].group.split(';');
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
    let g = parseInt(assignment.match(/[0-9]+/)[0]);
    let stages = event.configuration.stages;
    return ((g-1) - ((g-1)%stages)) === ((group-1) - ((group-1)%stages));
  }

  public static isOrganizerOrDelegate(person) {
    return person.roles.includes('delegate') || person.roles.includes('organizer');
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
      let groupA = parseInt(a.match(/[0-9]+/)[0]);
      let groupB = parseInt(b.match(/[0-9]+/)[0]);
      return (groupA < groupB) ? -1 : (groupA > groupB) ? 1 : 0;
    }).join(';');
  }

  static countGroupsForEvent(wcif: any, event: Event): number {
    return Math.max(...(wcif.persons.filter(p => p[event.id].competing)
      .map(p => {
        let assignments = p[event.id].group.split(';');
        return !!assignments[0] ? parseInt(assignments[0].match(/[0-9]+/)[0]) : 0;
      })));
  }

  static generateStaffBasedOnPersonalBests(wcif: Wcif) {
    let staff: StaffPerson[] = this.getInitialStaff(wcif);
    for (let e of wcif.events) {
      Helpers.sortCompetitorsBySpeedInEvent(wcif, e.id, false);
      wcif.persons.forEach((p, i, array) => {
        if (i < array.length / 2 && !!p.wcaId) {
          let staffPerson: StaffPerson = this.findInStaff(p, staff);
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
      let staffPerson: StaffPerson = new StaffPerson();
      staffPerson.name = p.name;
      staffPerson.wcaId = p.wcaId;
      staffPerson.isAllowedTo = ['run'];
      return staffPerson;
    });
  }

}
