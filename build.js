const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function createZip(outputFile, files, manifestPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputFile);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`✓ Created ${path.basename(outputFile)} (${archive.pointer()} bytes)`);
            resolve();
        });

        archive.on('error', (err) => reject(err));
        archive.pipe(output);

        // Add manifest
        archive.file(manifestPath, { name: 'manifest.json' });

        // Add other root files
        files.forEach(file => {
            if (fs.existsSync(file)) {
                archive.file(file, { name: path.basename(file) });
            }
        });

        // Add directories
        archive.directory('src/', 'src');
        
        // Add assets but exclude screenshots folder
        archive.directory('assets/', 'assets', (entry) => {
            // Exclude the screenshots folder and its contents
            const normalized = entry.name.replace(/\\/g, '/');
            if (normalized.includes('images/screenshots')) {
                return false;
            }
            return entry;
        });

        archive.finalize();
    });
}

async function build() {
    const distDir = path.join(__dirname, 'dist');

    // Create dist directory
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    const rootFiles = ['LICENSE'];

    try {
        // Build Chrome version
        await createZip(
            path.join(distDir, 'locksy-chrome.zip'),
            rootFiles,
            'manifest.json'
        );

        // Build Firefox version
        await createZip(
            path.join(distDir, 'locksy-firefox.zip'),
            rootFiles,
            'manifest.firefox.json'
        );

        console.log('\n✓ Build completed successfully!');
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

build();
