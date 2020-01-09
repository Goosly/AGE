import {Wcif} from './classes';
import {EventId, Person} from '@wca/helpers';

export class Helpers {

  public static sortCompetitorsByGroupInEvent(wcif: Wcif, eventId: string) {
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

  public static sortCompetitorsBySpeedInEvent(wcif: Wcif, eventId: EventId, reverse: boolean) {
    wcif.persons = this.sortBySpeed(wcif, eventId);
    if (reverse) {
      wcif.persons = wcif.persons.reverse();
    }
  }

  public static getTopFiveBySpeedInEvent(wcif: Wcif, eventId: EventId): Person[] {
    return this.sortBySpeed(wcif, eventId).slice(0, 4);
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

  public static sortCompetitorsByName(wcif: Wcif) {
    wcif.persons = wcif.persons.sort(function(a, b) {
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
  }
}
