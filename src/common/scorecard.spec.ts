import {ScoreCardService} from './scorecard';

describe('test', function() {

  it('test getIndexToPlace', function() {
    const s: ScoreCardService = new ScoreCardService(null);

    expect(s.getIndexToPlace(0, 4)).toBe(0);
    expect(s.getIndexToPlace(1, 4)).toBe(1);
    expect(s.getIndexToPlace(2, 4)).toBe(2);
    expect(s.getIndexToPlace(3, 4)).toBe(3);

    expect(s.getIndexToPlace(0, 8)).toBe(0);
    expect(s.getIndexToPlace(1, 8)).toBe(4);
    expect(s.getIndexToPlace(2, 8)).toBe(1);
    expect(s.getIndexToPlace(3, 8)).toBe(5);
    expect(s.getIndexToPlace(4, 8)).toBe(2);
    expect(s.getIndexToPlace(5, 8)).toBe(6);
    expect(s.getIndexToPlace(6, 8)).toBe(3);
    expect(s.getIndexToPlace(7, 8)).toBe(7);

    expect(s.getIndexToPlace(0, 20)).toBe(0);
    expect(s.getIndexToPlace(1, 20)).toBe(4);
    expect(s.getIndexToPlace(2, 20)).toBe(8);
    expect(s.getIndexToPlace(3, 20)).toBe(12);
    expect(s.getIndexToPlace(4, 20)).toBe(16);
    expect(s.getIndexToPlace(5, 20)).toBe(1);
    expect(s.getIndexToPlace(6, 20)).toBe(5);
    expect(s.getIndexToPlace(7, 20)).toBe(9);
    expect(s.getIndexToPlace(8, 20)).toBe(13);
    expect(s.getIndexToPlace(9, 20)).toBe(17);
    expect(s.getIndexToPlace(10, 20)).toBe(2);
    expect(s.getIndexToPlace(11, 20)).toBe(6);
    expect(s.getIndexToPlace(12, 20)).toBe(10);
    expect(s.getIndexToPlace(13, 20)).toBe(14);
    expect(s.getIndexToPlace(14, 20)).toBe(18);
    expect(s.getIndexToPlace(15, 20)).toBe(3);
    expect(s.getIndexToPlace(16, 20)).toBe(7);
    expect(s.getIndexToPlace(17, 20)).toBe(11);
    expect(s.getIndexToPlace(18, 20)).toBe(15);
    expect(s.getIndexToPlace(19, 20)).toBe(19);

    expect(s.getIndexToPlace(0, 28)).toBe(0);
    expect(s.getIndexToPlace(1, 28)).toBe(4);
    expect(s.getIndexToPlace(2, 28)).toBe(8);
    expect(s.getIndexToPlace(3, 28)).toBe(12);
    expect(s.getIndexToPlace(4, 28)).toBe(16);
    expect(s.getIndexToPlace(5, 28)).toBe(20);
    expect(s.getIndexToPlace(6, 28)).toBe(24);
    expect(s.getIndexToPlace(7, 28)).toBe(1);
    expect(s.getIndexToPlace(8, 28)).toBe(5);
    expect(s.getIndexToPlace(9, 28)).toBe(9);
    expect(s.getIndexToPlace(10, 28)).toBe(13);
    expect(s.getIndexToPlace(11, 28)).toBe(17);
    expect(s.getIndexToPlace(12, 28)).toBe(21);
    expect(s.getIndexToPlace(13, 28)).toBe(25);
    expect(s.getIndexToPlace(14, 28)).toBe(2);
    expect(s.getIndexToPlace(15, 28)).toBe(6);
    expect(s.getIndexToPlace(16, 28)).toBe(10);
    expect(s.getIndexToPlace(17, 28)).toBe(14);
    expect(s.getIndexToPlace(18, 28)).toBe(18);
    expect(s.getIndexToPlace(19, 28)).toBe(22);
    expect(s.getIndexToPlace(20, 28)).toBe(26);
    expect(s.getIndexToPlace(21, 28)).toBe(3);
    expect(s.getIndexToPlace(22, 28)).toBe(7);
    expect(s.getIndexToPlace(23, 28)).toBe(11);
    expect(s.getIndexToPlace(24, 28)).toBe(15);
    expect(s.getIndexToPlace(25, 28)).toBe(19);
    expect(s.getIndexToPlace(26, 28)).toBe(23);
    expect(s.getIndexToPlace(27, 28)).toBe(27);
  });

});
