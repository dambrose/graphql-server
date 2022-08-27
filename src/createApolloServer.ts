import {ApolloServer} from 'apollo-server-koa';
import {useServer} from 'graphql-ws/lib/use/ws';
import {
	ApolloServerPluginDrainHttpServer,
	ApolloServerPluginLandingPageGraphQLPlayground
} from 'apollo-server-core';
import makeContext from './makeContext.js';

export default ({httpServer, wsServer, schema}) => {

	const graphqlWsServer = useServer({
		schema,
		onConnect({connectionParams}) {
			console.log(`socket connected ${JSON.stringify(connectionParams)}`);
		},
		onDisconnect({connectionParams}) {
			console.log(`socket disconnected ${JSON.stringify(connectionParams)}`);
		},
		context: async ({connectionParams}) => {
			return makeContext({connectionParams});
		}
	}, wsServer);

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