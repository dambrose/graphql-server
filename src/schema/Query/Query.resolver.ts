import db from '../db.js';

export default {
	Query: {
		hello() {
			return 'hello';
		},
		read(_, {path}) {
			return db.cat(path);
		}
	}
};