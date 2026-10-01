import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeneratedCoverLetter } from '../../models/generated-cover-letter';

@Component({
  selector: 'app-cover-letter-editor',
  imports: [FormsModule],
  templateUrl: './cover-letter-editor.html',
  styleUrl: '../editor.scss',
})
export class CoverLetterEditor {
  draft = input.required<GeneratedCoverLetter>();
  saving = input(false);
  save = output<void>();
  cancel = output<void>();

  addParagraph(): void {
    this.draft().paragraphs.push({ text: '', sourceIds: [] });
  }

  removeParagraph(index: number): void {
    this.draft().paragraphs.splice(index, 1);
  }

  submit(): void {
    const d = this.draft();
    d.recipient = d.recipient.trim();
    d.salutation = d.salutation.trim();
    d.closing = d.closing.trim();
    d.paragraphs = d.paragraphs.map((p) => ({ ...p, text: p.text.trim() })).filter((p) => p.text);
    this.save.emit();
  }
}
