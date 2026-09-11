"""Offline SQLite fixtures for extracted SQL; not BigQuery execution or parsing.

Only dialect/date-source adapters below are translated. Joins, aggregation,
position formulas, trend predicates and alert CASE expressions come from queries.md.
Run: python3 -m unittest discover -s plugins/gsc-bigquery/skills/gsc-bigquery/tests -v
"""
import calendar
import math
import datetime as dt
from pathlib import Path
import re
import sqlite3
import unittest

DOC = (Path(__file__).parents[1] / 'references/queries.md').read_text()
END = dt.date(2026, 9, 10)


def block(number, index=0):
    section = DOC.split(f'### Query {number}:', 1)[1].split('### Query ', 1)[0]
    return re.findall(r'```sql\n(.*?)\n```', section, re.S)[index]


def gate_sql():
    # Execute all production CTEs and the required-table predicate. Only the
    # BigQuery array sources and metadata identifiers need SQLite equivalents.
    # ASSERT syntax remains a BigQuery-engine verification limitation.
    sql = re.findall(r'```sql\n(.*?)\n```', DOC, re.S)[0]
    sql = 'WITH expected AS (' + sql.split('WITH expected AS (', 1)[1]
    sql = sql.replace('UNNEST(GENERATE_DATE_ARRAY(@coverage_start, @coverage_end))',
                      "(WITH RECURSIVE dates(day) AS (SELECT @coverage_start UNION ALL "
                      "SELECT date(day, '+1 day') FROM dates WHERE day < @coverage_end) SELECT day FROM dates)")
    sql = re.sub(r'UNNEST\(\[\s*(.*?)\s*\]\)',
                 lambda m: '(' + ' UNION ALL '.join(
                     'SELECT ' + value for value in re.findall(r'STRUCT\((.*?)\)', m[1], re.S)) + ')', sql, flags=re.S)
    sql = sql.replace('`{PROJECT}.{DATASET}.ExportLog`', 'export_log')
    sql = sql.replace('`{PROJECT}.{DATASET}.INFORMATION_SCHEMA.PARTITIONS`', 'physical_partitions')
    return sql.replace("SAFE.PARSE_DATE('%Y%m%d', partition_id)", 'PARSE_PARTITION(partition_id)')


def parse_partition(value):
    try:
        return dt.datetime.strptime(value, '%Y%m%d').date().isoformat()
    except (TypeError, ValueError):
        return None


