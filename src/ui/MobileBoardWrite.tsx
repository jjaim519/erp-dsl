'use client';
// MobileBoardWrite (유기체) — 사내 게시판 작성/수정의 모바일 화면. 데스크탑 BoardWrite의 짝.
//
//  · **규칙을 공유한다**: 수신자 포섭·배타 판정은 `_audience` 한 벌(데스크탑과 같은 모듈).
//    복제하면 같은 조직도가 두 화면에서 다르게 담긴다 — 그건 데이터 버그로 읽힌다.
//  · 데스크탑이 가진 작성 기능을 전부 갖는다 — 분류·제목·수신자(조직도 드릴)·본문·첨부(문서 포함)·
//    게시옵션 3종(상단고정/필독/댓글허용)·임시저장.
//  · 데스크탑과 갈리는 것:
//    ① 본문이 `Editor`(TipTap 툴바 10종)가 아니라 `Textarea`다. 폰에서 리치 툴바는 화면을 먹고 손도 안 닿는다.
//       (서식이 필요한 글은 데스크탑에서 쓴다 — 매체가 다르면 작성 도구도 다르다.)
//    ② 첨부가 드롭존이 아니라 **파일 선택 버튼 + 행 목록**이다. 폰에는 드래그가 없다.
//       사진만 붙이는 화면은 `MobilePhotoPicker`(썸네일 격자)가 따로 있다 — 여긴 문서까지 받는다.
//    ③ 수신자 칩은 필드 표면 안에 살고, 조직도는 새 화면이 아니라 *그 자리에서 펼친다*.
//       폰에서 화면을 하나 더 쌓으면 "쓰던 글"의 맥락이 끊긴다.
//  · **등록·취소는 이 부품이 아니라 셸이 소유한다** — 등록은 `MobileShell.bottom`(하단 고정 CTA),
//    취소는 뒤로가기(`onBack`). 부품이 자기 sticky 바를 그리면 같은 자리를 두 경로가 다툰다(v0.52.0).
//    **임시저장도 이 부품이 갖지 않는다.** 등록과 같은 위계가 아니다 — 등록은 *커밋*(상태를 넘김),
//    임시저장은 *안전망*(작업 보존). 업계 권고는 ① 백그라운드 자동 저장(초안 버전) ② 이탈 시점(뒤로가기)
//    확인 ③ 명시 버튼은 남기되 눈에 안 띄게 다("버튼을 아예 없애면 불안을 만든다")이고, 그 자리는
//    **셸 Navigation 우측 액션**이다. 폼 끝에 두면 정작 필요한 순간(나가려 할 때) 화면 밖이라 스크롤해야
//    닿고, 하단 CTA 옆에 두면 슬롯이 하나뿐인 자리를 놓고 등록과 다툰다(v0.52.0에서 합친 이유).
import { useRef, useState } from 'react';
import { MobileField } from './MobileField';
import { MobileChoice } from './MobileChoice';
import { TextInput } from './TextInput';
import { Textarea } from './Textarea';
import { Switch } from './Switch';
import { Chip } from './Chip';
import { Button } from './Button';
import { Text } from './Text';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { MobileSection } from './MobileSection';
import { MobileListRow } from './MobileListRow';
import { buildAudienceIndex, type AudienceNode } from './_audience';
import type { FileItem } from './FileUploader';
import './mobileboard.css';

type Props = {
  categories: { value: string; label: string }[];
  category: string | null;
  onCategoryChange: (v: string | null) => void;
  postTitle: string;
  onPostTitleChange: (v: string) => void;
  body: string;
  onBodyChange: (v: string) => void;
  bodyPlaceholder?: string;
  // 수신자 — 안 주면 섹션 미노출(소비처 결정, 데스크탑과 동일)
  audiences?: AudienceNode[];
  selectedAudiences?: string[];
  onAudiencesChange?: (ids: string[]) => void;
  // 첨부(문서 포함)
  files?: FileItem[];
  onFilesChange?: (next: FileItem[]) => void;
  attachLabel?: string;
  // 게시 옵션
  notice?: boolean;
  onNoticeChange?: (b: boolean) => void;
  mustRead?: boolean;
  onMustReadChange?: (b: boolean) => void;
  commentsAllowed?: boolean;
  onCommentsAllowedChange?: (b: boolean) => void;
};

