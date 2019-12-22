import {Injectable} from '@angular/core';
import {Wcif, EventConfiguration, GeneralConfiguration} from './classes';
import {Helpers} from './helpers';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  wcif: Wcif;
  totalNumberOfTimers: number = 16;
  configuration: GeneralConfiguration = new GeneralConfiguration();

  constructor() {}

  generateGrouping(eventId: string) {
    if (this.configuration.groupStrategy === 'basic') {
      this.generateBasicGrouping(eventId);
    } else {
      this.generateAdvancedGrouping(eventId);
    }
  }

  generateAdvancedGrouping(eventId: string) {
    let generateGroupingForEvent = (e, s) => this.generateGroupingForEvent(e, s);
    let file = document.getElementById('staff')['files'][0];
    let staff = null;
    if (file) {
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function(e) {
        staff = JSON.parse(e.target['result']);
        generateGroupingForEvent(eventId, staff);
      };
    } else if (this.configuration.everyoneCanScrambleAndRun) {
      generateGroupingForEvent(eventId, []);
    } else {
      alert("There are no scramblers and runners! Please select a json file or allow everyone to scramble and run (NOT RECOMMENDED).");
      throw Error("No scramblers and runners");
    }
  }

  private generateBasicGrouping(eventId: string) { // Very simple: random groups
    let event: any = this.wcif.events.filter(e => e.id === eventId)[0];
    let eventConfiguration: EventConfiguration = event.configuration;
    let i = 0;
    this.shuffleCompetitors();
    this.wcif.persons.filter(p => p[eventId].competing).forEach(p => {
      p[eventId].group = (i + 1) + '';
      i = (i + 1) % eventConfiguration.scrambleGroups;
    });
    Helpers.sortCompetitorsByName(this.wcif);
  }

  private generateGroupingForEvent(eventId: string, staff) {
    // Make some variables
    let event: any = this.wcif.events.filter(e => e.id === eventId)[0];
    let configuration: EventConfiguration = event.configuration;
    let numberOfGroups: number = configuration.stages * configuration.scrambleGroups;
    let taskCounter = this.createTaskCounter(configuration); // Variable to keep track of assignments for all groups
    if (configuration.skip) {
      return;
    }

    this.shuffleCompetitors();
    // Determine competitors and which of them can scramble, run and/or judge
    let allCompetitors: Array<any> = this.wcif.persons.filter(p => p[eventId].competing);
    let potentialScramblers: Array<any> = this.wcif.persons.filter(p => p[eventId].competing && this.canScramble(p, staff, eventId));
    let potentialRunners: Array<any> = this.wcif.persons.filter(p => p[eventId].competing && this.canRun(p, staff));

    if (potentialScramblers.length < numberOfGroups * configuration.scramblers) {
      alert('Not enough scramblers for ' + eventId + '!\nMake sure you add plenty of reliable people in your json file, then retry.');
      Helpers.sortCompetitorsByName(this.wcif);
      return;
    }
    if (potentialRunners.length < numberOfGroups * configuration.runners) {
      alert('Not enough runners for ' + eventId + '!\nMake sure you add plenty of reliable people in your json file, then retry.');
      Helpers.sortCompetitorsByName(this.wcif);
      return;
    }

    let group: number = 0; // Group starts counting at 0, so always display as group+1
    let assignedIds: Array<number> = [];

    // 1. Find scramblers, divide them into groups
    potentialScramblers = this.sortScramblersByScramblingAssigned(potentialScramblers);
    potentialScramblers.forEach(p => {
      if (taskCounter[group]['S']['max'] > taskCounter[group]['S']['count']) {
        // Still room for another scrambler, so let's assign group & task to him/her!
        p[eventId].group = (group + 1) + ';S' + (((group + configuration.stages) % numberOfGroups) + 1);
        taskCounter[group]['S']['count']++;
        assignedIds.push(p.registrantId);
      }
      group = this.nextGroup(group, numberOfGroups);
    });

    // 2. Find runners, divide them into groups
    potentialRunners = this.sortRunnersByRunningAssigned(potentialRunners);
    potentialRunners.filter(p => this.isNotAssigned(p, assignedIds)).forEach(p => {
      if (taskCounter[group]['R']['max'] > taskCounter[group]['R']['count']) {
        // Still room for another runner, so let's assign group & task to him/her!
        p[eventId].group = (group + 1) + ';R' + (((group + configuration.stages) % numberOfGroups) + 1);
        taskCounter[group]['R']['count']++;
        assignedIds.push(p.registrantId);
      }
      group = this.nextGroup(group, numberOfGroups);
    });

    // 3. Assign everyone else
    allCompetitors.filter(p => this.isNotAssigned(p, assignedIds)).forEach(p => {
      if (this.canJudge(p) && taskCounter[group]['J']['max'] > taskCounter[group]['J']['count']) {
        // Still room for another judge, so let's assign group & task to him/her!
        p[eventId].group = (group + 1) + ';J' + (((group + configuration.stages) % numberOfGroups) + 1);
        taskCounter[group]['J']['count']++;
        assignedIds.push(p.registrantId);
      } else {
        p[eventId].group = (group + 1) + ''; // Person will compete in this group, but doesn't have a task
        assignedIds.push(p.registrantId);
      }
      group = this.nextGroup(group, numberOfGroups);
    });

    this.countCJRSForEvent(eventId);
    Helpers.sortCompetitorsByName(this.wcif);
  }

  private nextGroup(group: number, numberOfGroups: number): number {
    return (group + 1) % numberOfGroups; // Go back to 0 on overflow
  }

  private isNotAssigned(p: any, assignedIds: Array<number>): boolean {
    return assignedIds.indexOf(p.registrantId) === -1;
  }

  processWcif(): void {
    if (! this.wcif.events || this.wcif.events.length === 0) {
      alert('No events found! Please define all rounds and the schedule on the WCA website and then restart.');
      this.wcif = null;
      throw new Error('No events');
    }

    if (! this.wcif.persons || this.wcif.persons.length === 0) {
      alert('No competitors found! Maybe registration is not open yet?');
      this.wcif = null;
      throw new Error('No competitors');
    }

    // TODO count rounds (only one round?)
    for (let e of this.wcif.events) {
      e.numberOfRegistrations = 0; // Add field
      if (! e.rounds || ! e.rounds.length) {
        alert('No rounds found for ' + e.id + '! Please define all rounds and the schedule on the WCA website and then restart.');
        this.wcif = null;
        throw new Error('No rounds for ' + e.id);
      }
      e.round1 = e.rounds[0];
      e.numberOfRounds =  !e.rounds ? 0 : e.rounds.length;

      e.startTime = '';
      for (let v of this.wcif.schedule.venues) {
        for (let r of v.rooms) {
          for (let a of r.activities) {
            if (a.activityCode.startsWith(e.id + '-r1') // This is a round 1 of e
                && (e.startTime === '' || e.startTime > a.startTime)) { // Starttime is earlier than currently known
              e.startTime = a.startTime;
            }
          }
        }
      }
    }
	  // All events should have a startTime now (if they're included in the schedule)
    this.sortEventsByStartTime();

    // For every person: set registration fields per event to 1 or 0 (and count per event)
    let idsToRemove = [];
    for (let p of this.wcif.persons) {
      p.fullName = p.name;
      p.name = p.name.split('(')[0]; // Remove local name
      
      if (!p.registration || p.registration.status !== 'accepted') {
        idsToRemove.push(p.registrantId);
        continue;
      }
      for (let e of this.wcif.events) {
        if (p.registration.eventIds.indexOf(e.id) > -1) {
          p[e.id] = { competing: true, group: '1' };
          e.numberOfRegistrations++;
        } else {
          p[e.id] = { competing: false, group: '' };
        }
      }
    }

    // Remove registrations that are not accepted
    this.wcif.persons = this.wcif.persons.filter(p => idsToRemove.indexOf(p.registrantId) === -1);

    // Set configuration for events
    this.setEventConfiguration();
  }

  public setEventConfiguration() {
    let defaults : Array<EventConfiguration> = [
      { id: '222', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '333', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '444', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '555', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '666', stages: 1, scramblers: 2, runners: 1, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '777', stages: 1, scramblers: 2, runners: 1, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '333bf', stages: 1, scramblers: 1, runners: 1, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '333oh', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '333ft', stages: 1, scramblers: 2, runners: 1, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'clock', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'minx', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'pyram', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'skewb', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'sq1', stages: 1, scramblers: 2, runners: 2, timers: (this.totalNumberOfTimers), totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '444bf', stages: 1, scramblers: 2, runners: 0, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: true, scrambleGroups: 2 },
      { id: '555bf', stages: 1, scramblers: 2, runners: 0, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: true, scrambleGroups: 2 },
      { id: '333mbf', stages: 1, scramblers: 2, runners: 0, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: true, scrambleGroups: 2 },
      { id: '333fm', stages: 1, scramblers: 2, runners: 0, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: true, scrambleGroups: 2 },
    ];

    for (let e of this.wcif.events) {
      e.configuration = defaults.filter(d => d.id === e.id)[0];
      e.configuration.scrambleGroups = Math.max(e.round1.scrambleSetCount, e.configuration.scrambleGroups);
    }
  }
  
  public countCJRSForEvent(eventId: string) {
    let event: any = this.wcif.events.filter(e => e.id === eventId)[0];
    let configuration: EventConfiguration = event.configuration;
    let numberOfGroups: number = configuration.stages * configuration.scrambleGroups;

    event.groupCounters = [];
    let group: number = 1;
    while (group <= numberOfGroups) {
      let groupCounter: string = this.wcif.persons
        .filter(p => p[eventId].group.split(';').indexOf(group.toString()) > -1).length + '|';
      groupCounter += this.wcif.persons
        .filter(p => p[eventId].group.split(';').indexOf('J' + group) > -1).length + '|';
      groupCounter += this.wcif.persons
        .filter(p => p[eventId].group.split(';').indexOf('R' + group) > -1).length + '|';
      groupCounter += this.wcif.persons
        .filter(p => p[eventId].group.split(';').indexOf('S' + group) > -1).length;
      event.groupCounters.push(groupCounter);
      group++;
    }
  }

  private canJudge(person): boolean {
    return ! this.configuration.skipDelegatesAndOrganizers
      || (person.roles.indexOf('delegate') < 0
        && person.roles.indexOf('organizer') < 0);
  }

  private canScramble(person, staff, event): boolean {
    if (this.configuration.everyoneCanScrambleAndRun) {
      return !!person.wcaId && this.canJudge(person);
    }
    let x = staff.filter(s => s.wcaId === person.wcaId);
    if (x.length === 1) {
      return x[0].isAllowedTo.indexOf('scrambleEverything') > -1 || x[0].isAllowedTo.indexOf(event) > -1;
    }
    return false;
  }

  private canRun(person, staff): boolean {
    if (this.configuration.everyoneCanScrambleAndRun) {
      return !!person.wcaId && this.canJudge(person);
    }
    let x = staff.filter(s => s.wcaId === person.wcaId);
    if (x.length === 1) {
      return x[0].isAllowedTo.indexOf('run') > -1;
    }
    return false;
  }

  private sortScramblersByScramblingAssigned(persons: any) {
    return this.sortByAssignedTaskOfType(persons, 'S');
  }

  private sortRunnersByRunningAssigned(persons: any) {
    return this.sortByAssignedTaskOfType(persons, 'R');
  }

  private sortByAssignedTaskOfType(persons: any, taskType: string) {
    return persons.sort(function (a, b) {
      var countA = this.allEventIds().filter(e => a[e].group.indexOf(taskType) > -1).length;
      var countB = this.allEventIds().filter(e => b[e].group.indexOf(taskType) > -1).length;
      return (countA < countB) ? -1 : (countA > countB) ? 1 : 0;
    }.bind(this));
  }

  private allEventIds(): string[] {
    return this.wcif.events.map(e => e.id);
  }

  private shuffleCompetitors() {
    let i,j,x;
    for (i = this.wcif.persons.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = this.wcif.persons[i];
      this.wcif.persons[i] = this.wcif.persons[j];
      this.wcif.persons[j] = x;
    }
  }

  private sortEventsByStartTime() {
    this.wcif.events = this.wcif.events.sort(function(a, b) {
      var textA = a.startTime;
      var textB = b.startTime;
      if (textA === '') {
        return 1;
      }
      if (textB === '') {
        return -1;
      }
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
  }

  private createTaskCounter(configuration: EventConfiguration) {
    let numberOfGroups: number = configuration.stages * configuration.scrambleGroups;
    let tasks = [
      {	'J': { 'max': configuration.timers, 'count': 0 },
        'R': { 'max': configuration.runners, 'count': 0 },
        'S': { 'max': configuration.scramblers, 'count': 0 } }
    ];
    for (let i = 0; i < numberOfGroups; i++) {
      tasks.push( JSON.parse(JSON.stringify(tasks[0])));
    }
    return tasks;
  }

}
