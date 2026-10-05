import { Service } from '@angular/core';
import {
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap/datepicker';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Service()
export class UtcDateAdapter extends NgbDateAdapter<Date> {
  fromModel(value: Date | null): NgbDateStruct | null {
    if (!(value instanceof Date) || isNaN(value.getTime())) return null;
    return {
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
      day: value.getUTCDate(),
    };
  }

  toModel(date: NgbDateStruct | null): Date | null {
    return date ? new Date(Date.UTC(date.year, date.month - 1, date.day)) : null;
  }
}

@Service()
export class DisplayDateParserFormatter extends NgbDateParserFormatter {
  format(date: NgbDateStruct | null): string {
    if (!date) return '';
    return `${String(date.day).padStart(2, '0')} ${MONTHS[date.month - 1]} ${date.year}`;
  }

  parse(value: string): NgbDateStruct | null {
    const text = value?.trim();
    if (!text) return null;

    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
    if (iso) return { year: +iso[1], month: +iso[2], day: +iso[3] };

    const named = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(text);
    if (named) {
      const month = MONTHS.findIndex((m) => m.toLowerCase() === named[2].slice(0, 3).toLowerCase());
      if (month >= 0) return { year: +named[3], month: month + 1, day: +named[1] };
    }

    return null;
  }
}
