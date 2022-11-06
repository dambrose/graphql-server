import git from '../src/lib/gitdb.js';

// describe('gitdb', () => {
//
// 	test('nothing', async () => {
// 		const db = await git('../db.git', 'master');
// 		// console.log(await db.modified('foo'));
// 		// console.log(await db.modified('chuckr/hello.txt'));
// 		// console.log(await db.type('bazz'));
// 		// console.log(await db.rmdir('\\-bazz'));
// 		// await db.save('hello chuck R!','chuckr/hello.txt');
// 		// await db.cp('chuck/hello.txt','chuck/hello2.txt');
// 		// await db.mv('chuck','chuckr');
// 		// await db.rm('chuckr/hello2.txt');
// 		// console.dir(await db.ls('chuckr'), {depth: 10});
// 		// console.dir(await db.ls('Phil/z-Kathryn/XP', true));
// 		// await db.setUser('dennisa', 'dennisa@magnatag.com')
//
// 		// expect(db).toBeDefined();
// 		expect(null).toBeNull();
// 	});
//
// });

(async () => {

	const db = await git('../db.git', 'main');

	await db.setUser('dennisa', 'dennisa@magnatag.com');

	console.log(await db.save('Hello!', 'hello1.txt'));
	console.log(await db.save('Hello World!', 'hello2.txt'));
	console.log(await db.save('Hello World!', 'hello3.txt'));

	// console.log(await db.save('Hello World!', 'baz/bar/hello world.txt'));
//
// 	// console.log(await db.mkdir('foo'));
//
//
// 	// console.log(await db.mkdir('foo/bar'));
//
// 	console.log(await db.cp('baz', 'foo'));
//
// 	// console.log(await db.rm('foo/baz'));
//
// 	// console.log(await db.rmdir('foo'));
//
// 	// console.log(await db.rmdir('foofoo'));
//
// 	console.dir(await db.ls('', true), {depth: 10});
//
})().catch(err => {
	console.error(err);
});
