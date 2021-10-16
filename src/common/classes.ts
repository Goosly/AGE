import {Room} from '@wca/helpers/lib/models/room';

export class Wcif {
  persons?: Array<any>;
  events?: Array<any>;
  id?: any;
  schedule?: Schedule;
  extensions?: any[];
}

export class StaffPerson {
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
  everyoneCanScrambleAndRun: boolean = false;
  bordersOnNametags: boolean = true;
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
