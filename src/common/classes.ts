export class Wcif {
  persons: Array<any>;
  events: Array<any>;
  id: any;
  schedule: any;
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
  skipDelegatesAndOrganizers: boolean = true;
  everyoneCanScrambleAndRun: boolean = false;
  bordersOnNametags: boolean = true;
}