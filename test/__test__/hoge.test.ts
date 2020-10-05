import { describe, expect, test } from '@jest/globals';

const greet = (name: string): string => `Hello, ${name}!`;
describe('greet', (): void => {
  test('should say hello to Tom.', (): void => {
    const response: string = greet('Tom');
    expect(response).toBe('Hello, Tom!');
  });
});



// import { IosApp, AndroidApp } from 'application';
import config from 'config';

describe('config', (): void => {
  test('hoge', (): void => {
    const iosApps: any = config.get('app.iOS');

    expect(iosApps).toMatchObject({ "countryCode": ["jp", "us"], "id": 490217893 });
   });
});

import ReviewRepository from '../../src/repositories/ReviewRepository';
import ReviewModel from '../../src/models/ReviewModel';

describe('mysql', (): void => {
  test('selectRecord', async () => {
    const reviewRepository = new ReviewRepository(false);
    const review = new ReviewModel("reviewId", "title", "", "message", "version", "1", "postedAt");
    expect(await reviewRepository.selectRecord(review, "kind")).toBe(0);
  })
});