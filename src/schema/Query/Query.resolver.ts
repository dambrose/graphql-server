import {verify} from '../../lib/jwt.js';

export default {
	Query: {
		hello() {
			return 'hello';
		},
		jwtVerify(_, {token}) {
			return verify(token);
		}
	}
};