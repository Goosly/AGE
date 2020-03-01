import {Wcif} from './classes';
import {Activity, EventId, getEventName, Person} from '@wca/helpers';
import {environment} from '../environments/environment';
import * as moment from 'moment-timezone';

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

    let s = this.splitInGroups('2020-02-15T09:15:00Z', '2020-02-15T10:00:00Z', 2);
    console.log(s);
    s = this.splitInGroups('2020-02-15T09:15:00Z', '2020-02-15T10:00:00Z', 3);
    console.log(s);

    'Europe/Brussels';
    '2020-02-15T09:15:00Z';
    '2020-02-15T09:37:30Z';
    '2020-02-15T10:00:00Z';
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
    } = this.parseActivityCode(activityCode);
    return [
      eventId && getEventName(eventId),
      roundNumber && `Round ${roundNumber}`,
      groupNumber && `Group ${groupNumber}`,
      attemptNumber && `Attempt ${attemptNumber}`,
    ]
      .filter(x => x)
      .join(', ');
  };

  private parseActivityCode(activityCode) {
    const [, e, r, g, a] = activityCode.match(
      /(\w+)(?:-r(\d+))?(?:-g(\d+))?(?:-a(\d+))?/
    );
    return {
      eventId: e,
      roundNumber: r && parseInt(r, 10),
      groupNumber: g && parseInt(g, 10),
      attemptNumber: a && parseInt(a, 10),
    };
  }

}
