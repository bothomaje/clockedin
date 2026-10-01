import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeneratedCv } from '../../models/generated-cv';

@Component({
  selector: 'app-cv-editor',
  imports: [FormsModule],
  templateUrl: './cv-editor.html',
  styleUrl: '../editor.scss',
})
export class CvEditor {
  draft = input.required<GeneratedCv>();
  ownedSkills = input<string[]>([]);
  saving = input(false);
  save = output<void>();
  cancel = output<void>();

  availableSkills(): string[] {
    const current = new Set(this.draft().skills.map((s) => s.trim().toLowerCase()));
    return this.ownedSkills().filter((s) => !current.has(s.trim().toLowerCase()));
  }

  addBullet(list: string[]): void {
    list.push('');
  }

  removeAt(list: unknown[], index: number): void {
    list.splice(index, 1);
  }

  addSkill(name: string): void {
    if (name) this.draft().skills.push(name);
  }

  submit(): void {
    const d = this.draft();
    d.summary = d.summary.trim();
    for (const entry of [...d.experience, ...d.projects]) {
      entry.bullets = entry.bullets.map((b) => b.trim()).filter(Boolean);
    }
    this.save.emit();
  }
}
