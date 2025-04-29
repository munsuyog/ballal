"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users } from "lucide-react"

interface ResourceSettingsProps {
  resourceData: {
    students: number
    createdAt: string
  }
}

export function ResourceSettings({ resourceData }: ResourceSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{resourceData.students} students</span>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Created {resourceData.createdAt}</span>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Customize Theme
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            Grade Categories
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}