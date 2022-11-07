export default authorization => {
	const [prefix, token, undef] = authorization?.split(' ') ?? [];

	if (prefix === 'Bearer' && typeof token === 'string' && undef === undefined) {
		return token;
	}
};