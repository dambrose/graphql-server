import defer from './deferred.js';

const transactions: Promise<any>[] = [];

export default async function begin(actions: () => Promise<any>): Promise<any> {
	const {promise, resolve} = defer();

	const waiting = transactions.slice();

	transactions.push(promise);

	const end = () => {
		resolve();
		transactions.splice(transactions.indexOf(promise), 1);
	};

	await Promise.all(waiting);

	const result = actions();

	result.then(end).catch(end);

	return await result;
};
