import { motion } from "framer-motion";
import biscuitImg from "@/assets/biscuit.png";
import scannerImg from "@/assets/scanner.png";

const features = [
  {
    icon: scannerImg,
    title: "Escaneie",
    description:
      "Encontre cachorros pelo campus e escaneie o QR Code da coleira deles.",
  },
  {
    icon: biscuitImg,
    title: "Capture",
    description:
      "Use biscoitos para tentar capturar! Normal: 30%, Premium: 75%.",
  },
  {
    icon: "✨",
    title: "Shiny",
    description:
      "5% de chance de encontrar um cachorro Shiny com sprite exclusivo!",
  },
  {
    icon: "⬆️",
    title: "Evolua",
    description:
      "Escaneie 3x o mesmo cachorro para evoluir seu sprite na DogDex.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-xl md:text-2xl font-pixel text-center text-primary text-pixel-shadow mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Como funciona
        </motion.h2>
        <p className="text-center text-muted-foreground mb-16 max-w-md mx-auto">
          Capture todos os doguinhos e ajude a alimentá-los!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="pixel-card flex flex-col items-center text-center group hover:border-primary/50 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                {typeof feature.icon === "string" &&
                feature.icon.length <= 3 ? (
                  <span className="text-4xl">{feature.icon}</span>
                ) : (
                  <img
                    src={feature.icon}
                    alt={feature.title}
                    width={64}
                    height={64}
                    loading="lazy"
                    className="object-contain"
                  />
                )}
              </div>
              <h3 className="font-pixel text-xs text-secondary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
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
