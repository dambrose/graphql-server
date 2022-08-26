import {stat} from 'fs/promises';

export default {
	File: {
		async size({path}) {
			const {size} = await stat(path);
			return size;
		}
	}
};