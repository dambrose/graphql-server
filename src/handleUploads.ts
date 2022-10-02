import {join} from 'path';
import {createWriteStream} from 'fs';
import {pipeline} from 'stream/promises';

export default files => {
	return Promise.all(files.map(async file => {

		const {filename, mimetype, createReadStream} = await file;

		const path = join('/tmp', filename);

		await pipeline(
			createReadStream(),
			createWriteStream(path)
		);

		return {
			filename,
			mimetype,
			path
		};
	}));
};