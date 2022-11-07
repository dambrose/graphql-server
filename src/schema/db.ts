import gitdb from '../lib/gitdb.js';

const {
	GIT_PATH = `${process.env.HOME}/db.git`,
	GIT_BRANCH = 'main'
} = process.env;

export default await gitdb(GIT_PATH, GIT_BRANCH);
