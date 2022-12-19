import {createHash} from 'crypto';
import {pipeline} from 'stream/promises';
import {join} from 'path';
import {createWriteStream} from 'fs';

const {UPLOAD_DIR = '/tmp'} = process.env;

interface File {
	filename: string;
	mimetype: string;
	path: string;
	hash: string;
}

export default async (file: Promise<{ filename: string, mimetype: string, createReadStream: () => NodeJS.ReadableStream }>): Promise<File> => {

	const {filename, mimetype, createReadStream} = await file;

	const sha1 = createHash('sha1');

	await pipeline(
		createReadStream(),
		sha1
	);

	const hash: string = sha1.digest('hex');
	const path: string = join(UPLOAD_DIR, hash);

	await pipeline(
		createReadStream(),
		createWriteStream(path)
	);

	return {
		filename,
		mimetype,
		path,
		hash
	};
}