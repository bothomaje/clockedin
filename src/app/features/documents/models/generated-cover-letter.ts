export interface GeneratedCoverLetterParagraph {
  text: string;
  sourceIds: string[];
}

export interface GeneratedCoverLetter {
  recipient: string;
  salutation: string;
  paragraphs: GeneratedCoverLetterParagraph[];
  closing: string;
}
