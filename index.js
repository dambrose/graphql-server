import Koa from 'koa';
import http from 'http';

const port = 3000;

const httpServer = http.createServer();
const app = new Koa();

app.use(ctx => {
	ctx.body = 'Hello World!';
});

httpServer.on('request', app.callback());

httpServer.listen({port}, err => {
	if (err) {
		console.error(err.stack);
		process.exit(1);
	}
	console.log(`server listening http://localhost:${port}`);
});
