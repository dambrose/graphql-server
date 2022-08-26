import {makeExecutableSchema} from '@graphql-tools/schema';
import {fileURLToPath} from 'url';
import {join} from 'path';
import {readFile} from 'fs/promises';
import QueryResolver from './resolvers/Query.resolver.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default async function makeSchema() {

	const Query = await readFile(join(__dirname, 'types/Query.graphql'), 'utf-8');

	const typeDefs = [Query];
	const resolvers = [QueryResolver];

	return makeExecutableSchema({
		typeDefs,
		resolvers
	});

}