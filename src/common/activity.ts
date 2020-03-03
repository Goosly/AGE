import {Activity, getEventName} from '@wca/helpers';
import * as moment from 'moment-timezone';
import {activityCodeToName, parseActivityCode} from '@wca/helpers/lib/helpers/activity';
import {Helpers} from './helpers';

export class ActivityHelper {

  public static testMomentJsStuff() {
    /*
    console.log(moment('2020-02-15T09:15:00Z'));
    console.log(moment('2020-02-15T09:37:30Z'));

    let duration = moment.duration(moment('2020-02-15T10:00:00Z').diff(moment('2020-02-15T09:15:00Z')));
    console.log('diff in seconds = ' + (duration / 1000));

    let m = moment('2020-02-15T09:15:00Z');
    let numberOfGroups = 2;
    console.log('duration: ');
    console.log(duration);
    console.log(duration.asMilliseconds());
    console.log(m.add(duration.asMilliseconds() / numberOfGroups));

    console.log(m.tz('Europe/Brussels').format('H:mm'));
    console.log(m.add(duration.asMilliseconds() / numberOfGroups).tz('Europe/Brussels').format('H:mm:ss'));
    */

    /*
    let s = this.splitInGroups('2020-02-15T09:15:00Z', '2020-02-15T10:00:00Z', 2);
    console.log(s);
    s = this.splitInGroups('2020-02-15T09:15:00Z', '2020-02-15T10:00:00Z', 3);
    console.log(s);
     */

    'Europe/Brussels';
    '2020-02-15T09:15:00Z';
    '2020-02-15T09:37:30Z';
    '2020-02-15T10:00:00Z';
  }

  public static addChildActivitiesForEveryRound(wcif) {
    let currentId = this.getHighestActivityId(wcif) + 1;
    wcif.schedule.venues.forEach(v => {
      v.rooms.forEach(r => r.activities.forEach(a => {
        if (! a.activityCode.startsWith('other') && ! a.activityCode.includes('-a')) {
          let activityCode = parseActivityCode(a.activityCode);
          let event = Helpers.getEvent(activityCode.eventId, wcif);
          this.createChildActivitiesFor(a, event);
          currentId = this.assignIdsToChildActivities(a.childActivities, currentId);
        }
      }));
    });
  }

  private static createChildActivitiesFor(a: Activity, event): void {
    a.childActivities = [];

    let numberOfGroups = event.configuration.scrambleGroups;
    let timesOfGroups = this.splitInGroups(a.startTime, a.endTime, numberOfGroups);

    let childActivities = [];
    for (let stageIndex = 0; stageIndex < event.configuration.stages; stageIndex++) {
      for (let groupIndex = 0; groupIndex < numberOfGroups; groupIndex++) {
        let activityCode = a.activityCode + '-g' + ((groupIndex + 1) * (stageIndex + 1));
        let childActivity = {
          id: null,
          name: activityCodeToName(activityCode),
          activityCode: activityCode,
          startTime: timesOfGroups[groupIndex],
          endTime: timesOfGroups[groupIndex + 1],
          childActivities: [],
          scrambleSetId: null
        };
        a.childActivities.push(childActivity);
      }
    }
  }

  public static getAllActivitiesFromWcif(wcif): Activity[] {
    let allActivities: Activity[] = [];
    wcif.schedule.venues.forEach(v => {
      v.rooms.forEach(r => r.activities.forEach(a => {
        allActivities.push(a);
        a.childActivities.forEach(childActivity => allActivities.push(childActivity));
      }));
    });
    return allActivities;
  }

  private static getHighestActivityId(wcif) {
    let activities = this.getAllActivitiesFromWcif(wcif);
    return Math.max(...activities.map(a => a.id));
  }

  private static splitInGroups(startTime: string, endTime: string, numberOfGroups: number): string[] {
    let startMoment = moment(startTime);
    let endMoment = moment(endTime);
    let durationOfOneGroupAsMilliseconds = moment.duration(endMoment.diff(startMoment)).asMilliseconds() / numberOfGroups;

    let allTimes = [startTime];
    for (let i = 1; i < numberOfGroups; i++) {
      let endOfGroup = moment(startMoment).add(durationOfOneGroupAsMilliseconds * i);
      allTimes.push(endOfGroup.tz('UTC').format());
    }
    allTimes.push(endTime);
    return allTimes;
  }

  private activityCodeToName(activityCode) {
    const {
      eventId,
      roundNumber,
      groupNumber,
      attemptNumber,
    } = parseActivityCode(activityCode);
    return [
      eventId && getEventName(eventId),
      roundNumber && `Round ${roundNumber}`,
      groupNumber && `Group ${groupNumber}`,
      attemptNumber && `Attempt ${attemptNumber}`,
    ]
      .filter(x => x)
      .join(', ');
  };

  private static assignIdsToChildActivities(childActivities: Activity[], currentId: number) {
    childActivities.forEach(a => a.id = currentId++);
    return currentId;
  }

}
