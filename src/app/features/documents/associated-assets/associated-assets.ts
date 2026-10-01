import { Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DocumentState } from '../state/document-state';
import { DocumentActions } from '../document-actions/document-actions';
import { Job } from '../../jobs/models/job';
import { User } from '../../profile/models/user';

@Component({
  selector: 'app-associated-assets',
  imports: [RouterLink, DatePipe, DocumentActions],
  templateUrl: './associated-assets.html',
})
export class AssociatedAssets {
  job = input.required<Job>();
  user = input.required<User>();
  basePath = input<'applications' | 'jobs'>('applications');

  protected documentState = inject(DocumentState);
}
