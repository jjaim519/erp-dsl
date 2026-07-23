'use client';
// DetailPage (템플릿) — ERP 상세 페이지 골격. PageHeader + 좌(정보) / 우(폼) 2분할. 도메인 0줄.
// 좌 = DescriptionList(읽기), 우 = FormSection(입력). 도메인은 info·form(데이터)로만.
import { Page } from './Page';
import { Stack } from './Stack';
import { Grid } from './Grid';
import { Card } from './Card';
import { Title } from './Title';
import { Group } from './Group';
import { PageHeader } from './PageHeader';
import { DescriptionList } from './DescriptionList';
import { FormSection } from './FormSection';
import type { Action, CellType, BadgeColor } from './_cells';
import { renderAction } from './_cells';
import type { FieldSpec } from '../schema';

type DescItem = { label: string; value: unknown; type: CellType; badgeColors?: Record<string, BadgeColor> };

type Props = {
  title: string;
  description?: string;                      // 상세는 제목 아래 보조정보(예: "관리자 · 2026-05-02 등록"). 목록은 제목만.
  actions?: Action[];                       // 예: 목록으로, 수정
  info: { heading?: string; items: DescItem[]; columns?: 1 | 2 | 3 };
  form?: {
    heading?: string;
    fields: FieldSpec[];
    columns?: 1 | 2;
    values: Record<string, unknown>;
    onChange: (name: string, value: unknown) => void;
    resolvers?: Record<string, (apply: (patch: Record<string, unknown>) => void) => void>;
    errors?: Record<string, string>;
    footer?: Action[];                      // 예: 프로젝트 생성
  };
};

export function DetailPage({ title, description, actions, info, form }: Props) {
  return (
    <Page>
      <Stack gap="lg">
        <PageHeader title={title} meta={description ? [{ kind: 'text', label: description }] : undefined} actions={actions} />
        <Grid columns={2} gap="lg">
          <Grid.Col span={1}>
            <Card variant="elevated" padding="lg">
              <Stack gap="md">
                {info.heading && <Title variant="subheading">{info.heading}</Title>}
                <DescriptionList items={info.items} columns={info.columns ?? 1} />
              </Stack>
            </Card>
          </Grid.Col>
          {form && (
            <Grid.Col span={1}>
              <Card variant="elevated" padding="lg">
                <Stack gap="md">
                  {form.heading && <Title variant="subheading">{form.heading}</Title>}
                  <FormSection
                    fields={form.fields}
                    values={form.values}
                    onChange={form.onChange}
                    columns={form.columns ?? 1}
                    resolvers={form.resolvers}
                    errors={form.errors}
                  />
                  {form.footer && form.footer.length > 0 && (
                    <Group justify="end" gap="xs">
                      {form.footer.map((a, i) => renderAction({ ...a, variant: a.variant ?? 'primary' }, i))}
                    </Group>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          )}
        </Grid>
      </Stack>
    </Page>
  );
}
