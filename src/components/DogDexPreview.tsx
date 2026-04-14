import { motion } from "framer-motion";

const DOGS = [
  { id: 1, name: "Rex", captured: true, emoji: "🐕" },
  { id: 2, name: "Thor", captured: true, emoji: "🦮" },
  { id: 3, name: "Luna", captured: false, emoji: "🐩" },
  { id: 4, name: "Mel", captured: true, emoji: "🐶" },
  { id: 5, name: "Bob", captured: false, emoji: "🐕‍🦺" },
  { id: 6, name: "Nina", captured: false, emoji: "🐾" },
  { id: 7, name: "Zeus", captured: true, emoji: "🦴" },
  { id: 8, name: "Pipoca", captured: false, emoji: "🐕" },
  { id: 9, name: "Caramelo", captured: true, emoji: "🐶" },
  { id: 10, name: "Bolinha", captured: false, emoji: "🐩" },
  { id: 11, name: "Frajola", captured: false, emoji: "🦮" },
  { id: 12, name: "Buddy", captured: false, emoji: "🐕" },
];

const DogDexPreview = () => {
  const capturedCount = DOGS.filter((d) => d.captured).length;

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 gradient-warm" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            DogDex
          </h2>
          <p className="text-muted-foreground text-lg">
            {capturedCount}/{DOGS.length} capturados — complete sua coleção!
          </p>
        </motion.div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-3xl mx-auto">
          {DOGS.map((dog, i) => (
            <motion.div
              key={dog.id}
              className={`bg-card rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 border ${
                dog.captured
                  ? "border-primary/20 hover:shadow-hover hover:-translate-y-1"
                  : "border-border/30 opacity-50"
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="text-3xl">
                {dog.captured ? dog.emoji : "❓"}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                #{String(dog.id).padStart(3, "0")}
              </span>
              <span
                className={`text-xs font-semibold ${
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
