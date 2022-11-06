import db from '../db.js';

export default {
	Query: {
		hello() {
			return 'hello';
		},
		read(_, {path}) {
			return db.cat(path);
		},
		ls(_, {path, recursive}) {
			return db.ls(path, recursive);
		}
	}
};