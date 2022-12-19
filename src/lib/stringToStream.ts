import {Readable} from 'stream';
import {Buffer} from 'buffer';

export default (string: string) => <NodeJS.ReadableStream>Readable.from(Buffer.from(string));
