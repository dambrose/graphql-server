export default (authorization: string): string | undefined => {
	const [prefix, token, undef]: string[] = authorization?.split(' ') ?? [];

	if (prefix === 'Bearer' && typeof token === 'string' && undef === undefined)
		return token;
};