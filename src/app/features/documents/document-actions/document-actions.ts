import { Component, inject, input, signal } from '@angular/core';
import { PdfCompiler } from '../generation/pdf-service';
import { GeneratedDocument } from '../models/generated-document';
import { GeneratedCv } from '../models/generated-cv';
import { GeneratedCoverLetter } from '../models/generated-cover-letter';
import { User } from '../../profile/models/user';
import { Job } from '../../jobs/models/job';
import { buildCvPayload } from '../generation/ai/cv-payload';
import { buildCoverLetterPayload } from '../generation/ai/cover-letter-renderer';
import { DEFAULT_CV_TEMPLATE } from '../generation/templates/default-cv.typst';
import { DEFAULT_COVER_LETTER_TEMPLATE } from '../generation/templates/default-cover-letter.typst';

@Component({
  selector: 'app-document-actions',
  templateUrl: './document-actions.html',
})
export class DocumentActions {
  document = input.required<GeneratedDocument>();
  user = input.required<User>();
  job = input.required<Job>();
  label = input('Download PDF');
  buttonClass = input('btn btn-outline-secondary btn-sm');

  private pdfCompiler = inject(PdfCompiler);

  isDownloading = signal(false);
  downloadError = signal('');

  async download(): Promise<void> {
    if (!this.document().structured) return;

    this.downloadError.set('');
    this.isDownloading.set(true);

    try {
      const isCv = this.document().type === 'cv';

      const template = isCv
        ? (this.user().templates?.cv ?? DEFAULT_CV_TEMPLATE)
        : (this.user().templates?.coverLetter ?? DEFAULT_COVER_LETTER_TEMPLATE);

      const payload = isCv
        ? buildCvPayload(
            this.document().structured as GeneratedCv,
            this.user().info,
            this.user().career,
          )
        : buildCoverLetterPayload(
            this.document().structured as GeneratedCoverLetter,
            this.user().info,
            this.job(),
          );

      const bytes = await this.pdfCompiler.compilePdf(template, payload);

      const label = [
        this.user().info.name,
        isCv ? 'CV' : 'Cover Letter',
        this.job().company,
        `v${this.document().version}`,
      ]
        .filter(Boolean)
        .join(' - ');

      this.pdfCompiler.download(bytes, label);
    } catch (err) {
      this.downloadError.set((err as Error).message);
    } finally {
      this.isDownloading.set(false);
    }
  }
}
