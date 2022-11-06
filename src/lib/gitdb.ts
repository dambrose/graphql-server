import {spawn} from 'child_process';
import {join, dirname, basename} from 'path';
import streamToString from './streamToString.js';
import stringToStream from './stringToStream.js';

export default async (repository, branch) => {

	async function gitSetUserName(name) {
		await new Promise((resolve, reject) => {
			const cmd = `git config --local user.name "${name}"`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve(null);
			});
		});
	}

	async function gitSetUserEmail(email) {
		await new Promise((resolve, reject) => {
			const cmd = `git config --local user.email "${email}"`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve(null);
			});
		});
	}

	async function gitModified(filePath) {
		const cmd = `git log -1 --pretty="format:%ci" -- "${filePath}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		const [modified] = (await streamToString(child.stdout)).split('\n');
		return modified;
	}

	async function gitRevParse(path) {
		const cmd = `git rev-parse "${branch}:${path.replace(/"/g, '\\"')}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		const [hash] = (await streamToString(child.stdout)).split('\n');
		return hash;
	}

	async function gitType(filePath) {
		const cmd = `git cat-file -t "${branch}:${filePath.replace(/"/g, '\\"')}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		const [type] = (await streamToString(child.stdout)).split('\n');
		return type;
	}

	function gitCatFile(filePath) {
		const cmd = `git cat-file -p "${branch}:${filePath.replace(/"/g, '\\"')}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		return streamToString(child.stdout);
	}

	async function gitLsTree(treePath, recursive) {
		const cmd = `git ls-tree${recursive ? ' -r ' : ' '}"${branch}:${treePath.replace(/"/g, '\\"')}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});
		const dir = (await streamToString(child.stdout)).split('\n').filter(s => !!s);

		return (await Promise.all(dir.map(async s => {
			const [meta, gitPath] = s.split('\t');
			const relPath = gitPath.replace(/^"|"$|\\/g, '');
			const name = basename(relPath);
			const [, type, hash] = meta.split(' ');
			const path = join(treePath, relPath);
			return {
				type,
				hash,
				name,
				relPath,
				path
			};
		})));
	}

	async function gitHashObject(stream) {

		const cmd = 'git hash-object --stdin -w';
		const child = spawn(cmd, {shell: true, cwd: repository});

		stream.pipe(child.stdin);

		const [hash] = (await streamToString(child.stdout)).split('\n');
		return hash;
	}

	function gitReadTree(args = '--empty') {
		return new Promise((resolve, reject) => {
			const cmd = `git read-tree ${args}`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve(null);
			});
		});
	}

	function gitAddBlobToIndex(hash, fileName) {
		return new Promise((resolve, reject) => {
			const cmd = `git update-index --add --cacheinfo 100644,${hash},"${fileName.replace(/"/g, '\\"')}"`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve(null);
			});
		});
	}

	function gitRemoveBlobFromIndex(filePath) {
		return new Promise((resolve, reject) => {
			const cmd = `git rm "${filePath.replace(/"/g, '\\"').replace(/^-/, '\\-')}" --cached`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve(null);
			});
		});
	}

	async function gitWriteTree() {
		const cmd = 'git write-tree';
		const child = spawn(cmd, {shell: true, cwd: repository});

		const [tree] = (await streamToString(child.stdout)).split('\n');
		return tree;
	}

	async function gitCommitTree(tree, message) {

		const cmd = `git commit-tree ${tree} -p ${branch}`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		stringToStream(message).pipe(child.stdin);

		const [commit] = (await streamToString(child.stdout)).split('\n');
		return commit;
	}

	function gitUpdateRef(commit) {
		return new Promise((resolve, reject) => {
			const cmd = `git update-ref refs/heads/${branch} ${commit}`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve(null);
			});
		});
	}

	// public functions

	async function setUser(name, email) {
		await gitSetUserName(name);
		await gitSetUserEmail(email);
	}

	function exists(path) {
		return new Promise(resolve => {
			gitType(path).then(type => resolve(!!type)).catch(() => resolve(false));
		});
	}

	async function type(path) {
		const type = await gitType(path);
		if (!type) throw new Error(`"${path}" does not exist`);
		return type === 'blob' ? 'file' : type === 'tree' ? 'folder' : null;
	}

	async function modified(path) {
		return new Date(await gitModified(path));
	}

	async function cat(filePath) {
		if (await gitType(filePath) === 'blob')
			return await gitCatFile(filePath);
	}

	async function ls(treePath, recursive) {
		if (await gitType(treePath) === 'tree') {
			const dir = await gitLsTree(treePath, false);
			return (await Promise.all(dir.map(async ({type, hash, name, path}) => {
				const children = recursive && type === 'tree' ? await ls(path, true) : undefined;
				return {
					type: type === 'blob' ? 'file' : type === 'tree' ? 'folder' : null,
					hash,
					name,
					path,
					children
				};
			}))).filter(({name, type}) => (type && !/^\./.test(name)));
		}
	}

	async function save(data, filePath) {

		const dir = dirname(filePath);

		if (dir !== '.' && await gitType(dir) !== 'tree')
			throw new Error(`save: "${filePath}", directory "${dir}" does not exist`);

		const stream = typeof data === 'string' ? stringToStream(data) : data;

		const object = await gitHashObject(stream);

		await gitAddBlobToIndex(object, filePath);

		const tree = await gitWriteTree();

		const commit = await gitCommitTree(tree, `save: ${filePath}`);

		await gitUpdateRef(commit);

		return {object, tree, commit};

	}

	async function rm(filePath) {

		if (await gitType(filePath) !== 'blob')
			throw new Error(`rm: "${filePath}" is not a blob`);

		await gitRemoveBlobFromIndex(filePath);

		const tree = await gitWriteTree();

		const commit = await gitCommitTree(tree, `rm: ${filePath}`);

		await gitUpdateRef(commit);

		return {tree, commit};
	}

	async function mkdir(path) {
		if (!await gitType(path)) {

			const stream = stringToStream('');

			const object = await gitHashObject(stream);

			await gitAddBlobToIndex(object, join(path, '.dir'));

			const tree = await gitWriteTree();

			const commit = await gitCommitTree(tree, `mkdir: ${path}`);

			await gitUpdateRef(commit);

			return {object, tree, commit};
		}
	}

	function logProgress(progress, message) {
		console.log(`${Math.round(progress * 100)}% done, ${message}`);
	}

	async function rmdir(path, onProgress = logProgress) {
		if (await gitType(path) === 'tree') {

			const objects = await gitLsTree(path, true);
			let i = 0;
			for (const {path} of objects) {
				await gitRemoveBlobFromIndex(path);
				onProgress(++i / objects.length, `rm: "${path}"`);
			}

			const tree = await gitWriteTree();

			const commit = await gitCommitTree(tree, `rmdir: ${path}`);

			await gitUpdateRef(commit);

			return {
				tree,
				commit
			};
		}
	}

	async function cp(fromPath, toPath, onProgress = logProgress) {
		const fromType = await gitType(fromPath);
		if (!fromType) throw new Error(`cp: "${fromPath}" does not exist`);

		const toType = await gitType(toPath);
		if (toType) throw new Error(`cp: "${toPath}" already exists`);

		if (fromType === 'blob') {
			const object = await gitRevParse(fromPath);
			await gitAddBlobToIndex(object, toPath);
		} else { // tree
			const objects = await gitLsTree(fromPath, true);
			let i = 0;
			for (const {hash: object, relPath, path: oldPath} of objects) {
				const newPath = join(toPath, relPath);
				await gitAddBlobToIndex(object, newPath);
				onProgress(++i / objects.length, `cp: "${oldPath}" --> "${newPath}"`);
			}
		}

		const tree = await gitWriteTree();

		const commit = await gitCommitTree(tree, `cp: "${fromPath}" --> "${toPath}"`);

		await gitUpdateRef(commit);

		return {
			tree,
			commit
		};
	}

	async function mv(fromPath, toPath, onProgress = logProgress) {
		const fromType = await gitType(fromPath);
		if (!fromType) throw new Error(`cp: "${fromPath}" does not exist`);

		const toType = await gitType(toPath);
		if (toType) throw new Error(`cp: "${toPath}" already exists`);

		if (fromType === 'blob') {
			const object = await gitRevParse(fromPath);
			await gitAddBlobToIndex(object, toPath);
			await gitRemoveBlobFromIndex(fromPath);
		} else { // tree
			const objects = await gitLsTree(fromPath, true);
			let i = 0;
			for (const {hash: object, relPath, path: oldPath} of objects) {
				i++;
				const newPath = join(toPath, relPath);
				try {
					await gitAddBlobToIndex(object, newPath);
					await gitRemoveBlobFromIndex(oldPath);
					onProgress(i / objects.length, `mv: "${oldPath}" --> "${newPath}"`);
				} catch (err) {
					console.error(err);
				}
			}
		}

		const tree = await gitWriteTree();

		const commit = await gitCommitTree(tree, `mv: "${fromPath}" --> "${toPath}"`);

		await gitUpdateRef(commit);

		return {
			tree,
			commit
		};
	}

	async function search(text, path) {
		const regExp = new RegExp(text, 'i');

		const all = await gitLsTree(path, true);

		return all.map(({name, path}) => ({
			type: name === '.dir' ? 'folder' : 'file',
			name: name === '.dir' ? basename(dirname(path)) : name,
			path: name === '.dir' ? dirname(path) : path
		})).filter(({name}) => regExp.test(name));
	}

	await gitReadTree();
	await gitReadTree(branch);

	return {
		setUser,
		modified,
		type,
		exists,
		save,
		rm,
		mv,
		mkdir,
		rmdir,
		ls,
		cat,
		cp,
		search
	};

};

