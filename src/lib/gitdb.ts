import {spawn} from 'child_process';
import {join, dirname, basename} from 'path';
import streamToString from './streamToString.js';
import stringToStream from './stringToStream.js';

interface TreeItem {
	type: string;
	name: string;
	hash: string;
	path: string;
	relPath: string;
}

interface FileOrFolder {
	type: string;
	name: string;
	hash: string;
	path: string;
	children?: FileOrFolder[];
}

interface SearchResult {
	type: string;
	name: string;
	path: string;
}

type LogProgress = (progress: number, message: string) => void

interface GitDb {
	setUser: (name: string, email: string) => Promise<void>;
	modified: (path: string) => Promise<Date>;
	type: (path: string) => Promise<'file' | 'folder'>;
	exists: (path: string) => Promise<boolean>;
	save: (data: string | NodeJS.ReadableStream, filePath: string) => Promise<{ object: string, tree: string, commit: string }>;
	rm: (filePath: string) => Promise<{ tree: string, commit: string }>;
	mv: (fromPath: string, toPath: string, onProgress?: LogProgress) => Promise<{ tree: string, commit: string }>;
	mkdir: (path: string) => Promise<{ object: string, tree: string, commit: string }>;
	rmdir: (path: string, onProgress?: LogProgress) => Promise<{ tree: string, commit: string }>;
	ls: (treePath: string, recursive: boolean) => Promise<FileOrFolder[]>;
	cat: (filePath: string) => Promise<string>;
	cp: (fromPath: string, toPath: string, onProgress?: LogProgress) => Promise<{ tree: string, commit: string }>;
	search: (text: string, path: string) => Promise<SearchResult[]>;
}

