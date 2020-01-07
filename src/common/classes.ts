import {Schedule} from '@wca/helpers';

export class Wcif {
  persons: Array<any>;
  events: Array<any>;
  id: any;
  schedule: Schedule;
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
  groupStrategy: 'basic' | 'basicBySpeed' | 'basicBySpeedReverse' | 'advanced' | 'fromGroupifier' | 'fromCsv' = 'basic';
  skipDelegatesAndOrganizers: boolean = true;
  doNotAssignJudges: boolean = false;
  doNotAssignTasksToNewCompetitors = false;
  everyoneCanScrambleAndRun: boolean = false;
  bordersOnNametags: boolean = true;
}
