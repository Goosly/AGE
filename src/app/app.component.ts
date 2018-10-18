import { Component } from '@angular/core';
import { ApiService } from '../common/api';
import { GroupService } from '../common/group';
import { ExportService } from '../common/export';
import { EventConfiguration } from '../common/classes';

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
  competitionsToChooseFrom: Array<String> = [];
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
        this.groupService.generateGrouping(e.id);
        this.countCJRSForEvent(e.id);
      });
      this.groupsGenerated = true;
    } catch (error) {
      console.error(error);
    }
  };

  handleGenerateOneEvent(eventId: string) {
    this.groupService.generateGrouping(eventId);
    this.countCJRSForEvent(eventId);
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

  handleBlurEvent(eventId: string) {
    this.countCJRSForEvent(eventId);
  }

  private countCJRSForEvent(eventId: string) {
    let event: any = this.groupService.wcif.events.filter(e => e.id === eventId)[0];
    let configuration: EventConfiguration = event.configuration;
    let numberOfGroups: number = configuration.stages * configuration.scrambleGroups;

    event.groupCounters = [];
    for (let group: number = 1; group <= numberOfGroups; group++) {
      let groupCounter: string = this.groupService.wcif.persons
        .filter(p => p[eventId].group.split(';').indexOf(group.toString()) > -1).length + '|';
      groupCounter += this.groupService.wcif.persons
        .filter(p => p[eventId].group.split(';').indexOf('J' + group) > -1).length + '|';
      groupCounter += this.groupService.wcif.persons
        .filter(p => p[eventId].group.split(';').indexOf('R' + group) > -1).length + '|';
      groupCounter += this.groupService.wcif.persons
        .filter(p => p[eventId].group.split(';').indexOf('S' + group) > -1).length;
      event.groupCounters.push(groupCounter);
    }
    this.groupCounter = Array(Math.max(this.groupCounter.length, numberOfGroups));
  }

}
