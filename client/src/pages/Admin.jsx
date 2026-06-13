import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ParticleField from '../components/ParticleField'
import { io } from 'socket.io-client'

function Admin() {
  const [activeTab, setActiveTab] = useState('overview')
  const [messages, setMessages] = useState([])
  const [projects, setProjects] = useState([])
  const [documents, setDocuments] = useState([])
  const [skills, setSkills] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const token = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchMessages()
    fetchProjects()
    fetchSkills()
    fetchDocuments()
  }, [])

  useEffect(() => {
    const socket = io('http://localhost:3000')

    socket.on('newMessage', (data) => {
        setUnreadCount(prev => prev + 1)
        setMessages(prev => [{
            _id: Date.now().toString(),
            name: data.name,
            email: data.email,
            message: '(click to refresh for full message)',
            createdAt: data.createdAt,
            read: false
        }, ...prev])
    })

    return () => socket.disconnect()
  }, [])

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  const fetchMessages = async () => {
    const res = await fetch('http://localhost:3000/api/admin/messages', {
      headers: authHeaders
    })
    const data = await res.json()
    setMessages(data)
    setUnreadCount(data.filter(m => !m.read).length)
  }

  const fetchProjects = async () => {
    const res = await fetch('http://localhost:3000/api/projects')
    const data = await res.json()
    setProjects(data)
  }

  const fetchDocuments = async () => {
    const res = await fetch('http://localhost:3000/api/documents')
    const data = await res.json()
    setDocuments(data)
  }

  const fetchSkills = async () => {
    const res = await fetch('http://localhost:3000/api/skills')
    const data = await res.json()
    setSkills(data)
  }

  const stats = {
    total: messages.length,
    unread: unreadCount,
    projects: projects.length,
    skills: skills.length,
    documents: documents.length,
  }

  const markAsRead = async (id) => {
    await fetch(`http://localhost:3000/api/admin/messages/${id}/read`, {
        method: 'PATCH',
        headers: authHeaders
    })
    setMessages(prev =>
        prev.map(m => m._id === id ? { ...m, read: true } : m)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
}

  const deleteMessage = async (id) => {
    const msg = messages.find(m => m._id === id)
    await fetch(`http://localhost:3000/api/contact/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    })
    setMessages(prev => prev.filter(m => m._id !== id))
    if (msg && !msg.read) setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const deleteProject = async (id) => {
    await fetch(`http://localhost:3000/api/projects/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    })
    fetchProjects()
  }

  const deleteDocument = async (filename) => {
    await fetch(`http://localhost:3000/api/documents/${filename}`, {
        method: 'DELETE',
        headers: authHeaders
    })
    fetchDocuments()
  }


  const deleteSkill = async (id) => {
    await fetch(`http://localhost:3000/api/skills/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    })
    fetchSkills()
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/login')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'messages', label: 'Messages', badge: unreadCount },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'documents', label: 'Documents' },
    { id: 'addProject', label: 'Add Project' },
    { id: 'addSkill', label: 'Add Skill' },
  ]

  return (
    <div className="admin-page">
      <div className="admin-content-wrapper">

        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-particles">
            <ParticleField />
          </div>

          <div className="admin-sidebar-header">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
            {sidebarOpen && (
              <div className="admin-brand">
                <p className="section-label">Admin</p>
                <h2>Dashboard</h2>
              </div>
            )}
          </div>

          <nav className="admin-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`admin-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
                title={tab.label}
              >
                {sidebarOpen && <span className="nav-label">{tab.label}</span>}
                {tab.badge > 0 && (
                  <span className="badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <button className="logout-btn" onClick={handleLogout}>
            {sidebarOpen ? 'Logout' : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            )}
          </button>
        </aside>

        {/* Main content */}
        <main
          className={`admin-main ${sidebarOpen ? 'shifted' : ''}`}
          onClick={() => { if (sidebarOpen) setSidebarOpen(false) }}
        >

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="admin-section">
              <h2>Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Total Messages</p>
                  <h3 className="stat-number">{stats.total}</h3>
                </div>
                <div className="stat-card unread-stat">
                  <p className="stat-label">Unread Messages</p>
                  <h3 className="stat-number">{stats.unread}</h3>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Total Projects</p>
                  <h3 className="stat-number">{stats.projects}</h3>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Documents</p>
                  <h3 className="stat-number">{stats.documents}</h3>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Skill Categories</p>
                  <h3 className="stat-number">{stats.skills}</h3>
                </div>
              </div>
              <div className="overview-shortcuts">
                <p className="section-label" style={{ fontSize: '0.8rem' }}>Quick Actions</p>
                <div className="shortcut-grid">
                  <button className="shortcut-btn" onClick={() => setActiveTab('addProject')}>
                    + Add Project
                  </button>
                  <button className="shortcut-btn" onClick={() => setActiveTab('addSkill')}>
                    + Add Skill
                  </button>
                  <button className="shortcut-btn" onClick={() => setActiveTab('messages')}>
                    View Messages
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="admin-section">
              <h2>Messages <span className="count">({messages.length})</span></h2>
              {messages.length === 0 ? (
                <p className="no-documents">No messages yet.</p>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg._id}
                    className={`message-card ${!msg.read ? 'unread' : ''}`}
                    onClick={() => { if (!msg.read) markAsRead(msg._id) }}
                  >
                    <div className="message-header">
                      <div>
                        <h3>
                          {msg.name}
                          {!msg.read && <span className="unread-dot" />}
                        </h3>
                        <p className="message-meta">
                          {msg.email}
                          {msg.phone && ` · ${msg.phone}`}
                          {msg.organisation && ` · ${msg.organisation}`}
                        </p>
                      </div>
                      <div className="message-actions">
                        <span className="message-date">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMessage(msg._id)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="message-body">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="admin-section">
              <h2>Projects <span className="count">({projects.length})</span></h2>
              {projects.map(project => (
                <div key={project._id} className="admin-item">
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.techStack.join(', ')}</p>
                  </div>
                  <button className="delete-btn" onClick={() => deleteProject(project._id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="admin-section">
              <h2>Documents <span className="count">({documents.length})</span></h2>

              <label className="upload-label" style={{ marginBottom: '2rem', display: 'inline-block' }}>
               + Upload Document
              <input
              type="file"
              accept=".pdf"
              onChange={async (e) => {
                const file = e.target.files[0]
                if (!file) return
                const formData = new FormData()
                formData.append('file', file)
                try {
                  const response = await fetch('http://localhost:3000/api/documents', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                  body: formData
                })
                if (response.ok) fetchDocuments()
              } catch (err) {
                console.error('Upload failed:', err)
            }
          }}
          style={{ display: 'none' }}
        />
      </label>

      {documents.length === 0 ? (
        <p className="no-documents">No documents uploaded yet.</p>
      ) : (
        documents.map(doc => (
          <div key={doc.filename} className="admin-item">
            <div>
              <h3>{doc.originalname}</h3>
              <p>{doc.filename}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <a
                href={`http://localhost:3000${doc.path}`}
                target="_blank"
                rel="noreferrer"
                className="read-btn"
              >
              View
              </a>
              <button
              className="delete-btn"
              onClick={() => deleteDocument(doc.filename)}
              >
                Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    )}

          {/* SKILLS TAB */}
          {activeTab === 'skills' && (
            <div className="admin-section">
              <h2>Skills <span className="count">({skills.length})</span></h2>
              {skills.map(skill => (
                <div key={skill._id} className="admin-item">
                  <div>
                    <h3>{skill.category}</h3>
                    <p>{skill.skills.join(', ')}</p>
                  </div>
                  <button className="delete-btn" onClick={() => deleteSkill(skill._id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ADD PROJECT TAB */}
          {activeTab === 'addProject' && (
            <AddProjectForm token={token} onSuccess={() => {
              fetchProjects()
              setActiveTab('projects')
            }} />
          )}

          {/* ADD SKILL TAB */}
          {activeTab === 'addSkill' && (
            <AddSkillForm token={token} onSuccess={() => {
              fetchSkills()
              setActiveTab('skills')
            }} />
          )}

        </main>
      </div>
    </div>
  )
}

function AddProjectForm({ token, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    techStack: '',
    liveLink: '',
    githubLink: ''
  })
  const [status, setStatus] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')

    const projectData = {
      ...form,
      techStack: form.techStack.split(',').map(t => t.trim())
    }

    try {
      const response = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        setStatus('success')
        setForm({ title: '', description: '', techStack: '', liveLink: '', githubLink: '' })
        setTimeout(onSuccess, 1000)
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div className="admin-section">
      <h2>Add New Project</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="4" required />
        </div>
        <div className="form-group">
          <label>Tech Stack <span className="optional">(comma separated)</span></label>
          <input name="techStack" value={form.techStack} onChange={handleChange} placeholder="React, Node.js, MongoDB" required />
        </div>
        <div className="form-group">
          <label>Live Link <span className="optional">(optional)</span></label>
          <input name="liveLink" value={form.liveLink} onChange={handleChange} placeholder="https://..." />
        </div>
        <div className="form-group">
          <label>GitHub Link <span className="optional">(optional)</span></label>
          <input name="githubLink" value={form.githubLink} onChange={handleChange} placeholder="https://github.com/..." />
        </div>
        <button type="submit" className="submit-btn" disabled={status === 'sending'}>
          {status === 'sending' ? 'Adding...' : 'Add Project'}
        </button>
        {status === 'success' && <p className="form-success">Project added! Redirecting...</p>}
        {status === 'error' && <p className="form-error">Something went wrong.</p>}
      </form>
    </div>
  )
}

function AddSkillForm({ token, onSuccess }) {
  const [form, setForm] = useState({
    category: '',
    skills: '',
    order: ''
  })
  const [status, setStatus] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')

    const skillData = {
      category: form.category,
      skills: form.skills.split(',').map(s => s.trim()),
      order: parseInt(form.order) || 0
    }

    try {
      const response = await fetch('http://localhost:3000/api/skills', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(skillData)
      })

      if (response.ok) {
        setStatus('success')
        setForm({ category: '', skills: '', order: '' })
        setTimeout(onSuccess, 1000)
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div className="admin-section">
      <h2>Add Skill Category</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category Name</label>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Frontend, Backend, Fullstack, Cloud, ML/AI, Software Engineering"
            required
          />
        </div>
        <div className="form-group">
          <label>Skills <span className="optional">(comma separated)</span></label>
          <input
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="React, Node.js, MongoDB"
            required
          />
        </div>
        <div className="form-group">
          <label>Display Order <span className="optional">(optional — lower number shows first)</span></label>
          <input
            name="order"
            value={form.order}
            onChange={handleChange}
            placeholder="1"
            type="number"
          />
        </div>
        <button type="submit" className="submit-btn" disabled={status === 'sending'}>
          {status === 'sending' ? 'Adding...' : 'Add Skill Category'}
        </button>
        {status === 'success' && <p className="form-success">Skill category added! Redirecting...</p>}
        {status === 'error' && <p className="form-error">Something went wrong.</p>}
      </form>
    </div>
  )
}

export default Admin