import Koa from 'koa';
import {createServer} from 'http';
import {WebSocketServer} from 'ws';
import makeSchema from './makeSchema.js';
import createApolloServer from './createApolloServer.js';
import graphqlUploadKoa from 'graphql-upload/graphqlUploadKoa.mjs';
import healthcheck from './healthcheck.js';

const port: number = parseInt(process.env.PORT || '3000');
const path: string = '/graphql';

const httpServer = createServer();
const wsServer: WebSocketServer = new WebSocketServer({server: httpServer, path});

const schema = await makeSchema();

const apolloServer = createApolloServer({httpServer, wsServer, schema});
await apolloServer.start();

const app = new Koa();

app.proxy = true;

app
	.use(healthcheck())
	.use(graphqlUploadKoa())
	.use(apolloServer.getMiddleware({path}));

apolloServer.applyMiddleware({app, path});

httpServer.on('request', app.callback());

httpServer.listen({port}, () => {
	console.log(`server listening http://localhost:${port}${path}`);
});