import pubSub from '../../pubSub.js';

export default {
	Mutation: {
		async echo(parent, {message}) {
			await pubSub.publish('ECHO', {echo: message});
			return message;
		}
	}
};