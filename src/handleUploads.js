import {join} from 'path';
import fs from 'fs';

export default (files) => {
	return Promise.all(files.map(async file => {

		const {filename, mimetype, createReadStream} = await file;

		const path = join('/tmp', filename);

		await new Promise((resolve, reject) => {
			const readStream = createReadStream();
			readStream.on('end', resolve);
			readStream.on('error', reject);

			const outputStream = fs.createWriteStream(path);
			outputStream.on('error', reject);

			readStream.pipe(outputStream);
		});

		return {
			filename,
			mimetype,
			path
		};
	}));
};