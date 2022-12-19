import {Buffer} from 'buffer';

export default (stream: NodeJS.ReadableStream) => new Promise<string>((resolve, reject) => {
	const _buf = [];
	stream.on('data', (chunk) => _buf.push(chunk));
	stream.on('end', () => resolve(Buffer.concat(_buf).toString()));
	stream.on('error', (err) => reject(err));
});