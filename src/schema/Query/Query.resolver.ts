import db from '../db.js';
import {verify} from '../../lib/jwt.js';

export default {
	Query: {
		hello() {
			return 'hello';
		},
		read(_, {path}) {
			return db.cat(path);
		},
		ls(_, {path, recursive}) {
			return db.ls(path, !!recursive);
		},
		jwtVerify(_, {token}) {
			return verify(token);
		}
	}
};