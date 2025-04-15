import * as fs from 'node:fs/promises';
import * as path from 'node:path';


type LeafNode = {
    fileName: string,
    type: 'file',
    contentName?: string,
    contentDescription?: string,
}

type DirNode = {
    fileName: string,
    type: 'dir',
    children: AnyNode[],
}

type AnyNode = LeafNode | DirNode;

/**
 * Recursively builds the directory tree. It ignores any file or directory starting with '.' or '_', and only includes
 * leaf nodes for JSON files.
 *
 * @param targetPath - The path to process.
 * @returns A node representing the file/directory, or null if the file is not JSON.
 */
async function buildTree(targetPath: string): Promise<AnyNode | null> {
    const name: string = path.basename(targetPath);
    // Ignore . and _
    if (name.startsWith("_") || name.startsWith(".")) {
        return null;
    }
    const stats = await fs.stat(targetPath);

    if (stats.isDirectory()) {
        // Read the directory contents.
        const childNames = await fs.readdir(targetPath);
        const children = await Promise.all(childNames.map(async (childName: string) => {
            return buildTree(path.join(targetPath, childName));
        }));

        // Filter out null values (i.e. things that are neither an eligible json file nor directory).
        const validChildren: AnyNode[] = children.filter((child): child is AnyNode => child !== null);

        // Only include the directory if it has children
        if (validChildren.length > 0) {
            return {
                fileName: name,
                type: 'dir',
                children: validChildren
            } satisfies DirNode;
        }
        else {
            return null;
        }
    }
    else if (stats.isFile() && path.extname(name).toLowerCase() === '.json') {
        const contents: string = await fs.readFile(targetPath, 'utf-8');
        const out: LeafNode = {
            fileName: name,
            type: 'file',
        };
        const json = JSON.parse(contents);
        if (json['name']) {
            out.contentName = json['name'];
        }
        if (json['description']) {
            out.contentDescription = json['description'];
        }
        return out;
    }
    return null;
}

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