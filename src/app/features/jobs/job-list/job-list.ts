import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { JobState } from '../state/job-state';
import { getLatestJobUpdate, getSavedAt, Job, JobStatus } from '../models/job';
import { JobCard, JobRowVariant } from '../job-card/job-card';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { statusLabel } from '../../../shared/ui/status-chip/status-chip';
import { ErrorState } from '../../../shared/ui/error-state/error-state';

export type SortField = 'updatedAt' | 'dateApplied' | 'savedAt' | 'company' | 'role';

interface Column {
  label: string;
  width?: string;
}

const PIPELINE_COLUMNS: Column[] = [
  { label: 'Company', width: '220px' },
  { label: 'Role' },
  { label: 'Location & employment', width: '180px' },
  { label: 'Salary Range', width: '150px' },
  { label: 'Saved Date', width: '130px' },
  { label: 'Application', width: '130px' },
];

const SAVED_COLUMNS: Column[] = [
  { label: 'Company', width: '220px' },
  { label: 'Role & department' },
  { label: 'Location', width: '180px' },
  { label: 'Salary', width: '150px' },
  { label: 'Deadline', width: '130px' },
  { label: 'Date saved', width: '130px' },
];

@Component({
  selector: 'app-job-list',
  imports: [JobCard, FormsModule, EmptyState, ErrorState],
  templateUrl: './job-list.html',
})
export class JobList implements OnInit {
  private jobState = inject(JobState);

  statuses = input<JobStatus[]>();
  variant = input<JobRowVariant>('pipeline');
  defaultSort = input<SortField>('updatedAt');
  allStatusesLabel = input('All statuses');
  emptyTitle = input('No saved jobs yet');
  emptyDescription = input('Nothing saved yet.');
  emptyHint = input<string>();
  noun = input('application');
  errorTitle = input("We couldn't load your saved jobs.");

  view = output<Job>();
  edit = output<Job>();
  statusLabel = statusLabel;

  loading = this.jobState.loading;
  error = this.jobState.error;

  search = signal('');
  statusFilter = signal<JobStatus | ''>('');
  departmentFilter = signal('');
  locationFilter = signal('');
  sortBy = signal<SortField>('updatedAt');
  sortDir = signal<'asc' | 'desc'>('desc');

  skeletonRows = [
    [120, 180, 70, 50, 160, 100],
    [100, 200, 70, 50, 130, 90],
    [140, 150, 70, 50, 170, 110],
  ];

  activeFilterCount = computed(
    () =>
      [this.statusFilter(), this.departmentFilter(), this.locationFilter()].filter(Boolean).length,
  );
  hasActiveFilters = computed(() => this.activeFilterCount() > 0 || !!this.search().trim());

  noResultsText = computed(() => {
    const term = this.search().trim();
    const subject = `${this.noun()} jobs`;
    return term
      ? `We couldn't find any ${subject} matching your search "${term}" with the active filters. Try checking the spelling or clearing your active filters.`
      : `We couldn't find any ${subject} matching your active filters. Try clearing your filters.`;
  });

  statusOptions = computed(() => this.statuses() ?? Object.values(JobStatus));
  showStatusFilter = computed(
    () => this.variant() === 'pipeline' && this.statusOptions().length > 1,
  );
  showDepartmentFilter = computed(() => this.variant() === 'pipeline');
  chipColumn = computed(() => (this.variant() === 'saved' ? 5 : 2));
  columns = computed(() => (this.variant() === 'saved' ? SAVED_COLUMNS : PIPELINE_COLUMNS));

  private scoped = computed(() => {
    const allowed = this.statuses();
    const jobs = this.jobState.jobs();
    return allowed ? jobs.filter((j) => allowed.includes(getLatestJobUpdate(j).status)) : jobs;
  });

  departmentOptions = computed(() => this.distinct((j) => j.department));
  locationOptions = computed(() => this.distinct((j) => j.location));

  private distinct(pick: (job: Job) => string | undefined): string[] {
    return [
      ...new Set(
        this.scoped()
          .map(pick)
          .filter((v): v is string => !!v?.trim()),
      ),
    ].sort();
  }

  filteredJobs = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const department = this.departmentFilter();
    const location = this.locationFilter();

    const filtered = this.scoped().filter((job) => {
      if (term && !`${job.company} ${job.role}`.toLowerCase().includes(term)) return false;
      if (status && getLatestJobUpdate(job).status !== status) return false;
      if (department && job.department !== department) return false;
      if (location && job.location !== location) return false;
      return true;
    });

    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const field = this.sortBy();

    return [...filtered].sort((a, b) => {
      if (field === 'company') return dir * (a.company ?? '').localeCompare(b.company ?? '');
      if (field === 'role') return dir * (a.role ?? '').localeCompare(b.role ?? '');
      if (field === 'savedAt') return dir * (getSavedAt(a).getTime() - getSavedAt(b).getTime());
      if (field === 'dateApplied') {
        const at = a.dateApplied ? new Date(a.dateApplied).getTime() : 0;
        const bt = b.dateApplied ? new Date(b.dateApplied).getTime() : 0;
        return dir * (at - bt);
      }
      return (
        dir *
        (getLatestJobUpdate(a).updatedAt.getTime() - getLatestJobUpdate(b).updatedAt.getTime())
      );
    });
  });

  isEmpty = computed(() => this.scoped().length === 0);
  isNoResults = computed(() => !this.isEmpty() && this.filteredJobs().length === 0);

  ngOnInit(): void {
    this.sortBy.set(this.defaultSort());
    this.jobState.loadJobs();
  }

  reload(): void {
    this.jobState.loadJobs();
  }

  clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
    this.departmentFilter.set('');
    this.locationFilter.set('');
  }

  toggleSortDir(): void {
    this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
  }
}
