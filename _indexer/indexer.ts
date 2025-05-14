import * as fs from 'node:fs/promises';
import {buildTree} from "./common.js";

// Start at the repository root, assume that the _indexer directory is the cwd
process.chdir("..");
const repoRoot: string = process.cwd();

// Read all items in the repository root
const root = await buildTree(repoRoot);

if (root === null) {
    console.error("error: root was null");
}
else if (root.type === 'file') (
    console.error("error: root was a file, not a directory")
)
else {
    console.log('writing _index.json');
    await fs.writeFile('_index.json', JSON.stringify(root))
    console.log('wrote _index.json');
}