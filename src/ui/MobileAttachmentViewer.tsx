'use client';
// MobileAttachmentViewer (유기체) — 폰의 첨부 뷰어. **불투명 전체 화면 커버**(모달이 아니다).
//  계약은 데스크탑 AttachmentViewer와 한 벌(_attachment). 크롬만 이 층의 어휘로 그린다.
//
//  동작 규범(조사 §9에서 계약에 박기로 한 것):
//   · **counter "3 / 12"는 필수다** — APG가 인정한 접근 가능한 이름의 대체 수단이다(옵션이 아니다).
//   · **크롬 auto-hide 없음.** 자동 숨김은 사진 앱(체류지) 문법이고, ERP 첨부는 *경유지*다.
//     열자마자 "여기서 나가는 법"이 보여야 한다.
//   · **counter와 filmstrip은 택일** — 둘 다 두면 같은 정보를 두 번 말한다. counter를 택했다.
//   · **탈출구는 2개까지** — X + Esc. NN/g: 닫기 버튼이 둘 이상이면 명시적 X의 이점이 사라진다.
//   · **rotate를 두지 않는다** — 어느 제품도 라이트박스 크롬에 회전을 두지 않는다(있으면 editor 안이다).
//   · **가로 스와이프=페이징 / 세로=닫기를 동시에 열지 않는다** — NN/g 직접 경고.
//     touch-action은 제스처 *시작 후* 변경이 무효라 CSS로 중재할 수도 없다.
//     → 제스처를 아예 안 쓴다. 페이징은 하단 바 버튼이 한다(가속기가 없을 뿐 못 하는 건 없다, 06 §1-4).
//   · **문서 레벨 viewport meta를 절대 건드리지 않는다** — user-scalable=no·maximum-scale<2는
//     둘 다 SC 1.4.4 실패다(ACT b4f0c3). 확대는 부품 안의 닫힌 단계로 준다.
//     1.4.10 Reflow는 "2차원 레이아웃이 본질인 콘텐츠"를 예외로 두므로 **본체는 예외이고 크롬에 걸린다**
//     → 크롬 텍스트는 전부 rem 기반 토큰이다.
import { useEffect, useState } from 'react';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { Text } from './Text';
import { Menu } from './Menu';
import { AttachmentStage, type ZoomStep } from './_attachmentStage';
import { ZOOM_NEXT } from './_attachment';
import { counterLabel, type AttachmentViewerContract } from './_attachment';
import './attachment.css';

const ZOOM_LABEL: Record<ZoomStep, string> = { fit: '맞춤', actual: '150%', double: '250%' };

export function MobileAttachmentViewer({
  opened, onClose, items, index, onIndexChange,
  onDownload, onPrint, onShare, actions, pdfAssetBase,
}: AttachmentViewerContract) {
  const [zoom, setZoom] = useState<ZoomStep>('fit');
  const item = items[index];

  // 첨부를 넘기면 확대는 초기화한다 — 앞 장의 배율이 다음 장에 남으면 "왜 확대돼 있지"가 된다.
  useEffect(() => { setZoom('fit'); }, [index]);

  // Esc — 두 번째이자 마지막 탈출구.
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opened, onClose]);

  if (!opened || !item) return null;

  const overflow = [
    ...(onPrint ? [{ label: '인쇄', icon: 'print' as const, onClick: () => onPrint(item) }] : []),
    ...(actions ?? []),
  ];

  return (
    <div className="attm" role="dialog" aria-modal="true" aria-label={`${item.name} 미리보기`}>
      {/* live region은 뷰어와 *함께* 삽입하지 않는다 — 노드가 새로 들어오면 첫 announce가 누락된다.
          여기선 뷰어 자체가 열릴 때 통째로 마운트되므로, 카운터를 aria-live로 만들지 않고
          dialog의 aria-label이 이름을 대신한다(APG가 인정한 대체 수단). */}
      <div className="attm-top">
        <IconButton icon="x" label="닫기" variant="ghost" size="md" onClick={onClose} />
        <span className="attm-name"><Text variant="body-strong">{item.name}</Text></span>
        {items.length > 1 && (
          <span className="attm-counter"><Text variant="caption">{counterLabel(index, items.length)}</Text></span>
        )}
      </div>

      <div className="attm-body">
        <AttachmentStage item={item} zoom={zoom} pdfAssetBase={pdfAssetBase} onDownload={onDownload} />
      </div>

      {/* 하단 액션 바 — safe-area만큼 아래를 비운다(홈 인디케이터). */}
      <div className="attm-bottom">
        {items.length > 1 && (
          <IconButton icon="chevron-left" label="이전 첨부" variant="ghost" size="md"
            disabled={index <= 0} onClick={() => onIndexChange(index - 1)} />
        )}
        <button type="button" className="attm-zoom" onClick={() => setZoom(ZOOM_NEXT[zoom])}>
          <Icon name="search" size="sm" />{ZOOM_LABEL[zoom]}
        </button>
        {onShare && <IconButton icon="send" label="공유" variant="ghost" size="md" onClick={() => onShare(item)} />}
        {onDownload && <IconButton icon="download" label="내려받기" variant="ghost" size="md" onClick={() => onDownload(item)} />}
        {overflow.length > 0 && (
          <Menu position="top" align="end" items={overflow}
            trigger={<IconButton icon="dots-vertical" label="더보기" variant="ghost" size="md" onClick={() => {}} />} />
        )}
        {items.length > 1 && (
          <IconButton icon="chevron-right" label="다음 첨부" variant="ghost" size="md"
            disabled={index >= items.length - 1} onClick={() => onIndexChange(index + 1)} />
        )}
      </div>
    </div>
  );
}
