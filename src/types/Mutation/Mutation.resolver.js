import pubSub from '../../pubSub.js';
import handleUploads from '../../handleUploads.js';

export default {
	Mutation: {
		async echo(parent, {message}) {
			await pubSub.publish('ECHO', {echo: message});
			return message;
		},
		async upload(root, {files}) {
			console.log(files);
			const res = await handleUploads(files);
			return res;
		}
	}
};