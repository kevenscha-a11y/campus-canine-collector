import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import DogDexPreview from "@/components/DogDexPreview";
import CommunityGoal from "@/components/CommunityGoal";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <FeaturesSection />
      <DogDexPreview />
      <CommunityGoal />
      <Footer />
    </div>
  );
};

export default Index;
