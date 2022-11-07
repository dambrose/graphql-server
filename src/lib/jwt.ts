import jwt from 'jsonwebtoken';

const {JWT_SECRET = 'secret'} = process.env;

const sign = obj => {
	return new Promise((resolve, reject) => {
		jwt.sign(obj, JWT_SECRET, (err, token) => {
			if (err) reject(err);
			else resolve(token);
		});
	});
};

const verify = token => {
	return new Promise((resolve) => {
		jwt.verify(token, JWT_SECRET, (err, data) => {
			if (err) {
				console.error(err);
				resolve(null);
			} else {
				resolve(data);
			}
		});
	});
};

export {sign, verify};