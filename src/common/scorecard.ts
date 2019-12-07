import {Injectable} from '@angular/core';
import {formatCentiseconds, Event, getEventName, Round, Person} from '@wca/helpers';
declare var pdfMake: any;

@Injectable({
  providedIn: 'root'
})
export class ScoreCardService {

  public printScoreCardsForAllFirstRounds(wcif: any) {
    let scorecards: ScoreCardInfo[] = [];
    wcif['events'].forEach(event => {
      let competitorsOfEvent: Person[] = wcif['persons'].filter(p => p[event.id].competing && !! p[event.id].group);
      competitorsOfEvent.forEach(c => {
        let scorecard: ScoreCardInfo = this.getScoreCardForFirstRoundOfEvent(wcif, event);
        scorecard.competitorName = c.name;
        scorecard.competitorId = c.registrantId;
        scorecard.group = c[event.id].group.split(";")[0];
        scorecards.push(scorecard);
      });
      this.addEmptyScoreCardsUntilPageIsFull(scorecards, wcif);
    });

    this.print(wcif, scorecards);
  }

  private addEmptyScoreCardsUntilPageIsFull(scorecards: ScoreCardInfo[], wcif: any) {
    while (scorecards.length % 4 !== 0) {
      scorecards.push(this.getEmptyScoreCard(wcif));
    }
  }

  public printScoreCardsForRound(round: any) {
    // todo
    // pdfMake.createPdf(this.document()).download("testing.pdf");
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
      cutoff: this.getCutoffOf(event.rounds[0])
    }
  }

  private getTimeLimitOf(round: Round): string {
    if (round === null || round.timeLimit === null) {
      return null;
    } else {
      return formatCentiseconds(round.timeLimit.centiseconds);
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

  private getFakeScoreCard(): ScoreCardInfo {
    return {
      eventId: '333',
      competitionName: 'Belgian Open 2020',
      eventName: '3x3x3 Cube',
      round: 1,
      group: 2,
      totalGroups: 4,
      competitorId: 15,
      competitorName: 'Manu Vereecken',
      timeLimit: formatCentiseconds(5 * 6000),
      cutoff: formatCentiseconds(3 * 6000)
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
      cutoff: null
    }
  }

  private print(wcif: any, scorecards: ScoreCardInfo[]) {
    pdfMake.createPdf(this.document(scorecards)).download('scorecards-' + wcif.id + '.pdf');
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
    // todo use different types of scorecards: avg5/mo3/cumulative limit
    for (let i = 0; i < scorecards.length; i += 4) {
      let onePage = [
        [
          [this.oneAvg5ScoreCard(scorecards[i])],
          '',
          [this.oneAvg5ScoreCard(scorecards[i + 1])]
        ],
        [
          [this.oneAvg5ScoreCard(scorecards[i + 2])],
          '',
          [this.oneAvg5ScoreCard(scorecards[i + 3])]
        ]
      ];
      document.content.push({
        table: {
          heights: [385, 385],
            widths: [265, 10, 265],
            body: onePage
        },
        layout: 'noBorders',
        margin: [-20,-10],
        pageBreak: 'after'
      });
    }
    return document;
  }

  private oneAvg5ScoreCard(info: ScoreCardInfo): any[]  {
    return [
      {text: info.competitionName, alignment: 'center', fontSize: 10},
      {text: info.eventName, alignment: 'center', fontSize: 18, bold: true},
      {text: 'Round ' + (info.round === null ? '    ' : info.round)
          + ' | Group ' + (info.group === null ? '    ' : info.group)
          + ' of ' + (info.totalGroups === null ? '    ' : info.totalGroups), alignment: 'center', fontSize: 10},
      {table : {
          widths: [30, 215],
          body: [[
            {text: (info.competitorId === null ? ' ' : info.competitorId), fontSize: 16, alignment: 'center'},
            {text: info.competitorName, fontSize: 16, alignment: 'center'}]]
        },margin: [0, 5]},
      {table : {
          widths: [5, 16, 157, 20, 20],
          body: [[
            {text:''},
            {text:'S', alignment: 'center'},
            {text: info.timeLimit !== null ? 'Result (DNF if > ' + info.timeLimit + ')' : '', alignment: 'center'},
            {text:'J', alignment: 'center'},
            {text:'C', alignment: 'center'}],
            [{text:'1', margin: [0, 7]}, '', '', '', ''],
            [{text:'2', margin: [0, 7]}, '', '', '', '']]
        },margin: [0, 2]},
      {text: info.cutoff !== null ? '-------------- Continue if 1 or 2 < ' + info.cutoff +' --------------' : '', alignment: 'center', fontSize: 10},
      {table : {
          widths: [5, 16, 157, 20, 20],
          body: [
            [{text:'3', margin: [0, 7]}, '', '', '', ''],
            [{text:'4', margin: [0, 7]}, '', '', '', ''],
            [{text:'5', margin: [0, 7]}, '', '', '', '']]
        },margin: [0, 2]},
      {text: '-------------- Extra or provisional --------------', alignment: 'center', fontSize: 10},
      {table : {
          widths: [5, 16, 157, 20, 20],
          body: [[{text:'E', margin: [0, 5]}, '', '', '', '']]
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
  cutoff: string;
}

