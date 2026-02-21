const fs = require('fs');
const content = fs.readFileSync('public/dream-journal.html', 'utf8');
const searchStr = `<div class="card text-center">
              <div style="font-size: 4rem; margin-bottom: 1rem;">🌙</div>
              <h2>아직 기록된 꿈이 없습니다</h2>
              <p class="text-muted mb-md">첫 번째 꿈을 기록하고 무의식의 메시지를 발견하세요</p>
              <a href="/dream-input.html" class="btn btn-accent">첫 꿈 기록하기</a>
            </div>`;
const replaceStr = `<div class="card text-center" style="padding: 3rem; background: var(--color-surface); border: 1px solid var(--glass-border);">
              <div style="font-size: 4rem; margin-bottom: 1rem;">🌙</div>
              <h2 style="color: var(--color-accent); margin-bottom: 1rem;">아직 기록된 꿈이 없습니다</h2>
              <p class="text-muted mb-md" style="line-height: 1.6;">
                당신의 소중한 무의식의 메시지가 날아가기 전에 첫 번째 꿈을 기록해보세요.<br>
                칼 융의 심리학을 기반으로 한 인공지능이 당신의 내면에 숨겨진 의미와<br>
                자아 실현(Individuation)을 위한 깊이 있는 조언을 제공합니다.
              </p>
              <a href="/dream-input.html" class="btn btn-accent" style="font-size: 1.1rem; padding: 0.8rem 1.5rem;">첫 꿈 기록하기</a>
            </div>`;
const updated = content.replace(searchStr, replaceStr);
fs.writeFileSync('public/dream-journal.html', updated);
console.log('Fixed journal empty state');
