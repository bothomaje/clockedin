import { Component, computed, input, model } from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap/dropdown';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-select',
  imports: [NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem],
  templateUrl: './select.html',
})
export class Select<T extends string = string> {
  options = input.required<SelectOption<T>[]>();
  value = model.required<T>();
  inputId = input<string>();
  ariaLabel = input<string>();
  appearance = input<'field' | 'inline'>('field');
  highlight = input(false);
  disabled = input(false);

  protected selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label ?? '',
  );
}
