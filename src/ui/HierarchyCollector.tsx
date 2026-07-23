'use client';
// HierarchyCollector (템플릿) — 계층 카탈로그에서 수량과 함께 골라 담는 "작성 면". HierarchyExplorer의 짝.
//  · HE = 계층을 *관리*(추가·정리) / HierarchyCollector = 계층에서 *수집*(담기 누적). 같은 계층 데이터·반대 목적.
//  · 정당화(왜 별 부품): "모든 분류를 보며 횡단 + 수량 누적"이 HE+버튼으로 안 됨 — 횡단·누적이 새 정체성.
//  · 조립(도메인 0줄, 헌법 1): 카탈로그 책갈피 + 영속 경로 네비(cascader) + 좌 브라우즈 목록 + 우 카트(LineItemList) + 풋터.
//  · 윤곽→음영 2축(collector.css): 위젯 전체만 raised(그림자), 내부 flush, 카트=sunken well. 탭은 좌측 컬럼만 스코프.
//  · 책갈피·cascader·검색·카트칩은 *템플릿 종속* 컨트롤(collector.css) — Select/TabBar/Chip 아톰은 width·크기·체크를
//    못 닫아 이 면의 "컴팩트·무테" 요구를 못 맞춘다. 공유 부품(NumberStepper·LineItemList)은 그대로 재사용.
//  · 카트 카탈로그 토글은 브라우즈와 *독립*(담을 때만 동기화). 반응형 강등(narrow→스택)은 부품이 소유.
import { Fragment, useState } from 'react';
import { Page } from './Page';
import { Stack } from './Stack';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { Popover } from './Popover';
import { NumberStepper } from './NumberStepper';
import { LineItemList, type LineItem } from './LineItemList';
import { PageHeader } from './PageHeader';
import { fmtCurrency, renderAction, type Action } from './_cells';

export type CollectorNode = { id: string; label: string; children?: CollectorNode[] };
export type CollectorCatalog = { id: string; label: string; tree: CollectorNode[] };
export type CollectorProduct = {
  id: string;
  catalog: string;       // 카탈로그 id
  path: string[];        // 분류 노드 id 경로(cpath가 prefix면 노출)
  label: string;
  sublabel?: string;
  group?: string;        // 카트 그룹 라벨(하위분류)
  amount?: number;
  thumbnail?: string;
};
export type CollectorCartItem = LineItem & { catalog: string };

type Props = {
  title: string;
  description?: string;
  actions?: Action[];
  catalogs: CollectorCatalog[];
  products: CollectorProduct[];
  cart: CollectorCartItem[];
  onCartChange: (cart: CollectorCartItem[]) => void;
  showAmount?: boolean;
  onProductClick?: (productId: string) => void;
  emptyCart?: { icon?: IconName; title: string; description?: string };
};

