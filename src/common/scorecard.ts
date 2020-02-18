import {Injectable} from '@angular/core';
import {formatCentiseconds, Event, getEventName, Round, Person} from '@wca/helpers';
import {Helpers} from './helpers';
import {Wcif} from './classes';
declare var pdfMake: any;

@Injectable({
  providedIn: 'root'
})
export class ScoreCardService {

  private readonly SCORE_CARD_RESULT_WIDTH = 145;

  public printScoreCardsForAllFirstRoundsExceptFMC(wcif: Wcif) {
    let scorecards: ScoreCardInfo[] = [];
    wcif.events.filter(e => e.id !== '333fm').forEach(event => {
      Helpers.sortCompetitorsByGroupInEvent(wcif, event.id);
      let scorecardsForEvent: ScoreCardInfo[] = [];
      let competitorsOfEvent: Person[] = wcif.persons.filter(p => !! p[event.id].group && RegExp('^[0-9]+').test(p[event.id].group));
      competitorsOfEvent.forEach(c => {
        let scorecard: ScoreCardInfo = this.getScoreCardForFirstRoundOfEvent(wcif, event);
        scorecard.competitorName = c.name;
        scorecard.competitorId = c.registrantId;
        scorecard.group = c[event.id].group.split(";")[0];
        scorecardsForEvent.push(scorecard);
      });
      scorecardsForEvent.forEach((s, i) => s.scorecardNumber = (i + 1));
      this.addEmptyScoreCardsUntilPageIsFull(scorecardsForEvent, wcif);
      scorecards.push(...scorecardsForEvent);
    });

    Helpers.sortCompetitorsByName(wcif);
    pdfMake.createPdf(this.document(scorecards)).download('scorecards-' + wcif.id + '.pdf');
  }

  public printFourEmptyScorecards(wcif: Wcif) {
    let scorecards: ScoreCardInfo[] = [
      this.getEmptyScoreCard(wcif),
      this.getEmptyScoreCard(wcif),
      this.getEmptyScoreCard(wcif),
      this.getEmptyScoreCard(wcif)
    ];
    pdfMake.createPdf(this.document(scorecards)).download('emptyScorecards-' + wcif.id + '.pdf');
  }

  private addEmptyScoreCardsUntilPageIsFull(scorecards: ScoreCardInfo[], wcif: any) {
    while (scorecards.length % 4 !== 0) {
      scorecards.push(this.getEmptyScoreCard(wcif));
    }
  }

  private getScoreCardForFirstRoundOfEvent(wcif: any, event: Event): ScoreCardInfo {
    return {
      eventId: event.id,
      competitionName: wcif.name,
      eventName: getEventName(event.id),
      round: 1,
      group: null,
      totalGroups: event['configuration'].scrambleGroups * event['configuration'].stages,
      competitorId: null,
      competitorName: null,
      timeLimit: this.getTimeLimitOf(event.rounds[0]),
      cumulative: this.getCumulative(event.rounds[0]),
      cutoff: this.getCutoffOf(event.rounds[0]),
      scorecardNumber: null
    }
  }

  private getTimeLimitOf(round: Round): string {
    if (round === null || round.timeLimit === null) {
      return null;
    } else {
      return formatCentiseconds(round.timeLimit.centiseconds);
    }
  }

  private getCumulative(round: Round): boolean {
    if (round === null || round.timeLimit === null || round.timeLimit.cumulativeRoundIds === null) {
      return false;
    } else {
      return round.timeLimit.cumulativeRoundIds.length > 0
    }
  }

  private getCutoffOf(round: Round): string {
    if (round === null || round.cutoff === null) {
      return null;
    } else if (typeof round.cutoff.attemptResult === 'string') {
      return round.cutoff.attemptResult;
    } else {
      return formatCentiseconds(round.cutoff.attemptResult);
    }
  }

  private getEmptyScoreCard(wcif): ScoreCardInfo {
    return {
      eventId: ' ',
      competitionName: wcif.id,
      eventName: ' ',
      round: null,
      group: null,
      totalGroups: null,
      competitorId: null,
      competitorName: ' ',
      timeLimit: null,
      cumulative: false,
      cutoff: null,
      scorecardNumber: null
    }
  }

