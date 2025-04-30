"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { 
  TrendingUp, 
  Search, 
  ExternalLink 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

// Types for news articles
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export default function TechTrendsPage() {
  const { toast } = useToast()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("technology")

  // Fetch news articles
  const fetchNewsArticles = async () => {
    setLoading(true)
    try {
      // Use environment variable for API key
      const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY
      
      // Construct URL with filters
      const url = new URL("https://newsapi.org/v2/top-headlines")
      url.searchParams.append("apiKey", apiKey || "")
      url.searchParams.append("q", searchQuery || "tech")
      url.searchParams.append("category", category)
      url.searchParams.append("language", "en")
      url.searchParams.append("pageSize", "12")

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.status === "ok") {
        // Filter out articles without images
        const filteredArticles = data.articles.filter((article: NewsArticle) => 
          article.urlToImage && 
          article.title !== "[Removed]"
        )

        setArticles(filteredArticles)
      } else {
        throw new Error(data.message || "Failed to fetch news")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch tech news",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and category changes
  useEffect(() => {
    fetchNewsArticles()
  }, [category])

  return (
    <div className="tech-trends-bg min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Tech Trends</h1>
            <p className="text-muted-foreground">
              Stay updated with the latest technology news and innovations
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tech news..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchNewsArticles()}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline"
            onClick={() => fetchNewsArticles()}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-xl">Loading tech trends...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Articles Found</h3>
            <p className="text-muted-foreground">
              Try a different search or adjust your filters
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <Card key={index} className="flex flex-col">
                <div className="relative h-48 w-full">
                  <Image 
                    src={article.urlToImage} 
                    alt={article.title} 
                    fill 
                    className="object-cover rounded-t-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-tech.jpg"
                    }}
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {article.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{article.source.name}</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    asChild
                  >
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Read More 
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}