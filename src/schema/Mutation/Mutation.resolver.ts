import pubSub from '../../pubSub.js';
import handleUpload from '../../handleUpload.js';
import db from '../db.js';
import transaction from '../../lib/transaction.js';
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
		async saveFile(_, {path, file}, {name, email}) {
			const {createReadStream} = await file;
			await transaction(async () => {
				await db.setUser(name, email);
				await db.save(path, createReadStream());
			});
			return true;
		},
		async save(_, {path, data}, {name, email}) {
			await transaction(async () => {
				await db.setUser(name, email);
				await db.save(path, data);
			});
			return true;
		},
		async mkdir(_, {path}, {name, email}) {
			await transaction(async () => {
				await db.setUser(name, email);
				await db.mkdir(path);
			});
			return true;
		},
		async rmdir(_, {path}, {name, email}) {
			await transaction(async () => {
				await db.setUser(name, email);
				await db.rmdir(path);
			});
			return true;
		},
		async rm(_, {path}, {name, email}) {
			await transaction(async () => {
				await db.setUser(name, email);
				await db.rm(path);
			});
			return true;
		},
		async cp(_, {fromPath, toPath}, {name, email}) {
			await transaction(async () => {
				await db.setUser(name, email);
				await db.cp(fromPath, toPath);
			});
			return true;
		},
		async mv(_, {fromPath, toPath}, {name, email}) {
			await transaction(async () => {
				await db.setUser(name, email);
				await db.mv(fromPath, toPath);
			});
			return true;
		},

		jwtSign(_, {name, email}) {
			return sign({name, email});
		}
	}
};