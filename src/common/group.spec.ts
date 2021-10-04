// import * as moment from 'moment';

import {GroupService} from './group';

var assert = require('assert');

describe('decrement', function() {
  it('test decrement', function() {
    let event = {
      configuration: {stages: 2, scrambleGroups: 2}
    };
    let group: GroupService = new GroupService();

    assert.equal(group.decrement(0, event), 3);
  });
});