def minus_month(value, count):
    date = dt.date.fromisoformat(value)
    index = date.year * 12 + date.month - 1 - count
    return dt.date(index // 12, index % 12 + 1, 1).isoformat()


def adapt(sql):
    sql = re.sub(r'`\{PROJECT\}\.\{DATASET\}\.(searchdata_\w+)`', r'\1', sql)
    sql = sql.replace('DATE_SUB(@end_date, INTERVAL (@days - 1) DAY)', ':current_start')
    sql = sql.replace('DATE_SUB(@end_date, INTERVAL (2 * @days - 1) DAY)', ':prior_start')
    sql = sql.replace('DATE_SUB(@end_date, INTERVAL @days DAY)', ':prior_end')
    sql = re.sub(r'DATE_SUB\(last_month, INTERVAL (\d+) MONTH\)', r'MINUS_MONTH(last_month, \1)', sql)
    return sql


class Queries(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.row_factory = sqlite3.Row
        self.db.create_function('SAFE_DIVIDE', 2, lambda a, b: a / b if a is not None and b else None)
        self.db.create_function('IF', 3, lambda c, a, b: a if c else b)
        self.db.create_function('MINUS_MONTH', 2, minus_month)
        self.db.create_function('PARSE_PARTITION', 1, parse_partition)
        self.db.executescript('''
          CREATE TABLE searchdata_url_impression (
            data_date TEXT, url TEXT, query TEXT, clicks INT, impressions INT,
            sum_position INT, search_type TEXT, is_anonymized_query INT);
          CREATE TABLE searchdata_site_impression (
            data_date TEXT, query TEXT, clicks INT, impressions INT,
            sum_top_position INT, search_type TEXT, is_anonymized_query INT);
        ''')
        self.params = dict(end_date=END.isoformat(), days=28,
                           current_start=(END-dt.timedelta(days=27)).isoformat(),
                           prior_start=(END-dt.timedelta(days=55)).isoformat(),
                           prior_end=(END-dt.timedelta(days=28)).isoformat())

    def tearDown(self):
        self.db.close()

    def add(self, date, url, clicks, impressions=100, pos=0):
        self.db.execute('INSERT INTO searchdata_url_impression VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        (date, url, 'query', clicks, impressions, pos, 'WEB', 0))

    def test_native_zero_position_is_one_and_zero_impressions_unavailable(self):
        for column in ('sum_position', 'sum_top_position'):
            expr = re.search(r'SAFE_DIVIDE\(SUM\('+column+r'\), SUM\(impressions\)\) \+ 1', DOC)[0]
            self.assertEqual(self.db.execute(f'SELECT {expr} FROM (SELECT 0 AS {column}, 10 AS impressions)').fetchone()[0], 1)
            self.assertIsNone(self.db.execute(f'SELECT {expr} FROM (SELECT 0 AS {column}, 0 AS impressions)').fetchone()[0])

    def test_exact_28_dates_and_adjacent_prior(self):
        for i in range(58):
            self.db.execute('INSERT INTO searchdata_site_impression VALUES (?, ?, 1, 10, 0, ?, 0)',
                            ((END-dt.timedelta(days=i-1)).isoformat(), str(i), 'WEB'))
        row = self.db.execute(adapt(block(8)), self.params).fetchone()
        self.assertEqual((row['current_clicks'], row['prior_clicks']), (28, 28))
        self.assertEqual((row['current_position'], row['prior_position']), (1, 1))

    def test_coverage_rejects_missing_log_or_partition(self):
        self.db.executescript('CREATE TABLE export_log(data_date TEXT, namespace TEXT, agenda TEXT);'
                             'CREATE TABLE physical_partitions(partition_id TEXT, table_name TEXT, total_rows INT);')
        params = dict(coverage_start=self.params['current_start'], coverage_end=END.isoformat(),
                      require_site=True, require_url=True, site_namespace='site', url_namespace='url')
        for i in range(28):
            day = (END-dt.timedelta(days=i)).isoformat()
            for name in ('site', 'url'):
                self.db.execute('INSERT INTO export_log VALUES (?, ?, ?)', (day, name, 'SEARCHDATA'))
                self.db.execute('INSERT INTO physical_partitions VALUES (?, ?, 1)',
                                (day.replace('-', ''), f'searchdata_{name}_impression'))
        gate = gate_sql()
        self.assertEqual(len(self.db.execute(gate, params).fetchall()), 0)
        self.db.execute('UPDATE export_log SET agenda = ? WHERE data_date = ? AND namespace = ?',
                        ('OTHER', END.isoformat(), 'url'))
        rows = self.db.execute(gate, params).fetchall()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['export_logged'], 0)
        self.assertEqual(len(self.db.execute(gate, params | dict(require_url=False, url_namespace=None)).fetchall()), 0)
        self.assertEqual(len(self.db.execute(gate, params | dict(require_site=False, site_namespace=None)).fetchall()), 1)
        self.db.execute("UPDATE export_log SET agenda = 'SEARCHDATA'")
        self.db.execute('UPDATE physical_partitions SET total_rows = 0 WHERE partition_id = ?', (END.strftime('%Y%m%d'),))
        self.db.execute("INSERT INTO physical_partitions VALUES ('__NULL__', 'searchdata_url_impression', 100)")
        self.assertEqual(len(self.db.execute(gate, params).fetchall()), 2)
        for required in [dict(require_site=False), dict(require_url=False)]:
            self.assertEqual(len(self.db.execute(gate, params | required).fetchall()), 1)

    def test_weighted_positions_use_impressions_in_full_snapshot(self):
        for date in [self.params['end_date'], self.params['prior_end']]:
            self.db.executemany('INSERT INTO searchdata_site_impression VALUES (?, ?, ?, ?, ?, ?, ?)',
                                [(date, 'small', 1, 10, 0, 'WEB', 0),
                                 (date, 'large', 9, 90, 810, 'WEB', 0)])
            self.add(date, 'small', 1, 10, 0)
            self.add(date, 'large', 9, 90, 810)
        row = self.db.execute(adapt(block(8)), self.params).fetchone()
        self.assertAlmostEqual(row['current_position'], 9.1)
        self.assertAlmostEqual(row['prior_position'], 9.1)
        rows = self.db.execute(adapt(block(14, 1)), self.params).fetchall()
        self.assertEqual(rows, [])

    def test_disappeared_query_url_pairs_thresholds_and_weighted_position(self):
        for url, clicks in [('critical', 20), ('warning', 5), ('tiny', 4), ('present', 20)]:
            self.add(self.params['prior_end'], url, clicks, 10, 0)
        self.add(self.params['prior_end'], 'critical', 0, 90, 810)
        self.add(self.params['end_date'], 'present', 1)
        # A different query at the same URL does not rescue the vanished pair.
        self.add(self.params['end_date'], 'critical', 1)
        self.db.execute("UPDATE searchdata_url_impression SET query = 'other' WHERE data_date = ? AND url = 'critical'",
                        (self.params['end_date'],))
        rows = {r['url']: r for r in self.db.execute(adapt(block(14, 1)), self.params)}
        self.assertEqual({url: r['severity'] for url, r in rows.items()}, {'critical': 'critical', 'warning': 'warning'})
        self.assertAlmostEqual(rows['critical']['prior_position'], 9.1)

    def test_prior_only_url_has_zero_current_clicks(self):
        self.add(self.params['prior_end'], 'gone', 20)
        self.add(self.params['prior_end'], 'stable', 10)
        self.add(self.params['end_date'], 'stable', 10)
        rows = self.db.execute(adapt(block(11)), self.params).fetchall()
        self.assertEqual(len(rows), 1)
        self.assertEqual((rows[0]['url'], rows[0]['curr_clicks'], rows[0]['click_change']), ('gone', 0, -20))
        self.assertIsNone(rows[0]['curr_position'])
        self.assertIsNone(rows[0]['curr_ctr'])

    def test_latest_complete_months_one_row_and_disappearance(self):
        # SQLite substitutes only BigQuery's date-array source. Execute extracted
        # zero-fill join, pivot and decline filter against the monthly fixture.
        self.db.executescript('''
          CREATE TABLE monthly(url TEXT, month TEXT, clicks INT);
          CREATE TABLE bounds(last_month TEXT);
          INSERT INTO bounds VALUES ('2026-08-01');
          CREATE TABLE months(m TEXT);
          INSERT INTO months VALUES ('2026-06-01'), ('2026-07-01'), ('2026-08-01');
          INSERT INTO monthly VALUES ('gone', '2026-06-01', 30), ('gone', '2026-07-01', 20),
            ('down', '2026-06-01', 50), ('down', '2026-07-01', 40), ('down', '2026-08-01', 10),
            ('up', '2026-06-01', 30), ('up', '2026-07-01', 20), ('up', '2026-08-01', 40);
        ''')
        sql = 'WITH complete AS (' + block(9).split('complete AS (', 1)[1]
        sql = re.sub(r'CROSS JOIN UNNEST\(GENERATE_DATE_ARRAY\(.*?\)\) m', 'CROSS JOIN months', sql)
        rows = self.db.execute(adapt(sql)).fetchall()
        self.assertEqual({r['url']: r['clicks_last_month'] for r in rows}, {'gone': 0, 'down': 10})
        self.assertEqual(len(rows), 2)
        # Execute extracted choice of last complete month for mid/end month dates.
        self.db.create_function('LAST_DAY', 1, lambda d: d[:8] + str(calendar.monthrange(int(d[:4]), int(d[5:7]))[1]))
        bound = block(9).split('WITH bounds AS (', 1)[1].split('), monthly', 1)[0]
        bound = bound.replace('DATE_TRUNC(@end_date, MONTH)', "substr(@end_date, 1, 7) || '-01'")
        bound = bound.replace("DATE_SUB(substr(@end_date, 1, 7) || '-01', INTERVAL 1 MONTH)", "MINUS_MONTH(@end_date, 1)")
        for end, month in [('2026-09-10', '2026-08-01'), ('2026-09-30', '2026-09-01'), ('2026-03-01', '2026-02-01')]:
            self.assertEqual(self.db.execute(bound, {'end_date': end}).fetchone()[0], month)

    def test_ctr_alert_thresholds_attainable_and_zero_baseline_guarded(self):
        # Equal clicks isolate CTR changes from click alerts; position zero stays 1.
        for url, current_impressions in [('warning', 200), ('critical', 400), ('none', 125)]:
            self.add(self.params['prior_end'], url, 10, 100)
            self.add(self.params['end_date'], url, 10, current_impressions)
        self.add(self.params['prior_end'], 'zero_baseline', 0)
        self.add(self.params['end_date'], 'zero_baseline', 0)
        self.add(self.params['prior_end'], 'zero_current', 10)
        self.add(self.params['end_date'], 'zero_current', 0)
        self.add(self.params['prior_end'], 'mixed_critical', 10)
        self.add(self.params['end_date'], 'mixed_critical', 10, 400, 10000)
        self.add(self.params['prior_end'], 'tiny_ctr', 10, 1000000)
        self.add(self.params['end_date'], 'tiny_ctr', 10, 4000000)
        rows = self.db.execute(adapt(block(14)), self.params).fetchall()
        self.assertEqual({r['url']: r['severity'] for r in rows},
                         {'warning': 'warning', 'critical': 'critical', 'zero_current': 'critical',
                          'mixed_critical': 'critical', 'tiny_ctr': 'critical'})

    def setup_cohorts(self):
        self.db.executescript('ALTER TABLE searchdata_url_impression ADD COLUMN device TEXT;'
                             'ALTER TABLE searchdata_url_impression ADD COLUMN country TEXT;')
        self.db.create_function('REGEXP_CONTAINS', 2, lambda q, pattern: bool(re.search(pattern, q)))
        self.db.create_function('FLOOR', 1, lambda value: math.floor(value) if value is not None else None)
        self.db.create_function('GREATEST', 2, lambda a, b: max(a, b) if b is not None else None)

    def test_comparable_peers_exclude_self_and_require_coverage(self):
        self.setup_cohorts()
        for url, clicks, country in [('a', 10, 'usa'), ('b', 30, 'usa'), ('c', 40, 'usa'), ('isolated', 20, 'can')]:
            self.db.execute('INSERT INTO searchdata_url_impression VALUES (?, ?, ?, ?, 100, 0, ?, 0, ?, ?)',
                            (END.isoformat(), url, 'query', clicks, 'WEB', 'MOBILE', country))
        params = self.params | dict(brand_regex='brand', min_peer_pages=2, min_peer_impressions=200)
        rows = {row['url']: row for row in self.db.execute(adapt(block(6)), params)}
        self.assertAlmostEqual(rows['a']['benchmark_ctr'], 0.35)
        self.assertAlmostEqual(rows['a']['extra_clicks_scenario'], 25)
        self.assertIsNone(rows['isolated']['benchmark_ctr'])
        self.assertIsNone(rows['isolated']['extra_clicks_scenario'])
        self.assertEqual(rows['isolated']['verdict'], 'benchmark unavailable')
        self.assertEqual((rows['a']['total_cohorts'], rows['a']['unavailable_cohorts']), (4, 1))
        self.db.execute("UPDATE searchdata_url_impression SET impressions = 200 WHERE url = 'b'")
        self.db.execute("UPDATE searchdata_url_impression SET impressions = 300 WHERE url = 'c'")
        rows = {row['url']: row for row in self.db.execute(adapt(block(6)), params)}
        self.assertAlmostEqual(rows['a']['benchmark_ctr'], 70 / 500)
        self.assertAlmostEqual(rows['a']['extra_clicks_scenario'], 4)
        for thresholds in [dict(min_peer_pages=3), dict(min_peer_impressions=501)]:
            rows = {row['url']: row for row in self.db.execute(adapt(block(6)), params | thresholds)}
            self.assertIsNone(rows['a']['benchmark_ctr'])

    def test_bounded_cohort_rows_preserve_full_unavailable_count(self):
        self.setup_cohorts()
        for i in range(61):
            self.db.execute('INSERT INTO searchdata_url_impression VALUES (?, ?, ?, 10, 100, 0, ?, 0, ?, ?)',
                            (END.isoformat(), str(i), 'query', 'WEB', 'MOBILE', 'usa' if i < 60 else 'can'))
        params = self.params | dict(brand_regex='brand', min_peer_pages=2, min_peer_impressions=200)
        rows = self.db.execute(adapt(block(6)), params).fetchall()
        self.assertEqual(len(rows), 50)
        self.assertTrue(all(row['benchmark_ctr'] is not None for row in rows))
        self.assertTrue(all((row['total_cohorts'], row['unavailable_cohorts']) == (61, 1) for row in rows))

    def test_cohorts_without_position_or_dimension_remain_unavailable(self):
        self.setup_cohorts()
        self.db.executemany('INSERT INTO searchdata_url_impression VALUES (?, ?, ?, 0, ?, 0, ?, 0, ?, ?)',
                            [(END.isoformat(), 'no-position', 'query', 0, 'WEB', 'MOBILE', 'usa'),
                             (END.isoformat(), 'no-country', 'query', 100, 'WEB', 'MOBILE', None)])
        params = self.params | dict(brand_regex='brand', min_peer_pages=2, min_peer_impressions=200)
        rows = self.db.execute(adapt(block(6)), params).fetchall()
        self.assertEqual(len(rows), 2)
        self.assertTrue(all(row['benchmark_ctr'] is None for row in rows))
        self.assertTrue(all((row['total_cohorts'], row['unavailable_cohorts']) == (2, 2) for row in rows))

    def test_structural_contracts_not_bigquery_execution(self):
        self.assertNotIn('CURRENT_DATE()', DOC)
        self.assertNotRegex(DOC, r'`\{DATASET\}\.')
        for match in re.finditer(r'SAFE_DIVIDE\(SUM\(sum_(?:top_)?position\), SUM\(impressions\)\)', DOC):
            self.assertTrue(DOC[match.end():].startswith(' + 1'))
        self.assertIn("agenda = 'SEARCHDATA'", DOC)
        self.assertIn('INFORMATION_SCHEMA.PARTITIONS', DOC)
        self.assertIn('total_rows > 0', DOC)
        self.assertNotRegex(block(6), r'JOIN buckets\b')
        self.assertIn('c.cohort_pages - 1', block(6))
        self.assertIn('@min_peer_pages', block(6))
        self.assertIn('p.year = m.year - 1', block(16))
        self.assertIn('LAST_DAY(data_date) <= @end_date', block(16))
        self.assertNotIn('HAVING total_clicks > 0', block(21))
        self.assertEqual(len(re.findall(r'^### Query \d+:', DOC, re.M)), 22)


if __name__ == '__main__':
    unittest.main()
