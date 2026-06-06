import { motion } from "framer-motion";
import { QrCode, Cookie, Sparkles, TrendingUp } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Escaneie",
    description: "Encontre cachorros pelo campus e escaneie o QR Code da coleira.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Cookie,
    title: "Capture",
    description: "Use biscoitos para capturar! Normal: 30%, Premium: 75%.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Sparkles,
    title: "Shiny",
    description: "5% de chance de encontrar uma versão Shiny com visual exclusivo!",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: TrendingUp,
    title: "Evolua",
    description: "Escaneie 3x o mesmo cachorro para evoluir seu sprite na DogDex.",
    color: "bg-rarity-legendary/10 text-rarity-legendary",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            Como funciona
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Capture todos os doguinhos e ajude a alimentá-los!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="bg-card rounded-2xl p-6 shadow-card hover:shadow-soft transition-all duration-300 hover:-translate-y-1 border border-border/50"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
