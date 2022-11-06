import crypto from 'crypto';

export default data => crypto.createHash('sha1').update(['blob ', data.length, '\0', data].join('')).digest('hex');
