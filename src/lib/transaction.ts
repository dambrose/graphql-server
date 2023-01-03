import defer from './deferred.js';

const transactions: Promise<any>[] = [];

export {transactions};

export default async function begin(transaction: () => Promise<any>): Promise<any> {
	const {promise, resolve} = defer();

	const waiting = transactions.slice();

	transactions.push(promise);

	const end = (): void => {
		resolve();
		transactions.splice(transactions.indexOf(promise), 1);
	};

	await Promise.all(waiting);

	const result = transaction();

	result.then(end).catch(end);

	return await result;
};
