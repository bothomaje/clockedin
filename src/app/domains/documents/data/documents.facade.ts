import { inject, Service } from '@angular/core';
import { DocumentState } from './state/document-state';

@Service()
export class DocumentsFacade {
  private state = inject(DocumentState);

  loadForJob = (id: string) => this.state.loadForJob(id);
}
