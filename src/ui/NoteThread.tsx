'use client';
// NoteThread (분자) — 데스크탑에서 *쓰기 가능한* 누적 메모. MobileComment+MobileComposer의 데스크탑 짝.
//
//  왜 신설인가: Timeline은 읽기 전용(항목 수정·삭제·컴포저가 없다) · MobileComment/Composer는 모바일 계열
//   (컴포저가 화면 하단 고정이라 데스크탑 패널 안에 못 들어간다) · BoardView의 댓글은 게시판 글 안에 갇혀 있다.
//   **모바일 짝이 이미 있다는 것**이 이 요청의 가장 강한 근거였다 — 같은 행위, 다른 매체.
//
//  Enter 제출은 이 부품이 `form`을 소유해 푼다. TextInput에 onKeyDown을 여는 안은 안 쓴다 —
//   임의 키 핸들러는 닫힌 경계에 뚫는 구멍이고, 이 요구는 *컴포저를 가진 부품*이 자기 안에서 풀 일이다.
//
//  빈 상태 문구를 두지 않는다: 메모가 없으면 입력칸만 남는다. "아직 메모가 없습니다"는 정보가 0이고,
//   입력칸이 이미 "여기 쓰면 된다"를 말하고 있다.
import { useState } from 'react';
import { Text } from './Text';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { IconButton } from './IconButton';
import { Stack } from './Stack';
import { Divider } from './Divider';
import './notethread.css';

export type ThreadNote = {
  id: string;
  body: string;
  author: string;
  time: string;         // 상대 시각 문자열 — 포맷은 소비처(부품은 시계를 안 본다)
  canEdit?: boolean;    // 서버 판정. 부품이 다시 계산하지 않는다
};

type Props = {
  notes: ThreadNote[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSubmit: () => void;
  onEdit?: (id: string, body: string) => void;
  onDelete?: (id: string) => void;
  placeholder?: string;
  submitLabel?: string;
  submitting?: boolean;
  busyId?: string;      // 그 항목의 버튼만 로딩
};

export function NoteThread({
  notes, draft, onDraftChange, onSubmit, onEdit, onDelete,
  placeholder = '메모 남기기', submitLabel = '남기기', submitting = false, busyId,
}: Props) {
  // 편집 중인 항목과 그 초안은 *표현 상태*라 부품이 갖는다(펼침·인라인편집 선례 — Tree·BoardView).
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const startEdit = (n: ThreadNote) => { setEditId(n.id); setEditDraft(n.body); };
  const commitEdit = () => {
    if (editId && editDraft.trim()) onEdit?.(editId, editDraft.trim());
    setEditId(null);
  };

  return (
    <div>
      <form
        className="nt-form"
        onSubmit={(e) => { e.preventDefault(); if (draft.trim()) onSubmit(); }}
      >
        <TextInput value={draft} onChange={onDraftChange} placeholder={placeholder} size="sm" />
        <Button type="submit" variant="secondary" size="sm" loading={submitting} disabled={!draft.trim()}>
          {submitLabel}
        </Button>
      </form>

      {notes.map((n, i) => (
        <div key={n.id} className="nt-item">
          {/* 항목 사이 선 — Divider 원자. 초판은 inset box-shadow로 선을 *흉내* 냈다(우리가 이미 가진 부품인데). */}
          {i > 0 && <Divider />}
          {editId === n.id ? (
            <div className="nt-edit">
              <TextInput value={editDraft} onChange={setEditDraft} size="sm" />
              <IconButton icon="check" label="저장" variant="ghost" size="sm" onClick={commitEdit} />
              <IconButton icon="x" label="취소" variant="ghost" size="sm" onClick={() => setEditId(null)} />
            </div>
          ) : (
            <div className="nt-body">
              {/* 본문↔메타는 한 덩어리(xxs) — 항목 사이 간격보다 좁아야 "누가 언제"가 그 글의 것으로 읽힌다.
                  초판은 margin-top:2px(토큰 밖 매직넘버)이었다. */}
              <Stack gap="xxs">
                <Text variant="body">{n.body}</Text>
                <Text variant="caption" color="secondary">{n.author} · {n.time}</Text>
              </Stack>
              {n.canEdit && (onEdit || onDelete) && (
                <div className="nt-acts">
                  {onEdit && (
                    <IconButton icon="edit" label="메모 수정" variant="ghost" size="sm"
                      disabled={busyId === n.id} onClick={() => startEdit(n)} />
                  )}
                  {onDelete && (
                    <IconButton icon="trash" label="메모 삭제" variant="danger" size="sm"
                      disabled={busyId === n.id} onClick={() => onDelete(n.id)} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
