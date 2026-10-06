import { Component, forwardRef, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { Location } from '../../location/location.model';
import {
  LocationSearchState,
  LocationService,
  MIN_QUERY_LENGTH,
} from '../../location/location.service';

let nextId = 0;

@Component({
  selector: 'app-location-input',
  templateUrl: './location-input.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LocationInput), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => LocationInput), multi: true },
  ],
})
export class LocationInput implements ControlValueAccessor, Validator {
  inputId = input<string>();
  placeholder = input('Search for a city');
  legacyValue = input<string>();

  protected listId = `clk-location-list-${nextId++}`;
  protected text = signal('');
  protected selected = signal<Location | null>(null);
  protected open = signal(false);
  protected touched = signal(false);
  protected activeIndex = signal(-1);
  protected minLength = MIN_QUERY_LENGTH;
  protected disabled = signal(false);

  private query$ = new Subject<string>();
  protected state = toSignal(inject(LocationService).suggestions(this.query$), {
    initialValue: { status: 'idle', results: [] } as LocationSearchState,
  });

  private onChange: (value: Location | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  protected get pending(): boolean {
    return !!this.text().trim() && !this.selected();
  }

  protected showError(): boolean {
    return this.touched() && this.pending;
  }

  protected optionId(index: number): string {
    return `${this.listId}-${index}`;
  }

  protected onInput(value: string): void {
    this.text.set(value);
    this.selected.set(null);
    this.activeIndex.set(-1);
    this.open.set(true);
    this.query$.next(value);
    this.onChange(null);
    this.onValidatorChange();
  }

  protected select(location: Location): void {
    this.selected.set(location);
    this.text.set(location.formatted);
    this.open.set(false);
    this.activeIndex.set(-1);
    this.onChange(location);
    this.onValidatorChange();
  }

  protected onBlur(): void {
    this.open.set(false);
    this.touched.set(true);
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const results = this.state().results;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open.set(true);
        if (results.length) this.activeIndex.set((this.activeIndex() + 1) % results.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (results.length) {
          this.activeIndex.set((this.activeIndex() - 1 + results.length) % results.length);
        }
        break;
      case 'Enter': {
        const active = results[this.activeIndex()];
        if (this.open() && active) {
          event.preventDefault();
          this.select(active);
        }
        break;
      }
      case 'Escape':
        this.open.set(false);
        break;
    }
  }

  writeValue(value: Location | null | undefined): void {
    this.selected.set(value ?? null);
    this.text.set(value?.formatted ?? '');
  }

  registerOnChange(fn: (value: Location | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.pending ? { locationNotSelected: true } : null;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) this.open.set(false);
  }
}
