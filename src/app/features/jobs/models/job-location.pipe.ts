import { Pipe, PipeTransform } from '@angular/core';
import { Job, jobLocationLabel, jobPlaceLabel } from './job';

@Pipe({ name: 'jobLocation' })
export class JobLocationPipe implements PipeTransform {
  transform(job: Job, part: 'full' | 'place' = 'full'): string {
    return part === 'place' ? jobPlaceLabel(job) : jobLocationLabel(job);
  }
}
