import { HeroSection } from "@/components/sections/HeroSection";
import { CapabilitiesSection } from "@/components/sections/CapabilitiesSection";
import { SelectedWorksSection } from "@/components/sections/SelectedWorksSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { GithubActivitySection } from "@/components/sections/GithubActivitySection";
import { ContactFooter } from "@/components/sections/ContactFooter";
import { SectionProgressHud } from "@/components/ui/SectionProgressHud";

export default function HomePage() {
  return (
    <main className="relative min-h-screen text-text-primary">
      <SectionProgressHud/>
      <HeroSection />
      <CapabilitiesSection />
      <SelectedWorksSection />
      <ExperienceSection />
      <GithubActivitySection />
      <ContactFooter />
    </main>
  );
}
