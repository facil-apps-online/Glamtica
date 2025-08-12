import fs from 'fs';
import path from 'path';

// 📌 Configura las rutas de las carpetas a analizar
const srcDir = path.resolve('./src');
const hooksDir = path.join(srcDir, 'hooks');
const pagesDir = path.join(srcDir, 'pages');
const componentsDir = path.join(srcDir, 'components');

// 📌 Función para listar todos los archivos .ts y .tsx
function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

// 📌 Función para leer todo el código del proyecto
function readAllCode(dirPath) {
    let code = '';
    const files = getAllFiles(dirPath);
    files.forEach(file => {
        code += fs.readFileSync(file, 'utf8');
    });
    return code;
}

const allCode = readAllCode(srcDir);

// 📌 Función para encontrar archivos no usados
function findUnused(files, label) {
    const unused = [];
    files.forEach(file => {
        const fileName = path.basename(file).replace(/\.(ts|tsx)$/, '');
        if (!allCode.includes(fileName)) {
            unused.push(fileName);
        }
    });

    console.log(`\n🔍 ${label} NO usados:`);
    if (unused.length === 0) {
        console.log('✅ Todos se usan.');
    } else {
        unused.forEach(u => console.log(`- ${u}`));
    }
}

// 📌 Buscar hooks, pages y components no usados
findUnused(getAllFiles(hooksDir), 'Hooks');
findUnused(getAllFiles(pagesDir), 'Pages');
findUnused(getAllFiles(componentsDir), 'Components');
