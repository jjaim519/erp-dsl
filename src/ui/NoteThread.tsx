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
//
//  ── 첨부(v0.84) ──
//  왜 새 부품이 아니라 확장인가: 이건 이미 "쓰기 가능한 누적 메모"고 첨부만 없었다. 새로 만들면 같은 행위에
//   부품이 두 벌이 되고 소비처가 매번 "어느 걸 쓰지"를 판단한다. 기존 부품으론 못 메우는 자리이기도 하다 —
//   FileUploader는 자기 세로 목록을 소유해 컴포저 한 줄에 못 들어가고, AttachmentViewer는 여는 일만 알고
//   붙이는 일을 모르며, MobileComposer는 화면 하단 고정이라 데스크탑 패널 안에 못 들어간다.
//  타입은 _attachment의 Attachment를 그대로 쓴다(새 타입 0) — 같은 첨부가 뷰어와 스레드에서 다르게
//   취급되면 데이터 버그로 읽힌다.
//  **실제 업로드도, 뷰어를 여는 것도 부품의 일이 아니다**(FileUploader 선례 / 모달 소유는 소비처).
//   부품이 뷰어를 삼키면 닫힌 경계가 그만큼 커진다.
//  능력의 유무는 콜백의 유무로 말한다 — allowAttach 같은 boolean을 두지 않는다(onEdit·onDelete 선례).
import { useRef, useState } from 'react';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { Image } from './Image';
import { Stack } from './Stack';
import { Divider } from './Divider';
import { matchesAccept, withinSize } from './_fileAccept';
import type { Attachment } from './_attachment';
import './notethread.css';

export type ThreadNote = {
  id: string;
  body: string;
  author: string;
  time: string;         // 상대 시각 문자열 — 포맷은 소비처(부품은 시계를 안 본다)
  canEdit?: boolean;    // 서버 판정. 부품이 다시 계산하지 않는다
  /** 이 메모에 이미 올라간 첨부. 없거나 비면 자리를 안 그린다. */
  attachments?: Attachment[];
};

