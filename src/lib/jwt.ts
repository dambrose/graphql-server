import jwt from 'jsonwebtoken';

const {JWT_SECRET = 'secret'} = process.env;

const sign = (payload: any): Promise<string> => {
	return new Promise((resolve, reject) => {
		jwt.sign(payload, JWT_SECRET, (err, token) => {
			if (err) reject(err);
			else resolve(token);
		});
	});
};

const verify = (token: string): Promise<any | void> => {
	return new Promise((resolve: (value?: any) => void) => {
		jwt.verify(token, JWT_SECRET, (err: Error, data?: any): void => {
			if (err) {
				console.error(err);
				resolve();
			} else {
				resolve(data);
			}
		});
	});
};

export {sign, verify};