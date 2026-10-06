import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { JobState } from '../state/job-state';
import {
  getDateApplied,
  getLatestJobUpdate,
  getSavedAt,
  Job,
  jobPlaceLabel,
  JobStatus,
} from '../models/job';
import { JobCard, JobRowVariant } from '../job-card/job-card';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { statusLabel } from '../../../shared/ui/status-chip/status-chip';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { Select, SelectOption } from '../../../shared/ui/select/select';

export type SortField = 'updatedAt' | 'dateApplied' | 'savedAt' | 'company' | 'role';

interface Column {
  label: string;
  width?: string;
}

const APPLICATION_COLUMNS: Column[] = [
  { label: 'Company', width: '240px' },
  { label: 'Role' },
  { label: 'Status', width: '132px' },
  { label: 'Location', width: '200px' },
  { label: 'Salary', width: '130px' },
  { label: 'Date applied', width: '130px' },
];

const SAVED_COLUMNS: Column[] = [
  { label: 'Company', width: '240px' },
  { label: 'Role' },
  { label: 'Status', width: '132px' },
  { label: 'Location', width: '200px' },
  { label: 'Date saved', width: '130px' },
  { label: 'Deadline', width: '130px' },
];

@Component({
  selector: 'app-job-list',
  imports: [JobCard, FormsModule, EmptyState, ErrorState, Select],
  templateUrl: './job-list.html',
})
export class JobList implements OnInit {
  private jobState = inject(JobState);

  statuses = input<JobStatus[]>();
  variant = input<JobRowVariant>('application');
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
  getDateApplied = getDateApplied;

  loading = this.jobState.loading;
  error = this.jobState.error;

  search = signal('');
  statusFilter = signal<JobStatus | ''>('');
  locationFilter = signal('');
  sortBy = signal<SortField>('updatedAt');
  sortDir = signal<'asc' | 'desc'>('desc');

  skeletonRows = [
    [120, 180, 70, 50, 160, 100],
    [100, 200, 70, 50, 130, 90],
    [140, 150, 70, 50, 170, 110],
  ];

  activeFilterCount = computed(
    () => [this.statusFilter(), this.locationFilter()].filter(Boolean).length,
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
    () => this.variant() === 'application' && this.statusOptions().length > 1,
  );
  chipColumn = computed(() => (this.variant() === 'saved' ? 5 : 2));
  columns = computed(() => (this.variant() === 'saved' ? SAVED_COLUMNS : APPLICATION_COLUMNS));

  private scoped = computed(() => {
    const allowed = this.statuses();
    const jobs = this.jobState.jobs();
    return allowed ? jobs.filter((j) => allowed.includes(getLatestJobUpdate(j).status)) : jobs;
  });

  locationOptions = computed(() => this.distinct(jobPlaceLabel));

  statusSelectOptions = computed<SelectOption<JobStatus | ''>[]>(() => [
    { value: '', label: this.allStatusesLabel() },
    ...this.statusOptions().map((status) => ({ value: status, label: statusLabel(status) })),
  ]);

  locationSelectOptions = computed<SelectOption<string>[]>(() => [
    { value: '', label: 'All locations' },
    ...this.locationOptions().map((location) => ({ value: location, label: location })),
  ]);

  sortOptions = computed<SelectOption<SortField>[]>(() => [
    this.variant() === 'saved'
      ? { value: 'savedAt', label: 'Date Saved' }
      : { value: 'dateApplied', label: 'Date Applied' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'company', label: 'Company' },
    { value: 'role', label: 'Role' },
  ]);

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
    const location = this.locationFilter();

    const filtered = this.scoped().filter((job) => {
      if (term && !`${job.company} ${job.role}`.toLowerCase().includes(term)) return false;
      if (status && getLatestJobUpdate(job).status !== status) return false;
      if (location && jobPlaceLabel(job) !== location) return false;
      return true;
    });

    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const field = this.sortBy();

    return [...filtered].sort((a, b) => {
      if (field === 'company') return dir * (a.company ?? '').localeCompare(b.company ?? '');
      if (field === 'role') return dir * (a.role ?? '').localeCompare(b.role ?? '');
      if (field === 'savedAt') return dir * (getSavedAt(a).getTime() - getSavedAt(b).getTime());
      // if (field === 'dateApplied') {
      //   const at = getDateApplied(a) ? getDateApplied(a) : 0;
      //   const bt = getDateApplied(b) ? getDateApplied(a) : 0;
      //   return dir * (at - bt);
      // }
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
    this.locationFilter.set('');
  }

  toggleSortDir(): void {
    this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
  }
}
