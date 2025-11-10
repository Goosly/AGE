import {Injectable} from '@angular/core';
import {formatCentiseconds, getEventName, Person, Round} from '@wca/helpers';
import {Helpers} from './helpers';
import {Wcif} from './classes';
import {GroupService} from './group';

declare var pdfMake: any;

@Injectable({
  providedIn: 'root'
})
export class ScoreCardService {

  constructor (
    public groupService: GroupService) {}

  private readonly SCORE_CARD_RESULT_WIDTH = 145;

  public printScoreCardsInStacks(wcif: Wcif) {
    let scorecards: ScoreCardInfo[] = [];
    wcif.events.filter(e => e.id !== '333fm').forEach(event => {
      Helpers.sortCompetitorsByGroupInEvent(wcif, event.id);
      event.countGroupsForScorecard = Helpers.countGroupsForEvent(wcif, event);
      const scorecardsForEvent: ScoreCardInfo[] = this.competitorsOfEvent(wcif, event)
        .map(competitor => this.mapCompetitorToScorecard(competitor, wcif, event));
      scorecards.push(...scorecardsForEvent);
    });
    scorecards = this.reorderScorecardsInStacks(scorecards, wcif);

    Helpers.sortCompetitorsByName(wcif);
    pdfMake.createPdf(this.onA4(scorecards)).download('A4-stacked-scorecards-' + wcif.id + '.pdf');
  }

  public printScoreCardsForAllFirstRoundsExceptFMC(wcif: Wcif, printOnA6: boolean) {
    const scorecards: ScoreCardInfo[] = [];
    wcif.events.filter(e => e.id !== '333fm').forEach(event => {
      Helpers.sortCompetitorsByGroupInEvent(wcif, event.id);
      event.countGroupsForScorecard = Helpers.countGroupsForEvent(wcif, event);
      const scorecardsForEvent: ScoreCardInfo[] = this.competitorsOfEvent(wcif, event)
        .map(competitor => this.mapCompetitorToScorecard(competitor, wcif, event));
      this.addScorecardNumbers(scorecardsForEvent);
      this.addStationNumbersFromWcifOrGenerate(scorecardsForEvent);
      if (!printOnA6) {
        this.addEmptyScoreCardsUntilPageIsFull(scorecardsForEvent, wcif);
      }
      scorecards.push(...scorecardsForEvent);
    });

    Helpers.sortCompetitorsByName(wcif);
    this.downloadPdf(scorecards, wcif, printOnA6);
  }

  private downloadPdf(scorecards: ScoreCardInfo[], wcif: Wcif, printOnA6: boolean) {
    if (printOnA6) {
      pdfMake.createPdf(this.onA6(scorecards)).download('A6-scorecards-' + wcif.id + '.pdf');
    } else {
      pdfMake.createPdf(this.onA4(scorecards)).download('A4-scorecards-' + wcif.id + '.pdf');
    }
  }

  private competitorsOfEvent(wcif: Wcif, event) {
    return wcif.persons.filter(p => !!p[event.id].group && RegExp('^[0-9]+').test(p[event.id].group));
  }

  private mapCompetitorToScorecard(person: Person, wcif: Wcif, event) {
    const scorecard: ScoreCardInfo = this.getScoreCardForFirstRoundOfEvent(wcif, event);
    scorecard.competitorName = person.name;
    scorecard.competitorId = person.registrantId;
    scorecard.group = person[event.id].group.split(';')[0];
    scorecard.stageName = Helpers.getStageName(wcif, event, scorecard.group);
    scorecard.timerStationId = person[event.id].stationNumber;
    return scorecard;
  }

  private addScorecardNumbers(scorecards: ScoreCardInfo[]) {
    scorecards.forEach((s: ScoreCardInfo, i: number) => {
      s.scorecardNumber = (i + 1);
    });
  }

