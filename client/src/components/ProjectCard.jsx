function ProjectCard({ project }) {
  return (
    <div className="project-card">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <div className="tech-stack">
        {project.techStack.map(tech => (
          <span key={tech} className="tech-tag">{tech}</span>
        ))}
      </div>
      <div className="project-links">
        {project.liveLink && <a href={project.liveLink} target="_blank" rel="noreferrer">↗ Live Site</a>}
        {project.githubLink && <a href={project.githubLink} target="_blank" rel="noreferrer">↗ GitHub</a>}
      </div>
    </div>
  )
}

export default ProjectCard