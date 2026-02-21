import glob
import os

html_files = glob.glob('public/*.html')
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<link rel="manifest"' not in content:
        content = content.replace('</head>', '  <link rel="manifest" href="/manifest.json">\n</head>')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)

js_append = """
// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered!', reg))
      .catch(err => console.error('SW registration failed!', err));
  });
}
"""
with open('public/js/app.js', 'a', encoding='utf-8') as f:
    f.write(js_append)

print('PWA injected successfully')
