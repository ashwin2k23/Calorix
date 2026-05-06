import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, Brain, Activity, Utensils, ArrowRight } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

export default function Landing() {
  const features = [
    {
      icon: <Activity className="w-6 h-6 text-primary" />,
      title: "Calorie Tracking",
      desc: "Easily log your Indian meals with our extensive food database."
    },
    {
      icon: <Brain className="w-6 h-6 text-primary" />,
      title: "AI Diet Planner",
      desc: "Get personalized diet plans tailored to your goals by our AI."
    },
    {
      icon: <Utensils className="w-6 h-6 text-primary" />,
      title: "Indian Food DB",
      desc: "From Roti to Paneer, we've got all your favorite Indian dishes covered."
    },
    {
      icon: <Flame className="w-6 h-6 text-primary" />,
      title: "Progress Analytics",
      desc: "Track your macros and weight changes with intuitive charts."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Flame className="w-8 h-8 text-primary" />
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Calorix
            </span>
          </div>
          <div>
            <SignedIn>
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button variant="outline" className="rounded-full">Dashboard</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <div className="flex items-center gap-2">
                <Link to="/sign-in">
                  <Button variant="ghost" className="rounded-full hidden sm:inline-flex">Sign In</Button>
                </Link>
                <Link to="/sign-up">
                  <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
                </Link>
              </div>
            </SignedOut>
          </div>
        </nav>

        <main className="text-center max-w-3xl mx-auto mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20 shadow-[0_0_15px_rgba(0,194,255,0.1)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm font-semibold tracking-wide uppercase">AI-Powered Indian Nutrition Assistant</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Track Calories. <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-primary via-[#00c2ff] to-primary bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
                Eat Smart.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Achieve your fitness goals with AI-driven diet recommendations, extensive Indian food tracking, and deep insights into your nutrition.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignedIn>
                <Link to="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto text-lg rounded-full px-8 bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,194,255,0.3)] hover:shadow-[0_0_30px_rgba(0,194,255,0.5)]">
                    Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </SignedIn>
              <SignedOut>
                <Link to="/sign-up">
                  <Button size="lg" className="w-full sm:w-auto text-lg rounded-full px-8 bg-gradient-to-r from-primary to-[#00c2ff] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,194,255,0.3)] hover:shadow-[0_0_30px_rgba(0,194,255,0.5)]">
                    Start Tracking Free
                  </Button>
                </Link>
                <Link to="/sign-in">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg rounded-full px-8 border-white/10 hover:bg-white/5 transition-colors">
                    Sign In
                  </Button>
                </Link>
              </SignedOut>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-32 text-left"
          >
            {features.map((feature, idx) => (
              <div key={idx} className="group p-6 rounded-3xl bg-card/40 border border-white/5 backdrop-blur-md hover:bg-card/60 hover:border-primary/30 transition-all hover:shadow-[0_8px_30px_rgba(0,194,255,0.1)]">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </main>

        <footer className="mt-32 text-center text-sm text-muted-foreground border-t border-white/10 pt-8 pb-4">
          <p>“This app provides general nutrition guidance and is not a substitute for professional medical advice.”</p>
          <p className="mt-2">&copy; {new Date().getFullYear()} Calorix. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
