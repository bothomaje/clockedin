export const DEFAULT_CV_TEMPLATE = String.raw`
#import "@preview/simple-technical-resume:0.1.1": *

#let data = json("/data.json")
#let info = data.info
#let cv = data.cv

#show: resume.with(
  top-margin: 0.45in,
  font: "New Computer Modern",
  personal-info-font-size: 9.2pt,
  author-position: center,
  personal-info-position: center,
  author-name: info.name,
  phone: info.phone,
  email: info.email,
  website: info.personalSite,
  linkedin-user-id: info.linkedinUserId,
  github-username: info.githubUsername,
)

#let parse-date(s) = {
  if s == none or s == "" { none } else {
    let p = s.split("-")
    datetime(year: int(p.at(0)), month: int(p.at(1)), day: int(p.at(2)))
  }
}

#let end-or-present(s) = {
  let d = parse-date(s)
  if d == none { "Present" } else { d }
}

#if cv.summary != "" [
  #custom-title("Summary")[
    #cv.summary
  ]
]

#if cv.education.len() > 0 [
  #custom-title("Education")[
    #for item in cv.education [
      #let start = parse-date(item.startDate)
      #let end = parse-date(item.endDate)
      #if start != none and end != none [
        #education-heading(
          item.institution,
          item.location,
          item.qualification,
          item.field,
          start,
          end,
        )[]
      ] else [
        #text(weight: "bold")[#item.qualification#if item.field != "" [, #item.field]]
        #linebreak()
        #text(style: "italic")[#item.institution]
      ]
    ]
  ]
]

#if cv.experience.len() > 0 [
  #custom-title("Experience")[
    #for item in cv.experience [
      #work-heading(
        item.role,
        item.company,
        item.location,
        parse-date(item.startDate),
        end-or-present(item.endDate),
      )[
        #for bullet in item.bullets [
          - #bullet
        ]
      ]
    ]
  ]
]

#if cv.projects.len() > 0 [
  #custom-title("Projects")[
    #for item in cv.projects [
      #project-heading(item.name)[
        #for bullet in item.bullets [
          - #bullet
        ]
      ]
    ]
  ]
]

#if cv.skills.len() > 0 [
  #custom-title("Skills")[
    #skills()[
      #for group in cv.skills [
        - *#group.category:* #group.items.join(", ")
      ]
    ]
  ]
]
`;
