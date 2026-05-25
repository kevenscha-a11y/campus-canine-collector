import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroDog from "@/assets/hero-dog.png";
import { QrCode, Cookie, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Subtle warm gradient background */}
      <div className="absolute inset-0 gradient-warm" />
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-20">
        <motion.div
          className="flex-1 text-center lg:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Novo: Metas comunitárias!
          </div>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
            Colecione os{" "}
            <span className="text-gradient-hero">doguinhos</span>{" "}
            do campus
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mb-8 mx-auto lg:mx-0">
            Escaneie QR Codes, capture cachorros e complete sua DogDex.
            Cada captura ajuda a alimentar os doguinhos da universidade! 🐾
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
            <Button asChild variant="hero" size="xl">
              <Link to="/register">Começar agora</Link>
            </Button>
            <Button asChild variant="hero-outline" size="xl">
              <Link to="/login">Entrar</Link>
            </Button>
          </div>

          <div className="flex items-center gap-8 justify-center lg:justify-start">
            <Stat value="12" label="Doguinhos" />
            <div className="w-px h-8 bg-border" />
            <Stat value="340+" label="Treinadores" />
            <div className="w-px h-8 bg-border" />
            <Stat value="2.4k" label="Capturas" />
          </div>
        </motion.div>

        <motion.div
          className="flex-1 flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="relative">
            <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl" />
            <img
              src={heroDog}
              alt="DogDex mascote"
              width={420}
              height={420}
              className="relative z-10 animate-float drop-shadow-xl"
            />

            {/* Floating badges */}
            <motion.div
              className="absolute top-8 -left-4 bg-card rounded-2xl shadow-soft px-4 py-3 flex items-center gap-2"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
            >
              <QrCode className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Scan!</span>
            </motion.div>

            <motion.div
              className="absolute bottom-12 -right-4 bg-card rounded-2xl shadow-soft px-4 py-3 flex items-center gap-2"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1 }}
            >
              <Cookie className="w-5 h-5 text-secondary" />
              <span className="text-sm font-semibold text-foreground">Capturado!</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="font-heading text-xl font-bold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);

export default HeroSection;
