type HealthCheckOptions = {
	checkHealth?: Function,
	path?: String
}

export default ({checkHealth = () => true, path = '/healthcheck'}: HealthCheckOptions = {}) => {
	return (ctx, next) => {
		if (ctx.url !== path) return next();

		if (checkHealth()) {
			ctx.status = 200;
			ctx.body = 'OK';
		} else {
			ctx.status = 503;
			ctx.body = 'Service Unavailable';
		}
	};
}

