import os

files = ['auth.html', 'dashboard.html', 'dream-journal.html', 'dream-input.html', 'analysis-result.html', 'contact.html', 'terms.html', 'privacy.html']

for f in files:
    p = os.path.join('public', f)
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as file:
            c = file.read()
        
        c = c.replace('<meta name="google-adsense-account" content="ca-pub-5730073345509405">\n', '')
        c = c.replace('<meta name="google-adsense-account" content="ca-pub-5730073345509405">', '')
        c = c.replace('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5730073345509405"\n     crossorigin="anonymous"></script>\n', '')
        c = c.replace('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5730073345509405" crossorigin="anonymous"></script>\n', '')
        c = c.replace('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5730073345509405" crossorigin="anonymous"></script>', '')
        
        with open(p, 'w', encoding='utf-8') as file:
            file.write(c)
        print(f"Cleaned {f}")
