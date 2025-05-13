import * as fs from 'node:fs/promises';
import {AnyNode, buildTree} from "./common.js";
import path from "node:path";
import {simpleGit} from "simple-git";

// Start at the repository root, assume that the _indexer directory is the cwd
process.chdir("..");
const repoRoot: string = process.cwd();

// Read all items in the repository root
const root = await buildTree(repoRoot);

const git = simpleGit()

async function getTimestamp(p: string): Promise<number | null> {

    const logResult = await git.log({
        file: p,
        n: 1,
        format: {ts: '%ct'}
    });
    const tsRaw = logResult.latest?.ts;
    // Git gives us the timestamp in seconds, we want millis
    return tsRaw === undefined ? null : parseInt(tsRaw) * 1000;
}

if (root === null) {
    console.error("error: root was null");
}
else if (root.type === 'file') (
    console.error("error: root was a file, not a directory")
)
else {

    function updateTs(containingDir: string[] | null, node: AnyNode): Promise<unknown> {
        if (node.type === 'dir') {
            return Promise.all(node.children.map(child => updateTs(containingDir === null ? [] : [...containingDir, node.fileName], child)));
        }
        else {
            return ((async () => {
                const p = path.join(...(containingDir as string[]), node.fileName);
                const contents = JSON.parse((await fs.readFile(p)).toString());
                if (!('timestamp' in contents)) {
                    contents['timestamp'] = await getTimestamp(p);
                }
                await fs.writeFile(p, JSON.stringify(contents));
            })());
        }
    }

    console.log("Beginning timestamp update")
    await updateTs(null, root);
    console.log("Done with timestamp update")
}
