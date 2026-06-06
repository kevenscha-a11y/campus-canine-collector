import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Heart } from "lucide-react";

const CommunityGoal = () => {
  const current = 734;
  const goal = 1000;
  const percent = Math.round((current / goal) * 100);

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          className="bg-card rounded-3xl p-8 md:p-10 shadow-soft border border-border/50 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-14 h-14 rounded-2xl gradient-secondary flex items-center justify-center mx-auto mb-5">
            <Heart className="w-7 h-7 text-secondary-foreground" />
          </div>

          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            Meta comunitária
          </h2>
          <p className="text-muted-foreground mb-8">
            Ao atingir a meta, doaremos{" "}
            <strong className="text-foreground">20kg de ração</strong> para os
            doguinhos da universidade! 🐶
          </p>

          <div className="mb-4">
            <Progress
              value={percent}
              className="h-4 rounded-full bg-muted"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-semibold text-primary">
              {current.toLocaleString()} escaneamentos
            </span>
            <span className="text-muted-foreground">
              Meta: {goal.toLocaleString()}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunityGoal;
