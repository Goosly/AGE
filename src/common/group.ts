import {Injectable} from '@angular/core';
import {EventConfiguration, GeneralConfiguration, StaffPerson, Wcif} from './classes';
import {Helpers} from './helpers';
import {Activity, AssignmentCode, EventId, Person} from '@wca/helpers';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  wcif: Wcif;
  totalNumberOfTimers: number = 16;
  configuration: GeneralConfiguration = new GeneralConfiguration();

  constructor() {}

  generateGrouping(eventId: EventId) {
    if (this.configuration.groupStrategy === 'basic') {
      this.generateBasicGrouping(eventId);
    } else if (this.configuration.groupStrategy === 'basicBySpeed') {
      this.generateBasicBySpeedGrouping(eventId, false);
    } else if (this.configuration.groupStrategy === 'basicBySpeedReverse') {
      this.generateBasicBySpeedGrouping(eventId, true);
    } else if (this.configuration.groupStrategy === 'advanced') {
      this.generateAdvancedGrouping(eventId);
    }
  }

  generateAdvancedGrouping(eventId: EventId) {
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

  private generateBasicGrouping(eventId: EventId) { // Very simple: random groups
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

  private generateBasicBySpeedGrouping(eventId: EventId, reverse: boolean) { // Sort by speed, then loop and assign group 1, then group 2, etc.
    let event: any = this.wcif.events.filter(e => e.id === eventId)[0];
    let eventConfiguration: EventConfiguration = event.configuration;
    let sizeOfGroup = this.wcif.persons.filter(p => p[eventId].competing).length / eventConfiguration.scrambleGroups;
    Helpers.sortCompetitorsBySpeedInEvent(this.wcif, eventId, reverse);
    this.wcif.persons.filter(p => p[eventId].competing).forEach((p, index) => {
      p[eventId].group = (Math.trunc(index / sizeOfGroup) + 1) + '';
    });
    Helpers.sortCompetitorsByName(this.wcif);
  }

  private generateGroupingForEvent(eventId: EventId, staff) {
    // Make some variables
    let event: any = this.wcif.events.filter(e => e.id === eventId)[0];
    let taskCounter = this.createTaskCounter(event.configuration); // Variable to keep track of assignments for all groups
    if (event.configuration.skip) {
      return;
    }

    this.markPersonsThatArePartOfTheStaff(staff);

    this.shuffleCompetitors();
    // Determine competitors and which of them can scramble, run and/or judge
    let allCompetitors: Array<any> = this.wcif.persons.filter(p => p[eventId].competing);
    let potentialScramblers: Array<any> = this.wcif.persons.filter(p => p[eventId].competing && this.canScramble(p, staff, eventId));
    let potentialRunners: Array<any> = this.wcif.persons.filter(p => p[eventId].competing && this.canRun(p, staff));

    if (potentialScramblers.length < this.numberOfGroups(event) * event.configuration.scramblers) {
      alert('Not enough scramblers for ' + eventId + '!\nMake sure you add plenty of reliable people in your json file');
    }
    if (potentialRunners.length < this.numberOfGroups(event) * event.configuration.runners) {
      alert('Not enough runners for ' + eventId + '!\nMake sure you add plenty of reliable people in your json file');
    }

    let group: number = 0; // Group starts counting at 0, so always display as group+1
    let assignedIds: Array<number> = [];

    // 1. Find scramblers, divide them into groups
    potentialScramblers = this.sortScramblersByScramblingAssigned(potentialScramblers);
    this.moveTopFiveToPositionsForLastGroup(potentialScramblers, event);
    potentialScramblers.forEach(p => {
      if (taskCounter[group]['S']['max'] > taskCounter[group]['S']['count']) {
        // Still room for another scrambler, so let's assign group & task to him/her!
        p[eventId].group = (group + 1) + ';S' + this.nextGroupOnSameStage(group, event);
        taskCounter[group]['S']['count']++;
        assignedIds.push(p.registrantId);
      }
      group = this.increment(group, event);
    });

    // 2. Find runners, divide them into groups
    group = 0;
    potentialRunners = potentialRunners.filter(p => this.isNotAssigned(p, assignedIds));
    potentialRunners = this.sortRunnersByRunningAssigned(potentialRunners);
    this.moveTopFiveToPositionsForLastGroup(potentialRunners, event);
    potentialRunners.forEach(p => {
      if (taskCounter[group]['R']['max'] > taskCounter[group]['R']['count']) {
        // Still room for another runner, so let's assign group & task to him/her!
        p[eventId].group = (group + 1) + ';R' + this.nextGroupOnSameStage(group, event);
        taskCounter[group]['R']['count']++;
        assignedIds.push(p.registrantId);
      }
      group = this.increment(group, event);
    });

    // 3. Assign everyone else
    group = 0;
    allCompetitors = allCompetitors.filter(p => this.isNotAssigned(p, assignedIds));
    this.moveTopFiveToPositionsForLastGroup(allCompetitors, event);
    allCompetitors.forEach(p => {
      if (! this.configuration.doNotAssignJudges && this.canJudge(p) && taskCounter[group]['J']['max'] > taskCounter[group]['J']['count']) {
        // Still room for another judge, so let's assign group & task to him/her!
        p[eventId].group = (group + 1) + ';J' + this.nextGroupOnSameStage(group, event);
        taskCounter[group]['J']['count']++;
        assignedIds.push(p.registrantId);
      } else {
        p[eventId].group = (group + 1) + ''; // Person will compete in this group, but doesn't have a task
        assignedIds.push(p.registrantId);
      }
      group = this.increment(group, event);
    });

    this.countCJRSForEvent(eventId);
    Helpers.sortCompetitorsByName(this.wcif);
  }

  private moveTopFiveToPositionsForLastGroup(competitors: Array<any>, event: any) {
    if (this.isScrambleDependentEvent(event)) {
      let topFive = Helpers.getTopFiveBySpeedInEvent(this.wcif, event.id)
        .filter(p => competitors.includes(p));
      if (topFive.length <= competitors.length / event.configuration.scrambleGroups) {
        for (let i = 0; i < topFive.length; i++) {
          let m = i % event.configuration.stages;
          let g = Math.trunc(i / event.configuration.stages);
          let position = (g+1) * this.numberOfGroups(event) - m - 1;
          let positionOfTopFiveCompetitor = competitors.indexOf(topFive[i]);
          if (position === -1 || positionOfTopFiveCompetitor === -1
            || position >= competitors.length || positionOfTopFiveCompetitor >= competitors.length) {
            console.error('Error!');
          }
          if (position !== positionOfTopFiveCompetitor) {
            competitors[positionOfTopFiveCompetitor] = competitors[position];
            competitors[position] = topFive[i];
          }
        }
      } else {
        console.debug('Not doing top five in last group for event: ' + event.id);
        console.debug(competitors.length);
      }
    }
  }

  private isScrambleDependentEvent(event: any) {
    return ['222', '333', '333bf', '333oh', 'clock', 'pyram', 'skewb', 'sq1', '444bf'].includes(event.id);
  }

  private swapAssignments(a: Person, b: Person, event: any) {
    let assignmentA = a[event.id].group;
    let assignmentB = b[event.id].group;
    a[event.id].group = assignmentB;
    b[event.id].group = assignmentA;
  }

  private nextGroupOnSameStage(group: number, event: any) {
    return (((group + event.configuration.stages) % this.numberOfGroups(event)) + 1);
  }

  private markPersonsThatArePartOfTheStaff(staff: StaffPerson[]) {
    let staffWcaIds = staff.map(s => s.wcaId);
    this.wcif.persons.forEach(p => p.isStaff = staffWcaIds.includes(p.wcaId));
  }

  private numberOfGroups(event: any): number {
    return event.configuration.stages * event.configuration.scrambleGroups;
  }

  private increment(group: number, event: any): number {
    return (group + 1) % this.numberOfGroups(event); // Go back to 0 on overflow
  }

  private isNotAssigned(p: any, assignedIds: Array<number>): boolean {
    return assignedIds.indexOf(p.registrantId) === -1;
  }

  public processWcif(): void {
    if (! this.wcif.events || this.wcif.events.length === 0) {
      alert('No events found! Please define all rounds and the schedule on the WCA website and then restart.');
      this.wcif = undefined;
      throw new Error('No events');
    }

    if (! this.wcif.persons || this.wcif.persons.length === 0) {
      alert('No competitors found! Maybe registration is not open yet?');
      this.wcif = undefined;
      throw new Error('No competitors');
    }

    for (let e of this.wcif.events) {
      e.numberOfRegistrations = 0; // Add field
      if (! e.rounds || ! e.rounds.length) {
        alert('No rounds found for ' + e.id + '! Please define all rounds and the schedule on the WCA website and then restart.');
        this.wcif = undefined;
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

  public importAssignmentsFromGroupifier(): void {
    this.resetTheDefaultGroupOnesForAllCompetitors();

    let allActivities: Activity[] = this.getAllActivitiesFromWcif();
    this.wcif.persons.forEach(p => this.readPersonAssignmentsFromGroupifier(p, allActivities));
  }

  private resetTheDefaultGroupOnesForAllCompetitors() {
    this.wcif.persons.forEach(p => {
      this.wcif.events.forEach(e => {
        p[e.id].group = '';
      })
    });
  }

  private readPersonAssignmentsFromGroupifier(p: Person, allActivities: Activity[]) {
    this.sortAssignmentsByAssignmentCode(p);
    p.assignments.forEach(assignmentFromGroupifier => {
      let activity = allActivities.filter(a => a.id.toString() === assignmentFromGroupifier.activityId.toString());
      if (activity.length === 0) {
        return;
      }
      let activityCode: string[] = activity[0].activityCode.split('-');
      this.validateActivityCode(activityCode);
      let eventId = activityCode[0];
      let group: number = parseInt(activityCode[2].substring(1));

      if (p[eventId].group.length !== 0) {
        p[eventId].group += ';';
      }
      p[eventId].group += this.convertAssignmentCodeFromGroupifier(assignmentFromGroupifier.assignmentCode);
      p[eventId].group += group.toString();
    });
  }

  private convertAssignmentCodeFromGroupifier(code: AssignmentCode) {
    switch (code) {
      case 'competitor':
        return '';
      case 'staff-judge':
        return 'J';
      case 'staff-scrambler':
        return 'S';
      case 'staff-runner':
        return 'R';
      case 'staff-dataentry':
        return 'D';
      case 'staff-announcer':
        return 'A';
    }
  }

  private validateActivityCode(activityCode: string[]) {
    if (activityCode.length !== 3) {
      throw new Error('Expected activity to have 3 parts, but wasn\'t: ' + activityCode.join('-'));
    }
    if (!this.wcif.events.map(e => e.id).includes(activityCode[0])){
      throw new Error('Expected activity to be of some event, but wasn\'t: ' + activityCode[0]);
    }
    if (activityCode[1] !== 'r1') {
      throw new Error('Expected activity to be of round 1, but wasn\'t: ' + activityCode[1]);
    }
    if (! RegExp('^[ag][0-9]+$').test(activityCode[2])){
      throw new Error('Expected activity to indicate a group, but wasn\'t: ' + activityCode[2]);
    }
  }

  private sortAssignmentsByAssignmentCode(p: Person) {
    // codes: 'competitor' | 'staff-judge' | 'staff-scrambler' | 'staff-runner'
    p.assignments = p.assignments.sort((a, b) => a.assignmentCode.localeCompare(b.assignmentCode));
  }

  private getAllActivitiesFromWcif() {
    let allActivities: Activity[] = [];
    this.wcif.schedule.venues.forEach(v => {
      v.rooms.forEach(r => r.activities.forEach(a => {
        allActivities.push(a);
        a.childActivities.forEach(childActivity => allActivities.push(childActivity));
      }));
    });
    return allActivities;
  }

  importAssignmentsFromCsv(callback: (competitors: number) => void) {
    let file = document.getElementById('importCsv')['files'][0];
    if (file) {
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function(e) {
        let csv: string = e.target['result'];
        let lines: string[] = csv.includes('\r\n') ? csv.split('\r\n') : csv.split('\n');
        let headers = lines[0].split(',');
        let competitors = lines.splice(1);
        let importedCompetitorsCounter = 0;
        for (let i = 0; i < competitors.length; i++) {
          if (competitors[i] === null || competitors[i] === undefined || competitors[i] === "") {
            continue;
          }
          let competitorToImport = competitors[i].split(',');
          let matchingPersons = this.wcif.persons.filter(p => p.name === competitorToImport[0] || p.fullName === competitorToImport[0]);
          if (matchingPersons.length === 0) {
            continue;
          }
          for (let j = 1; j < headers.length; j++) {
            matchingPersons[0][headers[j]].group = competitorToImport[j];
          }
          importedCompetitorsCounter++;
        }
        callback(importedCompetitorsCounter);
      }.bind(this);
    } else {
      alert("Please select a CSV file to import first");
      throw Error("No CSV file to import");
    }
  }

  public setEventConfiguration() {
    let defaults : Array<EventConfiguration> = [
      { id: '222', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '333', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '444', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '555', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '666', stages: 1, scramblers: 2, runners: 1, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '777', stages: 1, scramblers: 2, runners: 1, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '333bf', stages: 1, scramblers: 1, runners: 1, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '333oh', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: '333ft', stages: 1, scramblers: 2, runners: 1, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'clock', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'minx', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'pyram', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'skewb', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
      { id: 'sq1', stages: 1, scramblers: 2, runners: 2, timers: this.totalNumberOfTimers, totalTimers: this.totalNumberOfTimers, skip: false, scrambleGroups: 2 },
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
    if (this.configuration.doNotAssignTasksToNewCompetitors && !person.wcaId) {
      return false;
    }

    if (this.configuration.skipDelegatesAndOrganizers
      && (person.roles.includes('delegate')
        || person.roles.includes('organizer'))) {
      return false;
    }

    return true;
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
