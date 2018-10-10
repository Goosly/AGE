import {Injectable} from '@angular/core';
import {Wcif, EventConfiguration, GeneralConfiguration} from '../common/classes';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  wcif: Wcif;
  totalNumberOfTimers: number = 16;
  configuration: GeneralConfiguration = new GeneralConfiguration();

  constructor() {}

  generateGrouping(eventId: string) {
    let handler = (eventId, staff) => this.staffIsReadyForGrouping(eventId, staff);
    let file = document.getElementById('staff')['files'][0];
    let staff = null;
    if (file) {
      var reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function(e) {
        staff = JSON.parse(e.target['result']);
        handler(eventId, staff);
      };
    } else {
      // Note that this is the staff.json file, but minified
      staff = JSON.parse('[{"name":"Philipp Weyer","wcaId":"2010WEYE01","isAllowedTo":["run","scrambleEverything"]},{"name":"Mats Valk","wcaId":"2007VALK01","isAllowedTo":["run","scrambleEverything"]},{"name":"Sebastian Weyer","wcaId":"2010WEYE02","isAllowedTo":["run","scrambleEverything"]},{"name":"Erik Akkersdijk","wcaId":"2005AKKE01","isAllowedTo":["run","scrambleEverything"]},{"name":"Patrick Hetco","wcaId":"2011HETC01","isAllowedTo":["run","scrambleEverything"]},{"name":"Callum Hales-Jepp","wcaId":"2012HALE01","isAllowedTo":["run","scrambleEverything"]},{"name":"David Vos","wcaId":"2008VOSD01","isAllowedTo":["run","scrambleEverything"]},{"name":"Finn Ickler","wcaId":"2012ICKL01","isAllowedTo":["run","scrambleEverything"]},{"name":"Clément Cherblanc","wcaId":"2014CHER05","isAllowedTo":["run","scrambleEverything"]},{"name":"Oscar Roth Andersen","wcaId":"2008ANDE02","isAllowedTo":["run","scrambleEverything"]},{"name":"Sebastiano Tronto","wcaId":"2011TRON02","isAllowedTo":["run","scrambleEverything"]},{"name":"James Molloy","wcaId":"2011MOLL01","isAllowedTo":["run","scrambleEverything"]},{"name":"Annika Stein","wcaId":"2014STEI03","isAllowedTo":["run","scrambleEverything"]},{"name":"Laurence Livsey","wcaId":"2012LIVS01","isAllowedTo":["run","scrambleEverything"]},{"name":"Ron van Bruchem","wcaId":"2003BRUC01","isAllowedTo":["run","scrambleEverything"]},{"name":"Manu Vereecken","wcaId":"2010VERE01","isAllowedTo":["run","scrambleEverything"]},{"name":"Nora Christ","wcaId":"2009CHRI03","isAllowedTo":["run","scrambleEverything"]},{"name":"Radu Făciu","wcaId":"2009FACI01","isAllowedTo":["run","scrambleEverything"]},{"name":"Joe Theis","wcaId":"2017THEI02","isAllowedTo":["run","scrambleEverything"]},{"name":"Nathan Daviaud","wcaId":"2017DAVI29","isAllowedTo":["run","scrambleEverything"]},{"name":"Jules Desjardin","wcaId":"2010DESJ01","isAllowedTo":["run","scrambleEverything"]},{"name":"Abdelhak Kaddour","wcaId":"2010KADD01","isAllowedTo":["run","scrambleEverything"]},{"name":"Antoine Piau","wcaId":"2008PIAU01","isAllowedTo":["run","scrambleEverything"]},{"name":"Valentin Hoffmann","wcaId":"2011HOFF02","isAllowedTo":["run","scrambleEverything"]},{"name":"Maxence Baudry","wcaId":"2014BAUD02","isAllowedTo":["run","scrambleEverything"]},{"name":"Louis Fertier","wcaId":"2013FERT01","isAllowedTo":["run","scrambleEverything"]},{"name":"Anthony Lafourcade","wcaId":"2014LAFO01","isAllowedTo":["run","scrambleEverything"]},{"name":"Rémi Esturoune","wcaId":"2010ESTU01","isAllowedTo":["run","scrambleEverything"]},{"name":"Victor Wijsman","wcaId":"2016WIJS01","isAllowedTo":["run","scrambleEverything"]},{"name":"Fanny Pousset","wcaId":"2016POUS01","isAllowedTo":["run","scrambleEverything"]},{"name":"Philippe Virouleau","wcaId":"2008VIRO01","isAllowedTo":["run","scrambleEverything"]},{"name":"Adrien Schumacker","wcaId":"2016SCHU02","isAllowedTo":["run","scrambleEverything"]},{"name":"Clara Lafourcade","wcaId":"2014LAFO02","isAllowedTo":["run","scrambleEverything"]},{"name":"Rui Reis","wcaId":"2015REIS02","isAllowedTo":["run","scrambleEverything"]},{"name":"Lina Tissier","wcaId":"2009TISS01","isAllowedTo":["run","scrambleEverything"]},{"name":"Philippe Lucien","wcaId":"2011LUCI01","isAllowedTo":["run","scrambleEverything"]},{"name":"Juliette Sébastien","wcaId":"2014SEBA01","isAllowedTo":["run","scrambleEverything"]},{"name":"Joffrey Lenoble","wcaId":"2007LENO01","isAllowedTo":["run","scrambleEverything"]},{"name":"Benjamin Sintes","wcaId":"2007SINT01","isAllowedTo":["run","scrambleEverything"]},{"name":"Benoît Goubin","wcaId":"2008GOUB01","isAllowedTo":["run","scrambleEverything"]},{"name":"Guillaume Sintes","wcaId":"2008SINT01","isAllowedTo":["run","scrambleEverything"]},{"name":"Pauline Bonnaudet","wcaId":"2009BONN01","isAllowedTo":["run","scrambleEverything"]},{"name":"Lucas Cai","wcaId":"2012CAIL01","isAllowedTo":["run","scrambleEverything"]}]');
      handler(eventId, staff);
    }
  }

  private staffIsReadyForGrouping(eventId: string, staff) {
    // Make some variables
    let event: any = this.wcif.events.filter(e => e.id === eventId)[0];
    let numberOfCompetitors: number = event.numberOfRegistrations;
    let configuration: EventConfiguration = event.configuration;
    let numberOfGroups: number = configuration.stages * configuration.scrambleGroups;
    let tasks = this.createTaskCounter(configuration); // Variable to keep track of assignments for all groups
    if (configuration.skip) {
      return;
    }
    
    this.shuffleCompetitors();
    // Determine competitors and which of them can scramble, run and/or judge
    let allCompetitors: Array<any> = this.wcif.persons.filter(p => p[eventId].competing);
    let potentialScramblers: Array<any> = this.wcif.persons.filter(p => p[eventId].competing && this.canScramble(p, staff, eventId));
    let potentialRunners: Array<any> = this.wcif.persons.filter(p => p[eventId].competing && this.canRun(p, staff));
    
    if (potentialScramblers.length < numberOfGroups * configuration.scramblers) {
      this.sortCompetitorsByName();
      alert("Not enough scramblers for " + eventId! + " Aborting event...");
      return;
    }
    if (potentialRunners.length < numberOfGroups * configuration.runners) {
      this.sortCompetitorsByName();
      alert("Not enough runners for " + eventId! + " Aborting event...");
      return;
    }
    
    let group: number = 0; // Group starts counting at 0, so always display as group+1
    let assignedIds: Array<number> = [];

    // 1. Find scramblers, divide them into groups
    potentialScramblers.forEach(p => {
      if (tasks[group]["S"]["max"] > tasks[group]["S"]["count"]) {
        // Still room for another scrambler, so let's assign group & task to him/her!
        p[eventId].group = (group + 1) + ";S" + (((group + configuration.stages) % numberOfGroups) + 1);
        tasks[group]["S"]["count"]++;
        assignedIds.push(p.registrantId);
      }
      group = this.nextGroup(group, numberOfGroups);
    });

    // 2. Find runners, divide them into groups
    potentialRunners.filter(p => this.isNotAssigned(p, assignedIds)).forEach(p => {
      if (tasks[group]["R"]["max"] > tasks[group]["R"]["count"]) {
        // Still room for another runner, so let's assign group & task to him/her!
        p[eventId].group = (group + 1) + ";R" + (((group + configuration.stages) % numberOfGroups) + 1);
        tasks[group]["R"]["count"]++;
        assignedIds.push(p.registrantId);
      }
      group = this.nextGroup(group, numberOfGroups);
    });

    // 3. Assign everyone else
    allCompetitors.filter(p => this.isNotAssigned(p, assignedIds)).forEach(p => {
      if (this.canJudge(p) && tasks[group]["J"]["max"] > tasks[group]["J"]["count"]) {
        // Still room for another judge, so let's assign group & task to him/her!
        p[eventId].group = (group + 1) + ";J" + (((group + configuration.stages) % numberOfGroups) + 1);
        tasks[group]["J"]["count"]++;
        assignedIds.push(p.registrantId);
      } else {
        p[eventId].group = (group + 1) + ""; // Person will compete in this group, but doesn't have a task
        assignedIds.push(p.registrantId);
      }
      group = this.nextGroup(group, numberOfGroups);
    });

    this.sortCompetitorsByName();
  }

  private nextGroup(group: number, numberOfGroups: number): number {
    return (group + 1) % numberOfGroups; // Go back to 0 on overflow
  }

  private isNotAssigned(p: any, assignedIds: Array<number>): boolean {
    return assignedIds.indexOf(p.registrantId) === -1;
  }

  processWcif() : void {
    // TODO count rounds (only one round?)
    for (let e of this.wcif.events) {
      e.numberOfRegistrations = 0; // Add field
      if (! e.rounds || ! e.rounds.length) {
        alert("No rounds found for " + e.id + "! Please define all rounds and the schedule on the WCA website and then restart.");
        this.wcif = null;
        throw "No rounds for " + e.id;
      }
      e.round1 = e.rounds[0];

      e.startTime = '';
      for(let v of this.wcif.schedule.venues) {
        for(let r of v.rooms) {
          for(let a of r.activities) {
            if (a.activityCode.startsWith(e.id + "-r1") // This is a round 1 of e
                && (e.startTime === '' || e.startTime > a.startTime)) { // Starttime is earlier than currently known
              e.startTime = a.startTime;
            }
          }
        }
      }
    }
    this.sortEventsByStartTime();

    // For every person: set registration fields per event to 1 or 0 (and count per event)
    let idsToRemove = [];
    for (let p of this.wcif.persons) {
      if (p.registration.status !== 'accepted') {
        idsToRemove.push(p.registrantId);
        continue;
      }
      for (let e of this.wcif.events) {
        if(p.registration.eventIds.indexOf(e.id) > -1) {
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
    }
  }

  private canJudge(person) : boolean {
    return ! this.configuration.skipDelegatesAndOrganizers
      || (person.roles.indexOf("delegate") < 0
        && person.roles.indexOf("organizer") < 0);
  };
  
  private canScramble(person, staff, event) : boolean {
    if (this.configuration.everyoneCanScrambleAndRun) {
      return this.canJudge(person);
    }
    let x = staff.filter(s => s.wcaId === person.wcaId);
    if (x.length === 1) {
      return x[0].isAllowedTo.indexOf("scrambleEverything") > -1 || x[0].isAllowedTo.indexOf(event) > -1;
    }
    return false;
  };
  
  private canRun(person, staff) : boolean {
    if (this.configuration.everyoneCanScrambleAndRun) {
      return this.canJudge(person);
    }
    let x = staff.filter(s => s.wcaId === person.wcaId);
    if (x.length === 1) {
      return x[0].isAllowedTo.indexOf("run") > -1;
    }
    return false;
  };

  private shuffleCompetitors() {
    let i,j,x;
    for (i = this.wcif.persons.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = this.wcif.persons[i];
      this.wcif.persons[i] = this.wcif.persons[j];
      this.wcif.persons[j] = x;
    }
  }

  public sortCompetitorsByName() {
    this.wcif.persons = this.wcif.persons.sort(function(a, b) {
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
  }

  public sortCompetitorsByEvent(eventId: string) {
    this.wcif.persons = this.wcif.persons.sort(function(a, b) {
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
      {	"J": { "max": configuration.timers, "count": 0 },
        "R": { "max": configuration.runners, "count": 0 },
        "S": { "max": configuration.scramblers, "count": 0 } }
    ];
    for (let i = 0; i < numberOfGroups; i++) {
      tasks.push( JSON.parse(JSON.stringify(tasks[0])));
    }
    return tasks;
  }

}