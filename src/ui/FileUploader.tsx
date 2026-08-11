'use client';
// FileUploader 분자 — controlled(value + onChange 하나). 횡단규칙 2와 동형:
//  · value(부모가 줌)를 받아 4단계 상태를 표현한다.
//  · 선택/제거/재시도 → "목록이 이렇게 바뀌었으면 함"(next)을 통째로 신호만 쏜다.
//    그 신호로 무엇이 일어나는지(실제 업로드)는 모른다 — 렌더러의 일.
//  · 브라우저 File → FileItem(id·status:'pending') 부여는 분자의 일(표현 단위라서).
//    단, 원본 File을 FileItem.file로 *실어 보낸다* — "업로드는 소비처의 일"인데 바이트를 안 주면
//    소비처가 FormData를 못 만들어 실제 업로드가 물리적으로 불가능했다(controlled value가 소비처를 지나가니
//    별도 콜백 없이 file 필드만 얹으면 충분). pending 항목만 보유(검증 실패 error엔 업로드 대상 아님).
// status 4 enum: pending=점선/대기 · uploading=진행바 · done=체크 · error=빨강+재시도.
// 검증(용량·확장자)은 스키마 → 위반 시 status='error'. 단일/다중은 multiple로 흡수.
import { useRef } from 'react';
import { Stack } from './Stack';
import { Group } from './Group';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { matchesAccept, withinSize } from './_fileAccept';
import { Progress } from '@mantine/core';

export type FileItem = {
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress?: number; // 0~100
  error?: string;
  file?: File; // 원본 바이트 — pending에 실린다. 소비처가 FormData(file)로 실제 업로드. 검증 실패엔 없음.
  url?: string; // 표시용 주소(이미지 썸네일 등). 업로드 완료분은 소비처가 서버 URL을 넣고,
                //  새로 고른 건 부품이 objectURL을 채운다. 파일 목록형(FileUploader)은 안 쓰고 썸네일형이 쓴다.
};

type Props = {
  value: FileItem[];
  onChange: (next: FileItem[]) => void; // 다음 목록을 통째로 신호 (controlled)
  multiple?: boolean;
  disabled?: boolean;
  name?: string;
  // 제약(선언형) — 다이얼로그 필터(accept)는 OS마다 표기가 다르므로 JS에서 한 번 더 검증한다(mac/win 동일 동작).
  accept?: string;    // 허용 확장자/MIME 목록(쉼표). 예: '.pdf,.xlsx,image/*'
  maxSize?: number;   // 최대 바이트. 초과 시 status:'error'
  maxCount?: number;  // 최대 개수(초과분 거부)
};

// 브라우저 File → FileItem 부여 + 검증(분자 책임). 위반 시 status:'error'(스키마 제약의 결정적 적용).
//  판정 자체는 _fileAccept가 한다 — NoteThread도 같은 accept·maxSize를 받으므로 판정이 두 벌이면
//  같은 파일이 화면마다 다르게 거절된다. 여기 남는 건 *거절을 어떻게 표현하나*(status·문구)뿐이다.
function toItems(files: File[], accept?: string, maxSize?: number): FileItem[] {
  return files.map((f) => {
    const id = `${f.name}-${f.size}-${f.lastModified}`;
    if (!matchesAccept(f, accept)) return { id, name: f.name, status: 'error' as const, error: '지원하지 않는 형식' };
    if (!withinSize(f, maxSize)) {
      return { id, name: f.name, status: 'error' as const, error: `용량 초과 (최대 ${Math.round((maxSize ?? 0) / 1024 / 1024)}MB)` };
    }
    return { id, name: f.name, status: 'pending' as const, file: f };
  });
}

export function FileUploader({ value, onChange, multiple, disabled, name, accept, maxSize, maxCount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (files: FileList | null) => {
    if (!files || !files.length) return;
    const picked = toItems(Array.from(files), accept, maxSize);
    let merged = multiple ? [...value, ...picked] : picked.slice(0, 1);
    if (maxCount != null && merged.length > maxCount) merged = merged.slice(0, maxCount); // 개수 상한
    onChange(merged);
  };
  const remove = (id: string) => onChange(value.filter((f) => f.id !== id));
  const retry = (id: string) =>
    onChange(value.map((f) => (f.id === id ? { ...f, status: 'pending', error: undefined } : f)));

  return (
    <Stack gap="xs">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (!disabled) add(e.dataTransfer.files); }}
        style={{
          border: 'var(--border-width) dashed var(--border-default)',
          borderRadius: 'var(--mantine-radius-md)',
          padding: 'var(--mantine-spacing-lg)',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Group gap="xs" align="center" justify="center">
          <Icon name="upload" color="secondary" />
          <Text variant="body" color="secondary">파일을 끌어다 놓거나 클릭해 선택</Text>
        </Group>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => add(e.currentTarget.files)}
          style={{ display: 'none' }}
        />
      </div>

      {value.map((f) => (
        <Group key={f.id} gap="sm" align="center" justify="between">
          <Group gap="xs" align="center">
            {f.status === 'done' && <Icon name="check" color="primary" size="sm" />}
            {f.status === 'error' && <Icon name="alert-circle" color="danger" size="sm" />}
            <Text variant="body" color={f.status === 'error' ? 'danger' : 'primary'}>{f.name}</Text>
          </Group>
          <Group gap="xs" align="center">
            {f.status === 'uploading' && (
              <div style={{ width: 120 }}><Progress value={f.progress ?? 0} color="primary" size="sm" /></div>
            )}
            {f.status === 'error' && (
              <Button variant="ghost" size="sm" leftIcon={<Icon name="refresh" size="sm" />} onClick={() => retry(f.id)}>
                재시도
              </Button>
            )}
            <span role="button" aria-label="제거" onClick={() => !disabled && remove(f.id)}
              style={{ display: 'inline-flex', cursor: disabled ? 'not-allowed' : 'pointer' }}>
              <Icon name="x" color="secondary" size="sm" />
            </span>
          </Group>
        </Group>
      ))}
    </Stack>
  );
}
