import { Hero } from './components/Hero';
import { LogoMarquee } from './components/LogoMarquee';
import { AiMarquee } from './components/AiMarquee';
import { Problem } from './components/sections/Problem';
import { HowItWorks } from './components/sections/HowItWorks';
import { LiveDashboard } from './components/sections/LiveDashboard';
import { Features } from './components/sections/Features';
import { Diagnostics } from './components/sections/Diagnostics';
import { AiChat } from './components/sections/AiChat';
import { Tech } from './components/sections/Tech';
import { Results } from './components/sections/Results';
import { Turnkey } from './components/sections/Turnkey';
import { Contact } from './components/sections/Contact';
import { Footer } from './components/sections/Footer';

/* A pitch page, not the company website: one scroll from the 3D scene to the contacts. */
export default function App() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <AiMarquee />
      <Problem />
      <HowItWorks />
      <LiveDashboard />
      <Features />
      <Diagnostics />
      <AiChat />
      <Tech />
      <Results />
      <Turnkey />
      <Contact />
      <Footer />
    </>
  );
}
