import { useState, useEffect } from 'react'
import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ProjectCard from './components/ProjectCard'
import Contact from './components/Contact'

function App() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
  }, [])

  return (
    <div>
      <Navbar />
      <Hero />
      <div className="divider"></div>
      <section className="section" id="projects">
        <p className="section-label">Work</p>
        <h2>My Projects</h2>
        <div className="projects-grid">
          {projects.map(project => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      </section>
      <Contact />
      <footer>
        <p>© 2026 Zyionne Aderinola</p>
        <p>Built with MERN Stack</p>
      </footer>
    </div>
  )
}

export default App