import React from 'react';
import PivotTableUI from '../PivotTableUI';

describe('PivotTableUI', () => {
  describe('handleDuplicates', () => {
    // Create a minimal instance of PivotTableUI for testing
    const getInstance = () => {
      const pivotTableUI = new PivotTableUI({
        onChange: () => {},
        renderers: {},
        aggregators: {},
        rows: [],
        cols: [],
        rendererName: '',
        aggregatorName: '',
        vals: [],
        valueFilter: {},
        rowOrder: 'key_a_to_z',
        colOrder: 'key_a_to_z',
        derivedAttributes: {},
        data: []
      });
      return pivotTableUI;
    };

    it('returns existingAttributes when newAttributes is null or undefined', () => {
      const instance = getInstance();
      expect(instance.handleDuplicates(null, ['a', 'b'])).toEqual(['a', 'b']);
      expect(instance.handleDuplicates(undefined, ['a', 'b'])).toEqual(['a', 'b']);
    });

    it('returns empty array when both inputs are null or undefined', () => {
      const instance = getInstance();
      expect(instance.handleDuplicates(null, null)).toEqual([]);
      expect(instance.handleDuplicates(undefined, undefined)).toEqual([]);
    });

    it('returns existingAttributes when there are no duplicates', () => {
      const instance = getInstance();
      const newAttributes = ['a', 'b', 'c'];
      const existingAttributes = ['d', 'e', 'f'];
      expect(instance.handleDuplicates(newAttributes, existingAttributes))
        .toEqual(existingAttributes);
    });

    it('removes duplicates from existingAttributes', () => {
      const instance = getInstance();
      const newAttributes = ['a', 'b', 'c'];
      const existingAttributes = ['b', 'c', 'd'];
      // 'b' and 'c' are duplicates and should be removed
      expect(instance.handleDuplicates(newAttributes, existingAttributes))
        .toEqual(['d']);
    });

    it('handles empty newAttributes', () => {
      const instance = getInstance();
      const newAttributes = [];
      const existingAttributes = ['a', 'b', 'c'];
      expect(instance.handleDuplicates(newAttributes, existingAttributes))
        .toEqual(existingAttributes);
    });

    it('handles empty existingAttributes', () => {
      const instance = getInstance();
      const newAttributes = ['a', 'b', 'c'];
      const existingAttributes = [];
      expect(instance.handleDuplicates(newAttributes, existingAttributes))
        .toEqual([]);
    });

    it('handles case with all attributes being duplicates', () => {
      const instance = getInstance();
      const newAttributes = ['a', 'b', 'c'];
      const existingAttributes = ['a', 'b', 'c'];
      expect(instance.handleDuplicates(newAttributes, existingAttributes))
        .toEqual([]);
    });
  });

  describe('propUpdater', () => {
    // We'll use a mock to check if sendPropUpdate is called with the right arguments
    let mockSendPropUpdate;
    let instance;

    beforeEach(() => {
      instance = new PivotTableUI({
        onChange: () => {},
        renderers: {},
        aggregators: {},
        rows: ['gender', 'age'],
        cols: ['country', 'year'],
        rendererName: '',
        aggregatorName: '',
        vals: [],
        valueFilter: {},
        rowOrder: 'key_a_to_z',
        colOrder: 'key_a_to_z',
        derivedAttributes: {},
        data: []
      });
      // Mock the sendPropUpdate method
      mockSendPropUpdate = jest.spyOn(instance, 'sendPropUpdate').mockImplementation(() => {});
      // Mock the handleDuplicates method to control its return value
      jest.spyOn(instance, 'handleDuplicates');
    });

    afterEach(() => {
      mockSendPropUpdate.mockRestore();
      instance.handleDuplicates.mockRestore();
    });

    it('calls handleDuplicates when key is "rows"', () => {
      const newRows = ['gender', 'name'];
      const updater = instance.propUpdater('rows');
      
      // Set up the mock to return the same cols (no duplicates found)
      instance.handleDuplicates.mockReturnValueOnce(instance.props.cols);
      
      updater(newRows);
      
      expect(instance.handleDuplicates).toHaveBeenCalledWith(newRows, instance.props.cols);
      expect(mockSendPropUpdate).toHaveBeenCalledWith({
        rows: { $set: newRows }
      });
    });

    it('calls handleDuplicates when key is "cols"', () => {
      const newCols = ['country', 'city'];
      const updater = instance.propUpdater('cols');
      
      // Set up the mock to return the same rows (no duplicates found)
      instance.handleDuplicates.mockReturnValueOnce(instance.props.rows);
      
      updater(newCols);
      
      expect(instance.handleDuplicates).toHaveBeenCalledWith(newCols, instance.props.rows);
      expect(mockSendPropUpdate).toHaveBeenCalledWith({
        cols: { $set: newCols }
      });
    });

    it('updates cols when duplicate is found in rows update', () => {
      const newRows = ['gender', 'country']; // 'country' is duplicate
      const updater = instance.propUpdater('rows');
      
      // 'country' is removed from cols
      const updatedCols = ['year'];
      instance.handleDuplicates.mockReturnValueOnce(updatedCols);
      
      updater(newRows);
      
      expect(mockSendPropUpdate).toHaveBeenCalledWith({
        rows: { $set: newRows },
        cols: { $set: updatedCols }
      });
    });

    it('updates rows when duplicate is found in cols update', () => {
      const newCols = ['country', 'gender']; // 'gender' is duplicate
      const updater = instance.propUpdater('cols');
      
      // 'gender' is removed from rows
      const updatedRows = ['age'];
      instance.handleDuplicates.mockReturnValueOnce(updatedRows);
      
      updater(newCols);
      
      expect(mockSendPropUpdate).toHaveBeenCalledWith({
        cols: { $set: newCols },
        rows: { $set: updatedRows }
      });
    });

    it('does not update the other attribute if no duplicates found', () => {
      const newRows = ['gender', 'name'];
      const updater = instance.propUpdater('rows');
      
      // No change to cols (same array reference)
      instance.handleDuplicates.mockReturnValueOnce(instance.props.cols);
      
      updater(newRows);
      
      expect(mockSendPropUpdate).toHaveBeenCalledWith({
        rows: { $set: newRows }
      });
      // We shouldn't have cols in the update
      expect(mockSendPropUpdate.mock.calls[0][0].cols).toBeUndefined();
    });
  });
});
