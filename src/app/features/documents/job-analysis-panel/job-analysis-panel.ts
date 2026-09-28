import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { AiGenerator } from '../generation/ai/ai-generator';
import { AiConsentService } from '../ai-consent-service';
import { JobState } from '../../jobs/state/job-state';
import { Job } from '../../jobs/models/job';
import { JobAnalysis } from '../../jobs/models/job-analysis';
import { User } from '../../profile/models/user';

@Component({
  selector: 'app-job-analysis-panel',
  imports: [JsonPipe],
  templateUrl: './job-analysis-panel.html',
})
export class JobAnalysisPanel {
  job = input.required<Job>();
  user = input<User>();
  analysed = output<JobAnalysis>();

  private aiGenerator = inject(AiGenerator);
  private consent = inject(AiConsentService);
  private jobState = inject(JobState);

  analysis = linkedSignal<JobAnalysis | undefined>(() => this.job().jobAnalysis ?? undefined);
  isAnalysing = signal(false);
  error = signal('');

  async analyse(): Promise<void> {
    if (!(await this.consent.ensureConsent(this.user()))) return;

    this.error.set('');
    this.isAnalysing.set(true);
    this.analysis.set(undefined);

    try {
      const result = await this.aiGenerator.analyseJob(this.job().jobDescription);
      this.analysis.set(result);
      await this.jobState.saveJobAnalysis(this.job().id!, result);
      this.analysed.emit(result);
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.isAnalysing.set(false);
    }
  }
}
