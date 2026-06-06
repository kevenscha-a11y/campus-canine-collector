import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DOG_CATALOG } from "@/data/catalog";
import { DogSprite, getDexVisibility } from "@/components/game/DogSprite";

/** Preview estático da landing — mesma linguagem visual da DogDex do app */
const DogDexPreview = () => {
  const preview = DOG_CATALOG.map((dog, i) => ({
    dog,
    captured: i % 3 !== 1,
    seen: i % 3 === 1 || i % 3 === 0,
  }));
  const capturedCount = preview.filter((p) => p.captured).length;

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
            {capturedCount}/{DOG_CATALOG.length} no exemplo — na sua conta, o progresso é só seu
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto rounded-2xl border-4 border-[hsl(0_72%_42%)] p-3 bg-[hsl(145_40%_18%)] shadow-lg">
          <div className="rounded-xl bg-[hsl(80_25%_88%)] p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {preview.map(({ dog, captured, seen }, i) => (
              <motion.div
                key={dog.id}
                className={`rounded-xl p-3 flex flex-col items-center gap-1 border-2 ${
                  captured
                    ? "bg-white border-primary/30"
                    : "bg-[hsl(220_15%_22%)] border-[hsl(220_15%_28%)]"
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <DogSprite
                  dog={dog}
                  visibility={getDexVisibility(captured, seen)}
                  size="sm"
                />
                <span className="text-[10px] font-mono text-muted-foreground">
                  #{String(dog.dex_number).padStart(3, "0")}
                </span>
                <span
                  className={`text-xs font-bold ${
                    captured ? "text-foreground" : "text-muted-foreground tracking-widest"
                  }`}
                >
                  {captured ? dog.name : "?????"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Button asChild variant="hero" size="lg">
            <Link to="/register">Abrir sua DogDex</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DogDexPreview;
