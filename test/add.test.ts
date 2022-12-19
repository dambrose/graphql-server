import {describe, expect, test} from '@jest/globals';

import add from '../src/lib/add.js';

describe('add', () => {

	test('add', () => {

		expect(add(2, 2)).toBe(4);

	});

});