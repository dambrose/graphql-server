import {Readable} from 'stream';
import {Buffer} from 'buffer';

export default string => Readable.from(Buffer.from(string));
