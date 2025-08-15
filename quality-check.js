import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('./src');

function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Hooks mal utilizados
    if (/useEffect\s*\(\s*async/.test(content)) {
        issues.push('⚠ useEffect async directamente (mala práctica)');
    }
    if (/useEffect\s*\(\s*\(\)\s*=>\s*\{\s*\},\s*\[\s*\]\s*\)/.test(content)) {
        issues.push('⚠ useEffect sin dependencias reales');
    }
    if (/useState\(.*\)/.test(content) && !content.includes('set')) {
        issues.push('⚠ useState sin usar');
    }

    // Formularios mal refactorizados
    if (/form/.test(content) && !/onSubmit=/.test(content)) {
        issues.push('⚠ Formulario sin onSubmit');
    }
    if (/<input/.test(content) && (!/value=/.test(content) || !/onChange=/.test(content))) {
        issues.push('⚠ Input sin value/onChange');
    }
    if (/any/.test(content) && /form/i.test(content)) {
        issues.push('⚠ Uso de any en formulario');
    }

    // Páginas sin vista de móvil
    if (filePath.includes('pages') && !/sm:|md:|lg:/.test(content)) {
        issues.push('⚠ Página sin clases responsive (Tailwind)');
    }

    // Páginas con doble padding o estilos conflictivos
    if (/(p-\d+.*p-\d+)/.test(content) || /(px-\d+.*px-\d+)/.test(content) || /(mt-\d+.*mt-\d+)/.test(content)) {
        issues.push('⚠ Clases de padding/margin duplicadas');
    }

    // Console.log generales
    if (/console\.log\(/.test(content)) {
        issues.push('⚠ Contiene console.log (eliminar en producción)');
    }

    // Console.log dentro de hooks (crítico)
    if (/use(Eff|Sta|Mem|Cal).*{[^}]*console\.log/.test(content)) {
        issues.push('🚨 console.log dentro de un hook (revisar con prioridad)');
    }

    return issues.length ? { file: filePath, issues } : null;
}

const files = getAllFiles(srcDir);
const report = files.map(analyzeFile).filter(Boolean);

if (report.length === 0) {
    console.log('✅ No se detectaron problemas.');
} else {
    console.log('🔍 Reporte de problemas encontrados:\n');
    report.forEach(r => {
        console.log(`📄 ${r.file}`);
        r.issues.forEach(i => console.log(`   - ${i}`));
    });
}
