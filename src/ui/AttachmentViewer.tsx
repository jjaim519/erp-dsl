'use client';
// AttachmentViewer (유기체) — 데스크탑의 첨부 뷰어. 계약은 모바일과 한 벌(_attachment), 크롬만 다르다.
//  · 데스크탑은 **dimmed backdrop 위 모달**이다(모바일의 불투명 전체 커버와 대비).
//    화면이 넓어 뒤 맥락을 지울 이유가 없고, 첨부는 경유지라 "돌아갈 곳"이 보이는 편이 낫다.
//  · 우리 Modal은 제목 줄과 액션 푸터 규격이 정해져 있어 그대로 쓰면 뷰어 크롬이 두 겹이 된다
//    → Mantine Modal을 여기서 격리해 직접 감싼다(격리 구역 명시 예외 — PaperModal 선례와 동류).
//  · counter·탈출구 2개·rotate 없음·auto-hide 없음은 모바일과 같은 규범이다(MobileAttachmentViewer 헤더 참조).
import { useEffect, useState } from 'react';
import { Modal as MantineModal } from '@mantine/core';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { Text } from './Text';
import { Menu } from './Menu';
import { AttachmentStage, type ZoomStep } from './_attachmentStage';
import { counterLabel, type AttachmentViewerContract } from './_attachment';
import './attachment.css';

const ZOOM_NEXT: Record<ZoomStep, ZoomStep> = { fit: 'actual', actual: 'double', double: 'fit' };
const ZOOM_LABEL: Record<ZoomStep, string> = { fit: '맞춤', actual: '150%', double: '250%' };

export function AttachmentViewer({
  opened, onClose, items, index, onIndexChange,
  onDownload, onPrint, actions, pdfAssetBase,
}: AttachmentViewerContract) {
  const [zoom, setZoom] = useState<ZoomStep>('fit');
  const item = items[index];

  useEffect(() => { setZoom('fit'); }, [index]);

  // ← → 로 첨부 넘기기. 데스크탑엔 키보드가 있으니 가속기를 준다(모바일은 버튼만 — 제스처 충돌 회피).
  useEffect(() => {
    if (!opened || items.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      if (e.key === 'ArrowRight' && index < items.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opened, index, items.length, onIndexChange]);

  if (!item) return null;

  const overflow = [
    ...(onPrint ? [{ label: '인쇄', icon: 'print' as const, onClick: () => onPrint(item) }] : []),
    ...(actions ?? []),
  ];

  return (
    <MantineModal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}     /* 닫기는 우리 크롬이 그린다 — 두 개면 탈출구가 셋이 된다 */
      size="auto"
      centered
      padding={0}
      radius="md"
      title={undefined}
      aria-label={`${item.name} 미리보기`}
      classNames={{ content: 'attd', body: 'attd-body-wrap' }}
    >
      <div className="attd-top">
        <span className="attd-name"><Text variant="body-strong">{item.name}</Text></span>
        {items.length > 1 && (
          <span className="attd-counter"><Text variant="caption" color="secondary">{counterLabel(index, items.length)}</Text></span>
        )}
        <span className="attd-tools">
          <button type="button" className="attd-zoom" onClick={() => setZoom(ZOOM_NEXT[zoom])}>
            <Icon name="search" size="sm" />{ZOOM_LABEL[zoom]}
          </button>
          {onDownload && <IconButton icon="download" label="내려받기" variant="ghost" size="sm" onClick={() => onDownload(item)} />}
          {overflow.length > 0 && (
            <Menu position="bottom" align="end" items={overflow}
              trigger={<IconButton icon="dots-vertical" label="더보기" variant="ghost" size="sm" onClick={() => {}} />} />
          )}
          <IconButton icon="x" label="닫기" variant="ghost" size="sm" onClick={onClose} />
        </span>
      </div>

      <div className="attd-body">
        <AttachmentStage item={item} zoom={zoom} pdfAssetBase={pdfAssetBase} onDownload={onDownload} />
      </div>

      {items.length > 1 && (
        <div className="attd-nav">
          <IconButton icon="chevron-left" label="이전 첨부" variant="ghost" size="md"
            disabled={index <= 0} onClick={() => onIndexChange(index - 1)} />
          <IconButton icon="chevron-right" label="다음 첨부" variant="ghost" size="md"
            disabled={index >= items.length - 1} onClick={() => onIndexChange(index + 1)} />
        </div>
      )}
    </MantineModal>
  );
}
