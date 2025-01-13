import { jest } from '@jest/globals';
import { createExpression, renderExpressions } from './expressions.js';

describe('renderExpressions', () => {
  test('replaces simple expressions', () => {
    const callback = jest.fn(() => 'replaced');
    createExpression('test', callback);
    
    const root = document.createElement('div');
    root.innerHTML = '<div>{{test}}</div>';
    
    renderExpressions(root);
    expect(root.innerHTML).toBe('<div>replaced</div>');
  });

  test('passes all arguments to callbacks', () => {
    const callback = jest.fn();
    createExpression('test', callback);
    
    const root = document.createElement('div');
    root.innerHTML = '<div>{{test arg1 arg2}}</div>';
    
    renderExpressions(root);
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
  });

  test('handles multiple expressions', () => {
    const callback1 = jest.fn(() => 'first');
    const callback2 = jest.fn(() => 'second');
    
    createExpression('first', callback1);
    createExpression('second', callback2);
    
    const root = document.createElement('div');
    root.innerHTML = '<div>{{first}} {{second}}</div>';
    
    renderExpressions(root);
    expect(root.innerHTML).toBe('<div>first second</div>');
  });

  test('uses custom regex', () => {
    const callback = jest.fn(() => 'replaced');
    createExpression('test', callback);
    
    const root = document.createElement('div');
    root.innerHTML = '<div>@@test(arg1 arg2)</div>';
    
    renderExpressions(root, { regex: /@@(\w+)\(([^)]*)\)/g });
    expect(root.innerHTML).toBe('<div>replaced</div>');
  });

  test('handles missing expressions', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div>{{missing}}</div>';
    
    renderExpressions(root);
    expect(root.innerHTML).toBe('<div>{{missing}}</div>');
  });
});
