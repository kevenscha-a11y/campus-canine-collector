import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroDog from "@/assets/hero-dog.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden scanlines">
      {/* Animated background dots */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(142 60% 45%) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 relative z-10">
        <motion.div
          className="flex-1 text-center lg:text-left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-pixel text-primary text-pixel-shadow leading-relaxed mb-6">
            DogDex
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 font-body mb-2 max-w-lg">
            Escaneie, capture e colecione todos os cachorros da universidade!
          </p>
          <p className="text-sm text-muted-foreground font-body mb-8 max-w-lg">
            Cada cachorro tem um QR Code. Use seus biscoitos para capturá-los e
            complete sua DogDex. Ajude a alimentar os doguinhos do campus!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button variant="hero" size="xl">
              Começar agora
            </Button>
            <Button variant="hero-secondary" size="xl">
              Ver DogDex
            </Button>
          </div>

          <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
            <Stat label="Cachorros" value="12" />
            <Stat label="Treinadores" value="340+" />
            <Stat label="Escaneios" value="2.4k" />
          </div>
        </motion.div>

        <motion.div
          className="flex-1 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
            <img
              src={heroDog}
              alt="DogDex mascote pixel art"
              width={400}
              height={400}
              className="relative z-10 animate-float drop-shadow-2xl"
              style={{ imageRendering: "auto" }}
            />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <span className="font-pixel text-[8px] text-muted-foreground">
          ▼ SCROLL ▼
        </span>
      </motion.div>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <div className="font-pixel text-sm text-secondary">{value}</div>
    <div className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mt-1">
      {label}
    </div>
  </div>
);

export default HeroSection;
