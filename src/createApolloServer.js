import {ApolloServer} from 'apollo-server-koa';
import {useServer} from 'graphql-ws/lib/use/ws';
import {
	ApolloServerPluginDrainHttpServer,
	ApolloServerPluginLandingPageGraphQLPlayground
} from 'apollo-server-core';
import makeContext from './makeContext.js';

export default ({httpServer, wsServer, schema}) => {

	const graphqlWsServer = wsServer ? useServer({
		schema,
		onConnect() {
			console.log('socket connected');
		},
		context: async ({connectionParams}) => {
			return makeContext({connectionParams});
		}
	}, wsServer) : {
		async dispose() {
		}
	};

	return new ApolloServer({
		schema,
		plugins: [
			ApolloServerPluginDrainHttpServer({httpServer}),
			ShutdownWebSocketServer(graphqlWsServer),
			ApolloServerPluginLandingPageGraphQLPlayground()
		],
		async context({ctx}) {
			return makeContext({ctx});
		}
	});

};

function ShutdownWebSocketServer(graphqlWsServer) {
	return {
		async serverWillStart() {
			return {
				async drainServer() {
					await graphqlWsServer.dispose();
				}
			};
		}
	};
}