type Deferred = {
	promise: Promise<any>
	resolve: (...args: any[]) => any,
	reject: (err: Error) => void,
}

export {Deferred};

export default function defer(): Deferred {

	let resolve, reject;

	const promise = new Promise(function (res, rej) {
		resolve = res;
		reject = rej;
	});

	return {
		promise,
		resolve,
		reject
	};

};