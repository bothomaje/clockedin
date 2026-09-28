import { Component, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';
import { AiConsentService } from '../ai-consent-service';
import { DocumentState } from '../state/document-state';
import { Job } from '../../jobs/models/job';
import { JobAnalysis } from '../../jobs/models/job-analysis';
import { User } from '../../profile/models/user';
import { GeneratedCv } from '../models/generated-cv';
import { DocumentActions } from '../document-actions/document-actions';

@Component({
  selector: 'app-cover-letter-panel',
  imports: [DatePipe, MarkdownComponent, DocumentActions],
  templateUrl: './cover-letter-panel.html',
})
export class CoverLetterPanel {
  job = input.required<Job>();
  user = input.required<User>();
  analysis = input<JobAnalysis>();
  cv = input<GeneratedCv>();
  analysisUpdated = output<JobAnalysis>();

  protected documentState = inject(DocumentState);
  private consent = inject(AiConsentService);

  async generateCoverLetter(): Promise<void> {
    if (!(await this.consent.ensureConsent(this.user()))) return;

    try {
      const result = await this.documentState.generateCoverLetter({
        info: this.user().info,
        career: this.user().career,
        job: this.job(),
        analysis: this.analysis(),
        cv: this.cv(),
      });

      this.analysisUpdated.emit(result.analysis);
    } catch {
      // error already captured in documentState.coverLetterError()
    }
  }
}
