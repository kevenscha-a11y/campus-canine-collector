import { Heart } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-8">
    <div className="container mx-auto px-4 text-center">
      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
        DogDex © 2026 — Feito com <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> para os doguinhos da universidade
      </p>
    </div>
  </footer>
);

export default Footer;
