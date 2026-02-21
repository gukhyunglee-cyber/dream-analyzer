const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

const globalFooter = `
    <!-- Global Footer -->
    <footer style="margin-top: 4rem; padding: 2rem; border-top: 1px solid var(--glass-border); text-align: center; color: var(--color-text-muted); background: var(--color-surface);">
        <div style="display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
            <a href="/about.html" style="color: var(--color-text-secondary); text-decoration: none;">서비스 소개</a>
            <a href="/contact.html" style="color: var(--color-text-secondary); text-decoration: none;">문의하기</a>
            <a href="/terms.html" style="color: var(--color-text-secondary); text-decoration: none;">이용약관</a>
            <a href="/privacy.html" style="color: var(--color-text-secondary); text-decoration: none;">개인정보처리방침</a>
        </div>
        <p style="font-size: 0.9rem;">&copy; 2026 꿈 여행. 칼 융의 분석심리학을 기반으로 합니다.</p>
    </footer>`;

const files = fs.readdirSync(publicDir);

files.forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(publicDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Remove existing footers
        content = content.replace(/<footer[\s\S]*?<\/footer>/gi, '');
        content = content.replace(/<!--\s*Global Footer\s*-->/gi, '');
        content = content.replace(/<!--\s*Footer\s*-->/gi, '');

        // Ensure no multiple empty lines leftover
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

        if (content.includes('</body>')) {
            content = content.replace('</body>', `${globalFooter}\n</body>`);
            fs.writeFileSync(filePath, content);
            console.log('Injected global footer into ' + file);
        }
    }
});