  private document(scorecards): any {
    let document = {
      content: [

      ],
      styles: {
      },
      defaultStyle: {
        fontSize: 12
      }
    };
    for (let i = 0; i < scorecards.length; i += 4) {
      let onePage = [
        [
          {stack: this.getScoreCardTemplate(scorecards[i]), border: [false, false, false, false]},
          {text: '', border: [false, false, false, false]},
          {text: '', border: [true, false, false, false]},
        {stack: this.getScoreCardTemplate(scorecards[i + 1]), border: [false, false, false, false]}
        ],
        [
          {text: '', border: [false, true, false, false]},
          {text: '', border: [false, true, false, false]},
          {text: '', border: [true, true, false, false]},
          {text: '', border: [false, true, false, false]}
        ],
        [
          {stack: this.getScoreCardTemplate(scorecards[i + 2]), border: [false, false, false, false]},
          {text: '', border: [false, false, false, false]},
          {text: '', border: [true, false, false, false]},
          {stack: this.getScoreCardTemplate(scorecards[i + 3]), border: [false, false, false, false]}
        ]
      ];
      let page = {
        table: {
          heights: [384, 22, 364],
          widths: [260, 2, 8, 260],
          body: onePage
        },
        layout: {
          hLineColor: function (i, node) {
            return '#d3d3d3';
          },
          vLineColor: function (i, node) {
            return '#d3d3d3';
          }
        },
        margin: [-20,-10],
        pageBreak: 'after'
      };
      document.content.push(page);
    }
    document.content[document.content.length - 1].pageBreak = null;
    return document;
  }

  private getScoreCardTemplate(info: ScoreCardInfo) {
    if ('333mbf' === info.eventId) {
      return this.oneMbldScoreCard(info);
    } else if (['666', '777', '333bf', '444bf', '555bf'].includes(info.eventId)) {
      return this.oneMo3ScoreCard(info);
    }
    return this.oneAvg5ScoreCard(info);
  }

  private oneMo3ScoreCard(info: ScoreCardInfo): any[]  {
    return [
      [
        {text: ! info.scorecardNumber ? '' : info.scorecardNumber, alignment: 'left', fontSize: 7},
        {text: info.competitionName, alignment: 'center', fontSize: 10}
      ],
      {text: info.eventName, alignment: 'center', fontSize: 18, bold: true},
      {text: 'Round ' + (info.round === null ? '    ' : info.round)
          + ' | Group ' + (info.group === null ? '    ' : info.group)
          + ' of ' + (info.totalGroups === null ? '    ' : info.totalGroups), alignment: 'center', fontSize: 10},
      {table : {
          widths: [30, this.SCORE_CARD_RESULT_WIDTH + 58],
          body: [[
            {text: (info.competitorId === null ? ' ' : info.competitorId), fontSize: 16, alignment: 'center'},
            {text: info.competitorName, fontSize: 16, alignment: 'center'}]]
        },margin: [0, 5]},
      {text: info.cumulative ? 'Also write down the time for a DNF!' : '', bold: true, alignment: 'center'},
      {table : {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [[
            {text:''},
            {text:'S', alignment: 'center'},
            {text:
                info.cumulative ? 'Result\n(Cumulative limit: ' + info.timeLimit + ')' :
                  (info.timeLimit !== null ? 'Result (DNF if ≥ ' + info.timeLimit + ')' : ''),
              alignment: 'center', fontSize: info.cumulative ? 10 : 12 },
            {text:'J', alignment: 'center'},
            {text:'C', alignment: 'center'}],
            [{text:'1', margin: [0, 7]}, '', '', '', '']]
        },margin: [0, 2]},
      {text: info.cutoff !== null ? '-------------- Continue if 1 < ' + info.cutoff +' --------------' : '', alignment: 'center', fontSize: 10},
      {table : {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [
            [{text:'2', margin: [0, 7]}, '', '', '', ''],
            [{text:'3', margin: [0, 7]}, '', '', '', '']]
        },margin: [0, 2]},
      {text: '-------------- Extra or provisional --------------', alignment: 'center', fontSize: 10},
      {table : {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [[{text:'E', margin: [0, 5]}, '', '', '', '']]
        },margin: [0, 2]}
    ]
  }

