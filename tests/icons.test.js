import test from 'node:test';
import assert from 'node:assert/strict';
import {exhibits} from '../experiments.js';
import {exhibitIcon, arrowIcon} from '../icons.js';
test('all twelve decorative exhibition icons are font-independent SVG geometry', () => {
 assert.equal(exhibits.length, 12);
 for (const {id} of exhibits) {
  const svg = exhibitIcon(id);
  assert.match(svg, /^<svg /); assert.match(svg, /viewBox="0 0 48 48"/);
  assert.match(svg, /aria-hidden="true"/); assert.match(svg, /focusable="false"/);
  assert.doesNotMatch(svg, /<text|<image|<script|href=/);
  assert.doesNotMatch(svg.replace(/<[^>]+>/g, ''), /\S/);
 }
 assert.equal(arrowIcon, exhibitIcon('flow'));
 assert.throws(() => exhibitIcon('unknown'), /Unknown exhibition icon/);
});
