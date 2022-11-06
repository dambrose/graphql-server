import {describe, expect, test} from '@jest/globals';

import transaction from '../src/lib/transaction.js';

describe('transaction', () => {

	test('123', async () => {

		let array = [];

		const t1 = transaction(async () => {
			const a = [];
			a.push(await timeout(() => '1', 300));
			a.push(await timeout(() => '2', 200));
			a.push(await timeout(() => '3', 100));
			array.push(...a);
		});

		await t1;

		expect(array.join('')).toBe('123');

	});

	test('123456', async () => {

		let array = [];

		const t1 = transaction(async () => {
			const a = [];
			a.push(await timeout(() => '1', 300));
			a.push(await timeout(() => '2', 200));
			a.push(await timeout(() => '3', 100));
			array.push(...a);
		});

		const t2 = transaction(async () => {
			const a = [];
			a.push(await timeout(() => '4', 100));
			a.push(await timeout(() => '5', 200));
			a.push(await timeout(() => '6', 300));
			array.push(...a);
		});

		await t1;
		await t2;

		expect(array.join('')).toBe('123456');

	});

	test('error 456', async () => {

		let array = [];

		const t1 = transaction(async () => {
			const a = [];
			a.push(await timeout(() => '1', 300));
			a.push(await timeout(() => 'a', 200));
			a.push(await timeout(() => '3', 100));
			array.push(...a);
		});

		const t2 = transaction(async () => {
			const a = [];
			a.push(await timeout(() => '4', 100));
			a.push(await timeout(() => '5', 200));
			a.push(await timeout(() => '6', 300));
			array.push(...a);
		});

		try {
			await t1;
		} catch (err) {
			//console.error(err.message);
		}

		try {
			await t2;
		} catch (err) {
			//console.error(err.message);
		}
		console.log(array.join(''));

		expect(array.join('')).toBe('456');

	});

});

function timeout(func, delay) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const res = func();
			if (res === 'a') reject(new Error('Error a'));
			resolve(res);
		}, delay);
	});
}