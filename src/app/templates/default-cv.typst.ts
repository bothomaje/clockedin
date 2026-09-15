export const DEFAULT_CV_TEMPLATE = String.raw`
#let data = json("/data.json")
#let info = data.info
#let cv = data.cv

#set document(title: info.name + " - CV", author: info.name)
#set page(paper: "a4", margin: (x: 1.8cm, y: 1.6cm))
#set text(font: ("Libertinus Serif", "New Computer Modern", "DejaVu Serif"), size: 10pt)
#set par(justify: true, leading: 0.62em)

#show heading.where(level: 1): it => block(above: 1.1em, below: 0.7em)[
  #set text(size: 11pt, weight: "bold", tracking: 0.06em)
  #upper(it.body)
  #v(-0.45em)
  #line(length: 100%, stroke: 0.5pt)
]

#align(center)[
  #text(size: 19pt, weight: "bold")[#info.name]
  #v(0.25em)
  #text(size: 9pt)[#info.contact]
  #if info.links.len() > 0 [
    #v(0.2em)
    #text(size: 9pt)[
      #info.links.map(l => link(l.url)[#l.label]).join(" · ")
    ]
  ]
]

#v(0.4em)

#if cv.summary != "" [
  = Summary
  #cv.summary
]

#if cv.experience.len() > 0 [
  = Experience
  #for item in cv.experience [
    #grid(
      columns: (1fr, auto),
      align: (left, right),
      text(weight: "bold")[#item.role],
      text(size: 9pt)[#item.startDate -- #item.endDate],
    )
    #text(style: "italic", size: 9.5pt)[#item.company]
    #v(0.2em)
    #for bullet in item.bullets [
      - #bullet
    ]
    #v(0.5em)
  ]
]

#if cv.projects.len() > 0 [
  = Projects
  #for item in cv.projects [
    #text(weight: "bold")[#item.name]
    #v(0.2em)
    #for bullet in item.bullets [
      - #bullet
    ]
    #v(0.5em)
  ]
]

#if cv.education.len() > 0 [
  = Education
  #for item in cv.education [
    #grid(
      columns: (1fr, auto),
      align: (left, right),
      text(weight: "bold")[#item.qualification#if item.field != "" [, #item.field]],
      text(size: 9pt)[#item.startDate -- #item.endDate],
    )
    #text(style: "italic", size: 9.5pt)[#item.institution]
    #v(0.5em)
  ]
]

#if cv.skills.len() > 0 [
  = Skills
  #for group in cv.skills [
    #text(weight: "bold")[#group.category:] #group.items.join(", ")
    #v(0.25em)
  ]
]
`;
