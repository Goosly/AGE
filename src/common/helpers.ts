import {Wcif} from './classes';
import {EventId, Person} from '@wca/helpers';
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

  static fillAllUsedTimersWithJudges(wcif: Wcif, eventId: string, userWcaId: string) {
    if (userWcaId !== "2010VERE01") {
      return;
    }

    let event: any = Helpers.getEvent(eventId, wcif);
    if (event.configuration.scrambleGroups <= 2) {
      return;
    }

    let numberOfGroups = event.configuration.scrambleGroups * event.configuration.stages;
    let group: number = 1;
    while (group <= numberOfGroups) {
      let competitors: number = this.countCompetitors(wcif, eventId, group);
      let judges: number = this.countJudges(wcif, eventId, group);

      while (judges !== competitors) {

        // todo add a judge somewhere

        competitors = this.countCompetitors(wcif, eventId, group);
        judges = this.countJudges(wcif, eventId, group);
      }
      group++;
    }

  }

  static countCJRSForEvent(wcif: Wcif, eventId: string, numberOfGroups?: number) {
    let event: any = Helpers.getEvent(eventId, wcif);
    if (!!numberOfGroups) {
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

  private static countScramblers(wcif: Wcif, eventId: string, group: number) {
    return wcif.persons
      .filter(p => p[eventId].group.split(';').indexOf('S' + group) > -1);
  }

  private static countRunners(wcif: Wcif, eventId: string, group: number) {
    return wcif.persons
      .filter(p => p[eventId].group.split(';').indexOf('R' + group) > -1).length;
  }

  private static countJudges(wcif: Wcif, eventId: string, group: number) {
    return wcif.persons
      .filter(p => p[eventId].group.split(';').indexOf('J' + group) > -1).length;
  }

  private static countCompetitors(wcif: Wcif, eventId: string, group: number) {
    return wcif.persons
      .filter(p => p[eventId].group.split(';').indexOf(group.toString()) > -1).length;
  }

}
