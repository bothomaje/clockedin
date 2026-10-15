import { inject, Service } from '@angular/core';
import { DataExportService } from './data-export.service';

@Service()
export class PrivacyFacade {
  private dataExport = inject(DataExportService);

  download = () => this.dataExport.download();
}
