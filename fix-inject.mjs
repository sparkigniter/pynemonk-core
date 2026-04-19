import fs from 'fs';
import path from 'path';

function processFile(filePath) {
    if (!filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file uses tsyringe injectable
    if (!content.includes('@injectable')) return;
    
    let modified = false;
    let needsInjectImport = false;

    // Pattern for single line constructors
    // constructor(private foo: Foo, bar: Bar)
    const constructorRegex = /constructor\s*\(([^)]+)\)\s*\{/g;
    
    content = content.replace(constructorRegex, (match, argsString) => {
        // If there's an existing @inject, we might need to skip or be careful
        // but we can parse args by comma (assuming no nested generics with commas in constructor)
        const args = argsString.split(',').map(s => s.trim());
        const newArgs = args.map(arg => {
            if (arg.includes('@inject')) return arg; // already has inject
            
            // arg is like `private foo: Foo` or `foo: Foo`
            const typeMatch = arg.match(/:\s*([A-Za-z0-9_]+)/);
            if (typeMatch && typeMatch[1] !== 'any' && typeMatch[1] !== 'string' && typeMatch[1] !== 'number' && typeMatch[1] !== 'boolean') {
                modified = true;
                needsInjectImport = true;
                return `@inject(${typeMatch[1]}) ${arg}`;
            }
            return arg;
        });
        
        return `constructor(${newArgs.join(', ')}) {`;
    });

    if (modified) {
        // Add inject to tsyringe import if needed
        if (needsInjectImport && !content.includes('inject,')) {
            content = content.replace(/import\s*\{\s*injectable\s*\}\s*from\s*['"]tsyringe['"];?/, 'import { injectable, inject } from "tsyringe";');
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

walkDir('./services/pynemonk-core-auth/src');
walkDir('./services/pynemonk-core-school/src');
walkDir('./services/pynemonk-core-accounting/src');
console.log('Done processing constructors.');