  private addStationNumbersFromWcifOrGenerate(scorecards: ScoreCardInfo[]) {
    let stationCounter = 0;
    let group = scorecards[0].group;
    for (let i = 0; i < scorecards.length; i++) {
      const scorecard: ScoreCardInfo = scorecards[i];
      if (scorecard.group == group) {
        stationCounter++;
      } else {
        stationCounter = 1;
        group = scorecard.group;
      }
      if (this.printStationNumbers()) {
        if (!scorecard.timerStationId) { // Might already be set from Wcif data
          scorecard.timerStationId = stationCounter;
        }
      } else {
        scorecard.timerStationId = null;
      }
    }
  }

  public printFourEmptyScorecards(wcif: Wcif) {
    const scorecards: ScoreCardInfo[] = [
      this.getEmptyScoreCard(wcif),
      this.getEmptyScoreCard(wcif),
      this.getEmptyScoreCard(wcif),
      this.getEmptyScoreCard(wcif)
    ];
    pdfMake.createPdf(this.onA4(scorecards)).download('emptyScorecards-' + wcif.id + '.pdf');
  }

  public printOneEmptyScorecardOnA6(wcif: Wcif) {
    const scorecards: ScoreCardInfo[] = [
      this.getEmptyScoreCard(wcif)
    ];
    pdfMake.createPdf(this.onA6(scorecards)).download('emptyScorecards-' + wcif.id + '.pdf');
  }

  private addEmptyScoreCardsUntilPageIsFull(scorecards: ScoreCardInfo[], wcif: any) {
    while (scorecards.length % 4 !== 0) {
      scorecards.push(this.getEmptyScoreCard(wcif));
    }
  }

