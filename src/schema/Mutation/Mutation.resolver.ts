import pubSub from '../../pubSub.js';
import handleUploads from '../../handleUploads.js';

export default {
	Mutation: {
		async echo(parent, {message}) {
			await pubSub.publish('ECHO', message);
			return message;
		},
		upload(_, {files}) {
			return handleUploads(files);
		}
	}
};