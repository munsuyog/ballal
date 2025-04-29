import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Brain, Sparkles, Users } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="home-bg min-h-screen">
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/0 to-secondary/5" />
        <div className="container mx-auto px-4 py-32">
          <div className="max-w-3xl">
            <h1 className="text-6xl font-bold tracking-tight mb-6 animate-in slide-in-from-left duration-500">
              Connect, Learn & Grow with{" "}
              <span className="text-primary">Skill Nexus</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 animate-in slide-in-from-left duration-500 delay-150">
              Your all-in-one platform for college projects, study materials, and professional networking.
              Join the community of ambitious students shaping their future.
            </p>
            <div className="flex gap-4 animate-in slide-in-from-left duration-500 delay-300">
              <Button size="lg" asChild>
                <Link href="/projects">
                  Explore Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/resources">
                  Browse Resources
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Project Collaboration</h3>
              <p className="text-muted-foreground">
                Explore, join, or create college projects. Connect with like-minded students and build your portfolio.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Study Resources</h3>
              <p className="text-muted-foreground">
                Access a vast library of question papers, notes, and research papers to excel in your studies.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">NexAI Assistant</h3>
              <p className="text-muted-foreground">
                Get personalized help finding resources, projects, and connections with our AI-powered assistant.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-6">Stay Ahead with Tech Trends</h2>
              <p className="text-muted-foreground mb-8">
                Get insights into the most in-demand skills and job trends. Personalized recommendations help you focus on what matters most for your career.
              </p>
              <Button asChild>
                <Link href="/tech-trends">
                  View Tech Trends
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-video bg-muted rounded-lg animate-pulse" />
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}