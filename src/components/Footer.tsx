import React from 'react';
import { Link } from 'react-router-dom';
import { Wand2, Twitter, Instagram, Facebook } from 'lucide-react';

const tools = [
  { name: "Background Remover", path: "/cocable" },
  { name: "AI Image Upscaler", path: "/upscaler" },
  { name: "AI Object Remover", path: "/object-remover" },
  { name: "Batch Remover", path: "/batch-remover" },
];

const socialLinks = [
  { icon: <Twitter className="h-5 w-5" />, href: "#" },
  
];

export const Footer = () => {
  return (
    <footer className="bg-background/50 border-t border-border/40">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <Wand2 className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold">Cocable AI</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              AI-powered image editing tools to simplify your creative workflow.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a key={index} href={social.href} className="text-muted-foreground hover:text-primary transition-colors">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Tools Links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase">Tools</h3>
            <ul className="mt-4 space-y-2">
              {tools.map((tool) => (
                <li key={tool.name}>
                  <Link to={tool.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/refunds" className="text-sm text-muted-foreground hover:text-primary transition-colors">Cancellations & Refunds</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Cocable AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};