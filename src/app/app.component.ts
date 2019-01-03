import { Component } from '@angular/core';
import { ApiService } from '../common/api';
import { GroupService } from '../common/group';
import { ExportService } from '../common/export';
import { EventConfiguration } from '../common/classes';
declare var $ :any;

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  // Keep track of app flow
  // TODO replace this by one state?
  groupsGenerated: boolean = false;
  readyForExport: boolean = false;

  // Info about competitions managed by user
  competitionsToChooseFrom: Array<String> = null;
  competitionId: string;
  numberOfEvents: number;
  numberOfCompetitors: number;

  // Fields for binding
  filter: string = '';
  competitorsToShow: Array<any>;
  showAdvanced: boolean;
  groupCounter: Array<number> = [];
  Math: any;

  constructor (
    public apiService: ApiService,
    public groupService: GroupService,
    public exportService: ExportService
    ) {
      this.Math = Math;
      if (this.apiService.oauthToken) {
        this.handleGetCompetitions();
      }
  }

  handleLoginToWca() {
    this.apiService.logIn();
  }

  handleGetCompetitions() {
    this.apiService.getCompetitions().subscribe(comps => {
      if (comps.length === 1) {
        this.handleCompetitionSelected(comps[0]['id']);
      }
      this.competitionsToChooseFrom = comps.map(c => c['id']);
    });
  }

  handleCompetitionSelected(competitionId: string) {
    this.competitionId = competitionId;
    this.apiService.getWcif(this.competitionId).subscribe(wcif => {
      this.groupService.wcif = wcif;
      try {
        this.groupService.processWcif();
        this.numberOfEvents = this.groupService.wcif["events"].length;
        this.numberOfCompetitors = this.groupService.wcif["persons"].length;
        this.competitorsToShow = this.groupService.wcif.persons;
      } catch (error) {
        console.error(error);
        this.groupService.wcif = null;
        this.competitionId = null;
      }
    });
  }

  handleTotalNumberOfTimersSet(value: number) {
    this.groupService.totalNumberOfTimers = Math.max(1, value);
    this.groupService.setEventConfiguration();
  }

  handleNumberOfStagesSet(value: number, eventId: string) {
    let event: EventConfiguration = this.groupService.wcif.events.filter(e => e.id === eventId)[0].configuration;
    event.stages = value;
    event.timers = event.totalTimers / event.stages;
  }

  handleGenerate() {
    try {
      this.groupService.wcif.events.forEach(e => {
        this.handleGenerateOneEvent(e.id);
        this.groupCounter = Array(Math.max(this.groupCounter.length, e.configuration.stages * e.configuration.scrambleGroups));
      });
      this.groupsGenerated = true;
    } catch (error) {
      console.error(error);
    }
  };

  handleGenerateOneEvent(eventId: string) {
    this.groupService.generateGrouping(eventId);
  }

  handleExport(value: boolean) {
    this.groupService.sortCompetitorsByName();
    this.readyForExport = value;
  }

  handleFilterChanged(value: string) {
    this.filter = value;
    // Note that the shown elements are actually references to the actual elements of the list, so the binding still works
    this.competitorsToShow = value === '' ? this.groupService.wcif.persons
      : this.groupService.wcif.persons.filter(p => p.name.toUpperCase().indexOf(this.filter.toUpperCase()) > -1);
  }

  handleSortByEvent(event) {
    this.groupService.sortCompetitorsByEvent(event.id);
  }

  handleBlurEvent(target, group: string, eventId: string) {
    if (this.isValidAssignment(group, eventId)) {
      $(target).removeClass('invalidAssignment');
    } else {
      $(target).addClass('invalidAssignment');
    }
    
    this.groupService.countCJRSForEvent(eventId);
  }
  
  isValidAssignment(group: string, eventId: string): boolean {
    if (group === null || group === "") { // Empty is OK
      return true;
    }
    if (! RegExp('^[0-9SJR;]+$').test(group)) { // Anything else than numbers, SJR and ; is not OK
      return false;
    }
    
    let event: EventConfiguration = this.groupService.wcif.events.filter(e => e.id === eventId)[0].configuration;
    let max: number = event.scrambleGroups * event.stages;
    let p = group.split(';')
    for (let i = 0; i < p.length; i++) { // Loop over the assignments for this event (for example: 1;J3)
      if (! RegExp('^[SJR]?[0-9]+$').test(p[i])) { // Every part must be (optionally S J or R followed by) a groupnumber
        return false;
      }
      if (parseInt(p[i].match(/[0-9]+/)[0]) > max) { // Groupnumber can't be higher than the amount of groups for this event
        return false;
      }
    }
    for (let i = 0; i < p.length; i++) { // New loop because this should only be checked if all parts are valid themselves
      // Check multiple assignments for one group (for example: 2;J2)
      if (p.map(e => parseInt(e.match(/[0-9]+/)[0])).indexOf(parseInt(p[i].match(/[0-9]+/)[0])) !== i) {
        return false;
      }
    }
    return true;
  }

}
