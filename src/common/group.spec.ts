import {GroupService} from './group';

var assert = require('assert');

describe('decrement', function() {
  it('test decrement', function() {
    let event = {
      configuration: {stages: 2, scrambleGroups: 2}
    };
    let group: GroupService = new GroupService();

    assert.equal(group.decrement(3, event), 2);
    assert.equal(group.decrement(2, event), 1);
    assert.equal(group.decrement(1, event), 0);
    assert.equal(group.decrement(0, event), 3);
  });
});
