import {makeExecutableSchema} from '@graphql-tools/schema';
import {fileURLToPath} from 'url';
import {join} from 'path';
import {readFile} from 'fs/promises';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const TYPES = [
	'Query',
	'Mutation',
	'Subscription',
	'Upload',
	'File'
];

export default async () => {

	const typeDefs = await Promise.all(TYPES.map(type => readFile(join(__dirname, `types/${type}/${type}.graphql`), 'utf-8')));
	const resolvers = await Promise.all(TYPES.map(async type => ((await import(`./types/${type}/${type}.resolver.js`)).default)));

	return makeExecutableSchema({
		typeDefs,
		resolvers
	});

}