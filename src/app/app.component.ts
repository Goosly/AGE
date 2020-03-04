import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { ApiService } from '../common/api';
import { GroupService } from '../common/group';
import { ExportService } from '../common/export';
import { EventConfiguration } from '../common/classes';
import { ScoreCardService } from '../common/scorecard';
import {Helpers} from '../common/helpers';
import {EventId} from '@wca/helpers';
import {ActivityHelper} from '../common/activity';
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

  // Competitions managed by user
  competitionsToChooseFrom: Array<String> = null;

  // Fields for binding
  userNameShort: string;
  filter: string = '';
  groupCounter: Array<number> = [];
  competitorCounterFromCsv: number = 0;
  wcifSaved: 'FALSE' | 'SAVING' | 'TRUE' | 'ERROR' = 'FALSE';
  wcifSaveError: any;
  Math: any;

  constructor (
    public apiService: ApiService,
    public groupService: GroupService,
    public exportService: ExportService,
    public scoreCardsService: ScoreCardService
    ) {
      this.Math = Math;
      if (this.apiService.oauthToken) {
        this.handleGetUser();
        this.handleGetCompetitions();
      }

    ActivityHelper.testMomentJsStuff();
  }

  handleLoginToWca() {
    this.apiService.logIn();
  }

  private handleGetUser() {
    this.apiService.getUser().subscribe(user => {
      this.userNameShort = user.me.name.split(' ')[0];
      this.apiService.logUserLoggedIn(user);
    });
  }

  private handleGetCompetitions() {
    this.apiService.getCompetitions().subscribe(comps => {
      if (comps.length === 1) {
        this.handleCompetitionSelected(comps[0]['id']);
      }
      this.competitionsToChooseFrom = comps.map(c => c['id']);
    });
  }

  handleCompetitionSelected(competitionId: string) {
    this.apiService.getWcif(competitionId).subscribe(wcif => {
      this.apiService.logUserFetchedWcifOf(this.userNameShort, competitionId);
      this.groupService.wcif = wcif;
      try {
        this.groupService.processWcif();
      } catch (error) {
        console.error(error);
        this.groupService.wcif = undefined;
      }
    });
  }

  handleTotalNumberOfTimersSet(value: number) {
    this.groupService.configuration.totalNumberOfTimers = Math.max(1, value);
    this.groupService.setDefaultEventConfiguration();
  }

  handleNumberOfStagesSet(value: number, eventId: string) {
    let event: EventConfiguration = this.groupService.wcif.events.filter(e => e.id === eventId)[0].configuration;
    event.stages = value;
    event.timers = event.totalTimers / event.stages;
  }

  handleGenerate() {
    try {
      this.groupService.wcif.events.forEach(event => {
        this.groupService.generateGrouping(event.id);
        this.groupCounter = this.getGroupCounterBasedOnEvent(event);
      });
      this.groupsGenerated = true;
    } catch (error) {
      console.error(error);
      alert("Error while generating groups. Please check the console.");
    }
  };

  private getGroupCounterBasedOnEvent(event) {
    // This is weird, I'm not sure why this is an array. It should be a number. Probably needed for binding?
    return Array(Math.max(this.groupCounter.length, event.configuration.stages * event.configuration.scrambleGroups));
  }

  private countCJRSForAllEvents(wcif) {
    let maxGroup = 1;
    wcif.events.forEach(e => {
      let numberOfGroupsForEvent = 1;
      wcif.persons.forEach(p => {
        const max = this.groupOfAssignment(p[e.id].group);
        if (max > numberOfGroupsForEvent) {
          numberOfGroupsForEvent = max;
        }
      });
      this.groupService.countCJRSForEvent(e.id, numberOfGroupsForEvent);
      if (numberOfGroupsForEvent > maxGroup) {
        maxGroup = numberOfGroupsForEvent;
      }
    });
    return new Array(maxGroup);
  }

  private groupOfAssignment(group: any): number {
    if (! group || group === '') {
      return -1;
    }
    const firstAssignment = group.split(';')[0];
    if (RegExp('^[0-9]+$').test(firstAssignment)) {
      return parseInt(firstAssignment);
    }
    return -1;
  }

  handleGenerateOneEvent(eventId: EventId) {
    this.groupService.generateGrouping(eventId);
    Helpers.sortCompetitorsByGroupInEvent(this.groupService.wcif, eventId);
  }

  handleExport() {
    Helpers.sortCompetitorsByName(this.groupService.wcif);
    this.readyForExport = true;
      this.apiService.logUserClicksExport(this.userNameShort, this.groupService.wcif.id);
  }

  handleBackToEdit() {
    this.readyForExport = false;
    this.apiService.logUserClicksBackToEdit(this.userNameShort, this.groupService.wcif.id);
  }

  handleFilterChanged(value: string) {
    this.filter = value;
  }

  handleImportFromWcif() {
    this.groupService.importAssignmentsFromWcif();
    this.groupCounter = this.countCJRSForAllEvents(this.groupService.wcif);
    this.apiService.logUserImportedFromWcif(this.userNameShort, this.groupService.wcif.id);
    this.groupService.configuration.groupStrategy = 'assignmentsFromWcif';
    Helpers.sortCompetitorsByName(this.groupService.wcif);
    this.groupsGenerated = true;
  }

  handleImportFromCsv() {
    this.groupService.importAssignmentsFromCsv((competitorCounterFromCsv: number) => {
      this.groupCounter = this.countCJRSForAllEvents(this.groupService.wcif);
      this.apiService.logUserImportedFromCsv(this.userNameShort, this.groupService.wcif.id);
      this.groupService.configuration.groupStrategy = 'fromCsv';
      Helpers.sortCompetitorsByName(this.groupService.wcif);
      this.competitorCounterFromCsv = competitorCounterFromCsv;
      this.groupsGenerated = true;
    });
  }

  handleSaveGroupsAndAssignmentsToWcif() {
    this.wcifSaved = 'SAVING';
    this.apiService.patchWcif(this.groupService.wcif,
      () => {
        this.wcifSaved = 'TRUE';
      },
      (error) => {
        this.wcifSaved = 'ERROR';
        this.wcifSaveError = error;
      });
  }

  handleSortByEvent(event) {
    Helpers.sortCompetitorsByGroupInEvent(this.groupService.wcif, event.id);
  }

  handleSortCompetitorsByName() {
    Helpers.sortCompetitorsByName(this.groupService.wcif);
  }

  handleBlurEvent(target, group: string, eventId: EventId) {
    if (this.isValidAssignment(group, eventId)) {
      $(target).removeClass('invalidAssignment');
    } else {
      $(target).addClass('invalidAssignment');
    }

    this.groupService.countCJRSForEvent(eventId);
  }

  isValidAssignment(group: string, eventId: EventId): boolean {
    if (group === null || group === "") { // Empty is OK
      return true;
    }
    if (! RegExp('^[0-9SJR;]+$').test(group)) { // Anything else than numbers, SJR and ; is not OK
      return false;
    }

    let event: EventConfiguration = this.groupService.wcif.events.filter(e => e.id === eventId)[0].configuration;
    let max: number = event.scrambleGroups * event.stages;
    let parts = group.split(';');
    for (let i = 0; i < parts.length; i++) { // Loop over the assignments for this event (for example: 1;J3)
      if (! RegExp('^[SJR]?[0-9]+$').test(parts[i])) { // Every part must be (optionally S J or R followed by) a groupnumber
        return false;
      }
      if (parseInt(parts[i].match(/[0-9]+/)[0]) > max) { // Groupnumber can't be higher than the amount of groups for this event
        return false;
      }
    }

    if (this.hasDuplicates(this.mapPartsToParallelGroupNumber(parts, event))) {
      return false;
    }

    return true;
  }

  private mapPartsToParallelGroupNumber(parts, event: EventConfiguration) {
    return parts.map(p => Math.trunc((parseInt(p.match(/[0-9]+/)[0]) - 1) / event.stages));
  }

  private hasDuplicates(array) {
    return (new Set(array)).size !== array.length;
  }

  competingButNoGroup(competitor: any, eventId: string) {
    return competitor[eventId].competing && ! RegExp('^[0-9]').test(competitor[eventId].group);
  }

  notCompeting(competitor: any, eventId: string) {
    return ! competitor[eventId].competing;
  }

  get competitionId() {
    return ! this.groupService.wcif ? null : this.groupService.wcif.id;
  }

  get numberOfEvents() {
    return ! this.groupService.wcif ? null : this.groupService.wcif.events.length;
  }

  get numberOfCompetitors() {
    return ! this.groupService.wcif ? null : this.groupService.wcif.persons.length;
  }

  get competitorsToShow() {
    return this.filter === '' ? this.groupService.wcif.persons
      : this.groupService.wcif.persons.filter(p => p.name.toUpperCase().indexOf(this.filter.toUpperCase()) > -1);
  }

  get advancedStrategy(): boolean {
    return this.groupService.configuration.groupStrategy === 'advanced';
  }

  get basicBySpeedStrategy(): boolean {
    return this.groupService.configuration.groupStrategy === 'basicBySpeed'
      || this.groupService.configuration.groupStrategy === 'basicBySpeedReverse';
  }

  get importStrategy(): boolean {
    return this.groupService.configuration.groupStrategy === 'assignmentsFromWcif'
      || this.groupService.configuration.groupStrategy === 'fromCsv';
  }

  get importFromCsvStrategy(): boolean {
    return this.groupService.configuration.groupStrategy === 'fromCsv';
  }

  get canImportFromWcif(): boolean {
    const ageOrGroupifierExtension: boolean = this.groupService.wcif.extensions
      .filter(e => e.id === 'AGE' || e.id.startsWith('groupifier')).length > 0;

    // Not sure how to check... Probably every person should have at least one assignment?
    // Play safe for whatever weird scenario: at least half of the persons should have at least one assignment
    let countPersonsWithAssignments = 0;
    this.groupService.wcif.persons.forEach(p => {
      if (p.assignments.length > 0) {
        countPersonsWithAssignments++;
      }
    });
    return ageOrGroupifierExtension && (countPersonsWithAssignments * 2 > this.groupService.wcif.persons.length);
  }

  version() {
    return environment.version;
  }

  testMode() {
    return environment.testMode;
  }
}
