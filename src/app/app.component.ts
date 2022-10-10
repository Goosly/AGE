import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { ApiService } from '../common/api';
import { GroupService } from '../common/group';
import { ExportService } from '../common/export';
import { EventConfiguration } from '../common/classes';
import { ScoreCardService } from '../common/scorecard';
import {Helpers} from '../common/helpers';
import {EventId} from '@wca/helpers';
import {AnnuntiaWcif} from '../test/annuntia';
import {ConfirmSaveWcifDialogComponent} from './dialog/confirm-save-wcif-dialog.component';
import {MatDialog} from '@angular/material/dialog';
declare var $: any;

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  // Keep track of app flow
  // TODO replace this by one state?
  groupsGenerated = false;
  readyForExport = false;
  loadingWcif = false;

  // Competitions managed by user
  competitionsToChooseFrom: Array<String> = null;

  // Fields for binding
  userNameShort: string;
  filter = '';
  groupCounter: Array<number> = [];
  competitorCounterFromCsv = 0;
  wcifSaved: 'FALSE' | 'SAVING' | 'TRUE' | 'ERROR' = 'FALSE';
  wcifSaveError: any;
  Math: any;

  constructor (
    public apiService: ApiService,
    public groupService: GroupService,
    public exportService: ExportService,
    public scoreCardsService: ScoreCardService,
    public dialog: MatDialog
    ) {
      this.Math = Math;
      this.groupService.document = document;
      if (this.apiService.oauthToken) {
        this.handleGetUser();
        this.handleGetCompetitions();
      }
  }

  handleLoginToWca() {
    this.apiService.logIn();
  }

  private handleGetUser() {
    if (environment.offlineMode) {
      this.userNameShort = 'Manu';
      this.groupService.userWcaId = '2010VERE01';
      return;
    }

    this.apiService.getUser().subscribe(user => {
      this.userNameShort = user.me.name.split(' ')[0];
      this.groupService.userWcaId = user.me.wca_id;
      this.apiService.logUserLoggedIn(user);
    });
  }

  private handleGetCompetitions() {
    if (environment.offlineMode) {
      this.competitionsToChooseFrom = ['OfflineComp'];
      return;
    }

    this.apiService.getCompetitions().subscribe(comps => {
      if (comps.length === 1 || environment.testMode) {
        this.handleCompetitionSelected(comps[0]['id']);
      }
      this.competitionsToChooseFrom = comps.map(c => c['id']);
    });
  }

  handleCompetitionSelected(competitionId: string) {
    this.loadingWcif = true;
    if (environment.offlineMode) {
      this.groupService.wcif = AnnuntiaWcif.wcif;
      this.groupService.processWcif();
    }

    this.apiService.getWcif(competitionId).subscribe(wcif => {
      this.apiService.logUserFetchedWcifOf(this.userNameShort, competitionId);
      this.groupService.wcif = wcif;
      try {
        this.groupService.processWcif();
        this.loadingWcif = false;
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
    const event: EventConfiguration = Helpers.getEvent(eventId, this.wcif()).configuration;
    event.stages = value;
    event.timers = event.totalTimers / event.stages;
  }

  toggleUseStages() {
    this.groupService.configuration.useMultipleStages = !this.groupService.configuration.useMultipleStages;
    if (this.groupService.configuration.useMultipleStages) {
      this.wcif().events.forEach(e => {
        e.configuration.stages = 2;
        e.configuration.timers = e.configuration.totalTimers / e.configuration.stages;
      });
    } else {
      this.wcif().events.forEach(e => {
        e.configuration.stages = 1;
        e.configuration.timers = e.configuration.totalTimers / e.configuration.stages;
      });
    }
  }

  handleGenerate() {
    try {
      this.wcif().events.forEach(event => {
        this.groupService.generateGrouping(event.id);
        this.groupCounter = this.getGroupCounterBasedOnEvent(event);
      });
      this.groupsGenerated = true;
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  private getGroupCounterBasedOnEvent(event) {
    return Array(Math.max(this.groupCounter.length, event.configuration.stages * event.configuration.scrambleGroups));
  }

  private countCJRSForAllEvents(wcif) {
    let maxGroup = 1;
    wcif.events.forEach(e => {
      const numberOfGroupsForEvent = Helpers.countGroupsForEvent(wcif, e);
      this.groupService.countCJRSForEvent(e.id, numberOfGroupsForEvent);
      if (numberOfGroupsForEvent > maxGroup) {
        maxGroup = numberOfGroupsForEvent;
      }
    });
    return new Array(maxGroup);
  }

  handleGenerateOneEvent(eventId: EventId) {
    this.groupService.generateGrouping(eventId);
    Helpers.sortCompetitorsByGroupInEvent(this.wcif(), eventId);
  }

  handleExport() {
    Helpers.sortCompetitorsByName(this.wcif());
    this.readyForExport = true;
    this.apiService.logUserClicksExport(this.userNameShort, this.wcif().id);
  }

  handleBackToEdit() {
    this.readyForExport = false;
    this.apiService.logUserClicksBackToEdit(this.userNameShort, this.wcif().id);
  }

  handleFilterChanged(value: string) {
    this.filter = value;
  }

  handleImportFromWcif() {
    this.groupService.importAssignmentsFromWcif();
    this.groupCounter = this.countCJRSForAllEvents(this.wcif());
    this.apiService.logUserImportedFromWcif(this.userNameShort, this.wcif().id);
    this.groupService.configuration.groupStrategy = 'assignmentsFromWcif';
    Helpers.sortCompetitorsByName(this.wcif());
    this.groupsGenerated = true;
  }

  handleImportGroupsFromCsv() {
    this.groupService.importAssignmentsFromCsv((competitorCounterFromCsv: number) => {
      this.groupCounter = this.countCJRSForAllEvents(this.wcif());
      this.apiService.logUserImportedFromCsv(this.userNameShort, this.wcif().id);
      this.groupService.configuration.groupStrategy = 'fromCsv';
      Helpers.sortCompetitorsByName(this.wcif());
      this.competitorCounterFromCsv = competitorCounterFromCsv;
      this.groupsGenerated = true;
    });
  }

  handleSaveGroupsAndAssignmentsToWcif() {
    this.wcifSaved = 'SAVING';
    this.apiService.patchWcif(this.wcif(), this.groupService.configuration,
      () => {
        this.wcifSaved = 'TRUE';
      },
      (error) => {
        this.wcifSaved = 'ERROR';
        this.wcifSaveError = error;
      });
    this.apiService.logUserSavedFromWcif(this.userNameShort, this.wcif().id);
  }

  handleSortByEvent(event) {
    Helpers.sortCompetitorsByGroupInEvent(this.wcif(), event.id);
  }

  handleSortCompetitorsByName() {
    Helpers.sortCompetitorsByName(this.wcif());
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
    if (group === null || group === '') { // Empty is OK
      return true;
    }
    if (! RegExp('^[0-9SJR;]+$').test(group)) { // Anything else than numbers, SJR and ; is not OK
      return false;
    }

    const event: EventConfiguration = Helpers.getEvent(eventId, this.wcif()).configuration;
    const max: number = event.scrambleGroups * event.stages;
    const parts = group.split(';');
    for (let i = 0; i < parts.length; i++) { // Loop over the assignments for this event (for example: 1;J3)
      if (! RegExp('^[SJR]?[0-9]+$').test(parts[i])) { // Every part must be (optionally S J or R followed by) a groupnumber
        return false;
      }
      if (! event.skip && parseInt(parts[i].match(/[0-9]+/)[0]) > max) { // Groupnumber can't be higher than the amount of groups for this event
        return false;
      }
    }

    if (! event.skip && this.hasDuplicates(this.mapPartsToParallelGroupNumber(parts, event))) {
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
    return ! this.wcif() ? null : this.wcif().id;
  }

  get numberOfEvents() {
    return ! this.wcif() ? null : this.wcif().events.length;
  }

  get numberOfCompetitors() {
    return ! this.wcif() ? null : this.wcif().persons.length;
  }

  get competitorsToShow() {
    return this.filter === '' ? this.wcif().persons
      : this.wcif().persons.filter(p => p.name.toUpperCase().indexOf(this.filter.toUpperCase()) > -1);
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
    // Not sure how to check... Probably every person should have at least one assignment?
    // Play safe for whatever weird scenario: at least half of the persons should have at least one assignment
    let countPersonsWithAssignments = 0;
    this.wcif().persons.forEach(p => {
      if (p.assignments.length > 0) {
        countPersonsWithAssignments++;
      }
    });
    return countPersonsWithAssignments * 2 > this.wcif().persons.length;
  }

  version() {
    return environment.version;
  }

  get getRooms() {
    return this.groupService.configuration.rooms;
  }

  private wcif() {
    return this.groupService.wcif;
  }

  openConfirmSaveWcif() {
    const dialogRef = this.dialog.open(ConfirmSaveWcifDialogComponent, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe(result => {
      this.handleSaveGroupsAndAssignmentsToWcif();
    });
  }
}
