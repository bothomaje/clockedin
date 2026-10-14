import { Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DocumentState } from '../../data/state/document-state';
import { DocumentActions } from '../document-actions/document-actions';
import { Job } from '@domains/jobs';
import { User } from '@domains/profile';

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
