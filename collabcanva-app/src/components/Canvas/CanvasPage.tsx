import { useState, lazy, Suspense } from "react";
import Navbar from "../Layout/Navbar";
import Canvas from "./Canvas";
import CanvasControls from "./CanvasControls";
import { CanvasProvider } from "../../contexts/CanvasContext";

// Lazy load heavy components that aren't needed immediately
const HelpOverlay = lazy(() => import("./HelpOverlay"));
const AICommandPanel = lazy(() => import("../AI/AICommandPanel"));

export default function CanvasPage() {
  const [showHelp, setShowHelp] = useState(false);

  const handleShowHelp = () => setShowHelp(true);

  return (
    <CanvasProvider>
      <div className="relative w-full h-screen overflow-hidden">
        <Navbar />
        <div className="pt-16">
          <Canvas onShowHelp={handleShowHelp} />
          <CanvasControls onShowHelp={handleShowHelp} />
          <Suspense fallback={<div />}>
            <AICommandPanel />
          </Suspense>
        </div>
        {showHelp && (
          <Suspense fallback={<div />}>
            <HelpOverlay onClose={() => setShowHelp(false)} />
          </Suspense>
        )}
      </div>
    </CanvasProvider>
  );
}
