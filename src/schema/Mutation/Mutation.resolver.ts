import pubSub from '../../pubSub.js';
import handleUpload from '../../handleUpload.js';
import {sign} from '../../lib/jwt.js';

export default {
	Mutation: {
		async echo(parent, {message}) {
			await pubSub.publish('ECHO', message);
			return message;
		},
		upload(_, {files}) {
			return Promise.all(files.map(handleUpload));
		},
		jwtSign(_, {name, email}) {
			return sign({name, email});
		}
	}
};