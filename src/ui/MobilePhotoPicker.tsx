'use client';
// MobilePhotoPicker (분자) — 모바일 사진 첨부/삭제. 정사각 썸네일 격자 + 추가 타일 + 각 썸네일 삭제.
//  · 데스크탑 FileUploader는 *드롭존*이라 폰에 못 쓴다 — 드래그가 없다. 여기선 추가 타일 하나가 그 역할.
//    accept="image/*"만 주고 capture는 *일부러 안 준다* — capture를 주면 카메라로 고정돼
//    갤러리에서 고르는 길이 막힌다(현장 사진은 나중에 올리는 경우가 더 많다).
//  · 값 타입은 FileUploader와 같은 FileItem을 쓴다(업로드 상태·진행률 어휘 공유). 썸네일 주소는 url:
//    새로 고른 건 이 부품이 objectURL로 채우고, 이미 올라간 건 소비처가 서버 URL을 넣는다.
//  · 삭제 ✕는 썸네일 모서리에 둔다. 44pt를 다 주면 썸네일을 덮으므로 32px로 두되, 히트박스를 시각 크기보다
//    넓힌다(::before 확장) — 작은 표적의 표준 절충.
//  · 실제 업로드는 소비처가 한다(pending의 file을 FormData로). 이 부품은 목록 상태만 만든다.
import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { Text } from './Text';
import type { FileItem } from './FileUploader';
import './mobilelist.css';

type Props = {
  value: FileItem[];
  onChange: (next: FileItem[]) => void;
  max?: number;          // 최대 장수(넘으면 추가 타일이 사라진다)
  disabled?: boolean;
};

let seq = 0;   // objectURL 회수를 위해 항목 id를 부품이 만든다(Date.now 대신 단조 증가)

export function MobilePhotoPicker({ value, onChange, max, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // 이 부품이 만든 objectURL만 회수한다(소비처가 넣은 서버 URL은 건드리지 않는다).
  const ownedUrls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const owned = ownedUrls.current;
    return () => { owned.forEach((u) => URL.revokeObjectURL(u)); owned.clear(); };
  }, []);

  const full = max != null && value.length >= max;

  const pick = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = max != null ? Math.max(0, max - value.length) : files.length;
    const next = Array.from(files).slice(0, room).map((file) => {
      const url = URL.createObjectURL(file);
      ownedUrls.current.add(url);
      return { id: `p${seq++}`, name: file.name, status: 'pending' as const, file, url };
    });
    onChange([...value, ...next]);
  };

  const remove = (id: string) => {
    const gone = value.find((v) => v.id === id);
    if (gone?.url && ownedUrls.current.has(gone.url)) {
      URL.revokeObjectURL(gone.url);
      ownedUrls.current.delete(gone.url);
    }
    onChange(value.filter((v) => v.id !== id));
  };

  return (
    <div className="mpp">
      {value.map((p) => (
        <div key={p.id} className="mpp-cell" data-status={p.status}>
          {/* 이미지는 도메인 콘텐츠가 아니라 사용자가 고른 파일이라 img 직접 사용(Image 원자는 4:3 박스 규격) */}
          {p.url && <img className="mpp-img" src={p.url} alt={p.name} />}
          {p.status === 'uploading' && <span className="mpp-veil"><Text variant="caption">{p.progress ?? 0}%</Text></span>}
          {p.status === 'error' && <span className="mpp-veil" data-tone="error"><Icon name="alert-triangle" size="sm" /></span>}
          {!disabled && (
            <button type="button" className="mpp-del" aria-label={`${p.name} 삭제`} onClick={() => remove(p.id)}>
              <Icon name="x" size="sm" />
            </button>
          )}
        </div>
      ))}

      {!disabled && !full && (
        <button type="button" className="mpp-add" onClick={() => inputRef.current?.click()}>
          <Icon name="plus" size="md" color="secondary" />
          {max != null && <span className="mpp-count">{value.length}/{max}</span>}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { pick(e.currentTarget.files); e.currentTarget.value = ''; }}
      />
    </div>
  );
}
