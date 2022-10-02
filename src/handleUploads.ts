import {join} from 'path';
import {createWriteStream} from 'fs';
import {pipeline} from 'stream/promises';
import {createHash} from 'crypto';

const {UPLOAD_DIR = '/tmp'} = process.env;

export default files => {
	return Promise.all(files.map(async file => {

		const {filename, mimetype, createReadStream} = await file;

		const sha1 = createHash('sha1');

		await pipeline(
			createReadStream(),
			sha1
		);

		const hash = sha1.digest('hex');
		const path = join(UPLOAD_DIR, hash);

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
	}));
};