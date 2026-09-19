/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * All 6 report types rendered client-side with @react-pdf/renderer —
 * free OSS, no server compute, no Vercel function time burned.
 * Loaded lazily via dynamic import, so it never touches SSR.
 */
import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#0f172a' },
  title: { fontSize: 16, marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#64748b', marginBottom: 16 },
  section: { fontSize: 12, marginTop: 16, marginBottom: 6 },
  thead: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#0f172a', paddingBottom: 3, marginBottom: 2 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingVertical: 3 },
  c1: { flex: 3 },
  c2: { flex: 1, textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold' },
  comment: { borderWidth: 0.5, borderColor: '#e2e8f0', borderRadius: 3, padding: 8, marginTop: 6 },
  muted: { color: '#64748b', fontSize: 8 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 8, color: '#94a3b8', textAlign: 'center' },
});

const generated = () => new Date().toLocaleString();

function T({ children }: { children: React.ReactNode }) {
  return <Text>{children}</Text>;
}

function Table({ head, rows }: { head: [string, string]; rows: [string, string | number | null][] }) {
  return (
    <View>
      <View style={styles.thead}>
        <Text style={[styles.c1, styles.bold]}>{head[0]}</Text>
        <Text style={[styles.c2, styles.bold]}>{head[1]}</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={styles.tr}>
          <Text style={styles.c1}>{r[0]}</Text>
          <Text style={styles.c2}>{r[1] ?? '—'}</Text>
        </View>
      ))}
    </View>
  );
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={[styles.title, styles.bold]}>{title}</Text>
        <Text style={styles.subtitle}>
          Cotabato State University · CSU CETC Faculty Evaluation Portal · {subtitle} · Generated {generated()}
        </Text>
        {children}
        <Text style={styles.footer} fixed>
          Cotabato State University · College of Engineering, Technology and Computing — Confidential
        </Text>
      </Page>
    </Document>
  );
}

function num(v: any) {
  return typeof v === 'number' ? v.toFixed(2) : '—';
}

export function buildDocument(type: string, data: any): any {
  switch (type) {
    case 'faculty': {
      const { overview, facultyName, semesterLabel } = data;
      return (
        <Shell title={`Faculty Evaluation Results — ${facultyName}`} subtitle={semesterLabel}>
          <Text style={styles.section}>
            Overall rating: {num(overview.overall)} / 5
          </Text>
          <Text style={[styles.section, styles.bold]}>Per question</Text>
          <Table
            head={['Question', 'Avg']}
            rows={(overview.per_question ?? []).map((q: any) => [
              `${q.category}: ${q.text}`,
              num(q.avg_rating),
            ])}
          />
          <Text style={[styles.section, styles.bold]}>Per subject</Text>
          <Table
            head={['Subject / Section', 'Avg']}
            rows={(overview.per_subject ?? []).map((s: any) => [
              `${s.subject_code} ${s.subject_name} (${s.section_name}) — ${s.evals} evals`,
              num(s.avg_rating),
            ])}
          />
          <Text style={[styles.section, styles.bold]}>
            Comments ({(overview.sentiment ?? {}).positive ?? 0} positive /{' '}
            {(overview.sentiment ?? {}).negative ?? 0} negative)
          </Text>
          {(overview.comments ?? []).slice(0, 40).map((c: any, i: number) => (
            <View key={i} style={styles.comment}>
              <T>{c.comment}</T>
              <Text style={styles.muted}>{c.label ?? 'neutral'}</Text>
            </View>
          ))}
        </Shell>
      );
    }
    case 'department': {
      const { overview, label } = data;
      const p = overview.participation ?? {};
      const pct = p.enrolled ? Math.round((p.submitted / p.enrolled) * 100) : 0;
      return (
        <Shell title="Department Overview" subtitle={label}>
          <Text style={styles.section}>
            Participation: {p.submitted ?? 0}/{p.enrolled ?? 0} students ({pct}%) · {p.total_evals ?? 0}{' '}
            evaluations
          </Text>
          <Text style={[styles.section, styles.bold]}>Faculty ranking</Text>
          <Table
            head={['Faculty', 'Overall']}
            rows={(overview.faculty ?? []).map((f: any) => [
              `${f.full_name} — ${f.evals} evals / ${f.loads} loads`,
              num(f.overall),
            ])}
          />
          <Text style={[styles.section, styles.bold]}>Per criterion</Text>
          <Table
            head={['Criterion', 'Avg']}
            rows={(overview.per_criterion ?? []).map((c: any) => [c.category, num(c.avg_rating)])}
          />
          <Text style={[styles.section, styles.bold]}>
            Sentiment: {(overview.sentiment ?? {}).positive ?? 0} positive /{' '}
            {(overview.sentiment ?? {}).neutral ?? 0} neutral / {(overview.sentiment ?? {}).negative ?? 0}{' '}
            negative
          </Text>
        </Shell>
      );
    }
    case 'faculty_detailed': {
      const { facultyName, semesterLabel, detail } = data;
      return (
        <Shell title={`Detailed Report — ${facultyName}`} subtitle={semesterLabel}>
          <Text style={[styles.section, styles.bold]}>Per question</Text>
          <Table
            head={['Question', 'Avg']}
            rows={(detail.per_question ?? []).map((q: any) => [`${q.category}: ${q.text}`, num(q.avg_rating)])}
          />
          <Text style={[styles.section, styles.bold]}>Comments</Text>
          {(detail.comments ?? []).slice(0, 60).map((c: any, i: number) => (
            <View key={i} style={styles.comment}>
              <T>{c.comment}</T>
              <Text style={styles.muted}>{c.label ?? 'neutral'}</Text>
            </View>
          ))}
        </Shell>
      );
    }
    case 'subject': {
      const { rows, semesterLabel } = data;
      return (
        <Shell title="Subject Report" subtitle={semesterLabel}>
          <Table
            head={['Subject', 'Avg']}
            rows={(rows ?? []).map((r: any) => [`${r.code} — ${r.name} (${r.evals} evals)`, num(r.avg_rating)])}
          />
        </Shell>
      );
    }
    case 'sentiment': {
      const { report, label } = data;
      const c = report.counts ?? {};
      return (
        <Shell title="Sentiment Analysis Report" subtitle={label}>
          <Text style={styles.section}>
            {c.positive ?? 0} positive · {c.neutral ?? 0} neutral · {c.negative ?? 0} negative
          </Text>
          {(report.comments ?? []).slice(0, 80).map((x: any, i: number) => (
            <View key={i} style={styles.comment}>
              <T>{x.comment}</T>
              <Text style={styles.muted}>
                {x.label ?? 'neutral'} · {x.faculty_name} · {x.subject_code}
              </Text>
            </View>
          ))}
        </Shell>
      );
    }
    case 'trend': {
      return (
        <Shell title="Semester Trend Report" subtitle="all semesters">
          <Table
            head={['Semester', 'Avg']}
            rows={(data.rows ?? []).map((r: any) => [
              `${r.academic_year} ${r.term} — ${r.evals} evals · ${r.positive}+ / ${r.negative}−`,
              num(r.avg_rating),
            ])}
          />
        </Shell>
      );
    }
    default:
      return <Shell title="Report" subtitle="">{null}</Shell>;
  }
}
