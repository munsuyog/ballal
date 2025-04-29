"use client"

import * as React from "react"
import Link from "next/link"
import { ModeToggle } from "./mode-toggle"
import { Button } from "./ui/button"
import { Search, Sparkles, BookOpen, Users, TrendingUp, MessageSquareMore, GraduationCap, Network, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const { user, signOut, loading } = useAuth()

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300",
      isScrolled ? "bg-background/80 backdrop-blur-md border-b" : "bg-transparent"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span className="font-bold text-xl">Skill Nexus</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <Users className="h-4 w-4" />
                Projects
              </Link>
              <Link href="/resources" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <BookOpen className="h-4 w-4" />
                Resources
              </Link>
              <Link href="/coursework" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <GraduationCap className="h-4 w-4" />
                Coursework
              </Link>
              <Link href="/network" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <Network className="h-4 w-4" />
                Network
              </Link>
              <Link href="/tech-trends" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <TrendingUp className="h-4 w-4" />
                Tech Trends
              </Link>
              <Link href="/nexai" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <MessageSquareMore className="h-4 w-4" />
                NexAI
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <ModeToggle />
            
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}