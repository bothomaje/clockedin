import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { AiConsentService } from '../../data/state/ai-consent-service';
import { DocumentState } from '../../data/state/document-state';
import { DocumentActions } from '../document-actions/document-actions';
import { GeneratedCv } from '../../data/models/generated-cv';
import { GeneratedDocument, GeneratedDocumentType } from '../../data/models/generated-document';
import { JobsFacade, Job, JobAnalysis, JobLocationPipe } from '@domains/jobs';
import { Breadcrumbs, Crumb } from '@shared/ui/breadcrumbs/breadcrumbs';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { CvEditor } from '../../ui/editors/cv-editor/cv-editor';
import { CoverLetterEditor } from '../../ui/editors/cover-letter-editor/cover-letter-editor';
import {
  CoverLetterOptions,
  CV_LENGTHS,
  CV_TONES,
  CvOptions,
  DEFAULT_CV_OPTIONS,
  DEFAULT_LETTER_OPTIONS,
  LETTER_LENGTHS,
  LETTER_TONES,
} from '../../data/models/generation-options';
import { GeneratedCoverLetter } from '../../data/models/generated-cover-letter';
import { GENERATION_STAGES } from '../../data/models/generation-stage';
import { AuthSession } from '@core/auth/auth-session';
import { ProfileFacade } from '@domains/profile';

type WizardView = 'setup' | 'processing' | 'preview' | 'error';

