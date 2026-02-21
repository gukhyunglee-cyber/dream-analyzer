const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const adsTxtPath = path.join(publicDir, 'ads.txt');

// 1. Write ads.txt
fs.writeFileSync(adsTxtPath, 'google.com, pub-5730073345509405, DIRECT, f08c47fec0942fa0');
console.log('Created ads.txt');

// 2. Inject meta and script tags
const metaTag = '<meta name="google-adsense-account" content="ca-pub-5730073345509405">';
const scriptTag = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5730073345509405" crossorigin="anonymous"></script>';

const files = fs.readdirSync(publicDir);

files.forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(publicDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Prevent double injection
        if (!content.includes('google-adsense-account')) {
            content = content.replace('</head>', `    ${metaTag}\n    ${scriptTag}\n</head>`);
            fs.writeFileSync(filePath, content);
            console.log('Injected AdSense code into ' + file);
        }
    }
});
