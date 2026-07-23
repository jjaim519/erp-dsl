'use client';
// AppShell 유기체 — ERP 공통 셸(모든 페이지 상속). 셸 크롬만 소유. 3티어 반응형.
//  · 경계: AppShell은 children만 받는다 — PageHeader는 페이지 템플릿이 소유(셸 비소유).
//  · 3티어: 폰 <768(하단탭) / 태블릿 768–1023(72px 아이콘 레일) / 데스크탑 ≥1024(260px 풀 넷바).
//    Mantine breakpoint는 sm(768) 하나로 폰↔(태블릿·데스크탑) collapse만 맡고, 태블릿↔데스크탑은
//    JS 티어가 넷바 width·내용을 스왑한다(둘 다 sm 이상이라 넷바는 뜨고 폭/렌더만 다름).
//  · 상단바 해체(데스크탑·태블릿): header.collapsed=tier!=='phone' → 0으로 접혀 세로공간 반환.
//    근거: 헌법상 상단바 좌측은 비고(넷바가 전체 경로 제공)·정체성은 PageHeader 소유 → 상단바에 남은
//    책임이 유틸리티(알림·프로필)뿐이라 해체하고, 그 둘을 넷바 하단 유틸리티 존으로 이관.
//    폰만 슬림 상단바 유지(좌 로고 + 우 [알림][아바타]) — 좌측 레일이 없어 유틸리티를 담을 데가 상단바뿐.
//  · 유틸리티 존(알림+프로필)은 티어마다 같은 데이터·다른 배치(menuItems가 넷바↔탭 재배치되는 것과 동형).
//    데스크탑=넷바 하단 [프로필 확장행 + 알림], 태블릿=레일 하단 [알림·아바타 아이콘], 폰=상단바 우측.
//  · 로고: 데스크탑 넷바 최상단 / 폰 상단바 좌측. 태블릿 레일(72px)엔 로고 없음 — 그 폭엔 정사각 마크만
//    들어가 부실해서 밴드 제거(메뉴부터 시작). 즉 logo는 데스크탑·폰만 쓴다.
//  · 셸 골격(M.Header/Navbar/Main/Footer 슬롯·바 정렬·safe-area)은 우리 콘텐츠 프리미티브가 노출 안 한
//    탈출구라 격리 구역 내 raw Mantine/CSS(헌법 7) — Modal raw flex·Calendar raw grid와 같은 명시 예외.
//    단 슬롯 *안의 콘텐츠*(탭 타일·메뉴 행·유틸리티)는 우리 Stack/Group/Icon/Text로 조립(도그푸드).
import { AppShell as M, NavLink, Box, Group as MGroup, Stack as MStack } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { CountBadge } from './CountBadge';
import { Avatar } from './Avatar';
import { IconButton } from './IconButton';
import { Popover } from './Popover';
import { Menu } from './Menu';
import { Stack } from './Stack';
import { Group } from './Group';
import { type Action } from './_cells';

type MenuItem = { label: string; icon: IconName; path: string; group?: string; count?: number };
// 프로필 더보기: menu(Action[]) 주면 Popover로 메뉴, 없으면 onMenuClick 폴백(경쟁 경로 아님).
type Profile = { name: string; role?: string; email?: string; avatarSrc?: string; onMenuClick?: () => void; menu?: Action[] };
// 알림: content 주면 Popover로 목록, 없으면 onClick 폴백.
type Notification = { hasUnread?: boolean; onClick?: () => void; content?: ReactNode };
type Props = {
  logo: ReactNode;
  onLogoClick?: () => void;
  menuItems: MenuItem[];
  activePath: string;
  onNavigate: (path: string) => void;
  profile?: Profile;
  notification?: Notification;
  children: ReactNode;
};

// 셸 치수(px) — 시중 표준 참조로 확정.
//  HEADER_HEIGHT     : 슬림 상단바 높이 64 (폰 전용 — 데스크탑·태블릿은 상단바 해체). Material toolbar 56~64.
//  NAV_WIDTH_DESKTOP : 데스크탑 풀 넷바 260 (표준 240~300).
//  NAV_WIDTH_RAIL    : 태블릿 아이콘 레일 72 (아이콘+짧은 라벨 세로 타일; 하단탭과 같은 tile()).
//  LOGO_BAND/SLOT    : 데스크탑 넷바 최상단 정체성 블록 88 / 로고 박스 56(밴드를 거의 채움, 종횡비 최대 적합).
//  MOBILE_LOGO_HEIGHT: 폰 상단바 좌측 로고 박스 40.
//  BOTTOM_NAV_HEIGHT : 폰 하단 탭바 콘텐츠 56 (Material bottom nav; 탭당 ≥48 터치타깃). + env(safe-area).
//  MAX_TABS          : 하단 탭 최대 5(모바일 관습). 초과 시 앞 4 + '더보기'(나머지 Popover). 옵션 쌓기 금지(§11-3).
// 브레이크포인트: 폰 <48em(768) · 태블릿 48–79.99em(768–1279) · 데스크탑 ≥80em(1280). em=브라우저 16px 기준(font-scale 무관·Mantine sm 정합).
//  1280 경계 근거: iPad 가로(≤Pro11 1194)를 태블릿 레일에 담기(결정 2). 값은 프리뷰 갤러리에서 튜닝 가능.
const HEADER_HEIGHT = 64;
const NAV_WIDTH_DESKTOP = 260;
const NAV_WIDTH_RAIL = 72;
const LOGO_BAND = 88;
const LOGO_SLOT_HEIGHT = 56;
const MOBILE_LOGO_HEIGHT = 40;
const BOTTOM_NAV_HEIGHT = 56;
const MAX_TABS = 5;