@Component({
  selector: 'app-document-wizard-page',
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    MarkdownComponent,
    DocumentActions,
    Breadcrumbs,
    PageHeader,
    CvEditor,
    CoverLetterEditor,
    JobLocationPipe,
  ],
  templateUrl: './document-wizard-page.html',
  styleUrl: './document-wizard-page.scss',
})
export class DocumentWizardPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consent = inject(AiConsentService);
  private session = inject(AuthSession);
  protected jobs = inject(JobsFacade);
  protected profile = inject(ProfileFacade);
  protected documentState = inject(DocumentState);

  readonly type: GeneratedDocumentType = this.route.snapshot.data['documentType'];
  readonly base: 'applications' | 'jobs' = this.route.snapshot.data['base'] ?? 'applications';
  readonly basePath = `/${this.base}`;
  readonly isCv = this.type === 'cv';
  readonly label = this.isCv ? 'CV' : 'Cover Letter';
  readonly jobId = this.route.snapshot.paramMap.get('id')!;

  ready = signal(false);
  mode = signal<'setup' | 'preview'>('setup');
  errorDismissed = signal(false);
  analysis = signal<JobAnalysis | undefined>(undefined);
  selectedProfileId = '';

  readonly cvTones = CV_TONES;
  readonly cvLengths = CV_LENGTHS;
  readonly letterTones = LETTER_TONES;
  readonly letterLengths = LETTER_LENGTHS;
  cvOptions = signal<CvOptions>({ ...DEFAULT_CV_OPTIONS });
  letterOptions = signal<CoverLetterOptions>({ ...DEFAULT_LETTER_OPTIONS });

  cvDraft = signal<GeneratedCv | undefined>(undefined);
  letterDraft = signal<GeneratedCoverLetter | undefined>(undefined);
  saving = signal(false);
  saveError = signal('');
  editing = computed(() => !!this.cvDraft() || !!this.letterDraft());
  ownedSkillNames = computed(() =>
    this.profile
      .skills()
      .map((s) => s.name)
      .filter((n): n is string => !!n),
  );

  documents = computed(() =>
    this.isCv ? this.documentState.cvDocuments() : this.documentState.coverLetterDocuments(),
  );
  active = computed(() =>
    this.isCv ? this.documentState.activeCv() : this.documentState.activeCoverLetter(),
  );
  generating = computed(() =>
    this.isCv ? this.documentState.isGeneratingCv() : this.documentState.isGeneratingCoverLetter(),
  );
  error = computed(() =>
    this.isCv ? this.documentState.cvError() : this.documentState.coverLetterError(),
  );

  view = computed<WizardView>(() => {
    if (this.generating()) return 'processing';
    if (this.error() && !this.errorDismissed()) return 'error';
    return this.mode() === 'preview' && this.active() ? 'preview' : 'setup';
  });

  title = computed(() => {
    switch (this.view()) {
      case 'processing':
        return `Generating ${this.label}…`;
      case 'error':
        return 'Unable to complete tailoring';
      case 'preview':
        return `Tailored ${this.label} draft`;
      default:
        return `Tailor ${this.label}`;
    }
  });

  crumbs = computed<Crumb[]>(() => {
    const job = this.jobs.selectedJob();
    const items: Crumb[] = [
      { label: this.base === 'jobs' ? 'Jobs' : 'Applications', link: this.basePath },
      { label: job?.company || 'Application', link: this.jobId },
      { label: `Tailor ${this.label}` },
    ];
    if (this.view() === 'preview') items.push({ label: 'Preview' });
    return items;
  });

  sourceSummary = computed(() => {
    const experience = this.profile.experience();
    return {
      roles: experience.length,
      skills: this.profile.skills().length,
      evidence: experience.reduce((n, e) => n + (e.evidence?.length ?? 0), 0),
    };
  });

  canGenerate = computed(() => this.profile.experience().length > 0);
  aiAllowed = this.session.isEmailVerified;

  emphasisChoices = computed(() => {
    const a = this.analysis();
    if (!a) return [];
    const terms = [...(a.domains ?? []), ...(a.technologies ?? []), ...(a.keywords ?? [])]
      .map((t) => t.trim())
      .filter(Boolean);
    return [...new Set(terms)].slice(0, 6);
  });

  selectedEmphasis = computed(() =>
    this.isCv ? this.cvOptions().emphasis : this.letterOptions().emphasis,
  );

  steps = computed(() => {
    const stage = this.isCv ? this.documentState.cvStage() : this.documentState.coverLetterStage();
    const current = stage ? GENERATION_STAGES.findIndex((s) => s.id === stage) : 0;
    return GENERATION_STAGES.map((s, i) => ({
      ...s,
      state: (i < current ? 'done' : i === current ? 'active' : 'pending') as
        'done' | 'active' | 'pending',
    }));
  });

  tailoringSummary = computed(() => {
    const doc = this.active();
    if (!doc) return undefined;

    const owned = new Set(
      this.profile
        .skills()
        .map((s) => s.name?.trim().toLowerCase())
        .filter((n): n is string => !!n),
    );
    const required = doc.jobAnalysis?.requiredSkills ?? [];
    const matched = required.filter((r) => owned.has(r.trim().toLowerCase()));
    const profile = this.profile.careerProfiles().find((p) => p.id === doc.careerProfileId)?.name;

    return {
      evidenceCount: doc.evidenceFactIds.length,
      profile,
      requiredTotal: required.length,
      requiredMatched: matched.length,
      issues: doc.validation?.issues ?? [],
    };
  });

  async ngOnInit(): Promise<void> {
    await this.profile.load();
    if (this.jobs.jobs().length === 0) await this.jobs.loadJobs();
    this.jobs.selectJob(this.jobId);

    const job = this.jobs.selectedJob();
    if (!job) {
      await this.router.navigate([this.basePath]);
      return;
    }

    this.analysis.set(job.jobAnalysis ?? undefined);
    if (!this.generating()) await this.documentState.loadForJob(this.jobId);
    if (this.active()) this.mode.set('preview');
    this.ready.set(true);
  }

  async generate(): Promise<void> {
    const job = this.jobs.selectedJob();
    if (!job || !this.aiAllowed()) return;

    const user = this.profile.user();
    if (
      !(await this.consent.ensureConsent(
        user,
        this.isCv ? 'cv-generation' : 'cover-letter-generation',
      ))
    )
      return;

    this.errorDismissed.set(false);

    try {
      if (this.isCv) {
        const result = await this.documentState.generateCv({
          info: user.info,
          career: user.career,
          job,
          profile: this.profile.careerProfiles().find((p) => p.id === this.selectedProfileId),
          analysis: this.analysis(),
          options: this.cvOptions(),
        });
        this.analysis.set(result.analysis);
        await this.persistAnalysis(job, result.analysis);
      } else {
        const cv =
          (this.documentState.activeCv()?.structured as GeneratedCv | null | undefined) ??
          undefined;
        const result = await this.documentState.generateCoverLetter({
          info: user.info,
          career: user.career,
          job,
          analysis: this.analysis(),
          cv,
          options: this.letterOptions(),
        });
        this.analysis.set(result.analysis);
        await this.persistAnalysis(job, result.analysis);
      }
      this.mode.set('preview');
    } catch {
      // message already in documentState error signal
    }
  }

  private async persistAnalysis(job: Job, analysis: JobAnalysis): Promise<void> {
    if (job.jobAnalysis || !job.id) return;
    try {
      await this.jobs.saveJobAnalysis(job.id, analysis);
    } catch {
      // non-fatal
    }
  }

  selectVersion(doc: GeneratedDocument): void {
    this.cancelEdit();
    if (this.isCv) this.documentState.selectCvVersion(doc);
    else this.documentState.selectCoverLetterVersion(doc);
  }

  regenerate(): void {
    this.cancelEdit();

    const previous = this.active()?.options;
    if (previous) {
      if (this.isCv) this.cvOptions.set({ ...(previous as CvOptions) });
      else this.letterOptions.set({ ...(previous as CoverLetterOptions) });
    }
    this.mode.set('setup');
  }

  patchCv(patch: Partial<CvOptions>): void {
    this.cvOptions.update((o) => ({ ...o, ...patch }));
  }

  patchLetter(patch: Partial<CoverLetterOptions>): void {
    this.letterOptions.update((o) => ({ ...o, ...patch }));
  }

  toggleEmphasis(term: string): void {
    const current = this.selectedEmphasis();
    const next = current.includes(term) ? current.filter((t) => t !== term) : [...current, term];
    if (this.isCv) this.patchCv({ emphasis: next });
    else this.patchLetter({ emphasis: next });
  }

  beginEdit(): void {
    const doc = this.active();
    if (!doc?.structured) return;
    this.saveError.set('');
    const copy = JSON.parse(JSON.stringify(doc.structured));
    if (this.isCv) this.cvDraft.set(copy as GeneratedCv);
    else this.letterDraft.set(copy as GeneratedCoverLetter);
  }

  cancelEdit(): void {
    this.cvDraft.set(undefined);
    this.letterDraft.set(undefined);
    this.saveError.set('');
  }

  async saveEdit(): Promise<void> {
    const doc = this.active();
    const job = this.jobs.selectedJob();
    if (!doc || !job) return;

    const user = this.profile.user();
    const cv = this.cvDraft();
    const letter = this.letterDraft();

    this.saving.set(true);
    this.saveError.set('');

    try {
      if (cv) {
        await this.documentState.saveCvEdits(this.jobId, doc, cv, user.info, user.career);
      } else if (letter) {
        await this.documentState.saveCoverLetterEdits(
          this.jobId,
          doc,
          letter,
          user.info,
          user.career,
          job,
        );
      }
      this.cancelEdit();
    } catch (err) {
      this.saveError.set((err as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  dismissError(): void {
    this.errorDismissed.set(true);
  }
}
