import {ApolloServer} from 'apollo-server-koa';
import {useServer} from 'graphql-ws/lib/use/ws';
import {
	ApolloServerPluginDrainHttpServer,
	ApolloServerPluginLandingPageGraphQLPlayground
} from 'apollo-server-core';
import makeContext from './makeContext.js';

export default function createApolloServer(httpServer, wsServer, schema) {

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

			// Proper shutdown for the HTTP server.
			ApolloServerPluginDrainHttpServer({httpServer}),

			// Proper shutdown for the WebSocket server.
			{
				async serverWillStart() {
					return {
						async drainServer() {
							await graphqlWsServer.dispose();
						}
					};
				}
			},
			ApolloServerPluginLandingPageGraphQLPlayground()
		],
		async context({ctx}) {
			return makeContext({ctx});
		}
	});

};