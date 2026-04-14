import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const CommunityGoal = () => {
  const current = 734;
  const goal = 1000;
  const percent = Math.round((current / goal) * 100);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          className="pixel-card text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-pixel text-lg text-secondary text-pixel-shadow mb-2">
            Meta comunitária
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Quando atingirmos a meta, doaremos <strong className="text-foreground">20kg de ração</strong> para os
            doguinhos da universidade! 🐶
          </p>

          <div className="mb-3">
            <Progress value={percent} className="h-4 bg-muted border border-border" />
          </div>

          <div className="flex justify-between font-pixel text-[9px]">
            <span className="text-primary">{current} escaneamentos</span>
            <span className="text-muted-foreground">Meta: {goal}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunityGoal;