export function HierarchyCollector({
  title, description, actions, catalogs, products, cart, onCartChange,
  showAmount = false, onProductClick, emptyCart,
}: Props) {
  const first = catalogs[0]?.id ?? '';
  const [browse, setBrowse] = useState(first);
  const [cpath, setCpath] = useState<string[]>([]);
  const [cartCat, setCartCat] = useState(first);
  const [search, setSearch] = useState('');
  const [openLevel, setOpenLevel] = useState(-1);
  const [cartSelOpen, setCartSelOpen] = useState(false);
  const multi = catalogs.length > 1;

  const activeTree = catalogs.find((c) => c.id === browse)?.tree ?? [];

  // 영속 cascader: 트리를 cpath 따라 내려가며 레벨별 옵션 도출(마지막은 다음 선택 칸)
  const levels: { options: { label: string; value: string }[]; value: string | null }[] = [];
  {
    let nodes: CollectorNode[] | undefined = activeTree;
    for (let d = 0; nodes && nodes.length > 0; d++) {
      levels.push({ options: nodes.map((n) => ({ label: n.label, value: n.id })), value: cpath[d] ?? null });
      if (cpath[d] == null) break;
      nodes = nodes.find((n) => n.id === cpath[d])?.children;
    }
  }
  const pickPath = (d: number, v: string | null) => {
    const next = cpath.slice(0, d);
    if (v) next[d] = v;
    setCpath(next);
  };

  const q = search.trim();
  const visible = products.filter(
    (p) => p.catalog === browse
      && cpath.every((c, i) => p.path[i] === c)
      && (q === '' || (p.label + (p.sublabel ?? '')).includes(q)),
  );
  const qtyOf = (id: string) => cart.find((i) => i.id === id)?.quantity ?? 0;

  const setProductQty = (p: CollectorProduct, quantity: number) => {
    let next: CollectorCartItem[];
    if (quantity <= 0) next = cart.filter((i) => i.id !== p.id);
    else if (cart.some((i) => i.id === p.id)) next = cart.map((i) => (i.id === p.id ? { ...i, quantity } : i));
    else next = [...cart, { id: p.id, label: p.label, sublabel: p.sublabel, group: p.group, unitAmount: p.amount, quantity, catalog: p.catalog }];
    if (quantity > 0) setCartCat(p.catalog); // 담으면 카트가 그 카탈로그로 동기화
    onCartChange(next);
  };
  const setCartQty = (id: string, quantity: number) =>
    onCartChange(quantity <= 0 ? cart.filter((i) => i.id !== id) : cart.map((i) => (i.id === id ? { ...i, quantity } : i)));
  const removeCart = (id: string) => onCartChange(cart.filter((i) => i.id !== id));

  const cartView = cart.filter((i) => i.catalog === cartCat);
  const grandQty = cart.reduce((s, i) => s + i.quantity, 0);       // 전역 합계(모든 카탈로그) — well 하단 고정
  const grandAmt = cart.reduce((s, i) => s + (i.unitAmount ?? 0) * i.quantity, 0);

  return (
    <Page>
      <Stack gap="md">
        <PageHeader title={title} meta={description ? [{ kind: 'text', label: description }] : undefined} />

        <div className="erpCollectorWidget">
          <div className="erpCollectorBody">
            {/* 좌: 브라우즈 컬럼(탭은 여기서만 스코프) */}
            <div className="erpCollectorBrowse">
              {multi && (
                <div className="erpCollectorTabs">
                  {catalogs.map((c) => (
                    <button key={c.id} type="button" className="erpCollectorTab" data-on={c.id === browse}
                      onClick={() => { setBrowse(c.id); setCpath([]); }}>{c.label}</button>
                  ))}
                </div>
              )}
              <div className="erpCollectorNav">
                <div className="erpCollectorCasc">
                  {levels.map((lv, d) => {
                    const label = lv.value ? (lv.options.find((o) => o.value === lv.value)?.label ?? '선택') : '선택';
                    return (
                      <Fragment key={d}>
                        {d > 0 && <span className="erpCollectorSep">›</span>}
                        <Popover
                          opened={openLevel === d}
                          onChange={(o) => setOpenLevel(o ? d : -1)}
                          position="bottom" align="start" width="auto"
                          content={(
                            <div className="erpCollectorCascMenu">
                              {lv.options.map((o) => (
                                <button key={o.value} type="button" className="erpCollectorCascItem" data-on={o.value === lv.value}
                                  onClick={() => { pickPath(d, o.value); setOpenLevel(-1); }}>{o.label}</button>
                              ))}
                            </div>
                          )}
                        >
                          <span className="erpCollectorCascTrig" data-ph={lv.value == null}>{label} <span style={{ opacity: 0.45 }}>▾</span></span>
                        </Popover>
                      </Fragment>
                    );
                  })}
                </div>
                <div className="erpCollectorSearch">
                  <input className="erpCollectorSearchInput" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이 목록 내 검색" />
                </div>
              </div>
              <div className="erpCollectorList">
                {visible.length === 0 ? (
                  <div style={{ padding: 'var(--mantine-spacing-xl)', textAlign: 'center' }}>
                    <Text variant="body" color="secondary">표시할 품목이 없습니다.</Text>
                  </div>
                ) : visible.map((p) => {
                  const qty = qtyOf(p.id);
                  return (
                    <div key={p.id} className="erpCollectorRow" data-in={qty > 0} onClick={() => onProductClick?.(p.id)}>
                      <div className="erpCollectorThumb" style={p.thumbnail ? { backgroundImage: `url(${p.thumbnail})`, backgroundSize: 'cover' } : undefined}>
                        {!p.thumbnail && <Icon name="package" size="sm" color="secondary" />}
                        {qty > 0 && <span className="erpCollectorCheck"><Icon name="check" size="sm" /></span>}
                      </div>
                      <div className="erpCollectorInfo">
                        <div className="erpCollectorRowName erpClampLine">{p.label}</div>
                        {p.sublabel && <div className="erpCollectorRowSub erpClampLine">{p.sublabel}</div>}
                      </div>
                      {showAmount && p.amount !== undefined && (
                        <div className="erpCollectorPrice"><Text variant="body-strong">{fmtCurrency(p.amount)}</Text></div>
                      )}
                      <div onClick={(e) => e.stopPropagation()}>
                        <NumberStepper value={qty} onChange={(v) => setProductQty(p, v)} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 우: 카트(sunken well) — 독립 카탈로그 토글 + LineItemList */}
            <div className="erpCollectorWell">
              <div className="erpCollectorWellHd">
                <span className="ttl">담은 내역</span>
                {multi && (
                  <Popover
                    opened={cartSelOpen}
                    onChange={setCartSelOpen}
                    position="bottom" align="end" width="auto"
                    content={(
                      <div className="erpCollectorCatMenu">
                        {catalogs.map((c) => {
                          const n = cart.filter((i) => i.catalog === c.id).length;
                          return (
                            <button key={c.id} type="button" className="erpCollectorCatItem" data-on={c.id === cartCat} data-empty={n === 0}
                              onClick={() => { setCartCat(c.id); setCartSelOpen(false); }}>
                              <span>{c.label}</span>
                              {n > 0 && <span className="cnt">{n}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  >
                    <span className="erpCollectorCatSel">
                      {catalogs.find((c) => c.id === cartCat)?.label ?? ''}
                      {cart.some((i) => i.catalog !== cartCat) && <span className="dot" />}
                      <Icon name="chevron-down" size="sm" color="secondary" />
                    </span>
                  </Popover>
                )}
              </div>
              <div className="erpCollectorWellBody">
                <LineItemList
                  items={cartView}
                  onQuantityChange={setCartQty}
                  onRemove={removeCart}
                  showAmount={showAmount}
                  showTotal={false}
                  emptyState={emptyCart ?? { icon: 'cart', title: '담은 품목이 없습니다', description: '왼쪽에서 수량을 정해 담으세요.' }}
                />
              </div>
              <div className="erpCollectorWellTotal">
                <span className="lbl">전체</span>
                <span>
                  {showAmount && <span className="amt">{fmtCurrency(grandAmt)}</span>}
                  <span className="lbl">{grandQty}개</span>
                </span>
              </div>
            </div>
          </div>

          {actions && actions.length > 0 && (
            <div className="erpCollectorFoot">{actions.map((a, i) => renderAction(a, i, 'sm'))}</div>
          )}
        </div>
      </Stack>
    </Page>
  );
}
