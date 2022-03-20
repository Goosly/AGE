import {Room} from '@wca/helpers/lib/models/room';
import {isDefined} from '@angular/compiler/src/util';

export class Wcif {
  persons?: Array<any>;
  events?: Array<any>;
  id?: any;
  schedule?: Schedule;
  extensions?: any[];
}

export class StaffPerson {
  name: string;
  wcaId: string;
  isAllowedTo: string[];
}

export class EventConfiguration {
  id: string;
  scrambleGroups: number;
  stages: number;
  scramblers: number;
  runners: number;
  timers: number;
  totalTimers: number;
  skip: boolean;
}

export class GeneralConfiguration {
  groupStrategy: 'basic' | 'basicBySpeed' | 'basicBySpeedReverse' | 'advanced' | 'assignmentsFromWcif' | 'fromCsv' = 'basic';
  totalNumberOfTimers: number = 16;
  skipDelegatesAndOrganizers: boolean = true;
  doNotAssignJudges: boolean = false;
  doNotAssignTasksToNewCompetitors: boolean = false;
  useMultipleStages: boolean = false;
  fixedSeating: boolean = false;
  autoPickScramblersAndRunners: boolean = false;
  bordersOnNametags: boolean = true;
  printStationNumbersOnScoreCards: boolean = false;
}

export interface Schedule {
  startDate: string;
  numberOfDays: number;
  venues?: Venue[];
}

export interface Venue {
  id: number;
  name: string;
  latitudeMicrodegrees: number;
  longitudeMicrodegrees: number;
  timezone: string;
  rooms: Room[];
}

export class Assignment {
  compete: number;
  judge: number[] = [];
  run: number[] = [];
  scramble: number[] = [];

  public static fromString(toParse: String) {
    const split = toParse.split(';');
    const result = new Assignment();
    split.forEach(s => {
      if (s.match(/^[JRS]/)) {
        switch (s.substring(0, 1)) {
          case 'J':
            result.judge.push(parseInt(s.match(/[0-9]+/)[0]));
            break;
          case 'R':
            result.run.push(parseInt(s.match(/[0-9]+/)[0]));
            break;
          case 'S':
            result.scramble.push(parseInt(s.match(/[0-9]+/)[0]));
            break;
        }
      } else if (s.match(/^[[0-9]+$/)) {
        result.compete = parseInt(s.match(/[0-9]+/)[0]);
      }
    });
    return result;
  }

  public competing(): boolean {
    return !!this.compete;
  }

  public toString(): string {
    let result = '';
    if (!!this.compete) {
      result += this.compete;
    }
    if (this.judge.length) {
      this.judge.forEach(j => result += ';J' + j);
    }
    if (this.run.length) {
      this.run.forEach(r => result += ';R' + r);
    }
    if (this.scramble.length) {
      this.scramble.forEach(s => result += ';S' + s);
    }
    if (result.startsWith(';')) {
      result = result.substring(1);
    }
    return result.split(';').sort((a: string, b: string) => {
      if (!a.match(/^[JRS]/)) {
        return -1;
      }
      if (!b.match(/^[JRS]/)) {
        return 1;
      }
      const groupA = parseInt(a.match(/[0-9]+/)[0]);
      const groupB = parseInt(b.match(/[0-9]+/)[0]);
      return (groupA < groupB) ? -1 : (groupA > groupB) ? 1 : 0;
    }).join(';');
  }

  public competesBeforeJudging(): boolean {
    return this.compete < (Math.min(...this.judge));
  }

  public similarTasksAs(toCompare: string): boolean {
    const assignment: Assignment = Assignment.fromString(toCompare);
    return assignment.competing() === this.competing()
      && assignment.judge.length === this.judge.length
      && assignment.run.length === this.run.length
      && assignment.scramble.length === this.scramble.length;
  }

}
