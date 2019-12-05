import {Injectable} from '@angular/core';
declare var pdfMake: any;

@Injectable({
  providedIn: 'root'
})
export class ScoreCardService {

  public printScoreCardsForRound(round: any) {
    pdfMake.createPdf(this.document()).download("testing.pdf");
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
      timeLimit: '5:00',
      cutoff: '3:00'
    }
  }

  private document(): any {
    return {
      content: [
        {
          table: {
            heights: [385, 385],
            widths: [265, 10, 265],
            body: [
              [
                [this.oneAvg5ScoreCard(this.getFakeScoreCard())],
                '',
                [this.oneAvg5ScoreCard(this.getFakeScoreCard())]
              ],
              [
                [this.oneAvg5ScoreCard(this.getFakeScoreCard())],
                '',
                [this.oneAvg5ScoreCard(this.getFakeScoreCard())]
              ]
            ]
          },
          layout: 'noBorders',
          margin: [-20,-10]
        }
      ],
      styles: {
      },
      defaultStyle: {
        fontSize: 12
      }
    };
  }

  private oneAvg5ScoreCard(info: ScoreCardInfo): any[]  {
    return [
      {text: info.competitionName, alignment: 'center', fontSize: 10},
      {text: info.eventName, alignment: 'center', fontSize: 18, bold: true},
      {text: 'Round ' + info.round + ' | Group ' + info.group + ' of ' + info.totalGroups, alignment: 'center', fontSize: 10},
      {table : {
          widths: [30, 215],
          body: [[
            {text: info.competitorId, fontSize: 16, alignment: 'center'},
            {text: info.competitorName, fontSize: 16, alignment: 'center'}]]
        },margin: [0, 5]},
      {table : {
          widths: [5, 16, 157, 20, 20],
          body: [[
            {text:''},
            {text:'S', alignment: 'center'},
            {text:'Result (DNF if > ' + info.timeLimit + ')', alignment: 'center'},
            {text:'J', alignment: 'center'},
            {text:'C', alignment: 'center'}],
            [{text:'1', margin: [0, 7]}, '', '', '', ''],
            [{text:'2', margin: [0, 7]}, '', '', '', '']]
        },margin: [0, 2]},
      {text: '-------------- Continue if 1 or 2 < ' + info.cutoff +' --------------', alignment: 'center', fontSize: 10},
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

