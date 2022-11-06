import pubSub from '../../pubSub.js';
import handleUpload from '../../handleUpload.js';
import db from '../db.js';
import transaction from '../../lib/transaction.js';

export default {
	Mutation: {
		async echo(parent, {message}) {
			await pubSub.publish('ECHO', message);
			return message;
		},
		upload(_, {files}) {
			return Promise.all(files.map(handleUpload));
		},
		async save(_, {path, file}) {
			const {createReadStream} = await file;
			await transaction(async () => {
				await db.setUser('dennisa', 'dennisa@magnatag.com');
				await db.save(createReadStream(), path);
			});
			return true;
		}
	}
};