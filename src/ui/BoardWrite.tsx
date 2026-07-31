'use client';
// BoardWrite (템플릿) — 사내 게시판 글 작성/수정. 도메인 0줄(헌법 1).
//  · 분류·제목·수신자·본문·첨부·게시옵션. 전부 controlled — 값/콜백은 소비처.
//  · 본문 = v1 Textarea(정직). 리치 에디터는 흡수 백로그(jsonrender-absorption 식 — 엔진은 나중에 외부 흡수).
//  · 수신자(안 C) = 칩 프리셋(빠른 길) + '직접 지정' 조직도 드릴(정밀·개인). audiences 데이터(소비처)가 깊이 결정.
//    'exclusive' 노드('전체')는 배타. 선택 결과 = '수신자 N' 칩(단일 진실, BoardView 읽음확인 분모).
//    v0.50.0: 프리셋·조직도는 *소스*(가용 목록)라 선택 상태를 표현하지 않는다 — 담기(add) 한 경로, 해제는 결과 ✕ 한 경로.
//    그전엔 프리셋 칩이 selected를 함께 들어 같은 대상이 두 곳에 칩으로 중복 표시되고 해제 경로가 둘이었다(§11-3 위반,
//    그리고 이 파일이 원래 선언한 "결과가 단일 진실"과도 어긋났음). 이미 담긴 소스 항목은 비활성 = 가용성 표시.
//  · 라벨은 FormField(분자)가 소유. 수신자 칩/드릴·게시옵션 레이아웃은 board 전용(board.css, 01 4-D). 색=토큰.
import { useState } from 'react';
import { Container } from './Container';
import { Page } from './Page';
import { PageHeader } from './PageHeader';
import { FormField } from './FormField';
import { Select } from './Select';
import { TextInput } from './TextInput';
import { Editor, type EditorFeature } from './Editor';
import { FileUploader, type FileItem } from './FileUploader';
import { Switch } from './Switch';
import { Chip } from './Chip';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';
import { Group } from './Group';
import { fieldBorder } from './_fieldStyles';
import { buildAudienceIndex, type AudienceNode } from './_audience';
import './board.css';

// 수신자 트리의 *규칙*(포섭·배타·행 상태)은 `_audience`가 단일 출처다 — 모바일(MobileBoardWrite)과
//  같은 한 벌을 쓴다. 복제하면 같은 데이터가 두 화면에서 다르게 담긴다(_calendarLanes와 같은 이유).
export type { AudienceNode };

type Props = {
  pageTitle?: string;                                    // '글쓰기' | '글 수정'
  // 분류 + 제목
  categories: { value: string; label: string }[];
  category: string | null;
  onCategoryChange: (v: string | null) => void;
  postTitle: string;
  onPostTitleChange: (v: string) => void;
  // 본문(리치 에디터 — TipTap 흡수). HTML 문자열.
  body: string;
  onBodyChange: (v: string) => void;
  bodyPlaceholder?: string;
  bodyFeatures?: EditorFeature[];        // 본문 에디터 노출 기능(닫힌 세트, 소비처 선택). 기본 전체

  // 수신자(안 C) — 안 주면 섹션 미노출(소비처 결정)
  audiences?: AudienceNode[];
  selectedAudiences?: string[];
  onAudiencesChange?: (ids: string[]) => void;
  // 첨부
  files?: FileItem[];
  onFilesChange?: (next: FileItem[]) => void;
  // 게시 옵션
  notice?: boolean;
  onNoticeChange?: (b: boolean) => void;
  mustRead?: boolean;
  onMustReadChange?: (b: boolean) => void;
  commentsAllowed?: boolean;
  onCommentsAllowedChange?: (b: boolean) => void;
  // 액션
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
};