type Props = {
  notes: ThreadNote[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSubmit: () => void;
  onEdit?: (id: string, body: string) => void;
  onDelete?: (id: string) => void;
  placeholder?: string;
  submitLabel?: string; // 아이콘 전용 제출 버튼의 aria-label이 된다
  submitting?: boolean;
  busyId?: string;      // 그 항목의 버튼만 로딩
  // ── 첨부 ──
  /** 있으면 컴포저에 클립 버튼이 선다. 없으면 안 그린다. accept·maxSize를 통과한 것만 올라온다. */
  onPickFiles?: (files: File[]) => void;
  /** 아직 안 올라간, 이번 제출에 실릴 파일. controlled — 소비처가 들고 부품이 그린다.
   *  부품이 File을 쥐고 있지 않는 이유는 FileUploader와 같다: **업로드는 소비처의 일**이다. */
  pendingFiles?: Attachment[];
  onRemovePendingFile?: (id: string) => void;
  /** 첨부를 눌렀을 때. 안 주면 첨부는 눌리지 않는 표시로만 남는다. */
  onOpenAttachment?: (id: string) => void;
  /** 파일 다이얼로그 제약. OS 필터는 표기가 새므로 부품이 한 번 더 거른다(FileUploader와 같은 판정). */
  accept?: string;
  maxSize?: number;     // 최대 바이트
};

export function NoteThread({
  notes, draft, onDraftChange, onSubmit, onEdit, onDelete,
  placeholder = '메모 남기기', submitLabel = '남기기', submitting = false, busyId,
  onPickFiles, pendingFiles, onRemovePendingFile, onOpenAttachment, accept, maxSize,
}: Props) {
  // 편집 중인 항목과 그 초안은 *표현 상태*라 부품이 갖는다(펼침·인라인편집 선례 — Tree·BoardView).
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const startEdit = (n: ThreadNote) => { setEditId(n.id); setEditDraft(n.body); };
  const commitEdit = () => {
    if (editId && editDraft.trim()) onEdit?.(editId, editDraft.trim());
    setEditId(null);
  };

  // 숨은 file input — 클립 버튼이 대신 연다(FileUploader 선례). 같은 파일을 다시 고를 수 있게 값을 비운다.
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const ok = Array.from(list).filter((f) => matchesAccept(f, accept) && withinSize(f, maxSize));
    if (ok.length) onPickFiles?.(ok);
  };

  // 첨부만 있는 제출을 막지 않는다 — 코멘트 없는 첨부("이거 보세요")가 실제로 흔하다.
  const canSubmit = draft.trim().length > 0 || (pendingFiles?.length ?? 0) > 0;

  // 첨부 한 덩이 — 컴포저 아래(대기)와 메모 아래(올라간 것)가 같은 어휘를 쓴다.
  //  이미지는 칩 대신 썸네일: kind 판별은 소비처가 이미 했고, 도면·현장사진은 이름보다 그림이 정보다.
  //  대기(pending)는 지울 수만, 올라간 것(posted)은 열 수만 있다 — 아직 서버에 없는 파일에 "열기"는 없다.
  const renderAttachment = (a: Attachment, stage: 'pending' | 'posted') => {
    const remove = stage === 'pending' && onRemovePendingFile
      ? () => onRemovePendingFile(a.id) : undefined;
    const open = stage === 'posted' && onOpenAttachment
      ? () => onOpenAttachment(a.id) : undefined;
    const removeBtn = remove && (
      <button type="button" className="x" aria-label={`${a.name} 첨부 취소`} onClick={remove}>
        <Icon name="x" size="sm" />
      </button>
    );

    if (a.kind === 'image' && a.src) {
      const thumb = <Image src={a.src} alt={a.alt ?? a.name} size="sm" fit="cover" radius="sm" />;
      return (
        <span key={a.id} className="nt-thumb">
          {open ? <button type="button" className="nt-thumb-open" onClick={open}>{thumb}</button> : thumb}
          {removeBtn}
        </span>
      );
    }

    const body = (
      <>
        <Icon name="paperclip" size="sm" />
        <span className="nm">{a.name}</span>
        {a.size && <span className="sz">{a.size}</span>}
      </>
    );
    if (open) {
      return <button key={a.id} type="button" className="nt-chip nt-chip-open" onClick={open}>{body}</button>;
    }
    return <span key={a.id} className="nt-chip">{body}{removeBtn}</span>;
  };

  return (
    <div>
      <form
        className="nt-form"
        onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(); }}
      >
        <TextInput value={draft} onChange={onDraftChange} placeholder={placeholder} size="sm" />
        {onPickFiles && (
          <>
            <IconButton icon="paperclip" label="파일 첨부" variant="ghost" size="sm"
              disabled={submitting} onClick={() => fileRef.current?.click()} />
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={accept}
              className="nt-file"
              onChange={(e) => { pick(e.currentTarget.files); e.currentTarget.value = ''; }}
            />
          </>
        )}
        {/* 제출은 아이콘 버튼 — 컴포저가 한 줄이라 클립과 나란히 서야 하고, 텍스트 버튼이면 그 줄이 무너진다.
            접근 가능한 이름은 submitLabel이 그대로 준다(형태만 바뀌고 의미는 안 바뀐다). */}
        <IconButton icon="send" label={submitLabel} variant="secondary" size="sm"
          type="submit" loading={submitting} disabled={!canSubmit} />
      </form>

      {pendingFiles && pendingFiles.length > 0 && (
        <div className="nt-chips nt-pending">
          {pendingFiles.map((a) => renderAttachment(a, 'pending'))}
        </div>
      )}

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
                {/* 본문이 비고 첨부만 있는 메모가 있다 — 그때 빈 줄을 그리지 않는다(빈 Text는 자리만 먹는다). */}
                {n.body && <Text variant="body">{n.body}</Text>}
                {n.attachments && n.attachments.length > 0 && (
                  <div className="nt-chips">{n.attachments.map((a) => renderAttachment(a, 'posted'))}</div>
                )}
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