  private getScoreCardForFirstRoundOfEvent(wcif: any, event: any): ScoreCardInfo {
    return {
      eventId: event.id,
      competitionName: wcif.name,
      eventName: getEventName(event.id),
      round: 1,
      group: null,
      totalGroups: event.countGroupsForScorecard,
      competitorId: null,
      competitorName: null,
      timeLimit: this.getTimeLimitOf(event.rounds[0]),
      cumulative: this.getCumulative(event.rounds[0]),
      cutoff: this.getCutoffOf(event.rounds[0]),
      scorecardNumber: null,
      timerStationId: null
    };
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
      return round.timeLimit.cumulativeRoundIds.length > 0;
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
      competitionName: wcif.name,
      eventName: ' ',
      round: null,
      group: null,
      totalGroups: null,
      competitorId: null,
      competitorName: ' ',
      timeLimit: null,
      cumulative: false,
      cutoff: null,
      scorecardNumber: null,
      timerStationId: null
    };
  }

  private onA6(scorecards): any {
    const document = {
      pageSize: 'A6',
      content: [

      ],
      styles: {
      },
      defaultStyle: {
        fontSize: 12
      }
    };
    for (let i = 0; i < scorecards.length; i++) {
      const page = {
        stack: this.getScoreCardTemplate(scorecards[i]), border: [false, false, false, false],
        margin: [-15, -10],
        pageBreak: 'after'
      };
      document.content.push(page);
    }
    document.content[document.content.length - 1].pageBreak = null;
    return document;
  }

  private onA4(scorecards): any {
    const document = {
      content: [

      ],
      styles: {
      },
      defaultStyle: {
        fontSize: 12
      }
    };
    for (let i = 0; i < scorecards.length; i += 4) {
      const onePage = [
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
      const page = {
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
        margin: [-20, -10],
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
    } else if ('333bf' === info.eventId && this.groupService.wcif.schedule?.startDate?.includes('2025')) {
      return this.oneMo3ScoreCard(info);
    } else if (['666', '777', '444bf', '555bf'].includes(info.eventId)) {
      return this.oneMo3ScoreCard(info);
    }
    return this.oneAvg5ScoreCard(info);
  }

  private oneMo3ScoreCard(info: ScoreCardInfo): any[] {
    return [
      [
        this.timerStationIdAndScorecardNumber(info),
        {text: info.competitionName, alignment: 'center', fontSize: 10, lineHeight: 0.90}
      ],
      {text: info.eventName, alignment: 'center', fontSize: 18, bold: true},
      this.roundAndGroupInfo(info),
      {
        table: {
          widths: [30, this.SCORE_CARD_RESULT_WIDTH + 58],
          body: [[
            {text: (info.competitorId === null ? ' ' : info.competitorId), fontSize: 16, alignment: 'center'},
            {text: info.competitorName, fontSize: 16, alignment: 'center'}]]
        }, margin: [0, 5]
      },
      {text: info.cumulative ? 'Also write down the time for a DNF!' : '', bold: true, alignment: 'center', fontSize: 10},
      {
        table: {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [[
            {text: ''},
            {text: 'S', alignment: 'center'},
            {
              text:
                info.cumulative ? 'Result\n(Cumulative limit: ' + info.timeLimit + ')' :
                  (info.timeLimit !== null ? 'Result (DNF if ≥ ' + info.timeLimit + ')' : ''),
              alignment: 'center', fontSize: info.cumulative ? 10 : 12
            },
            {text: 'J', alignment: 'center'},
            {text: 'C', alignment: 'center'}],
            [{text: '1', margin: [0, 7]}, '', '', '', '']]
        }, margin: [0, 2]
      },
      {
        text: info.cutoff !== null ? '-------------- Continue if 1 < ' + info.cutoff
          + ' --------------' : '', alignment: 'center', fontSize: 10
      },
      {
        table: {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [
            [{text: '2', margin: [0, 7]}, '', '', '', ''],
            [{text: '3', margin: [0, 7]}, '', '', '', '']]
        }, margin: [0, 2]
      },
      {text: '-------------- Extra or provisional --------------', alignment: 'center', fontSize: 10},
      {
        table: {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [[{text: 'E', margin: [0, 5]}, '', '', '', '']]
        }, margin: [0, 2]
      }
    ];
  }

  private oneAvg5ScoreCard(info: ScoreCardInfo): any[] {
    return [
      [
        this.timerStationIdAndScorecardNumber(info),
        {text: info.competitionName, alignment: 'center', fontSize: 10, lineHeight: 0.90}
      ],
      {text: info.eventName, alignment: 'center', fontSize: 18, bold: true, lineHeight: 0.90},
      this.roundAndGroupInfo(info),
      {
        table: {
          widths: [30, this.SCORE_CARD_RESULT_WIDTH + 58],
          body: [[
            {text: (info.competitorId === null ? ' ' : info.competitorId), lineHeight: 0.90, fontSize: 16, alignment: 'center'},
            {text: info.competitorName, lineHeight: 0.90, fontSize: info.competitorName.length > 22 ? 12 : 16, alignment: 'center'}]]
        }, margin: [0, 5]
      },
      {text: info.cumulative ? 'Also write down the time for a DNF!' : '', bold: true, alignment: 'center', fontSize: 10, lineHeight: 0.90},
      {
        table: {
          widths: [5, 16, (this.SCORE_CARD_RESULT_WIDTH), 20, 20],
          body: [[
            {text: ''},
            {text: 'S', alignment: 'center'},
            {
              text:
                info.cumulative ? 'Result\n(Cumulative limit: ' + info.timeLimit + ')' :
                  (info.timeLimit !== null ? 'Result (DNF if ≥ ' + info.timeLimit + ')' : ''),
              alignment: 'center', fontSize: info.cumulative ? 10 : 12
            },
            {text: 'J', alignment: 'center'},
            {text: 'C', alignment: 'center'}],
            [{text: '1', margin: [0, 7]}, '', '', '', ''],
            [{text: '2', margin: [0, 7]}, '', '', '', '']]
        }, margin: [0, 2]
      },
      {
        text: info.cutoff !== null ? '-------------- Continue if 1 or 2 < ' + info.cutoff + ' --------------' : '',
        alignment: 'center', fontSize: 10, lineHeight: 0.80
      },
      {
        table: {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [
            [{text: '3', margin: [0, 7]}, '', '', '', ''],
            [{text: '4', margin: [0, 7]}, '', '', '', ''],
            [{text: '5', margin: [0, 7]}, '', '', '', '']]
        }, margin: [0, 2]
      },
      {
        text: '-------------- Extra or provisional --------------',
        alignment: 'center', fontSize: 10, lineHeight: 0.80
      },
      {
        table: {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [[{text: 'E', margin: [0, 4]}, '', '', '', '']]
        }, margin: [0, 2]
      }
    ];
  }

  private oneMbldScoreCard(info: ScoreCardInfo): any[] {
    return [
      [
        this.timerStationIdAndScorecardNumber(info),
        {text: info.competitionName, alignment: 'center', fontSize: 10, lineHeight: 0.90}
      ],
      {text: info.eventName, alignment: 'center', fontSize: 18, bold: true},
      this.roundAndGroupInfo(info),
      {
        table: {
          widths: [30, this.SCORE_CARD_RESULT_WIDTH + 58],
          body: [[
            {text: (info.competitorId === null ? ' ' : info.competitorId), fontSize: 16, alignment: 'center'},
            {text: info.competitorName, fontSize: 16, alignment: 'center'}]]
        }, margin: [0, 5]
      },
      {text: 'Count and write down the number of cubes before the attempt starts', bold: true, alignment: 'center'},
      {
        table: {
          widths: [5, 16, this.SCORE_CARD_RESULT_WIDTH, 20, 20],
          body: [[
            {text: ''},
            {text: 'S', alignment: 'center'},
            {text: 'Result', alignment: 'center'},
            {text: 'J', alignment: 'center'},
            {text: 'C', alignment: 'center'}],
            [{text: '1', margin: [0, 7]}, '',
              {text: '_______ / _______\n\nTime:', margin: [0, 7]}, '', ''],
            [{text: '2', margin: [0, 7]}, '',
              {text: '_______ / _______\n\nTime:', margin: [0, 7]}, '', ''],
            [{text: '3', margin: [0, 7]}, '',
              {text: '_______ / _______\n\nTime:', margin: [0, 7]}, '', '']]
        }, margin: [0, 2]
      }
    ];
  }

  private timerStationIdAndScorecardNumber(info: ScoreCardInfo) {
    return {
      columns: [
        {text: !info.scorecardNumber ? '' : info.scorecardNumber,
          alignment: 'left', fontSize: 6, color: 'grey', lineHeight: 0.70},
        {text: !this.printStationNumbers() || !info.timerStationId ? '' : 'Timer ' + info.timerStationId,
          alignment: 'right', fontSize: 14, lineHeight: 0.70}
      ]
    };
  }

  private printStationNumbers() {
    return this.groupService.configuration.printStationNumbersOnScoreCards;
  }

  private roundAndGroupInfo(info: ScoreCardInfo) {
    return {
      text: 'Round ' + (info.round === null ? '    ' : info.round)
        + ' | Group ' + (info.group === null ? '    ' : info.group)
        + ' of ' + (info.totalGroups === null ? '    ' : info.totalGroups)
        + (info.stageName ? ' | ' + info.stageName : ''), alignment: 'center', fontSize: 10
    };
  }

  private reorderScorecardsInStacks(scorecards: ScoreCardInfo[], wcif: Wcif): ScoreCardInfo[] {
    const copyScorecards = this.copyAndAddScorecardsUntilPageIsFull(scorecards, wcif);

    const stackedScorecards = new Array<ScoreCardInfo>(copyScorecards.length);
    for (let i = 0; i < copyScorecards.length; i++) {
      const indexToPlace = this.getIndexToPlace(i, copyScorecards.length);
      stackedScorecards[indexToPlace] = copyScorecards[i];
      stackedScorecards[indexToPlace].scorecardNumber = i + 1;
    }

    return stackedScorecards;
  }

  private copyAndAddScorecardsUntilPageIsFull(scorecards: ScoreCardInfo[], wcif: Wcif) {
    const copyScorecards = [];
    for (let i = 0; i < scorecards.length; i++) {
      copyScorecards.push({...scorecards[i]});
    }
    this.addEmptyScoreCardsUntilPageIsFull(copyScorecards, wcif);
    return copyScorecards;
  }

  getIndexToPlace(i: number, length: number) {
    if (i < length * 0.25) {
      return i * 4;
    } else if (i < length * 0.5) {
      return (i * 4 + 1) % length;
    } else if (i < length * 0.75) {
      return (i * 4 + 2) % length;
    } else {
      return (i * 4 + 3) % length;
    }
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
  timerStationId: number;
  stageName?: string;
}

