import NavBar from "~/components/NavBar";
import Upload from "~/components/Upload";
import type { Route } from "./+types/home";
import { ArrowRight, ArrowUpRight, Clock, Layers } from "lucide-react";
import Button from "~/components/ui/Button";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { createProject, getProjects } from "../../lib/puter.action";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "AuraSpace" },
    { name: "description", content: "Welcome to AuraSpace!" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const handleUploadComplete = async (base64Data: string) => {
    const newId = Date.now().toString();
    const name = `Residence ${newId}`;
    const newItem = {
      id: newId,
      name,
      sourceImage: base64Data,
      timestamp: Date.now(),
    }

    const saved = await createProject({ item: newItem, visibility: 'private' });
    if (!saved) {
      console.error("failed to save new project");
      return false;
    }

    setProjects((prev) => [newItem, ...prev])
    navigate(`/visualizer/${newId}`, {
      state: {
        initialImage: saved.sourceImage,
        initialRender: saved.renderedImage || null,
        name
      },
    });
  }

  const [projects, setProjects] = useState<DesignItem[]>([]);

  useEffect(() => {
    getProjects()
      .then((loaded) => setProjects(loaded))
      .catch(() => setProjects([]));
  }, []);


  return (
    <div className="home">
      <NavBar />
      <section className="hero">
        <div className="announce">
          <div className="dot">
            <div className="pulse" />
            <p>Introducing AuraSpace 1.0</p>
          </div>
        </div>

        <h1>Visualize your dream space with AuraSpace</h1>
        <p>
          AuraSpace transforms your ideas into stunning reality. Design interiors, create
          virtual rooms, and explore endless possibilities with AI.
        </p>

        <div className="actions">
          <a href="#upload" className="cta">Start Exploring <ArrowRight className="icon" /></a>
          <Button variant="outline" size="lg" className="demo-btn">
            View Demo
          </Button>
        </div>


        <div id="upload" className="upload-shell">
          <div className="grid-overlay" />
          <div className="upload-card">
            <div className="upload-head">
              <div className="upload-icon">
                <Layers />
              </div>

              <h3>Upload Reference Image</h3>
              <p>Supports JPG, PNG and WEBP (Max 10MB)</p>
            </div>
            <Upload onComplete={handleUploadComplete} />
          </div>
        </div>
      </section>

      <section className="projects">
        <div className="section-inner">
          <div className="section-head">
            <div className="copy">
              <h2>Recent AI Creations</h2>
              <p>Feast your eyes on what our community has created with AuraSpace</p>
            </div>

          </div>

          <div className="projects-grid">
            {projects.map(({ id, name, renderedImage, sourceImage, timestamp }) => (
              <div key={id} className="project-card group">
                <div className="preview">
                  <img src={renderedImage || sourceImage} alt={name || "project"} />
                  <div className="badge">
                    <span className="status"></span>
                    <span className="label">Community Pick</span>
                  </div>
                </div>
                <div className="card-body">
                  <div>
                    <h3>{name || `Project ${id}`}</h3>

                    <div className="meta">
                      <Clock size={12} />
                      <span>{new Date(timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="arrow"><ArrowUpRight size={20} className="icon" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
