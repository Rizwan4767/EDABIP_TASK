import "./Landing-page-v2.css";
import Header from "./components/Header";
import Hero from "./components/Hero";
import PlatformOverview from "./components/PlatformOverview";
import ModularEcosystem from "./components/ModularEcosystem";
import Lifecycle from "./components/Lifecycle";
import Sovereignty from "./components/Sovereignty";
import Footer from "./components/Footer";
import {
  AIAssistantProvider,
  AIAssistantLauncher,
  AIAssistantPanel,
} from "../aiAssistant/index.js";
import "../aiAssistant/styles/ai-assistant.css";

export default function LandingPageV2() {
  return (
    <AIAssistantProvider>
      <main className="lv2-page">
        <Header />
        <Hero />
        <PlatformOverview />
        <ModularEcosystem />
        <Lifecycle />
        <Sovereignty />
        <Footer />
      </main>
      <AIAssistantLauncher />
      <AIAssistantPanel />
    </AIAssistantProvider>
  );
}
