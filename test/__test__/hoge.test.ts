import { describe, expect, test } from '@jest/globals';

const greet = (name: string): string => `Hello, ${name}!`;
describe('greet', (): void => {
  test('should say hello to Tom.', (): void => {
    const response: string = greet('Tom');
    expect(response).toBe('Hello, Tom!');
  });
});