export function BoardWrite({
  pageTitle = '글쓰기',
  categories, category, onCategoryChange,
  postTitle, onPostTitleChange,
  body, onBodyChange, bodyPlaceholder = '내용을 입력하세요', bodyFeatures,
  audiences, selectedAudiences, onAudiencesChange,
  files, onFilesChange,
  notice, onNoticeChange, mustRead, onMustReadChange,
  commentsAllowed = true, onCommentsAllowedChange,
  onCancel, onSaveDraft, onSubmit, submitLabel = '등록',
}: Props) {
  const [drillOpen, setDrillOpen] = useState(false);

  // ── 수신자(안 C) — 규칙은 `_audience`(공유), 여기선 화면만 ──
  const sel = new Set(selectedAudiences ?? []);
  const top = audiences ?? [];
  const aud = buildAudienceIndex(top);
  const labelOf = { get: (id: string) => aud.labelOf(id) };

  // 선택 경로는 "담기"(add) 하나, 해제 경로는 결과 목록의 ✕(remove) 하나 — 같은 행위에 경로 둘을 두지 않는다(§11-3).
  //  프리셋 칩·조직도 행은 *소스*(가용 목록)라 선택 상태를 표현하지 않고, 이미 담긴 항목은 비활성으로 가용성만 알린다.
  //  선택 결과의 단일 진실은 아래 '수신자 N' 목록 하나뿐(이 부품의 원 설계 — 파일 헤더 주석).
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
  const remaining = aud.remaining(sel);   // 빠른 추가엔 *아직 안 담긴* 제안만

  function treeRow(id: string, label: string, level: number) {
    const state = aud.rowState(sel, id);
    const cover = state === 'covered' ? aud.coveredBy(sel, id) : undefined;
    return (
      <div key={id} className={`bw-tnode lv${level} ${state}`}
        aria-disabled={state !== 'open' || undefined}
        title={cover ? `‘${labelOf.get(cover) ?? cover}’에 포함됨` : undefined}
        onClick={state === 'open' ? () => add(id) : undefined}>
        <span className="box"><Icon name="check" size="sm" /></span>{label}
      </div>
    );
  }
  function treeNode(node: AudienceNode, level: number) {
    return (
      <div key={node.id}>
        {treeRow(node.id, node.label, level)}
        {node.children?.map((c) => treeNode(c, level + 1))}
        {node.members?.map((m) => treeRow(m.id, m.dept ? `${m.name} · ${m.dept}` : m.name, level + 1))}
      </div>
    );
  }

  return (
    <Page>
      <Container maxWidth="default">
      <div className="bw">
        <PageHeader title={pageTitle} />

        <div className="bw-card">
          {/* 분류 + 제목 */}
          <div className="bw-row">
            <FormField label="분류" withAsterisk>
              <Select options={categories} value={category} onChange={onCategoryChange} placeholder="분류 선택" />
            </FormField>
            <FormField label="제목" withAsterisk>
              <TextInput value={postTitle} onChange={onPostTitleChange} placeholder="제목을 입력하세요" />
            </FormField>
          </div>

          {/* 수신자(안 C) — 칩 + 조직도 드릴 */}
          {audiences && audiences.length > 0 && (
            <FormField label="수신자" withAsterisk>
              <div className="bw-aud">
                {/* 값(input chip)은 *필드 표면 안*에 산다 — 다른 입력칸(분류·제목)과 같은 테두리 통로를 써서
                    "이건 이 폼 필드의 값"이 형태로 드러난다(MultiSelect의 PillsInput 어휘와 동형).
                    별도 소제목을 두지 않는다 — FormField 라벨이 이미 '수신자'라 중복이 된다. 개수만 우측에 조용히. */}
                <div className="bw-aud-field" style={fieldBorder}>
                  <div className="bw-aud-vals">
                    {sel.size === 0
                      ? <span className="ph">받는 사람을 선택하세요</span>
                      : [...sel].map((id) => (
                        <Chip key={id} color="primary" variant="value" selected onRemove={() => remove(id)}>
                          {labelOf.get(id) ?? id}
                        </Chip>
                      ))}
                  </div>
                  <div className="bw-aud-foot">
                    {top.some((n) => n.children || n.members) && (
                      <button type="button" className="bw-drillbtn" onClick={() => setDrillOpen((v) => !v)}>
                        <Icon name="building" size="sm" />＋ 직접 지정 (조직도)
                        <Icon name={drillOpen ? 'chevron-up' : 'chevron-down'} size="sm" />
                      </button>
                    )}
                    {sel.size > 0 && <span className="cnt">{sel.size}명</span>}
                  </div>
                  {drillOpen && <div className="bw-tree">{top.filter((n) => n.children || n.members).map((n) => treeNode(n, 1))}</div>}
                </div>
                {/* 빠른 추가(suggestion chip) — 아웃라인·가벼움. 이미 담긴 건 목록에서 뺀다(남은 제안만 보인다). */}
                {remaining.length > 0 && (
                  <div className="bw-aud-quick">
                    <Text variant="caption" color="secondary">빠른 추가</Text>
                    <div className="bw-aud-chips">
                      {remaining.map((n) => (
                        <Chip key={n.id} variant="suggest" onChange={() => add(n.id)}>{`＋ ${n.label}`}</Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FormField>
          )}

          {/* 본문 (리치 에디터 — TipTap 흡수) */}
          <FormField label="본문" withAsterisk>
            <Editor value={body} onChange={onBodyChange} features={bodyFeatures} placeholder={bodyPlaceholder} />
          </FormField>

          {/* 첨부 */}
          {onFilesChange && (
            <FormField label="첨부파일">
              <FileUploader value={files ?? []} onChange={onFilesChange} multiple maxSize={20 * 1024 * 1024} />
            </FormField>
          )}

          {/* 게시 옵션 */}
          <div className="bw-opts">
            <div className="bw-opts-hd">게시 옵션</div>
            {onNoticeChange && (
              <div className="bw-opt">
                <div className="bw-opt-txt"><div className="nm">상단 고정(공지)</div><div className="desc">목록 최상단 공지 영역에 고정됩니다.</div></div>
                <Switch checked={!!notice} onChange={onNoticeChange} />
              </div>
            )}
            {notice && onMustReadChange && (
              <div className="bw-opt">
                <div className="bw-opt-txt"><div className="nm">필독 지정</div><div className="desc">읽음 확인을 요구하고, 안 읽은 인원을 추적합니다.</div></div>
                <Switch checked={!!mustRead} onChange={onMustReadChange} />
              </div>
            )}
            {onCommentsAllowedChange && (
              <div className="bw-opt">
                <div className="bw-opt-txt"><div className="nm">댓글 허용</div><div className="desc">끄면 이 글에 댓글을 달 수 없습니다.</div></div>
                <Switch checked={commentsAllowed} onChange={onCommentsAllowedChange} />
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="bw-foot">
          <Group gap="xs" justify="end">
            {onCancel && <Button variant="ghost" onClick={onCancel}>취소</Button>}
            {onSaveDraft && <Button variant="secondary" leftIcon={<Icon name="save" size="sm" />} onClick={onSaveDraft}>임시저장</Button>}
            <Button variant="primary" onClick={onSubmit ?? (() => {})}>{submitLabel}</Button>
          </Group>
        </div>
      </div>
      </Container>
    </Page>
  );
}
