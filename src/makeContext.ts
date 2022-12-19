import parseAuthorization from './lib/parseAuthorization.js';
import {verify} from './lib/jwt.js';

type MakeContextParams = {
	ctx?: any,
	connectionParams?: any
}

export default async ({ctx, connectionParams}: MakeContextParams) => {
	const auth = ctx.get('authorization');
	if (!auth) return {};

	const token = parseAuthorization(auth);
	if (!token) return {};
	return await verify(token);
}