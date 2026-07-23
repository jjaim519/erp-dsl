'use client';
// BoardWrite (템플릿) — 사내 게시판 글 작성/수정. 도메인 0줄(헌법 1).
//  · 분류·제목·수신자·본문·첨부·게시옵션. 전부 controlled — 값/콜백은 소비처.
//  · 본문 = v1 Textarea(정직). 리치 에디터는 흡수 백로그(jsonrender-absorption 식 — 엔진은 나중에 외부 흡수).
//  · 수신자(안 C) = 칩 프리셋(빠른 길) + '직접 지정' 조직도 드릴(정밀·개인). audiences 데이터(소비처)가 깊이 결정.
//    'exclusive' 노드('전체')는 배타. 선택 결과 = '지정된 대상' 칩(단일 진실, BoardView 읽음확인 분모).
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
import './board.css';

export type AudienceNode = {
  id: string;
  label: string;
  exclusive?: boolean;                                   // '전체'처럼 단독 선택(다른 선택 해제)
  children?: AudienceNode[];                             // 하위 그룹(팀)
  members?: { id: string; name: string; dept?: string }[]; // 개인
};

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

  // ── 수신자(안 C) ──
  const sel = new Set(selectedAudiences ?? []);
  const top = audiences ?? [];
  const exclusiveIds = new Set(top.filter((n) => n.exclusive).map((n) => n.id));
  // id → 라벨 평탄화(선택 칩 표시용)
  const labelOf = new Map<string, string>();
  const walk = (nodes: AudienceNode[]) => nodes.forEach((n) => {
    labelOf.set(n.id, n.label);
    if (n.children) walk(n.children);
    n.members?.forEach((m) => labelOf.set(m.id, m.dept ? `${m.name} · ${m.dept}` : m.name));
  });
  walk(top);

  const toggle = (id: string) => {
    if (!onAudiencesChange) return;
    if (exclusiveIds.has(id)) { onAudiencesChange(sel.has(id) ? [] : [id]); return; }
    const next = new Set(sel); exclusiveIds.forEach((e) => next.delete(e));
    if (next.has(id)) next.delete(id); else next.add(id);
    onAudiencesChange([...next]);
  };

  function treeRow(id: string, label: string, level: number) {
    return (
      <div key={id} className={`bw-tnode lv${level}${sel.has(id) ? ' sel' : ''}`} onClick={() => toggle(id)}>
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
                <div className="bw-aud-chips">
                  {top.map((n) => (
                    <Chip key={n.id} selected={sel.has(n.id)} onChange={() => toggle(n.id)}>{n.label}</Chip>
                  ))}
                </div>
                {top.some((n) => n.children || n.members) && (
                  <>
                    <button type="button" className="bw-drillbtn" onClick={() => setDrillOpen((v) => !v)}>
                      <Icon name="building" size="sm" />＋ 직접 지정 (조직도)
                      <Icon name={drillOpen ? 'chevron-up' : 'chevron-down'} size="sm" />
                    </button>
                    {drillOpen && <div className="bw-tree">{top.filter((n) => n.children || n.members).map((n) => treeNode(n, 1))}</div>}
                  </>
                )}
                {sel.size > 0 && (
                  <div className="bw-picked">
                    <Text variant="caption" color="secondary">지정된 대상</Text>
                    <div className="bw-picked-chips">
                      {[...sel].map((id) => (
                        <Chip key={id} selected onRemove={() => toggle(id)}>{labelOf.get(id) ?? id}</Chip>
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