  private oneAvg5ScoreCard(info: ScoreCardInfo): any[]  {
    return [
      [
        {text: ! info.scorecardNumber ? '' : info.scorecardNumber, alignment: 'left', fontSize: 7},
        {text: info.competitionName, alignment: 'center', fontSize: 10}
      ],
      {text: info.eventName, alignment: 'center', fontSize: 18, bold: true},
      {text: 'Round ' + (info.round === null ? '    ' : info.round)
          + ' | Group ' + (info.group === null ? '    ' : info.group)
          + ' of ' + (info.totalGroups === null ? '    ' : info.totalGroups), alignment: 'center', fontSize: 10},
      {table : {
          widths: [30, this.SCORE_CARD_RESULT_WIDTH + 58],
          body: [[
            {text: (info.competitorId === null ? ' ' : info.competitorId), fontSize: 16, alignment: 'center'},
            {text: info.competitorName, fontSize: 16, alignment: 'center'}]]
        },margin: [0, 5]},
      {text: info.cumulative ? 'Also write down the time for a DNF!' : '', bold: true, alignment: 'center'},
      {table : {
          widths: [5, 16, (this.SCORE_CARD_RESULT_WIDTH), 20, 20],
          body: [[
            {text:''},
            {text:'S', alignment: 'center'},
            {text:
                info.cumulative ? 'Result\n(Cumulative limit: ' + info.timeLimit + ')' :
                  (info.timeLimit !== null ? 'Result (DNF if ≥ ' + info.timeLimit + ')' : ''),
              alignment: 'center', fontSize: info.cumulative ? 10 : 12 },
            {text:'J', alignment: 'center'},
            {text:'C', alignment: 'center'}],
            [{text:'1', margin: [0, 7]}, '', '', '', ''],
            [{text:'2', margin: [0, 7]}, '', '', '', '']]
        },margin: [0, 2]},
      {text: info.cutoff !== null ? '-------------- Continue if 1 or 2 < ' + info.cutoff +' --------------' : '', alignment: 'center', fontSize: 10},
      {table : {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [
            [{text:'3', margin: [0, 7]}, '', '', '', ''],
            [{text:'4', margin: [0, 7]}, '', '', '', ''],
            [{text:'5', margin: [0, 7]}, '', '', '', '']]
        },margin: [0, 2]},
      {text: '-------------- Extra or provisional --------------', alignment: 'center', fontSize: 10},
      {table : {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [[{text:'E', margin: [0, 5]}, '', '', '', '']]
        },margin: [0, 2]}
    ]
  }

  private oneMbldScoreCard(info: ScoreCardInfo): any[]  {
    return [
      [
        {text: ! info.scorecardNumber ? '' : info.scorecardNumber, alignment: 'left', fontSize: 7},
        {text: info.competitionName, alignment: 'center', fontSize: 10}
      ],
      {text: info.eventName, alignment: 'center', fontSize: 18, bold: true},
      {text: 'Round ' + (info.round === null ? '    ' : info.round)
          + ' | Group ' + (info.group === null ? '    ' : info.group)
          + ' of ' + (info.totalGroups === null ? '    ' : info.totalGroups), alignment: 'center', fontSize: 10},
      {table : {
          widths: [30, this.SCORE_CARD_RESULT_WIDTH + 58],
          body: [[
            {text: (info.competitorId === null ? ' ' : info.competitorId), fontSize: 16, alignment: 'center'},
            {text: info.competitorName, fontSize: 16, alignment: 'center'}]]
        },margin: [0, 5]},
      {text: 'Count and write down the number of cubes before the attempt starts', bold: true, alignment: 'center'},
      {table : {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [[
            {text:''},
            {text:'S', alignment: 'center'},
            {text: 'Result', alignment: 'center'},
            {text:'J', alignment: 'center'},
            {text:'C', alignment: 'center'}],
            [{text:'1', margin: [0, 7]}, '',
              {text:'_______ / _______\n\nTime:', margin: [0, 7]}, '', ''],
            [{text:'2', margin: [0, 7]}, '',
              {text:'_______ / _______\n\nTime:', margin: [0, 7]}, '', ''],
            [{text:'3', margin: [0, 7]}, '',
              {text:'_______ / _______\n\nTime:', margin: [0, 7]}, '', '']]
        },margin: [0, 2]}
    ]
  }
}

export class ScoreCardInfo {
  eventId: string;
  competitionName: string;
  eventName: string;
  round: number;
  group: number;
  totalGroups: number;
  competitorId: number;
  competitorName: string;
  timeLimit: string;
  cumulative: boolean;
  cutoff: string;
  scorecardNumber: number;
}

