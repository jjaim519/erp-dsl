'use client';
// MobileFileRow (분자) — 첨부 파일 한 줄(읽기). 아이콘 + 이름 + 크기 + 우측 동작.
//  · MobileListRow로 대신하지 않는 이유: 그 행은 *누르면 다른 화면으로 간다*(chevron)인데,
//    첨부는 누르면 내려받는다. 행동이 다르므로 별개 named 부품(§11-3 — 옵션으로 얹지 않는다).
//  · 이름은 길고 확장자는 끝에 있다 → 가운데를 자르지 않고 끝을 살린다(말줄임은 왼쪽에서).
//  · 파일 크기·형식 문자열은 소비처가 준다(부품은 바이트를 포맷하지 않는다 — 도메인/로케일).
import { Icon } from './Icon';
import './mobilelist.css';

type Props = {
  name: string;
  size?: string;              // '24 KB' 등 — 포맷은 소비처
  onDownload?: () => void;    // 있으면 행 전체가 눌린다
};

export function MobileFileRow({ name, size, onDownload }: Props) {
  const inner = (
    <>
      <span className="mfr-ico"><Icon name="file" size="sm" color="primary" /></span>
      <span className="mfr-name">{name}</span>
      {size && <span className="mfr-size">{size}</span>}
      {onDownload && <span className="mfr-dl"><Icon name="download" size="sm" color="secondary" /></span>}
    </>
  );
  return onDownload
    ? <button type="button" className="mfr" onClick={onDownload}>{inner}</button>
    : <div className="mfr">{inner}</div>;
}
