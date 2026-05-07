/**
 * home.tsx — Home page route (landing page).
 *
 * This is the main entry point users see when visiting AuraSpace.
 * It contains:
 *  - A hero section with a tagline and call-to-action buttons.
 *  - An upload card where users can drag-and-drop a floor-plan image.
 *  - A "Recent AI Creations" gallery showing previously saved projects.
 *
 * When an upload completes, the component creates a new project via
 * the Puter KV store and navigates to the Visualizer route.
 */

import NavBar from "~/components/NavBar";
import Upload from "~/components/Upload";
import type { Route } from "./+types/home";
import { ArrowRight, ArrowUpRight, Clock, Layers } from "lucide-react";
import Button from "~/components/ui/Button";
import { useNavigate } from "react-router";

/**
 * Sets the page `<title>` and meta description for SEO.
 */
export function meta({ }: Route.MetaArgs) {
  return [
    { title: "AuraSpace" },
    { name: "description", content: "Welcome to AuraSpace!" },
  ];
}

/**
 * Home page component.
 *
 * Responsibilities:
 *  - Loads saved projects from Puter KV on mount.
 *  - Handles upload completion by persisting a new project and
 *    navigating to the Visualizer route with the image data.
 *  - Renders the hero section, upload card, and project gallery.
 */
export default function Home() {
  const navigate = useNavigate();
  const handleUploadComplete = (base64Data: string) => {
    const newId = Date.now().toString();
    sessionStorage.setItem(`auraspace-upload-${newId}`, base64Data);
    navigate(`/visualizer/${newId}`);
  }

  

  return (
    <div className="home">
      <NavBar />

      {/* ── Hero Section ── */}
      <section className="hero">
        {/* Announcement badge */}
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

        {/* CTA buttons */}
        <div className="actions">
          <a href="#upload" className="cta">Start Exploring <ArrowRight className="icon" /></a>
          <Button variant="outline" size="lg" className="demo-btn">
            View Demo
          </Button>
        </div>

        {/* ── Upload Card ── */}
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

      {/* ── Recent Projects Gallery ── */}
      <section className="projects">
        <div className="section-inner">
          <div className="section-head">
            <div className="copy">
              <h2>Recent AI Creations</h2>
              <p>Feast your eyes on what our community has created with AuraSpace</p>
            </div>

          </div>

          {/* Grid of project cards */}
          <div className="projects-grid">
            <div className="project-card group">
              <div className="preview">
                <img src="https://roomify-mlhuk267-dfwu1i.puter.site/projects/1770803585402/rendered.png" alt="project" />
                <div className="badge">
                  <span className="status"></span>
                  <span className="label">Community Pick</span>
                </div>
              </div>
              <div className="card-body">
                <div>
                  <h3>Project Manhattan</h3>

                  <div className="meta">
                    <Clock size={12} />
                    <span>{new Date().toLocaleTimeString()}</span>
                    <span>Eddie</span>
                  </div>

                  <div className="arrow"><ArrowUpRight size={20} className="icon" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
