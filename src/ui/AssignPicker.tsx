'use client';
// AssignPicker 위젯 — 옵션세트(템플릿)를 kind별로 골라 배정하는 상호작용을 한 부품에 봉인.
//  · 배정 = 옵션 인스턴스 생성(서버 머지) — 트리거는 소비처 onAssign. 부품은 "고르기 + 경고"만 소유.
//  · kind 필터: 같은 kind 템플릿만 노출(도메인 무지 — kind는 불투명 태그, 동등 비교만).
//  · itemCount 배지 · 빈 템플릿(0개) 비활성 · 재적용(기존 선택값 덮어쓰기) 경고 Modal.
//  · 조립이지만(Popover+Modal+Button) "명시적으로 안 잡으면 통째로 새는" 상호작용이라 부품화(핸드오프 ①).
import { useState } from 'react';
import { Popover } from './Popover';
import { Modal } from './Modal';
import { Callout } from './Callout';
import { Button } from './Button';
import { Text } from './Text';
import { Icon } from './Icon';
import './assignpicker.css';

export type AssignTemplate = { id: string; label: string; kind: string; itemCount: number };

type Props = {
  templates: AssignTemplate[];
  kind: string;                          // 이 kind와 같은 템플릿만(불투명 태그 동등 비교)
  onAssign: (templateId: string) => void;
  confirmReapply?: boolean;              // true면 배정 전 덮어쓰기 경고 Modal
  triggerLabel?: string;
  confirmTitle?: string;
  confirmMessage?: string;
};

export function AssignPicker({
  templates, kind, onAssign, confirmReapply,
  triggerLabel = '옵션 가져오기',
  confirmTitle = '옵션세트 재적용',
  confirmMessage = '이미 배정된 옵션의 선택값이 이 템플릿으로 덮어써집니다. 계속하시겠습니까?',
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const filtered = templates.filter((t) => t.kind === kind);

  const choose = (id: string) => {
    setOpen(false);
    if (confirmReapply) setPending(id);
    else onAssign(id);
  };
  const confirm = () => { if (pending) onAssign(pending); setPending(null); };

  return (
    <>
      <Popover
        opened={open}
        onChange={setOpen}
        position="bottom"
        align="start"
        width="md"
        content={
          <div className="erpAP-list">
            {filtered.length === 0 ? (
              <div className="erpAP-empty"><Text variant="caption" color="secondary">배정할 템플릿이 없습니다</Text></div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="erpAP-row"
                  disabled={t.itemCount === 0}
                  onClick={() => choose(t.id)}
                >
                  <span className="erpAP-label">{t.label}</span>
                  <span className="erpAP-count">{t.itemCount}개</span>
                </button>
              ))
            )}
          </div>
        }
      >
        <Button variant="secondary" size="sm" leftIcon={<Icon name="download" size="sm" />}>{triggerLabel}</Button>
      </Popover>

      {confirmReapply && (
        <Modal
          opened={pending != null}
          onClose={() => setPending(null)}
          title={confirmTitle}
          actions={[
            { label: '취소', variant: 'ghost', onClick: () => setPending(null) },
            { label: '덮어쓰기 배정', variant: 'danger', onClick: confirm },
          ]}
        >
          <Callout tone="warning">{confirmMessage}</Callout>
        </Modal>
      )}
    </>
  );
}
