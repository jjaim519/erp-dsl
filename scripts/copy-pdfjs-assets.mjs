// pdf.js 자산을 public/pdfjs 로 복사한다 (dev 앱 전용 — 배포 패키지엔 public/이 안 들어간다).
//
//  왜 복사하나: **패키지는 정적 파일을 서빙할 수 없다.** 뷰어는 pdfAssetBase 경로만 받고,
//  그 경로에 자산을 놓는 건 소비 앱의 일이다(README §5). 이 스크립트는 *우리 dev 앱*이 그 일을 하는 것이고,
//  소비처도 같은 방식(복사 또는 정적 서빙)으로 놓으면 된다.
//
//  왜 CDN이 아닌가: 폐쇄망 요건. 조사에서 걸러낸 패키지 중 둘이 런타임에 외부 호스트를 때렸고
//  (herokuapp 라이선스 확인 / officeapps.live.com 업로드), 그건 ERP 문서에선 즉시 실격이다.
//
//  ⚠ wasm/ 을 빠뜨리면 스캔 PDF·JPEG2000·폼이 **조용히** 깨진다(에러 없이 빈 페이지).
//  ⚠ cmaps/ 를 빠뜨리면 한글 PDF가 깨진다(CJK 인코딩).
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pdfjs-dist');
const out = join(root, 'public', 'pdfjs');

if (!existsSync(src)) {
  // optional peer라 없을 수 있다 — 실패가 아니라 정상 경로다(뷰어는 폴백 카드를 그린다).
  console.log('[pdfjs] pdfjs-dist 미설치 — 건너뜀 (PDF는 폴백 카드로 표시된다)');
  process.exit(0);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await cp(join(src, 'build', 'pdf.worker.min.mjs'), join(out, 'pdf.worker.min.mjs'));
for (const dir of ['cmaps', 'standard_fonts', 'wasm']) {
  await cp(join(src, dir), join(out, dir), { recursive: true });
}

console.log('[pdfjs] public/pdfjs 로 복사 완료 (worker · cmaps · standard_fonts · wasm)');
