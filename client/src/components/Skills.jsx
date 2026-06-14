import { useState, useEffect } from 'react'

function Skills() {
  const [skills, setSkills] = useState([])

  useEffect(() => {
    fetch('https://portfolio-website-dngm.onrender.com/api/skills')
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) setSkills(data)
    })
  }, [])

  return (
    <section className="section" id="skills">
      <p className="section-label">Expertise</p>
      <h2>Skills & Technologies</h2>
      <div className="skills-grid">
        {skills.map(category => (
          <div key={category._id} className="skill-category">
            <h3>{category.category}</h3>
            <div className="skill-tags">
              {category.skills.map(skill => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Skills