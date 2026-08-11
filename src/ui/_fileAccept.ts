// ─────────────────────────────────────────────────────────────────────────
// _fileAccept — "이 파일이 제약을 통과하나"의 **단일 판정**. 부품이 아니라 함수다(런타임 의존 0).
//
//  FileUploader(목록형 업로더)와 NoteThread(첨부 가능한 스레드)가 같은 accept·maxSize 어휘를 받는다.
//  판정이 두 벌이면 같은 파일이 화면마다 다르게 거절된다 — _attachment의 fallbackReason을 한 곳에
//  모은 것과 같은 규율("두 부품이 다르게 판정하면 안 된다").
//
//  왜 JS에서 또 보나: 다이얼로그의 accept 필터는 OS마다 표기가 달라 새는 곳이 있다(mac/win 동일 동작 요건).
// ─────────────────────────────────────────────────────────────────────────

/** accept 매칭 — 확장자(.pdf) / 와일드카드(image/*) / 정확 MIME(application/pdf) 모두 지원. */
export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const mime = (file.type || '').toLowerCase();
  return accept.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).some((spec) => {
    if (spec.startsWith('.')) return name.endsWith(spec);
    if (spec.endsWith('/*')) return mime.startsWith(spec.slice(0, -1));
    return mime === spec;
  });
}

/** 용량 상한. maxSize를 안 주면 상한이 없다(제약은 선언한 것만 건다). */
export function withinSize(file: File, maxSize?: number): boolean {
  return maxSize == null || file.size <= maxSize;
}
