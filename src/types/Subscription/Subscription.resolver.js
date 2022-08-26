import pubSub from '../../pubSub.js';

export default {
	Subscription: {
		echo: {
			resolve(payload) {
				return payload.echo;
			},
			subscribe() {
				return pubSub.asyncIterator('ECHO');
			}
		}
	}
};