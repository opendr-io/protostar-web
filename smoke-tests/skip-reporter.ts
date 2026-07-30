import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

// Prints a "[SKIPPED]" summary at the end of a run — which tests were skipped and
// why — so skips aren't just easy-to-miss "-" marks in the list output. The reason
// comes from the annotation attached by `test.skip(condition, '<reason>')`.
class SkipReporter implements Reporter {
  private skipped: { title: string; reason: string }[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== 'skipped') return;
    const parts = test.titlePath().filter((p) => p && p !== 'chromium' && !p.endsWith('.spec.ts'));
    const reason = test.annotations.find((a) => a.type === 'skip')?.description ?? '';
    this.skipped.push({ title: parts.join(' › '), reason });
  }

  onEnd(_result: FullResult) {
    if (this.skipped.length === 0) return;
    console.log(`\n[SKIPPED] ${this.skipped.length} test(s) not run:`);
    for (const s of this.skipped) {
      console.log(`    ${s.title}${s.reason ? `  —  ${s.reason}` : ''}`);
    }
  }
}

export default SkipReporter;
