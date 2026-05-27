import Link from "next/link";
import { Globe, MessageCircle, ExternalLink, Video } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Documentation", "Changelog"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Security"],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Netsyra AI
          </h3>
          <p className="text-white/50 text-sm mt-2 max-w-xs">
            Intelligent AI orchestration for the next generation of applications.
          </p>
          <div className="flex space-x-4 mt-4">
            <Link href="#" className="text-white/40 hover:text-purple-400 transition-colors"><Globe className="w-5 h-5" /></Link>
            <Link href="#" className="text-white/40 hover:text-purple-400 transition-colors"><MessageCircle className="w-5 h-5" /></Link>
            <Link href="#" className="text-white/40 hover:text-purple-400 transition-colors"><ExternalLink className="w-5 h-5" /></Link>
            <Link href="#" className="text-white/40 hover:text-purple-400 transition-colors"><Video className="w-5 h-5" /></Link>
          </div>
        </div>
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category}>
            <h4 className="text-white font-semibold mb-3">{category}</h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link}>
                  <Link href="#" className="text-white/50 hover:text-white transition-colors text-sm">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/10 text-center text-white/40 text-sm">
        © {new Date().getFullYear()} Netsyra AI. All rights reserved.
      </div>
    </footer>
  );
}