import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatRelativeTime, formatSessionTitle } from './utils';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms);
const daysAgoAtNoon = (days: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, 12, 0);
};

test('formatRelativeTime describes recent times in words', () => {
  assert.equal(formatRelativeTime(ago(5 * 1000)), 'just now');
  assert.equal(formatRelativeTime(ago(MINUTE)), '1 minute ago');
  assert.equal(formatRelativeTime(ago(5 * MINUTE)), '5 minutes ago');
  assert.equal(formatRelativeTime(ago(HOUR)), '1 hour ago');
  assert.equal(formatRelativeTime(ago(3 * DAY)), '3 days ago');
});

test('formatRelativeTime falls back to a date after a week', () => {
  const date = ago(8 * DAY);

  assert.equal(formatRelativeTime(date), date.toLocaleDateString());
});

test('formatSessionTitle names today and yesterday', () => {
  assert.match(formatSessionTitle(daysAgoAtNoon(0)), /^Today at /);
  assert.match(formatSessionTitle(daysAgoAtNoon(1)), /^Yesterday at /);
});

test('formatSessionTitle uses the date for older sessions', () => {
  const title = formatSessionTitle(daysAgoAtNoon(3));

  assert.doesNotMatch(title, /^(Today|Yesterday)/);
  assert.match(title, / at /);
});

test('formatSessionTitle includes the year only for other years', () => {
  const now = new Date();
  const lastYear = String(now.getFullYear() - 1);

  assert.ok(formatSessionTitle(new Date(now.getFullYear() - 1, 5, 15, 12, 0)).includes(lastYear));
  assert.ok(!formatSessionTitle(daysAgoAtNoon(3)).includes(lastYear));
});
