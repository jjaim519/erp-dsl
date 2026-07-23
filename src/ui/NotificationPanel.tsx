'use client';
// NotificationPanel 위젯 — 알림 벨 Popover(content) 슬롯에 꽂히는 "알림 패널 구성". 시안 A(탭+시간그룹).
//  · 표면·그림자·폭은 감싸는 Popover(AppShell notifControl, width lg=360)가 소유 — 이 위젯은 안쪽 구성만.
//  · 골격 3층: [헤더(제목·미읽음 카운트·모두읽음)] · [본문 목록(높이 예약·내부 스크롤)] · [푸터(모든 알림 보기)].
//  · 도메인 무지(헌법 1): "발주 알림"을 모른다 — tone·title·icon·actor·time(문자열)만 받는다. 날짜 로직 없음
//    → 시간 그룹은 소비처가 item.group 라벨로 분류(바뀔 때만 헤더 렌더). 목적지(전체 알림 페이지)도 소비처 소유.
//  · 축 예약: 헤더 높이 고정 + 읽음점 컬럼은 읽은 알림도 자리 유지 → 읽음 전환에도 reflow 0.
import { Fragment, useState } from 'react';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { CountBadge } from './CountBadge';
import { SegmentedControl } from './SegmentedControl';
import { EmptyState } from './EmptyState';
import './notifpanel.css';

export type NotifTone = 'info' | 'success' | 'warning' | 'danger';
export type NotifItem = {
  id: string;
  tone: NotifTone;       // 좌측 아이콘 원 색 + 의미(jewel-tone 상태색)
  title: string;         // 본문(2줄 clamp). 미읽음이면 강조.
  time: string;          // 상대시각 라벨 — 소비처가 포맷(패키지는 날짜 계산 안 함)
  icon?: IconName;       // 없으면 tone 기본 아이콘
  actor?: string;        // 행위자(메타 앞)
  group?: string;        // 시간/분류 그룹 라벨('오늘'·'이번 주' 등) — 바뀔 때 그룹 헤더 렌더
  read?: boolean;
  onClick?: () => void;  // 행 클릭(상세로 이동 등)
};

type Props = {
  items: NotifItem[];
  onMarkAllRead?: () => void; // 있으면 "모두 읽음" 조립(미읽음 0이면 비활성)
  onViewAll?: () => void;     // 있으면 푸터 조립 — 목적지는 소비처 알림 Page(없으면 미조립)
  emptyLabel?: string;
};

// tone → 기본 아이콘(소비처가 icon 안 주면 사용).
const TONE_ICON: Record<NotifTone, IconName> = {
  info: 'info', success: 'check-circle', warning: 'alert-triangle', danger: 'x-circle',
};

export function NotificationPanel({ items, onMarkAllRead, onViewAll, emptyLabel = '새 알림이 없습니다' }: Props) {
  const [tab, setTab] = useState('all');
  const unread = items.filter((n) => !n.read).length;
  const shown = tab === 'unread' ? items.filter((n) => !n.read) : items;

  return (
    <div className="erpNotif">
      {/* 헤더 — 높이 고정(축 예약). 좌 제목+카운트 / 우 모두읽음. */}
      <div className="erpNotif-head">
        <span className="erpNotif-title">
          <Text variant="body-strong">알림</Text>
          <CountBadge count={unread} />
        </span>
        {onMarkAllRead && (
          <button type="button" className="erpNotif-act" onClick={onMarkAllRead} disabled={unread === 0}>
            모두 읽음
          </button>
        )}
      </div>

      {/* 탭 — 전체 / 안읽음(N). */}
      <div className="erpNotif-seg">
        <SegmentedControl
          size="sm"
          fullWidth
          value={tab}
          onChange={setTab}
          options={[
            { label: '전체', value: 'all' },
            { label: unread > 0 ? `안읽음 ${unread}` : '안읽음', value: 'unread' },
          ]}
        />
      </div>

      {/* 본문 — 높이 예약 + 내부 스크롤. 그룹 라벨은 group이 바뀔 때만. */}
      <div className="erpNotif-list">
        {shown.length === 0 ? (
          <div className="erpNotif-empty"><EmptyState icon="bell" title={emptyLabel} /></div>
        ) : (
          shown.map((n, i) => {
            const showGroup = n.group != null && n.group !== shown[i - 1]?.group;
            return (
              <Fragment key={n.id}>
                {showGroup && <div className="erpNotif-group">{n.group}</div>}
                <button
                  type="button"
                  className="erpNotif-row"
                  data-unread={!n.read || undefined}
                  onClick={n.onClick}
                >
                  <span className="erpNotif-ico" data-tone={n.tone}>
                    <Icon name={n.icon ?? TONE_ICON[n.tone]} size="sm" />
                  </span>
                  <span className="erpNotif-rbody">
                    <span className="erpNotif-rtitle">{n.title}</span>
                    <span className="erpNotif-rmeta">{n.actor ? `${n.actor} · ${n.time}` : n.time}</span>
                  </span>
                  <span className="erpNotif-dot" aria-hidden="true" />
                </button>
              </Fragment>
            );
          })
        )}
      </div>

      {/* 푸터 — 소비처가 onViewAll 줄 때만(죽은 링크 금지). 목적지는 소비처 알림 Page. */}
      {onViewAll && (
        <button type="button" className="erpNotif-foot" onClick={onViewAll}>모든 알림 보기 →</button>
      )}
    </div>
  );
}
