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

import Review from '../../src/repositories/Review';
import ReviewData from '../../src/models/ReviewData';

describe('mysql', (): void => {
  test('selectRecord', async () => {
    const review = new Review(false);
    const reviewData = new ReviewData("reviewId", "title", "", "message", "version", "1", "updated");
    expect(await review.selectRecord(reviewData, "kind")).toBe(0);
  })
});