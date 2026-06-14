import { useState, useEffect } from 'react'

function Documents() {
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    fetch('https://portfolio-website-dngm.onrender.com/api/documents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDocuments(data)
    })
  }, [])

  return (
    <section className="section" id="documents">
      <p className="section-label">Documents</p>
      <h2>Resources & Downloads</h2>
      <div className="documents-container">
        <div className="documents-list">
          {documents.length === 0 ? (
            <p className="no-documents">No documents available.</p>
          ) : (
            documents.map(doc => (
              <div key={doc.filename} className="document-item">
                <div className="document-info">
                  <span className="document-icon">PDF</span>
                  <span className="document-name">
                    {doc.originalname}
                  </span>
                </div>
                <a
                  href={doc.url || doc.path}
                  target="_blank"
                  rel="noreferrer"
                  className="document-download"
                >
                  ↓ Download
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default Documents