import { Component, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownComponent } from 'ngx-markdown';
import { AiConsentService } from '../ai-consent-service';
import { DocumentState } from '../state/document-state';
import { Job } from '../../jobs/models/job';
import { JobAnalysis } from '../../jobs/models/job-analysis';
import { User } from '../../profile/models/user';
import { CareerProfile } from '../../profile/models/career-profile';
import { GeneratedCv } from '../models/generated-cv';
import { DocumentActions } from '../document-actions/document-actions';

@Component({
  selector: 'app-cv-generation-panel',
  imports: [FormsModule, DatePipe, MarkdownComponent, DocumentActions],
  templateUrl: './cv-generation-panel.html',
})
export class CvGenerationPanel {
  job = input.required<Job>();
  user = input.required<User>();
  careerProfiles = input<CareerProfile[]>([]);
  analysis = input<JobAnalysis>();
  analysisUpdated = output<JobAnalysis>();
  cvGenerated = output<GeneratedCv>();

  protected documentState = inject(DocumentState);
  private consent = inject(AiConsentService);

  selectedProfileId = '';

  async generateCv(): Promise<void> {
    if (!(await this.consent.ensureConsent(this.user()))) return;

    const profile = this.careerProfiles().find((p) => p.id === this.selectedProfileId);

    try {
      const result = await this.documentState.generateCv({
        info: this.user().info,
        career: this.user().career,
        job: this.job(),
        profile,
        analysis: this.analysis(),
      });

      this.cvGenerated.emit(result.cv);
      this.analysisUpdated.emit(result.analysis);
    } catch {
      // error already captured in documentState.cvError()
    }
  }
}
