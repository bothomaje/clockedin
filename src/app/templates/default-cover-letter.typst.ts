export const DEFAULT_COVER_LETTER_TEMPLATE = String.raw`
#let data = json("/data.json")
#let info = data.info
#let letter = data.letter
#let job = data.job

#set document(title: info.name + " - Cover Letter", author: info.name)
#set page(paper: "a4", margin: (x: 2.2cm, y: 2.2cm))
#set text(font: ("Libertinus Serif", "New Computer Modern", "DejaVu Serif"), size: 11pt)
#set par(justify: true, leading: 0.68em, first-line-indent: 0pt, spacing: 1.1em)

#align(right)[
  #text(weight: "bold", size: 13pt)[#info.name]
  #v(0.15em)
  #text(size: 9pt)[#info.contact]
]

#v(1.2em)

#if letter.recipient != "" [
  #letter.recipient \
]
#if job.company != "" [
  #job.company
]

#v(1.2em)

#letter.salutation

#for paragraph in letter.paragraphs [
  #paragraph.text
]

#v(0.6em)

#letter.closing \
#v(1.4em)
#info.name
`;