export function MobileBoardWrite({
  categories, category, onCategoryChange,
  postTitle, onPostTitleChange,
  body, onBodyChange, bodyPlaceholder = '내용을 입력하세요',
  audiences, selectedAudiences, onAudiencesChange,
  files, onFilesChange, attachLabel = '파일 첨부',
  notice, onNoticeChange, mustRead, onMustReadChange,
  commentsAllowed = true, onCommentsAllowedChange,
}: Props) {
  const [drillOpen, setDrillOpen] = useState(false);
  const [openNodes, setOpenNodes] = useState<string[]>([]);   // 조직도 펼침 — 기본 전부 접힘
  const fileRef = useRef<HTMLInputElement>(null);

  // ── 수신자: 규칙은 공유 모듈, 여기선 화면만 ──
  const sel = new Set(selectedAudiences ?? []);
  const top = audiences ?? [];
  const aud = buildAudienceIndex(top);
  const add = (id: string) => {
    if (!onAudiencesChange) return;
    const next = aud.add(sel, id);
    if (next) onAudiencesChange(next);
  };
  const remove = (id: string) => {
    if (!onAudiencesChange) return;
    const next = new Set(sel); next.delete(id);
    onAudiencesChange([...next]);
  };
  const remaining = aud.remaining(sel);
  // 접힌 줄의 요약 — "인사팀 외 2". 개수를 따로 적지 않는다(‘외 N’이 이미 말한다).
  const names = [...sel].map((id) => aud.labelOf(id));
  const summary = names.length <= 1 ? (names[0] ?? '') : `${names[0]} 외 ${names.length - 1}`;

  // 행 상태 3종: added(직접 담김) / covered(조상에 포함 — 해제는 그 조상에서) / open(담을 수 있음).
  //  한 행에 두 행위가 있다: **담기(행 본체) / 펼치기(꺽쇠)**. 우리 Tree가 이미 그렇게 갈라 놓았고
  //  (행 클릭=onSelect · 꺽쇠=onToggle), 겹치면 "팀을 열어보려다 팀 전체가 수신자로 담긴다".
  const treeRow = (id: string, label: string, level: number, kids?: boolean) => {
    const state = aud.rowState(sel, id);
    const cover = state === 'covered' ? aud.coveredBy(sel, id) : undefined;
    const open = openNodes.includes(id);
    return (
      <div key={id} className={`mbw-tnode lv${level} ${state}`}>
        <button type="button" className="pick" disabled={state !== 'open'}
          aria-pressed={state === 'added'}
          title={cover ? `‘${aud.labelOf(cover)}’에 포함됨` : undefined}
          onClick={() => add(id)}>
          <span className="box"><Icon name="check" size="sm" /></span>{label}
        </button>
        {kids && (
          <button type="button" className="exp" aria-expanded={open} aria-label={`${label} 하위 ${open ? '접기' : '펼치기'}`}
            onClick={() => setOpenNodes((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}>
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size="sm" color="secondary" />
          </button>
        )}
      </div>
    );
  };
  // 하위는 **접힌 채로 시작**한다 — 조직도를 통째로 펼치면 본문까지 화면 밖으로 밀려난다(실화면 확인).
  //  깊이가 얕아도 마찬가지다: 폰에서 스크롤로 지나가야 하는 행이 늘어나는 게 곧 비용이다.
  const treeNode = (node: AudienceNode, level: number) => {
    const kids = Boolean(node.children?.length || node.members?.length);
    const open = openNodes.includes(node.id);
    return (
      <div key={node.id}>
        {treeRow(node.id, node.label, level, kids)}
        {open && (
          <>
            {node.children?.map((c) => treeNode(c, level + 1))}
            {node.members?.map((m) => treeRow(m.id, m.dept ? `${m.name} · ${m.dept}` : m.name, level + 1))}
          </>
        )}
      </div>
    );
  };

  // ── 첨부: 브라우저 File → FileItem 부여는 이 부품 책임(FileUploader와 같은 규율) ──
  const pickFiles = (list: FileList | null) => {
    if (!list || !onFilesChange) return;
    const added: FileItem[] = Array.from(list).map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      status: 'pending',
      file: f,
    }));
    onFilesChange([...(files ?? []), ...added]);
  };
  const dropFile = (id: string) => onFilesChange?.((files ?? []).filter((f) => f.id !== id));
  // 크기 표기는 부품이 한다 — File 객체를 이 부품이 이미 들고 있고, KB/MB는 로케일을 안 타는 표기다
  //  (날짜·통화처럼 소비처가 정할 성질이 아니다). 아직 안 붙인 파일(file 없음)은 조용히 생략.
  const fileSize = (f: FileItem) => {
    const b = f.file?.size;
    if (b == null) return undefined;
    return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
  };

  return (
    <>
      {/* 작성 머리 — 분류·제목·수신자를 *한 묶음*으로 둔다(메일 작성 화면과 같은 해부: 받는 이·제목이 먼저,
          본문은 그 아래 큰 면). 칸과 칸은 밑줄 하나로 나뉘고 상자는 없다. */}
      <MobileSection flush>
        {/* 분류는 드롭다운이 아니라 칩 줄이다 — 선택지가 몇 개뿐이라 전부 보여주고 한 번에 고르는 게 빠르고,
            꺽쇠(⌄)를 아래 수신자의 *펼침*에만 남겨 신호가 안 겹친다(오버레이로 열리는 것과 제자리에서
            펼쳐지는 것이 같은 글리프를 쓰면 화면이 거짓말을 한다). */}
        <MobileField label="분류" required>
          <MobileChoice options={categories} value={category} onChange={onCategoryChange} ariaLabel="분류" />
        </MobileField>
        <MobileField label="제목" required>
          <TextInput value={postTitle} onChange={onPostTitleChange} placeholder="제목을 입력하세요" />
        </MobileField>

        {audiences && audiences.length > 0 && (
          <>
          {/* 수신자는 *접힌 한 줄*로 시작한다 — 펼쳐 두면 칩 줄+빠른추가+조직도가 200px을 먹고
              본문이 첫 화면에서 밀려난다(실화면 확인). 단 **값은 접힌 줄에 그대로 보인다** —
              모바일 폼에서 "옵션을 접으면 두 번 탭해야 하고 옵션이 숨는다"는 경고(Smashing)는
              *값까지 숨겼을 때* 적중한다. 여기서 숨기는 건 고르는 *도구*뿐이다.
              펼침 안에서는 접기를 한 겹 더 두지 않는다(예전엔 조직도가 또 접혀 두 번 탭이었다). */}
          <MobileField label="수신자" required>
            <div className="mbw-aud">
              <button type="button" className="mbw-audsum" onClick={() => setDrillOpen((v) => !v)} aria-expanded={drillOpen}>
                <span className="t">
                  {sel.size === 0
                    ? <Text variant="body" color="secondary">받는 사람을 선택하세요</Text>
                    : <Text variant="body">{summary}</Text>}
                </span>
                <Icon name={drillOpen ? 'chevron-up' : 'chevron-down'} size="sm" color="secondary" />
              </button>

              {drillOpen && (
                <div className="mbw-audbody">
                  {/* 담긴 값 — 여기서만 개별 해제(✕). 담기는 아래 두 경로(칩·조직도)로 한 방향. */}
                  {sel.size > 0 && (
                    <div className="vals">
                      {[...sel].map((id) => (
                        <Chip key={id} color="primary" variant="value" selected onRemove={() => remove(id)}>
                          {aud.labelOf(id)}
                        </Chip>
                      ))}
                    </div>
                  )}
                  {remaining.length > 0 && (
                    <div className="mbw-quick">
                      <Text variant="caption" color="secondary">빠른 추가</Text>
                      <div className="chips">
                        {remaining.map((n) => (
                          <Chip key={n.id} variant="suggest" onChange={() => add(n.id)}>{`＋ ${n.label}`}</Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  {top.some((n) => n.children || n.members) && (
                    <div className="mbw-tree">
                      <Text variant="caption" color="secondary">조직도</Text>
                      {top.filter((n) => n.children || n.members).map((n) => treeNode(n, 1))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </MobileField>
          </>
        )}
      </MobileSection>

      {/* 본문 — 라벨 줄을 따로 두지 않는다. 섹션 제목이 그 이름표이고, 캔버스가 화면의 주인공이다
          (메일 작성의 본문 자리와 같다: 상자도 라벨 줄도 없이 바로 쓰는 면). */}
      <MobileSection title="본문">
        <Textarea variant="canvas" value={body} onChange={onBodyChange} placeholder={bodyPlaceholder} />
      </MobileSection>

      {onFilesChange && (
        // 첨부는 작성 흐름의 *보조 행위*라 헤더 우측 액션으로 접는다(`MobileSection.action`).
        //  붙인 게 없으면 헤더 한 줄뿐이다. 액션이 있는 헤더는 MobileSection이 세로 여백을 대칭으로 바꾼다.
        <MobileSection
          title={files && files.length > 0 ? `첨부 ${files.length}` : '첨부'}
          action={
            <button type="button" className="mbw-attach" onClick={() => fileRef.current?.click()}>
              {/* 네이티브 파일 입력 — accept를 안 건다: 문서·이미지 뭐든 받는다(사진 전용은 MobilePhotoPicker). */}
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => { pickFiles(e.target.files); e.target.value = ''; }} />
              <Icon name="paperclip" size="sm" />{attachLabel}
            </button>
          }
          flush
        >
          {files?.map((f) => (
            <MobileListRow
              key={f.id}
              title={f.name}
              meta={f.status === 'error' ? (f.error ?? '업로드 실패') : fileSize(f)}
              leading={<Icon name="file" size="sm" color="secondary" />}
              trailing={<IconButton icon="x" label="첨부 삭제" variant="ghost" size="sm" onClick={() => dropFile(f.id)} />}
            />
          ))}
        </MobileSection>
      )}

      {/* 게시 옵션 — 새 부품 없이 MobileListRow의 trailing 슬롯에 Switch를 꽂는다(onClick 없으면 정적 행). */}
      {(onNoticeChange || onMustReadChange || onCommentsAllowedChange) && (
        <MobileSection title="게시 옵션" flush>
          {onNoticeChange && (
            <MobileListRow title="상단 고정(공지)" meta="목록 최상단에 고정됩니다"
              trailing={<Switch checked={notice ?? false} onChange={onNoticeChange} />} />
          )}
          {onMustReadChange && (
            <MobileListRow title="필독" meta="수신자에게 읽음 확인을 요구합니다"
              trailing={<Switch checked={mustRead ?? false} onChange={onMustReadChange} />} />
          )}
          {onCommentsAllowedChange && (
            <MobileListRow title="댓글 허용" meta="끄면 댓글을 달 수 없습니다"
              trailing={<Switch checked={commentsAllowed} onChange={onCommentsAllowedChange} />} />
          )}
        </MobileSection>
      )}

    </>
  );
}
