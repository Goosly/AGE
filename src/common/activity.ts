import {Activity} from '@wca/helpers';
import * as moment from 'moment-timezone';
import {activityCodeToName, parseActivityCode, ParsedActivityCode} from '@wca/helpers/lib/helpers/activity';
import {Helpers} from './helpers';
import {Wcif} from './classes';

export class ActivityHelper {

  public static addChildActivitiesForEveryRound(wcif) {
    let currentId = this.getHighestActivityId(wcif) + 1;
    wcif.schedule.venues.forEach(v => {
      v.rooms.forEach(r => r.activities.forEach(a => {
        if (! a.activityCode.startsWith('other')) {
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
    for (let groupIndex = 0; groupIndex < numberOfGroups; groupIndex++) {
      for (let stageIndex = 0; stageIndex < event.configuration.stages; stageIndex++) {
        let code = this.addGroupToCodeOfActivity(a, groupIndex, stageIndex, numberOfGroups);

        let childActivity = {
          id: null,
          name: activityCodeToName(code),
          activityCode: code,
          startTime: timesOfGroups[groupIndex],
          endTime: timesOfGroups[groupIndex + 1],
          childActivities: [],
          scrambleSetId: null
        };
        a.childActivities.push(childActivity);
      }
    }
  }

  private static addGroupToCodeOfActivity(a: Activity, groupIndex: number, stageIndex: number, numberOfGroups) {
    let activityCode = parseActivityCode(a.activityCode);
    activityCode.groupNumber = 1 + (groupIndex + stageIndex * numberOfGroups);
    return this.formatActivityCode(activityCode);
  }

  private static formatActivityCode(activityCode: ParsedActivityCode) {
    let formattedActivityCode = activityCode.eventId + '-r' + activityCode.roundNumber + '-g' + activityCode.groupNumber;
    if (!!activityCode.attemptNumber) {
      formattedActivityCode += ('-a' + activityCode.attemptNumber);
    }
    return formattedActivityCode;
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

  private static assignIdsToChildActivities(childActivities: Activity[], currentId: number) {
    childActivities.forEach(a => a.id = currentId++);
    return currentId;
  }

  static createAssignmentsInWcif(wcif: Wcif) {
    this.resetAssignmentsOfAllPersons(wcif);

    let groupActivities = this.getAllGroupActivitiesForRoundsOne(wcif);
    groupActivities.forEach(activity => {
      let activityCode = parseActivityCode(activity.activityCode);
      let competitors = wcif.persons.filter(p => p[activityCode.eventId].group.split(';')[0] === ('' + activityCode.groupNumber));
      competitors.forEach(competitor => this.createAssignmentFor(competitor, activity, 'competitor'));
      let judges = wcif.persons.filter(p => p[activityCode.eventId].group.split(';').includes('J' + activityCode.groupNumber));
      judges.forEach(judge => this.createAssignmentFor(judge, activity, 'staff-judge'));
      let scramblers = wcif.persons.filter(p => p[activityCode.eventId].group.split(';').includes('S' + activityCode.groupNumber));
      scramblers.forEach(scrambler => this.createAssignmentFor(scrambler, activity, 'staff-scrambler'));
      let runners = wcif.persons.filter(p => p[activityCode.eventId].group.split(';').includes('R' + activityCode.groupNumber));
      runners.forEach(runner => this.createAssignmentFor(runner, activity, 'staff-runner'));
    });
  }

  private static resetAssignmentsOfAllPersons(wcif: Wcif) {
    wcif.persons.forEach(p => {
      p.assignments = [];
    });
  }

  private static getAllGroupActivitiesForRoundsOne(wcif: Wcif) {
    let activitiesFromWcif = this.getAllActivitiesFromWcif(wcif);
    return activitiesFromWcif.filter(a => a.activityCode.includes('-r1-g'));
  }

  private static createAssignmentFor(person: any, activity: Activity, assignmentCode: string) {
    person.assignments.push({
      activityId: activity.id,
      stationNumber: null,
      assignmentCode: assignmentCode
    });
  }

}
