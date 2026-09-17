export const DEFAULT_COVER_LETTER_TEMPLATE = String.raw`
#let data = json("/data.json")
#let info = data.info
#let letter = data.letter
#let job = data.job

#set document(title: info.name + " - Cover Letter", author: info.name)
#set page(paper: "a4", margin: (top: 0.45in, x: 1.8cm, bottom: 1.8cm))
#set text(font: "New Computer Modern", size: 10.5pt)
#set par(justify: true, leading: 0.65em, first-line-indent: 0pt, spacing: 1.1em)

#align(right)[
  #text(weight: "bold", size: 19pt)[#info.name]
  #v(0.2em)
  #text(size: 9.2pt)[#info.contact]
]

#line(length: 100%, stroke: 0.5pt)
#v(1em)

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
  #parbreak()
]

#v(0.6em)

#letter.closing \
#v(1.4em)
#info.name
`;
