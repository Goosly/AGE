import {AnnuntiaWcif} from '../test/annuntia';
import {ActivityHelper} from './activity';
import {GroupService} from './group';
import {Helpers} from './helpers';

describe('test', function() {

  it('test addChildActivitiesForFirstRounds with stages', function() {
    const group: GroupService = new GroupService(null);
    group.wcif = AnnuntiaWcif.wcif;
    group.processWcif();
    const activity = group.wcif.schedule.venues[0].rooms[0].activities[13];
    activity.childActivities = [];

    const event = Helpers.getEvent('333', group.wcif);
    event.configuration.stages = 3;

    ActivityHelper.addChildActivitiesForFirstRounds(group.wcif);

    expect(activity.activityCode).toBe('333-r1');
    expect(activity.childActivities.length).toBe(9);
    expect(activity.childActivities[0].activityCode).toBe('333-r1-g1');
    expect(activity.childActivities[1].activityCode).toBe('333-r1-g2');
    expect(activity.childActivities[2].activityCode).toBe('333-r1-g3');
    expect(activity.childActivities[3].activityCode).toBe('333-r1-g4');
    expect(activity.childActivities[4].activityCode).toBe('333-r1-g5');
    expect(activity.childActivities[5].activityCode).toBe('333-r1-g6');
    expect(activity.childActivities[6].activityCode).toBe('333-r1-g7');
    expect(activity.childActivities[7].activityCode).toBe('333-r1-g8');
    expect(activity.childActivities[8].activityCode).toBe('333-r1-g9');

    expect(activity.childActivities[0].startTime).toBe('2020-02-16T09:15:00Z');
    expect(activity.childActivities[0].endTime).toBe('2020-02-16T09:40:00Z');
    expect(activity.childActivities[1].startTime).toBe('2020-02-16T09:15:00Z');
    expect(activity.childActivities[1].endTime).toBe('2020-02-16T09:40:00Z');
    expect(activity.childActivities[2].startTime).toBe('2020-02-16T09:15:00Z');
    expect(activity.childActivities[2].endTime).toBe('2020-02-16T09:40:00Z');

    expect(activity.childActivities[3].startTime).toBe('2020-02-16T09:40:00Z');
    expect(activity.childActivities[3].endTime).toBe('2020-02-16T10:05:00Z');
    expect(activity.childActivities[4].startTime).toBe('2020-02-16T09:40:00Z');
    expect(activity.childActivities[4].endTime).toBe('2020-02-16T10:05:00Z');
    expect(activity.childActivities[5].startTime).toBe('2020-02-16T09:40:00Z');
    expect(activity.childActivities[5].endTime).toBe('2020-02-16T10:05:00Z');

    expect(activity.childActivities[6].startTime).toBe('2020-02-16T10:05:00Z');
    expect(activity.childActivities[6].endTime).toBe('2020-02-16T10:30:00Z');
    expect(activity.childActivities[7].startTime).toBe('2020-02-16T10:05:00Z');
    expect(activity.childActivities[7].endTime).toBe('2020-02-16T10:30:00Z');
    expect(activity.childActivities[8].startTime).toBe('2020-02-16T10:05:00Z');
    expect(activity.childActivities[8].endTime).toBe('2020-02-16T10:30:00Z');

    group.wcif.schedule.venues[0].rooms[0].activities
      .filter(activity => !activity.activityCode.includes('-r1') && !activity.activityCode.startsWith('other'))
      .forEach(activity => {
        expect(activity.childActivities.length).toBeLessThanOrEqual(2);
        activity.childActivities.forEach(child => {
          expect(child.startTime).toEqual(activity.startTime);
          expect(child.endTime).toEqual(activity.endTime);
          expect(child.name.startsWith(activity.name)).toBeTruthy();
        });
      });
  });

});
