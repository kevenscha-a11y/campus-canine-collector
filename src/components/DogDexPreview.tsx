import { motion } from "framer-motion";

const DOGS = [
  { id: 1, name: "Rex", captured: true },
  { id: 2, name: "Thor", captured: true },
  { id: 3, name: "Luna", captured: false },
  { id: 4, name: "Mel", captured: true },
  { id: 5, name: "Bob", captured: false },
  { id: 6, name: "Nina", captured: false },
  { id: 7, name: "Zeus", captured: true },
  { id: 8, name: "Pipoca", captured: false },
  { id: 9, name: "Caramelo", captured: true },
  { id: 10, name: "Bolinha", captured: false },
  { id: 11, name: "Frajola", captured: false },
  { id: 12, name: "Buddy", captured: false },
];

const DogDexPreview = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-xl md:text-2xl font-pixel text-center text-primary text-pixel-shadow mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          DogDex
        </motion.h2>
        <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
          Visualize todos os cachorros — capturados e por descobrir
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-3xl mx-auto">
          {DOGS.map((dog, i) => (
            <motion.div
              key={dog.id}
              className={`pixel-card aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:scale-105 ${
                dog.captured
                  ? "border-primary/40"
                  : "border-muted opacity-60"
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
            >
              <div
                className={`w-10 h-10 rounded flex items-center justify-center text-2xl ${
                  dog.captured ? "" : "grayscale"
                }`}
              >
                {dog.captured ? "🐕" : "❓"}
              </div>
              <span className="font-pixel text-[6px] text-muted-foreground">
                #{String(dog.id).padStart(3, "0")}
              </span>
              <span
                className={`font-pixel text-[7px] ${
                  dog.captured ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {dog.captured ? dog.name : "???"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DogDexPreview;