function groupItems(items: MenuItem[]): Array<{ group?: string; items: MenuItem[] }> {
  const out: Array<{ group?: string; items: MenuItem[] }> = [];
  for (const it of items) {
    const last = out[out.length - 1];
    if (last && last.group === it.group) last.items.push(it);
    else out.push({ group: it.group, items: [it] });
  }
  return out;
}

export function AppShell({
  logo, onLogoClick, menuItems, activePath, onNavigate, profile, notification, children,
}: Props) {
  const [notifOpen, notifH] = useDisclosure();
  const [moreOpen, moreH] = useDisclosure();
  // 티어 감지 — 데스크탑↔태블릿은 JS로 가른다(Mantine breakpoint 하나로는 3티어 불가).
  //  기본값: 데스크탑(SSR/첫 렌더 안정) → 마운트 후 실제 뷰포트 반영.
  //  경계 1280(80em): iPad 가로(≤Pro11 1194)를 태블릿 레일에 담기 위함(결정 2 — 패드는 가로 얇은 레일).
  const isDesktop = useMediaQuery('(min-width: 80em)', true);
  const isTablet = useMediaQuery('(min-width: 48em) and (max-width: 79.99em)', false);
  const tier: 'phone' | 'tablet' | 'desktop' = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'phone';
  const groups = groupItems(menuItems);

  // 하단 탭 분배(폰): 5개 이하면 전부, 초과면 앞 4개 + '더보기'(나머지는 Popover 목록).
  const overflow = menuItems.length > MAX_TABS;
  const tabItems = overflow ? menuItems.slice(0, MAX_TABS - 1) : menuItems;
  const moreItems = overflow ? menuItems.slice(MAX_TABS - 1) : [];
  const moreActive = moreItems.some((it) => it.path === activePath);

  // 타일(아이콘 위 라벨) — 하단탭·레일 공용. 활성은 색 역할(primary) vs secondary.
  const tile = (icon: IconName, label: string, active: boolean, count?: number) => (
    <Stack gap="xxs" align="center">
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <Icon name={icon} size="sm" color={active ? 'primary' : 'secondary'} />
        {count != null && count > 0 && (
          <span style={{ position: 'absolute', top: -7, left: '100%', marginLeft: -8 }}><CountBadge count={count} /></span>
        )}
      </span>
      <Text variant="caption" color={active ? 'primary' : 'secondary'}>{label}</Text>
    </Stack>
  );

  // ── 유틸리티 컨트롤(알림·프로필) — 티어마다 같은 데이터, 배치·형태만 다름 ──
  const unreadDot = (top: number, right: number) =>
    notification?.hasUnread ? (
      <span aria-hidden="true" style={{
        position: 'absolute', top, right, width: 8, height: 8,
        borderRadius: 'var(--mantine-radius-full)',
        background: 'var(--mantine-color-danger-6)', border: '2px solid var(--bg-primary)',
      }} />
    ) : null;

  // 알림 — kind 'icon'(상단바·넷바 하단) / 'tile'(레일). content 있으면 Popover, 없으면 onClick 폴백.
  const notifControl = (position: 'bottom' | 'top' | 'right', kind: 'icon' | 'tile') => {
    if (!notification) return null;
    const hasContent = Boolean(notification.content);
    const trigger = kind === 'tile' ? (
      <span className="erp-rail-item" role="button" tabIndex={0}
        onClick={hasContent ? undefined : notification.onClick}>
        {tile('bell', '알림', false)}
        {unreadDot(6, 16)}
      </span>
    ) : (
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <IconButton icon="bell" label="알림" variant="ghost" onClick={hasContent ? undefined : notification.onClick} />
        {unreadDot(6, 6)}
      </span>
    );
    return hasContent ? (
      // 키 큰 알림 패널은 옆(right)으로 흘릴 때 하단정렬(align=end) — 넷바 하단 앵커에서 위로 부풀지 않고
      //  넷바 오른쪽으로 빠져나오는 플라이아웃(좌측 넷바 문법). 폰(bottom)만 중앙정렬로 드롭.
      <Popover opened={notifOpen} onChange={(o) => (o ? notifH.open() : notifH.close())}
        position={position} align={position === 'right' ? 'end' : 'center'} width="lg" content={notification.content}>
        {trigger}
      </Popover>
    ) : trigger;
  };

  // 프로필 — kind 'full'(넷바 하단, 아바타+이름·직책+caret) / 'avatar'(상단바·레일, 아바타-only).
  const profileControl = (position: 'bottom' | 'top' | 'right', kind: 'full' | 'avatar' | 'rail') => {
    if (!profile) return null;
    const avatar = <Avatar src={profile.avatarSrc} size="md">{profile.name.slice(0, 1)}</Avatar>;
    const inner = kind === 'full' ? (
      <>
        {avatar}
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0, flex: 1 }}>
          <Text variant="body-strong">{profile.name}</Text>
          {profile.role && <Text variant="caption" color="secondary">{profile.role}</Text>}
        </span>
        <Icon name="chevron-down" size="sm" color="secondary" />
      </>
    ) : avatar;
    const cls = kind === 'rail' ? 'erp-rail-item' : 'erp-profile-trigger';
    const menuHeader = (
      <MGroup gap="sm" align="center" wrap="nowrap">
        {avatar}
        <MStack gap={2}>
          <Text variant="body-strong">{profile.name}</Text>
          {(profile.email || profile.role) && (
            <Text variant="caption" color="secondary">{profile.email ?? profile.role}</Text>
          )}
        </MStack>
      </MGroup>
    );
    // 'full': justify space-between 컨테이너 안에서 아바타 카드는 자연폭(좌측 앵커), 알림 벨은 우측 끝으로 밀림.
    const style = kind === 'full' ? { display: 'flex', alignItems: 'center', gap: 'var(--mantine-spacing-sm)', minWidth: 0 } : undefined;
    return profile.menu && profile.menu.length > 0 ? (
      <Menu trigger={<span className={cls} style={style}>{inner}</span>} items={profile.menu} position={position} header={menuHeader} />
    ) : (
      <span className={cls} role="button" tabIndex={0} style={style}
        onClick={profile.onMenuClick}
        onKeyDown={profile.onMenuClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); profile.onMenuClick!(); }
        } : undefined}>
        {inner}
      </span>
    );
  };

  return (
    <M
      layout="alt"
      header={{ height: HEADER_HEIGHT, collapsed: tier !== 'phone' }}
      navbar={{ width: tier === 'desktop' ? NAV_WIDTH_DESKTOP : NAV_WIDTH_RAIL, breakpoint: 'sm', collapsed: { mobile: tier === 'phone', desktop: false } }}
      footer={{ height: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`, collapsed: tier !== 'phone' }}
      padding="lg"
    >
      {/* 슬림 상단바 — 폰 전용(데스크탑·태블릿은 collapsed로 해체). 좌 로고 + 우 밀착 [알림][아바타]. */}
      {tier === 'phone' && (
        <M.Header style={{ boxShadow: '0 1px 2px rgba(11, 26, 53, 0.08)', borderBottom: 'none', zIndex: 1 }}>
          <MGroup h="100%" px="lg" align="center" wrap="nowrap">
            <Box className="erp-logo-slot" onClick={onLogoClick}
              style={{ height: MOBILE_LOGO_HEIGHT, display: 'flex', alignItems: 'center', cursor: onLogoClick ? 'pointer' : 'default' }}>
              {logo}
            </Box>
            <MGroup gap="sm" align="center" wrap="nowrap" style={{ marginLeft: 'auto' }}>
              {notifControl('bottom', 'icon')}
              {profileControl('bottom', 'avatar')}
            </MGroup>
          </MGroup>
        </M.Header>
      )}

      {/* 넷바 — 데스크탑(풀 260)·태블릿(레일 72). 3존: 로고(위) · 메뉴(grow) · 유틸리티(아래).
          모바일에선 collapsed.mobile로 완전 숨김(하단 탭이 대체). 우측 그림자로 "떠 있는 패널". */}
      <M.Navbar p={tier === 'tablet' ? 'xs' : 'md'} style={{ boxShadow: '2px 0 8px rgba(11, 26, 53, 0.08)', borderRight: 'none', zIndex: 2 }}>
        {tier !== 'phone' && (
          <>
            {/* 로고 — 데스크탑 넷바 최상단(a형). 밴드 하단 구분선이 정체성 블록을 드러냄.
                태블릿 레일(72px)은 로고 밴드 없음 — 그 폭엔 정사각 마크만 들어가 부실해서 제거(메뉴부터 시작). */}
            {tier === 'desktop' && (
              <M.Section style={{
                height: LOGO_BAND,
                display: 'flex', alignItems: 'center',
                marginBottom: 'var(--mantine-spacing-md)', borderBottom: '1px solid var(--border-default)',
              }}>
                <span className="erp-logo-slot" onClick={onLogoClick} style={{
                  height: LOGO_SLOT_HEIGHT, width: '100%',
                  display: 'flex', alignItems: 'center',
                  cursor: onLogoClick ? 'pointer' : 'default',
                }}>
                  {logo}
                </span>
              </M.Section>
            )}

            {/* 메뉴 — 가운데 grow. 데스크탑=NavLink(라벨+아이콘+카운트), 태블릿=세로 타일 레일. 넘치면 이 존만 스크롤. */}
            <M.Section grow style={{ overflowY: 'auto', minHeight: 0 }}>
              {tier === 'desktop' ? (
                <MStack gap="md">
                  {groups.map((g, gi) => (
                    <MStack gap={4} key={gi}>
                      {g.group && <Text variant="caption" color="secondary">{g.group}</Text>}
                      {g.items.map((it) => (
                        <NavLink key={it.path} label={it.label}
                          leftSection={<Icon name={it.icon} size="sm" />}
                          rightSection={it.count != null && it.count > 0 ? <CountBadge count={it.count} /> : undefined}
                          active={activePath === it.path} onClick={() => onNavigate(it.path)} />
                      ))}
                    </MStack>
                  ))}
                </MStack>
              ) : (
                <MStack gap="xxs">
                  {menuItems.map((it) => {
                    const active = activePath === it.path;
                    return (
                      <button key={it.path} type="button" className="erp-rail-item" data-active={active}
                        aria-current={active ? 'page' : undefined} onClick={() => onNavigate(it.path)}>
                        {tile(it.icon, it.label, active, it.count)}
                      </button>
                    );
                  })}
                </MStack>
              )}
            </M.Section>

            {/* 유틸리티 존(아래) — 데스크탑=[프로필 확장행 + 알림], 태블릿=[알림·아바타 아이콘]. 상단 구분선. */}
            {(profile || notification) && (
              <M.Section style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--mantine-spacing-sm)', marginTop: 'var(--mantine-spacing-sm)' }}>
                {tier === 'desktop' ? (
                  <MGroup gap="xs" justify="space-between" align="center" wrap="nowrap">
                    {profileControl('top', 'full')}
                    {notifControl('right', 'icon')}
                  </MGroup>
                ) : (
                  <MStack gap="xxs" align="center">
                    {notifControl('right', 'tile')}
                    {profileControl('right', 'rail')}
                  </MStack>
                )}
              </M.Section>
            )}
          </>
        )}
      </M.Navbar>

      {/* 데스크탑·태블릿: 문서 스크롤. 폰: appshell.css가 본문만 내부 스크롤(고정 헤더·하단탭 사이). */}
      <M.Main className="erp-appshell-main" style={{ background: 'var(--bg-tertiary)', minHeight: '100vh' }}>
        {children}
      </M.Main>

      {/* 하단 탭 내비 — 폰 전용(collapsed로 데스크탑·태블릿 숨김). 골격 raw(명시 예외), 타일은 우리 부품. */}
      {tier === 'phone' && (
        <M.Footer className="erp-appshell-footer">
          <nav className="erp-bottomnav" aria-label="주 메뉴">
            {tabItems.map((it) => {
              const active = activePath === it.path;
              return (
                <button key={it.path} type="button" className="erp-tab" data-active={active}
                  aria-current={active ? 'page' : undefined} onClick={() => onNavigate(it.path)}>
                  {tile(it.icon, it.label, active, it.count)}
                </button>
              );
            })}
            {overflow && (
              <Popover opened={moreOpen} onChange={(o) => (o ? moreH.open() : moreH.close())}
                position="top" width="sm"
                content={
                  <Stack gap="xxs">
                    {moreItems.map((it) => {
                      const active = activePath === it.path;
                      return (
                        <button key={it.path} type="button" className="erp-more-row" data-active={active}
                          onClick={() => { onNavigate(it.path); moreH.close(); }}>
                          <Group gap="sm" align="center">
                            <Icon name={it.icon} size="sm" color={active ? 'primary' : 'secondary'} />
                            <Text variant="body" color={active ? 'primary' : 'secondary'}>{it.label}</Text>
                            {it.count != null && it.count > 0 && <CountBadge count={it.count} />}
                          </Group>
                        </button>
                      );
                    })}
                  </Stack>
                }>
                <span className="erp-tab" data-active={moreActive}>
                  {tile('menu', '더보기', moreActive)}
                </span>
              </Popover>
            )}
          </nav>
        </M.Footer>
      )}
    </M>
  );
}