export default async (repository: string, branch: string): Promise<GitDb> => {

	async function gitSetUserName(name: string) {
		await new Promise((resolve, reject) => {
			const cmd: string = `git config --local user.name "${name}"`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve(null);
			});
		});
	}

	async function gitSetUserEmail(email: string) {
		await new Promise((resolve, reject) => {
			const cmd: string = `git config --local user.email "${email}"`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve(null);
			});
		});
	}

	async function gitModified(filePath: string): Promise<Date> {
		const cmd: string = `git log -1 --pretty="format:%ci" -- "${filePath}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		const [modified]: string[] = (await streamToString(child.stdout)).split('\n');
		return new Date(modified);
	}

	async function gitRevParse(path: string): Promise<string> {
		const cmd: string = `git rev-parse "${branch}:${path.replace(/"/g, '\\"')}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		const [hash]: string[] = (await streamToString(child.stdout)).split('\n');
		return hash;
	}

	async function gitType(filePath: string): Promise<string> {
		const cmd: string = `git cat-file -t "${branch}:${filePath.replace(/"/g, '\\"')}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		const [type]: string[] = (await streamToString(child.stdout)).split('\n');
		return type;
	}

	function gitCatFile(filePath: string): Promise<string> {
		const cmd: string = `git cat-file -p "${branch}:${filePath.replace(/"/g, '\\"')}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		return streamToString(child.stdout);
	}

	async function gitLsTree(treePath: string, recursive: boolean): Promise<TreeItem[]> {
		const cmd: string = `git ls-tree${recursive ? ' -r ' : ' '}"${branch}:${treePath.replace(/"/g, '\\"')}"`;
		const child = spawn(cmd, {shell: true, cwd: repository});
		const dir: string[] = (await streamToString(child.stdout)).split('\n').filter(s => !!s);

		return (await Promise.all(dir.map(async s => {
			const [meta, gitPath]: string[] = s.split('\t');
			const relPath: string = gitPath.replace(/^"|"$|\\/g, '');
			const name: string = basename(relPath);
			const [, type, hash]: string[] = meta.split(' ');
			const path: string = join(treePath, relPath);
			return {
				type,
				hash,
				name,
				relPath,
				path
			};
		})));
	}

	async function gitHashObject(stream: NodeJS.ReadableStream): Promise<string> {

		const cmd: string = 'git hash-object --stdin -w';
		const child = spawn(cmd, {shell: true, cwd: repository});

		stream.pipe(child.stdin);

		const [hash]: string[] = (await streamToString(child.stdout)).split('\n');
		return hash;
	}

	function gitReadTree(branch: string = '--empty'): Promise<void> {
		return new Promise((resolve, reject) => {
			const cmd: string = `git read-tree ${branch}`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve();
			});
		});
	}

	function gitAddBlobToIndex(hash: string, fileName: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const cmd: string = `git update-index --add --cacheinfo 100644,${hash},"${fileName.replace(/"/g, '\\"')}"`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve();
			});
		});
	}

	function gitRemoveBlobFromIndex(filePath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const cmd: string = `git rm "${filePath.replace(/"/g, '\\"').replace(/^-/, '\\-')}" --cached`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve();
			});
		});
	}

	async function gitWriteTree(): Promise<string> {
		const cmd: string = 'git write-tree';
		const child = spawn(cmd, {shell: true, cwd: repository});

		const [tree]: string[] = (await streamToString(child.stdout)).split('\n');
		return tree;
	}

	async function gitCommitTree(tree: string, message: string): Promise<string> {

		const cmd: string = `git commit-tree ${tree} -p ${branch}`;
		const child = spawn(cmd, {shell: true, cwd: repository});

		stringToStream(message).pipe(child.stdin);

		const [commit]: string[] = (await streamToString(child.stdout)).split('\n');
		return commit;
	}

	function gitUpdateRef(commit: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const cmd: string = `git update-ref refs/heads/${branch} ${commit}`;
			const child = spawn(cmd, {shell: true, cwd: repository});
			child.on('exit', code => {
				if (code)
					reject(new Error(`Command [${cmd}] exited with code: ${code}`));
				else
					resolve();
			});
		});
	}

	// public functions

	async function setUser(name: string, email: string): Promise<void> {
		await gitSetUserName(name);
		await gitSetUserEmail(email);
	}

	function exists(path: string): Promise<boolean> {
		return new Promise(resolve => {
			gitType(path).then(type => resolve(!!type)).catch(() => resolve(false));
		});
	}

	async function type(path: string): Promise<'file' | 'folder'> {
		const type: string = await gitType(path);
		if (!type) throw new Error(`"${path}" does not exist`);
		return type === 'blob' ? 'file' : type === 'tree' ? 'folder' : null;
	}

	async function cat(filePath: string): Promise<string> {
		if (await gitType(filePath) === 'blob')
			return await gitCatFile(filePath);
	}

	async function ls(treePath: string, recursive: boolean): Promise<FileOrFolder[]> {
		if (await gitType(treePath) === 'tree') {
			const dir: TreeItem[] = await gitLsTree(treePath, false);
			return (await Promise.all(dir.map(async ({type: gitType, hash, name, path}: TreeItem) => {
				const type: string = gitType === 'blob' ? 'file' : gitType === 'tree' ? 'folder' : null;
				const children: FileOrFolder[] = recursive && gitType === 'tree' ? await ls(path, true) : undefined;
				return {
					type,
					hash,
					name,
					path,
					children
				};
			}))).filter(({name, type}) => (type && !/^\./.test(name)));
		}
	}

	async function save(filePath: string, data: string | NodeJS.ReadableStream): Promise<{ object: string, tree: string, commit: string }> {

		const dir: string = dirname(filePath);

		if (dir !== '.' && await gitType(dir) !== 'tree')
			throw new Error(`save: "${filePath}", directory "${dir}" does not exist`);

		const stream: NodeJS.ReadableStream = typeof data === 'string' ? stringToStream(data) : data;

		const object: string = await gitHashObject(stream);

		await gitAddBlobToIndex(object, filePath);

		const tree: string = await gitWriteTree();

		const commit: string = await gitCommitTree(tree, `save: ${filePath}`);

		await gitUpdateRef(commit);

		return {object, tree, commit};

	}

	async function rm(filePath: string): Promise<{ tree: string, commit: string }> {

		if (await gitType(filePath) !== 'blob')
			throw new Error(`rm: "${filePath}" is not a blob`);

		await gitRemoveBlobFromIndex(filePath);

		const tree: string = await gitWriteTree();

		const commit: string = await gitCommitTree(tree, `rm: ${filePath}`);

		await gitUpdateRef(commit);

		return {tree, commit};
	}

	async function mkdir(path: string): Promise<{ object: string, tree: string, commit: string }> {

		if (await gitType(path)) throw new Error(`Error: ${path} exists`);

		const stream: NodeJS.ReadableStream = stringToStream('');

		const object: string = await gitHashObject(stream);

		await gitAddBlobToIndex(object, join(path, '.dir'));

		const tree: string = await gitWriteTree();

		const commit: string = await gitCommitTree(tree, `mkdir: ${path}`);

		await gitUpdateRef(commit);

		return {object, tree, commit};

	}

	function logProgress(progress: number, message: string): void {
		console.log(`${Math.round(progress * 100)}% done, ${message}`);
	}

	async function rmdir(path: string, onProgress: LogProgress = logProgress): Promise<{ tree: string, commit: string }> {
		if (await gitType(path) !== 'tree') throw new Error(`${path} is not a folder`);

		const objects: TreeItem[] = await gitLsTree(path, true);
		let i = 0;
		for (const {path} of objects) {
			await gitRemoveBlobFromIndex(path);
			onProgress(++i / objects.length, `rm: "${path}"`);
		}

		const tree: string = await gitWriteTree();

		const commit: string = await gitCommitTree(tree, `rmdir: ${path}`);

		await gitUpdateRef(commit);

		return {
			tree,
			commit
		};

	}

	async function cp(fromPath: string, toPath: string, onProgress: LogProgress = logProgress): Promise<{ tree: string, commit: string }> {
		const fromType: string | undefined = await gitType(fromPath);
		if (!fromType) throw new Error(`cp: "${fromPath}" does not exist`);

		const toType: string | undefined = await gitType(toPath);
		if (toType) throw new Error(`cp: "${toPath}" already exists`);

		if (fromType === 'blob') {
			const object: string = await gitRevParse(fromPath);
			await gitAddBlobToIndex(object, toPath);
		} else { // tree
			const objects: TreeItem[] = await gitLsTree(fromPath, true);
			let i: number = 0;
			for (const {hash: object, relPath, path: oldPath} of objects) {
				const newPath: string = join(toPath, relPath);
				await gitAddBlobToIndex(object, newPath);
				onProgress(++i / objects.length, `cp: "${oldPath}" --> "${newPath}"`);
			}
		}

		const tree: string = await gitWriteTree();

		const commit: string = await gitCommitTree(tree, `cp: "${fromPath}" --> "${toPath}"`);

		await gitUpdateRef(commit);

		return {
			tree,
			commit
		};
	}

	async function mv(fromPath: string, toPath: string, onProgress: LogProgress = logProgress): Promise<{ tree: string, commit: string }> {
		const fromType: string | undefined = await gitType(fromPath);
		if (!fromType) throw new Error(`cp: "${fromPath}" does not exist`);

		const toType: string | undefined = await gitType(toPath);
		if (toType) throw new Error(`cp: "${toPath}" already exists`);

		if (fromType === 'blob') {
			const object: string = await gitRevParse(fromPath);
			await gitAddBlobToIndex(object, toPath);
			await gitRemoveBlobFromIndex(fromPath);
		} else { // tree
			const objects: TreeItem[] = await gitLsTree(fromPath, true);
			let i = 0;
			for (const {hash: object, relPath, path: oldPath} of objects) {
				i++;
				const newPath: string = join(toPath, relPath);
				try {
					await gitAddBlobToIndex(object, newPath);
					await gitRemoveBlobFromIndex(oldPath);
					onProgress(i / objects.length, `mv: "${oldPath}" --> "${newPath}"`);
				} catch (err) {
					console.error(err);
				}
			}
		}

		const tree: string = await gitWriteTree();

		const commit: string = await gitCommitTree(tree, `mv: "${fromPath}" --> "${toPath}"`);

		await gitUpdateRef(commit);

		return {
			tree,
			commit
		};
	}

	async function search(text: string, path: string): Promise<SearchResult[]> {
		const regExp: RegExp = new RegExp(text, 'i');

		const all: TreeItem[] = await gitLsTree(path, true);

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
		modified: gitModified,
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

